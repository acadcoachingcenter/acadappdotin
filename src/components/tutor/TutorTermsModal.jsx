import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function TutorTermsModal({ open, onClose }) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">ACAD Tutor Terms &amp; Conditions</DialogTitle>
          <DialogDescription>
            Please read these terms carefully before registering as a tutor with ACAD.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4 text-sm text-slate-700 leading-relaxed">
            <h3 className="text-lg font-bold text-slate-900">ACAD Tutor Agreement</h3>
            <p>
              By registering as a tutor with <strong>ACAD (acadapp.in)</strong>, you agree to comply
              with the following Terms &amp; Conditions.
            </p>

            <Section title="1. Demo Class Requirement">
              <ul className="list-disc pl-5 space-y-1">
                <li>Every tutor must conduct <strong>one free demo class</strong> before being approved.</li>
                <li>The demo class shall be conducted <strong>in the presence of an ACAD Administrator or designated representative</strong>.</li>
                <li>Tutor approval is subject to the quality of teaching, communication, and professionalism demonstrated during the demo session.</li>
              </ul>
            </Section>

            <Section title="2. Fee Structure for ACAD-Referred Students">
              <ul className="list-disc pl-5 space-y-1">
                <li>For every student assigned through <strong>ACAD</strong>, tutors shall charge <strong>only the fee approved by ACAD</strong>.</li>
                <li>Tutors shall not collect any additional amount directly from students without prior written approval from ACAD.</li>
                <li>Revenue sharing shall be:
                  <ul className="list-disc pl-5 mt-1">
                    <li><strong>80% to the Tutor</strong></li>
                    <li><strong>20% to ACAD</strong></li>
                  </ul>
                </li>
                <li>Example: If an 8th Grade student pays ₹1,000 per subject per month — Tutor receives ₹800, ACAD receives ₹200.</li>
              </ul>
            </Section>

            <Section title="3. Students Brought by the Tutor">
              <ul className="list-disc pl-5 space-y-1">
                <li>Tutors may enroll students whom they have personally referred.</li>
                <li>For the <strong>first five (5) self-referred enrolled students</strong>, no platform commission or subscription fee will be charged.</li>
                <li>After five enrolled students, the tutor shall subscribe to the applicable <strong>ACAD Tutor Subscription Plan</strong> to continue using ACAD services.</li>
                <li>ACAD reserves the right to revise subscription plans with prior notice.</li>
              </ul>
            </Section>

            <Section title="4. Class Approval Process">
              <ul className="list-disc pl-5 space-y-1">
                <li>Both the <strong>student enrollment</strong> and <strong>tutor registration</strong> must be approved by ACAD before classes begin.</li>
                <li>Classes for ACAD-referred students shall commence only after: Student verification, Tutor approval, and Confirmation from the ACAD Administration.</li>
                <li>Official online class links will be shared through ACAD.</li>
              </ul>
            </Section>

            <Section title="5. Teaching Platform">
              <ul className="list-disc pl-5 space-y-1">
                <li>Tutors assigned by ACAD shall conduct classes using the platform or meeting link specified by ACAD.</li>
                <li>For students personally referred by the tutor, the tutor may use their own preferred teaching platform (Google Meet, Zoom, Microsoft Teams, etc.), unless otherwise agreed.</li>
              </ul>
            </Section>

            <Section title="6. Academic Support by ACAD">
              <p>Where required, ACAD may provide:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Study materials, Notes and worksheets</li>
                <li>Weekly and monthly assessments</li>
                <li>Question papers, Mock examinations</li>
                <li>Revision schedules, Performance analytics</li>
                <li>Parent progress reports</li>
                <li>Academic monitoring and mentoring</li>
              </ul>
              <p className="mt-1">Tutors are expected to cooperate with ACAD in implementing these academic resources.</p>
            </Section>

            <Section title="7. Student Conduct & Quality Standards">
              <p>Tutors shall:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Conduct classes punctually.</li>
                <li>Maintain professionalism and respectful behaviour.</li>
                <li>Prepare lessons in advance.</li>
                <li>Encourage student participation.</li>
                <li>Maintain confidentiality of student information.</li>
                <li>Avoid discrimination based on religion, caste, gender, language, nationality, or disability.</li>
              </ul>
            </Section>

            <Section title="8. Attendance & Class Records">
              <ul className="list-disc pl-5 space-y-1">
                <li>Tutors shall maintain attendance records.</li>
                <li>Missed classes must be rescheduled in consultation with students and ACAD.</li>
                <li>Repeated cancellations or absenteeism may lead to suspension or termination.</li>
              </ul>
            </Section>

            <Section title="9. Payments">
              <ul className="list-disc pl-5 space-y-1">
                <li>Payments shall be processed according to ACAD's payment schedule after successful fee collection from students.</li>
                <li>Tutors shall not directly collect payments from ACAD-assigned students.</li>
                <li>Any direct payment requests without authorization may result in removal from the platform.</li>
              </ul>
            </Section>

            <Section title="10. Non-Circumvention">
              <ul className="list-disc pl-5 space-y-1">
                <li>Tutors shall not encourage ACAD-referred students to discontinue ACAD and continue private classes independently.</li>
                <li>Any attempt to bypass ACAD's platform or payment system may result in immediate termination and permanent removal.</li>
              </ul>
            </Section>

            <Section title="11. Code of Ethics">
              <p>Tutors agree to:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Maintain a positive learning environment.</li>
                <li>Use appropriate language and behaviour.</li>
                <li>Protect student privacy.</li>
                <li>Avoid sharing copyrighted materials without permission.</li>
                <li>Comply with applicable educational and legal regulations.</li>
              </ul>
            </Section>

            <Section title="12. Suspension & Termination">
              <p>ACAD reserves the right to suspend or terminate a tutor account for:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Violation of these Terms &amp; Conditions.</li>
                <li>Poor teaching quality.</li>
                <li>Student complaints.</li>
                <li>Fee-related misconduct.</li>
                <li>Unprofessional behaviour.</li>
                <li>Academic malpractice.</li>
                <li>Misrepresentation of qualifications.</li>
              </ul>
            </Section>

            <Section title="13. Modification of Terms">
              <p>
                ACAD reserves the right to update or modify these Terms &amp; Conditions at any time.
                Continued use of the platform constitutes acceptance of the revised terms.
              </p>
            </Section>

            <Section title="14. Acceptance">
              <p>
                By registering as an ACAD Tutor, you acknowledge that you have read, understood, and
                agreed to these Terms &amp; Conditions and undertake to comply with all policies
                established by ACAD.
              </p>
            </Section>

            <div className="border-t pt-4 mt-4">
              <p className="font-semibold text-slate-900">ACAD – Online Learning Platform</p>
              <p>Website: <span className="text-blue-600">acadapp.in</span></p>
              <p>Email: <span className="text-blue-600">acadcoachingcenter@gmail.com</span></p>
              <p>Phone: +91 97908 18436</p>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <h4 className="font-bold text-slate-900 mb-1">{title}</h4>
      {children}
    </div>
  );
}