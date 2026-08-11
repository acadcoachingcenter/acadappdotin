import AdminClassroomPage from "./AdminClassroomPage";
import StudentClassroomPage from "./StudentClassroomPage";
import TutorClassroomPage from "./TutorClassroomPage";

export default function OnlineClassroomPage({ user }) {
  return (
    <div>
      <h1 className="mb-1 font-display text-2xl font-semibold text-ink">
        Online Classroom
      </h1>

      <p className="mb-6 text-sm text-slate">
        {user.role === "student" && "Join your scheduled ACAD live classes."}
        {user.role === "tutor" && "View your assigned classes and join the scheduled Google Meet."}
        {user.role === "admin" && "Schedule classes and send Google Calendar invitations to tutors and students."}
      </p>

      {user.role === "student" && <StudentClassroomPage user={user} />}
      {user.role === "tutor" && <TutorClassroomPage user={user} />}
      {user.role === "admin" && <AdminClassroomPage user={user} />}
    </div>
  );
}
