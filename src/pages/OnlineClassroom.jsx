import OnlineClassroomPage from "@/features/onlineClassroom/pages/OnlineClassroomPage";
import { useAuth } from "@/lib/AuthContext";

export default function OnlineClassroom() {
  const { user } = useAuth();

  return <OnlineClassroomPage user={user} />;
}
