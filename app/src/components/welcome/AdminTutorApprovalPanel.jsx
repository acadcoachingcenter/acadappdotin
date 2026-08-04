import React, { useState, useEffect } from "react";
import { apiClient } from "@/api/apiClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { ShieldCheck, Check, X, Clock, Loader2, ChevronDown, ChevronUp } from "lucide-react";

export default function AdminTutorApprovalPanel() {
  const { toast } = useToast();
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [expanded, setExpanded] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiClient.entities.HomeTutor.list("-created_date");
      setTutors(data);
    } catch (e) {
      toast({ title: "Failed to load tutors", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const setApproval = async (tutor, status) => {
    setUpdatingId(tutor.id);
    try {
      await apiClient.entities.HomeTutor.update(tutor.id, { approval_status: status });
      toast({ title: `Tutor ${status}`, description: tutor.tutor_name });
      await load();
    } catch (e) {
      toast({ title: "Failed: " + e.message, variant: "destructive" });
    } finally {
      setUpdatingId(null);
    }
  };

  const statusColor = (s) => {
    switch (s) {
      case "approved": return "bg-emerald-100 text-emerald-800";
      case "rejected": return "bg-red-100 text-red-800";
      default: return "bg-amber-100 text-amber-800";
    }
  };

  const pendingCount = tutors.filter(t => (t.approval_status || "pending") === "pending").length;

  return (
    <Card className="border-emerald-200 shadow-sm rounded-2xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-4"
      >
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-6 h-6" />
          <div className="text-left">
            <h3 className="font-bold text-lg">Admin · Tutor Approval Panel</h3>
            <p className="text-emerald-100 text-xs">{pendingCount} pending · {tutors.length} total tutors</p>
          </div>
        </div>
        {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </button>

      {expanded && (
        <CardContent className="p-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
            </div>
          ) : tutors.length === 0 ? (
            <p className="text-center text-slate-500 py-6 text-sm">No tutors enrolled yet.</p>
          ) : (
            <div className="space-y-3 max-h-[28rem] overflow-y-auto pr-1">
              {tutors.map((t) => {
                const status = t.approval_status || "pending";
                return (
                  <div key={t.id} className="border border-slate-200 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-900 truncate">{t.tutor_name}</span>
                        <Badge className={statusColor(status)}>{status}</Badge>
                      </div>
                      <p className="text-xs text-slate-500 truncate">{t.tutor_email}</p>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-500 mt-1">
                        <span>Subjects: {(t.subjects || []).join(", ") || "—"}</span>
                        <span>Exp: {t.experience_years || 0} yrs</span>
                        <span>₹{t.hourly_rate || 0}/hr</span>
                      </div>
                    </div>

                    <div className="flex gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant={status === "approved" ? "default" : "outline"}
                        onClick={() => setApproval(t, "approved")}
                        disabled={updatingId === t.id || status === "approved"}
                        className="h-8"
                      >
                        <Check className="w-3.5 h-3.5 mr-1" />Approve
                      </Button>
                      <Button
                        size="sm"
                        variant={status === "pending" ? "secondary" : "outline"}
                        onClick={() => setApproval(t, "pending")}
                        disabled={updatingId === t.id || status === "pending"}
                        className="h-8"
                      >
                        <Clock className="w-3.5 h-3.5 mr-1" />Pending
                      </Button>
                      <Button
                        size="sm"
                        variant={status === "rejected" ? "destructive" : "outline"}
                        onClick={() => setApproval(t, "rejected")}
                        disabled={updatingId === t.id || status === "rejected"}
                        className="h-8"
                      >
                        <X className="w-3.5 h-3.5 mr-1" />Reject
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}