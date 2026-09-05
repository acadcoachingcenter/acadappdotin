import AdminClassroomPage from "./AdminClassroomPage";
import StudentClassroomPage from "./StudentClassroomPage";
import TutorClassroomPage from "./TutorClassroomPage";
import { acadUserType, isAcadAdmin } from "@/lib/classroomApi";

export default function OnlineClassroomPage({ user }) {
  const admin = isAcadAdmin(user);
  const type = acadUserType(user);

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold text-slate-900">Online Classroom</h1>

      <p className="mb-6 text-sm text-slate-600">
        {admin && "Schedule classes and send Google Calendar + WhatsApp invitations to tutors and students."}
        {!admin && type === "student" && "Join your scheduled ACAD live classes."}
        {!admin && type === "tutor" && "View your assigned classes and join the scheduled Google Meet."}
        {!admin && type !== "student" && type !== "tutor" && "This page is for ACAD tutors and students."}
      </p>

      {admin && <AdminClassroomPage user={user} />}
      {!admin && type === "student" && <StudentClassroomPage user={user} />}
      {!admin && type === "tutor" && <TutorClassroomPage user={user} />}
    </div>
  );
}
