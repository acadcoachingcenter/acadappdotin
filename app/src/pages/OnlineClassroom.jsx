import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import OnlineClassroomPage from "@/features/onlineClassroom/pages/OnlineClassroomPage";

export default function OnlineClassroom() {
  const { user, isLoadingAuth, navigateToLogin } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <Loader2 className="w-8 h-8 mx-auto animate-spin text-slate-800" />
        <p className="mt-4 text-slate-600">Loading classroom…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center space-y-4">
        <p className="text-slate-600">Please sign in to view the classroom.</p>
        <button
          onClick={() => navigateToLogin()}
          className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white"
        >
          Sign in
        </button>
      </div>
    );
  }

  return <OnlineClassroomPage user={user} />;
}
