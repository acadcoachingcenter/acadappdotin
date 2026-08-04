import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Search, Check, X, Users, Crown } from "lucide-react";

export default function AdminHomeTutorApproval() {
  const { toast } = useToast();
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.HomeTutor.list("-created_date");
      setTutors(data);
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to load tutors", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    let list = tutors;
    if (statusFilter !== "all") {
      list = list.filter(t => (t.approval_status || "pending") === statusFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(t =>
        t.tutor_name?.toLowerCase().includes(q) ||
        t.tutor_email?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [tutors, search, statusFilter]);

  const setApproval = async (tutor, status) => {
    setUpdatingId(tutor.id);
    try {
      await base44.entities.HomeTutor.update(tutor.id, { approval_status: status });
      toast({ title: `Tutor ${status}` });

      if (status === "approved" && tutor.tutor_email) {
        try {
          await base44.functions.invoke("sendTutorApprovalEmail", {
            tutorName: tutor.tutor_name,
            tutorEmail: tutor.tutor_email,
            subjects: tutor.subjects || []
          });
          toast({ title: "Approval email sent to tutor ✉️" });
        } catch (emailErr) {
          console.error("Email send failed:", emailErr);
          toast({ title: "Profile approved, but email failed to send", variant: "destructive" });
        }
      }

      await load();
    } catch (e) {
      toast({ title: "Failed: " + e.message, variant: "destructive" });
    } finally {
      setUpdatingId(null);
    }
  };

  const setPlan = async (tutor, plan) => {
    setUpdatingId(tutor.id);
    try {
      const now = new Date();
      const end = new Date();
      end.setMonth(end.getMonth() + 1);
      await base44.entities.HomeTutor.update(tutor.id, {
        subscription_plan: plan,
        subscription_start_date: now.toISOString(),
        subscription_end_date: end.toISOString()
      });
      toast({ title: `Plan set to ${plan}` });
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

  const planColor = (p) => {
    switch (p) {
      case "pro": return "bg-blue-100 text-blue-800";
      case "elite": return "bg-amber-100 text-amber-800";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
          <Users className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Home Tutor Approvals</h1>
          <p className="text-slate-600">Approve tutor profiles and manage subscription plans.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between flex-wrap gap-3">
            <span>Tutors ({filtered.length})</span>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Search tutors..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 w-56"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-slate-500 py-10">No tutors found.</p>
          ) : (
            <div className="space-y-4">
              {filtered.map((t) => {
                const status = t.approval_status || "pending";
                const plan = t.subscription_plan || "free";
                return (
                  <div key={t.id} className="border rounded-lg p-4">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold text-lg">{t.tutor_name}</h4>
                          <Badge className={statusColor(status)}>{status}</Badge>
                          <Badge className={planColor(plan)}>
                            <Crown className="w-3 h-3 mr-1" />{plan}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600">{t.tutor_email}</p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 mt-2">
                          <span>Subjects: {(t.subjects || []).join(", ") || "—"}</span>
                          <span>Grades: {(t.grades || []).join(", ") || "—"}</span>
                          <span>Exp: {t.experience_years || 0} yrs</span>
                          <span>Rate: ₹{t.hourly_rate || 0}/hr</span>
                          {t.subscription_end_date && (
                            <span>Plan ends: {new Date(t.subscription_end_date).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-3 lg:items-end">
                        <div className="flex gap-2">
                          {status !== "approved" && (
                            <Button
                              size="sm"
                              onClick={() => setApproval(t, "approved")}
                              disabled={updatingId === t.id}
                            >
                              <Check className="w-4 h-4 mr-1" />Approve
                            </Button>
                          )}
                          {status !== "rejected" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setApproval(t, "rejected")}
                              disabled={updatingId === t.id}
                            >
                              <X className="w-4 h-4 mr-1" />Reject
                            </Button>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500">Plan:</span>
                          <Select
                            value={plan}
                            onValueChange={(v) => setPlan(t, v)}
                            disabled={updatingId === t.id}
                          >
                            <SelectTrigger className="w-32 h-8"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="free">Free (3)</SelectItem>
                              <SelectItem value="pro">Pro (10)</SelectItem>
                              <SelectItem value="elite">Elite (∞)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}