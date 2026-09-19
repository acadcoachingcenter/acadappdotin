import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";
import jsPDF from "jspdf";

const TERMS_AND_CONDITIONS = [
  "Fees once paid are non-refundable under any circumstances, except at the sole discretion of ACAD management.",
  "The student must maintain a minimum of 75% attendance to remain eligible for the course.",
  "Any act of indiscipline, misconduct, or harassment will lead to immediate termination without refund.",
  "The student agrees not to share, record, or redistribute any course materials, recordings, or content provided by ACAD.",
  "Classes may be conducted online or in-person as decided by the tutor and ACAD management.",
  "The student is responsible for providing accurate contact details; ACAD is not liable for communication failures due to incorrect information.",
  "ACAD reserves the right to modify the schedule, syllabus, or assigned tutor at any time without prior notice.",
  "The student/parent agrees to pay any additional examination or material fees separately, if applicable.",
  "In case of dispute, the decision of ACAD management shall be final and binding.",
  "This admission is valid only for the course and duration specified above."
];

const ACAD_LOGO_URL = "https://media.base44.com/images/public/689c76e2ab454d53f6e29bd5/c9bd2f11c_ACADLOGONEW.png";
const ACAD_WEBSITE = "acadapp.in";

// Loads the logo and returns a square-cropped PNG data URL. Earlier this
// also clipped the canvas to a circle (transparent corners), but PNG alpha
// doesn't reliably survive jsPDF's image embedding across versions - some
// builds flatten transparent pixels to opaque white, which is why the logo
// came out square in the downloaded PDF despite looking round on screen.
// Rounding now happens with a real PDF vector clip path - see
// drawCircularImage below - which doesn't depend on transparency at all.
async function loadImageAsDataURL(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const size = Math.min(img.naturalWidth, img.naturalHeight);
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");

      const offsetX = (img.naturalWidth - size) / 2;
      const offsetY = (img.naturalHeight - size) / 2;
      ctx.drawImage(img, offsetX, offsetY, size, size, 0, 0, size, size);

      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

// Draws a square logo image clipped to a circle using the PDF's own vector
// clip path (save graphics state -> add circular path -> clip -> draw image
// -> restore). This is independent of PNG transparency support, so it
// renders as a true circle in every PDF viewer.
function drawCircularLogo(doc, dataUrl, x, y, diameter) {
  const radius = diameter / 2;
  const cx = x + radius;
  const cy = y + radius;

  try {
    doc.saveGraphicsState();
    doc.circle(cx, cy, radius, null);
    doc.clip();
    doc.discardPath();
    doc.addImage(dataUrl, "PNG", x, y, diameter, diameter);
    doc.restoreGraphicsState();
  } catch (e) {
    // Older jsPDF builds without clip()/saveGraphicsState support: fall
    // back to an unclipped square rather than failing the whole PDF.
    try {
      doc.addImage(dataUrl, "PNG", x, y, diameter, diameter);
    } catch (e2) { /* skip logo entirely */ }
  }
}

// Merges the shared student-level fields across a group of enrollments
// (one record per course) and returns the per-course rows plus totals used
// to render a single combined admission card.
function summarizeEnrollments(enrollments) {
  const validEmail = (e) =>
    e && e.includes("@") && e.includes(".") && !e.includes("@whatsapp.temp");

  const studentName =
    enrollments.map((e) => e.student_name).find(Boolean) || "-";

  const studentEmail =
    enrollments.map((e) => e.student_email).find(validEmail) || "-";

  const studentWhatsapp =
    enrollments.map((e) => e.student_whatsapp).find(Boolean) || "-";

  const dates = enrollments
    .map((e) => e.enrollment_date || e.created_date)
    .filter(Boolean)
    .map((d) => new Date(d))
    .filter((d) => !isNaN(d));

  const earliestDate = dates.length
    ? new Date(Math.min(...dates.map((d) => d.getTime())))
    : new Date();

  const courses = enrollments.map((e) => ({
    id: e.id,
    course_name: e.course_name || "-",
    tutor_name: e.tutor_name || "-",
    amount_paid: Number(e.amount_paid || 0),
    transaction_id: e.payment_transaction_id || "",
    date: e.enrollment_date || e.created_date
      ? new Date(e.enrollment_date || e.created_date)
      : null,
  }));

  const totalMonthly = courses.reduce((sum, c) => sum + c.amount_paid, 0);

  return { studentName, studentEmail, studentWhatsapp, earliestDate, courses, totalMonthly };
}

export default function AdmissionCardModal({ enrollments, open, onOpenChange }) {
  const [isGenerating, setIsGenerating] = useState(false);

  if (!enrollments || enrollments.length === 0) return null;

  const summary = summarizeEnrollments(enrollments);

  const formatDate = (d) =>
    d
      ? d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
      : "-";

  const handleDownloadPDF = async () => {
    setIsGenerating(true);
    try {
      const logoDataUrl = await loadImageAsDataURL(ACAD_LOGO_URL);
      const doc = new jsPDF("p", "mm", "a4");
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;

      // Header band
      const headerHeight = 34;
      doc.setFillColor(21, 101, 192);
      doc.rect(0, 0, pageWidth, headerHeight, "F");
      if (logoDataUrl) {
        drawCircularLogo(doc, logoDataUrl, margin, 5, 22);
      }
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(17);
      doc.text("ACAD COACHING CENTER", margin + 27, 13);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text("Official Admission Card", margin + 27, 19);
      doc.setFont("helvetica", "bold");
      doc.text(ACAD_WEBSITE, margin + 27, 25);
      doc.setFont("helvetica", "normal");
      doc.text("  |  acadcoachingcenter@gmail.com  |  +91-9790818436", margin + 27 + doc.getTextWidth(ACAD_WEBSITE), 25);

      // Student summary box
      let y = headerHeight + 8;
      const summaryHeight = 40;
      doc.setDrawColor(21, 101, 192);
      doc.setLineWidth(0.6);
      doc.roundedRect(margin, y, pageWidth - 2 * margin, summaryHeight, 3, 3);

      doc.setTextColor(30, 30, 30);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text("ADMISSION CONFIRMATION", margin + 5, y + 8);

      // Student photo box (ID card style)
      const photoX = pageWidth - margin - 28;
      const photoY = y + 4;
      doc.setDrawColor(150, 150, 150);
      doc.setLineWidth(0.4);
      doc.setFillColor(245, 245, 245);
      doc.roundedRect(photoX, photoY, 23, 28, 2, 2, "FD");
      doc.setFontSize(7);
      doc.setTextColor(130, 130, 130);
      doc.text("Student Photo", photoX + 11.5, photoY + 31, { align: "center" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      const studentDetails = [
        ["Student Name", summary.studentName],
        ["Email", summary.studentEmail],
        ["WhatsApp", summary.studentWhatsapp],
        ["Status", "ACTIVE (Admitted)"],
        ["Enrolled Since", formatDate(summary.earliestDate)],
      ];

      let detailY = y + 15;
      const detailMaxWidth = photoX - (margin + 5) - 3;
      studentDetails.forEach(([label, value]) => {
        doc.setFont("helvetica", "bold");
        doc.text(`${label}:`, margin + 5, detailY);
        doc.setFont("helvetica", "normal");
        const valueLines = doc.splitTextToSize(String(value), detailMaxWidth - 32);
        doc.text(valueLines, margin + 37, detailY);
        detailY += 4.5;
      });

      // Courses table
      y = y + summaryHeight + 6;
      const colX = {
        course: margin + 3,
        tutor: margin + 68,
        amount: margin + 118,
        since: margin + 143,
      };
      const colWidth = {
        course: 62,
        tutor: 47,
        amount: 22,
        since: 25,
      };

      doc.setFillColor(232, 240, 253);
      doc.rect(margin, y, pageWidth - 2 * margin, 7, "F");
      doc.setDrawColor(21, 101, 192);
      doc.setLineWidth(0.4);
      doc.rect(margin, y, pageWidth - 2 * margin, 7);
      doc.setTextColor(21, 101, 192);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text("Course", colX.course, y + 5);
      doc.text("Tutor(s)", colX.tutor, y + 5);
      doc.text("Rs./month", colX.amount, y + 5);
      doc.text("Since", colX.since, y + 5);

      y += 7;
      const tableTop = y;
      doc.setFont("helvetica", "normal");
      doc.setTextColor(40, 40, 40);
      doc.setFontSize(8.5);

      summary.courses.forEach((course) => {
        const courseLines = doc.splitTextToSize(course.course_name, colWidth.course - 2);
        const tutorLines = doc.splitTextToSize(course.tutor_name, colWidth.tutor - 2);
        const rowHeight = Math.max(courseLines.length, tutorLines.length) * 3.8 + 3;

        doc.text(courseLines, colX.course, y + 4.5);
        doc.text(tutorLines, colX.tutor, y + 4.5);
        doc.text(`Rs.${course.amount_paid.toLocaleString("en-IN")}`, colX.amount, y + 4.5);
        doc.text(formatDate(course.date), colX.since, y + 4.5);

        y += rowHeight;
        doc.setDrawColor(225, 229, 235);
        doc.setLineWidth(0.2);
        doc.line(margin, y, pageWidth - margin, y);
      });

      // Total row
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(21, 101, 192);
      doc.text("TOTAL (monthly)", colX.course, y + 5);
      doc.text(`Rs.${summary.totalMonthly.toLocaleString("en-IN")}`, colX.amount, y + 5);
      y += 8;

      doc.setDrawColor(21, 101, 192);
      doc.setLineWidth(0.5);
      doc.rect(margin, tableTop - 7, pageWidth - 2 * margin, y - (tableTop - 7));

      // T&C section
      y += 6;
      doc.setFillColor(245, 247, 250);
      const tcBoxHeight = Math.max(120, pageHeight - y - 40);
      doc.roundedRect(margin, y, pageWidth - 2 * margin, tcBoxHeight, 3, 3, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(21, 101, 192);
      doc.text("GENERAL TERMS & CONDITIONS", margin + 5, y + 8);

      doc.setTextColor(40, 40, 40);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      let tcY = y + 15;
      TERMS_AND_CONDITIONS.forEach((term, i) => {
        const lines = doc.splitTextToSize(`${i + 1}. ${term}`, pageWidth - 2 * margin - 12);
        doc.text(lines, margin + 5, tcY);
        tcY += lines.length * 3.8 + 1;
      });

      // If the course table pushed content close to the page bottom, add a
      // new page for the signature block rather than overlapping it.
      let sigY = pageHeight - 30;
      if (y + tcBoxHeight > pageHeight - 35) {
        doc.addPage();
        sigY = pageHeight - 30;
      }

      doc.setDrawColor(120, 120, 120);
      doc.setLineWidth(0.3);
      doc.line(margin + 10, sigY, margin + 70, sigY);
      doc.line(pageWidth - margin - 70, sigY, pageWidth - margin - 10, sigY);
      doc.setFontSize(8);
      doc.setTextColor(60, 60, 60);
      doc.text("Parent / Guardian Signature", margin + 10, sigY + 5);
      doc.text("Authorized Signatory (ACAD)", pageWidth - margin - 70, sigY + 5);

      doc.setFontSize(7);
      doc.setTextColor(130, 130, 130);
      doc.text(`${ACAD_WEBSITE}  •  This is a computer-generated admission card and does not require a physical seal.`, pageWidth / 2, pageHeight - 8, { align: "center" });

      const fileName = `Admission_${(summary.studentName || "student").replace(/\s+/g, "_")}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error("PDF generation error:", error);
      alert("Failed to generate PDF: " + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Admission Card</DialogTitle>
        </DialogHeader>

        {/* On-screen admission card preview */}
        <div className="border-2 border-blue-600 rounded-lg p-6 bg-white">
          <div className="bg-[#1565C0] text-white -m-6 mb-4 p-4 rounded-t-lg flex items-center gap-3">
            <img src={ACAD_LOGO_URL} alt="ACAD Logo" className="w-14 h-14 rounded-full border-2 border-white object-cover flex-shrink-0" />
            <div>
              <h2 className="text-xl font-bold">ACAD COACHING CENTER</h2>
              <p className="text-sm opacity-90">Official Admission Card</p>
              <p className="text-xs opacity-80">
                <span className="font-semibold">{ACAD_WEBSITE}</span>
                {" | acadcoachingcenter@gmail.com | +91-9790818436"}
              </p>
            </div>
          </div>

          <div className="flex justify-between items-start mb-3">
            <h3 className="font-bold text-blue-700">ADMISSION CONFIRMATION</h3>
            <div className="w-20 h-24 border-2 border-dashed border-slate-300 rounded flex items-center justify-center text-xs text-slate-400 text-center">
              Student<br />Photo
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm mb-4">
            <p><strong>Student:</strong> {summary.studentName}</p>
            <p><strong>Status:</strong> <span className="text-green-600 font-semibold">ACTIVE</span></p>
            <p><strong>Email:</strong> {summary.studentEmail}</p>
            <p><strong>WhatsApp:</strong> {summary.studentWhatsapp}</p>
            <p className="col-span-2"><strong>Enrolled Since:</strong> {formatDate(summary.earliestDate)}</p>
          </div>

          {/* Courses table */}
          <div className="border border-blue-200 rounded-lg overflow-hidden mb-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-blue-50 text-blue-700">
                  <th className="text-left px-3 py-2 font-semibold">Course</th>
                  <th className="text-left px-3 py-2 font-semibold">Tutor(s)</th>
                  <th className="text-left px-3 py-2 font-semibold whitespace-nowrap">₹/month</th>
                  <th className="text-left px-3 py-2 font-semibold whitespace-nowrap">Since</th>
                </tr>
              </thead>
              <tbody>
                {summary.courses.map((course) => (
                  <tr key={course.id} className="border-t border-slate-100">
                    <td className="px-3 py-2 align-top">{course.course_name}</td>
                    <td className="px-3 py-2 align-top">{course.tutor_name}</td>
                    <td className="px-3 py-2 align-top whitespace-nowrap">₹{course.amount_paid.toLocaleString("en-IN")}</td>
                    <td className="px-3 py-2 align-top whitespace-nowrap">{formatDate(course.date)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-blue-200 bg-blue-50 font-semibold text-blue-700">
                  <td className="px-3 py-2" colSpan={2}>TOTAL (monthly)</td>
                  <td className="px-3 py-2 whitespace-nowrap">₹{summary.totalMonthly.toLocaleString("en-IN")}</td>
                  <td className="px-3 py-2"></td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="mt-4 bg-slate-50 p-3 rounded">
            <h4 className="font-bold text-blue-700 text-sm mb-2">General Terms & Conditions</h4>
            <ol className="list-decimal list-inside text-xs text-slate-700 space-y-1">
              {TERMS_AND_CONDITIONS.map((term, i) => (
                <li key={i}>{term}</li>
              ))}
            </ol>
          </div>

          <div className="flex justify-between mt-6 text-xs text-slate-500">
            <div>
              <div className="border-t border-slate-400 w-32 mt-8"></div>
              Parent / Guardian
            </div>
            <div className="text-right">
              <div className="border-t border-slate-400 w-32 mt-8"></div>
              Authorized Signatory (ACAD)
            </div>
          </div>

          <div className="text-center text-[10px] text-slate-400 mt-4">
            {ACAD_WEBSITE} • This is a computer-generated admission card and does not require a physical seal.
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="w-4 h-4 mr-2" /> Close
          </Button>
          <Button onClick={handleDownloadPDF} disabled={isGenerating} className="bg-[#1565C0] hover:bg-[#1e88e5]">
            <Download className="w-4 h-4 mr-2" />
            {isGenerating ? "Generating..." : "Download PDF"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
