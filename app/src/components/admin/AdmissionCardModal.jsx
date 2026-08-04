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

async function loadImageAsDataURL(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

export default function AdmissionCardModal({ enrollment, open, onOpenChange }) {
  const [isGenerating, setIsGenerating] = useState(false);

  if (!enrollment) return null;

  const enrollmentDate = new Date(enrollment.enrollment_date || enrollment.created_date).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric"
  });

  const handleDownloadPDF = async () => {
    setIsGenerating(true);
    try {
      const logoDataUrl = await loadImageAsDataURL(ACAD_LOGO_URL);
      const doc = new jsPDF("p", "mm", "a4");
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;

      // Header band
      doc.setFillColor(21, 101, 192);
      doc.rect(0, 0, pageWidth, 30, "F");
      if (logoDataUrl) {
        try { doc.addImage(logoDataUrl, "PNG", margin, 4, 20, 20); } catch (e) { /* skip logo */ }
      }
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("ACAD COACHING CENTER", margin + 24, 13);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text("Official Admission Card", margin + 24, 20);
      doc.text("acadcoachingcenter@gmail.com  |  +91-9790818436", margin + 24, 25);

      // Card border
      let y = 38;
      const cardHeight = 60;
      doc.setDrawColor(21, 101, 192);
      doc.setLineWidth(0.6);
      doc.roundedRect(margin, y, pageWidth - 2 * margin, cardHeight, 3, 3);

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
      const details = [
        ["Student Name", enrollment.student_name || "-"],
        ["Email", enrollment.student_email || "-"],
        ["WhatsApp", enrollment.student_whatsapp || "-"],
        ["Course", enrollment.course_name || "-"],
        ["Tutor(s)", enrollment.tutor_name || "-"],
        ["Amount (Monthly)", `Rs. ${enrollment.amount_paid?.toLocaleString("en-IN") || 0} / month`],
        ["Transaction ID", enrollment.payment_transaction_id || "-"],
        ["Enrollment Date", enrollmentDate],
        ["Status", "ACTIVE (Admitted)"]
      ];

      let detailY = y + 15;
      const detailMaxWidth = photoX - (margin + 5) - 3;
      details.forEach(([label, value]) => {
        doc.setFont("helvetica", "bold");
        doc.text(`${label}:`, margin + 5, detailY);
        doc.setFont("helvetica", "normal");
        const valueLines = doc.splitTextToSize(String(value), detailMaxWidth - 37);
        doc.text(valueLines, margin + 42, detailY);
        detailY += 4.5;
      });

      // T&C section
      y = 108;
      doc.setFillColor(245, 247, 250);
      doc.roundedRect(margin, y, pageWidth - 2 * margin, 175, 3, 3, "F");
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

      // Signature row
      const sigY = pageHeight - 30;
      doc.setDrawColor(120, 120, 120);
      doc.setLineWidth(0.3);
      doc.line(margin + 10, sigY, margin + 70, sigY);
      doc.line(pageWidth - margin - 70, sigY, pageWidth - margin - 10, sigY);
      doc.setFontSize(8);
      doc.setTextColor(60, 60, 60);
      doc.text("Parent / Guardian Signature", margin + 10, sigY + 5);
      doc.text("Authorized Signatory (ACAD)", pageWidth - margin - 70, sigY + 5);

      // Footer
      doc.setFontSize(7);
      doc.setTextColor(130, 130, 130);
      doc.text("This is a computer-generated admission card and does not require a physical seal.", pageWidth / 2, pageHeight - 8, { align: "center" });

      const fileName = `Admission_${(enrollment.student_name || "student").replace(/\s+/g, "_")}.pdf`;
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
              <p className="text-xs opacity-80">acadcoachingcenter@gmail.com | +91-9790818436</p>
            </div>
          </div>

          <div className="flex justify-between items-start mb-3">
            <h3 className="font-bold text-blue-700">ADMISSION CONFIRMATION</h3>
            <div className="w-20 h-24 border-2 border-dashed border-slate-300 rounded flex items-center justify-center text-xs text-slate-400 text-center">
              Student<br />Photo
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <p><strong>Student:</strong> {enrollment.student_name || "-"}</p>
            <p><strong>Status:</strong> <span className="text-green-600 font-semibold">ACTIVE</span></p>
            <p><strong>Email:</strong> {enrollment.student_email || "-"}</p>
            <p><strong>WhatsApp:</strong> {enrollment.student_whatsapp || "-"}</p>
            <p><strong>Course:</strong> {enrollment.course_name || "-"}</p>
            <p><strong>Tutor(s):</strong> {enrollment.tutor_name || "-"}</p>
            <p><strong>Amount:</strong> ₹{enrollment.amount_paid?.toLocaleString("en-IN") || 0}<span className="text-slate-500">/month</span></p>
            <p><strong>Date:</strong> {enrollmentDate}</p>
            {enrollment.payment_transaction_id && (
              <p className="col-span-2"><strong>Transaction ID:</strong> {enrollment.payment_transaction_id}</p>
            )}
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