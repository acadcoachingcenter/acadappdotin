import React, { useState, useEffect } from "react";
import { apiClient } from "@/api/apiClient";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Clock, Loader2, BookOpen, ExternalLink } from "lucide-react";

export default function AdminBookApprovals() {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [filter, setFilter] = useState("pending");

  useEffect(() => {
    loadPurchases();
  }, []);

  const loadPurchases = async () => {
    setLoading(true);
    try {
      const all = await apiClient.entities.BookPurchase.list("-created_date", 200);
      setPurchases(all);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (purchase) => {
    setProcessing(purchase.id);
    try {
      await apiClient.entities.BookPurchase.update(purchase.id, {
        status: "approved",
        approved_date: new Date().toISOString(),
      });
      loadPurchases();
    } catch (e) {
      console.error(e);
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (purchase) => {
    setProcessing(purchase.id);
    try {
      await apiClient.entities.BookPurchase.update(purchase.id, {
        status: "rejected",
        approved_date: new Date().toISOString(),
      });
      loadPurchases();
    } catch (e) {
      console.error(e);
    } finally {
      setProcessing(null);
    }
  };

  const filtered = purchases.filter((p) => p.status === filter);

  const counts = {
    pending: purchases.filter((p) => p.status === "pending").length,
    approved: purchases.filter((p) => p.status === "approved").length,
    rejected: purchases.filter((p) => p.status === "rejected").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Book Purchase Approvals</h1>
        <p className="text-slate-500 text-sm mt-1">Verify payment proofs and grant book access</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {[
          { key: "pending", label: "Pending", icon: Clock, color: "amber" },
          { key: "approved", label: "Approved", icon: CheckCircle, color: "green" },
          { key: "rejected", label: "Rejected", icon: XCircle, color: "red" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === tab.key
                ? `bg-${tab.color}-100 text-${tab.color}-700`
                : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            <Badge className="bg-slate-200 text-slate-600 ml-1">{counts[tab.key]}</Badge>
          </button>
        ))}
      </div>

      {/* Purchase cards */}
      {filtered.length === 0 ? (
        <Card className="p-12 text-center text-slate-400">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>No {filter} purchases.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((purchase) => (
            <Card key={purchase.id} className="border border-slate-200">
              <CardContent className="p-5">
                <div className="flex flex-col md:flex-row gap-5">
                  {/* Payment proof image */}
                  <div className="flex-shrink-0">
                    {purchase.payment_proof_url ? (
                      <a
                        href={purchase.payment_proof_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                      >
                        <img
                          src={purchase.payment_proof_url}
                          alt="Payment proof"
                          className="w-full md:w-48 h-auto max-h-48 object-contain rounded-lg border border-slate-200 hover:opacity-80 transition-opacity"
                        />
                        <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                          <ExternalLink className="w-3 h-3" /> Click to view full size
                        </p>
                      </a>
                    ) : (
                      <div className="w-48 h-32 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 text-sm">
                        No proof uploaded
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-slate-900">{purchase.book_title}</h3>
                        <p className="text-sm text-slate-500">{purchase.user_name}</p>
                        <p className="text-xs text-slate-400">{purchase.user_email}</p>
                      </div>
                      <Badge className={
                        purchase.status === "pending" ? "bg-amber-100 text-amber-700" :
                        purchase.status === "approved" ? "bg-green-100 text-green-700" :
                        "bg-red-100 text-red-700"
                      }>
                        {purchase.status}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                      <span>Amount: ₹{purchase.amount_paid || "N/A"}</span>
                      <span>·</span>
                      <span>Submitted: {purchase.purchase_date ? new Date(purchase.purchase_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "N/A"}</span>
                    </div>

                    {purchase.status === "pending" && (
                      <div className="flex gap-2 pt-2">
                        <Button
                          className="gap-2 bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => handleApprove(purchase)}
                          disabled={processing === purchase.id}
                        >
                          {processing === purchase.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                          Approve & Grant Access
                        </Button>
                        <Button
                          variant="outline"
                          className="gap-2 border-red-200 text-red-600 hover:bg-red-50"
                          onClick={() => handleReject(purchase)}
                          disabled={processing === purchase.id}
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
