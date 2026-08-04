import React, { useState, useEffect } from "react";
import { apiClient } from "@/api/apiClient";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Check, Crown, Zap, Rocket, Users, ExternalLink, ShieldCheck } from "lucide-react";

export const PLAN_LIMITS = { free: 5, pro: 10, elite: Infinity };

const PAYMENT_LINK = "https://pmny.in/xJuAmT6XgxX7";

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: 0,
    icon: Users,
    color: "from-slate-500 to-slate-600",
    studentCap: 5,
    features: [
      "Up to 5 active students",
      "Appear in nearby tutor search",
      "Basic profile listing",
      "Receive student interest requests"
    ]
  },
  {
    id: "pro",
    name: "Pro",
    price: 199,
    icon: Zap,
    color: "from-blue-500 to-indigo-600",
    studentCap: 10,
    features: [
      "Up to 10 active students",
      "Priority placement in search",
      "All Free features included",
      "Faster student matching"
    ]
  },
  {
    id: "elite",
    name: "Elite",
    price: 499,
    icon: Rocket,
    color: "from-amber-500 to-orange-600",
    studentCap: "Unlimited",
    features: [
      "Unlimited active students",
      "Top placement in search",
      "All Pro features included",
      "Premium support"
    ]
  }
];

export default function TutorSubscription() {
  const { toast } = useToast();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const u = await apiClient.auth.me();
        const existing = await apiClient.entities.HomeTutor.filter({ tutor_id: u.id });
        if (existing.length > 0) setProfile(existing[0]);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleUpgrade = (plan) => {
    window.open(PAYMENT_LINK, "_blank", "noopener,noreferrer");
    toast({
      title: `Upgrade to ${plan.name}`,
      description: "Complete the payment, then message admin with your payment ID to activate your plan."
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  const currentPlan = profile?.subscription_plan || "free";
  const approvalStatus = profile?.approval_status;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
          <Crown className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Subscription Plans</h1>
          <p className="text-slate-600">
            Choose a plan based on how many students you want to teach.
          </p>
        </div>
      </div>

      {!profile && (
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4 flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-amber-600" />
            <p className="text-sm text-amber-800">
              You haven't created a home tutor profile yet.{" "}
              <Link to={createPageUrl("BecomeHomeTutor")} className="underline font-medium">
                Create your profile first
              </Link>{" "}
              to get started.
            </p>
          </CardContent>
        </Card>
      )}

      {profile && approvalStatus !== "approved" && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4 flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            <p className="text-sm text-blue-800">
              Your tutor profile is currently <strong>{approvalStatus || "pending"}</strong>. Plan upgrades
              activate after admin approval.
            </p>
          </CardContent>
        </Card>
      )}

      {profile && (
        <Card className="bg-slate-900 text-white">
          <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <p className="text-sm text-slate-300">Current Plan</p>
              <p className="text-2xl font-bold capitalize">{currentPlan}</p>
              {profile.subscription_end_date && (
                <p className="text-xs text-slate-400 mt-1">
                  Renews/Expires: {new Date(profile.subscription_end_date).toLocaleDateString()}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-300">Student Capacity</p>
              <p className="text-2xl font-bold">
                {PLAN_LIMITS[currentPlan] === Infinity ? "Unlimited" : PLAN_LIMITS[currentPlan]}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {PLANS.map((plan) => {
          const isCurrent = currentPlan === plan.id;
          const Icon = plan.icon;
          return (
            <Card
              key={plan.id}
              className={`relative flex flex-col ${isCurrent ? "ring-2 ring-indigo-500" : ""}`}
            >
              {isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-indigo-600 text-white">Current Plan</Badge>
                </div>
              )}
              <CardHeader>
                <div className={`w-12 h-12 bg-gradient-to-br ${plan.color} rounded-xl flex items-center justify-center mb-2`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <p className="text-3xl font-bold text-slate-900">
                  ₹{plan.price}
                  <span className="text-sm font-normal text-slate-500">/month</span>
                </p>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col">
                <p className="text-sm text-slate-600 mb-3">
                  <strong>{plan.studentCap === "Unlimited" ? "Unlimited" : `Up to ${plan.studentCap}`}</strong> active students
                </p>
                <ul className="space-y-2 mb-6 flex-grow">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                      <Check className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                {plan.id === "free" ? (
                  <Button variant="outline" className="w-full" disabled={isCurrent}>
                    {isCurrent ? "Active" : "Free Forever"}
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    disabled={isCurrent}
                    onClick={() => handleUpgrade(plan)}
                  >
                    {isCurrent ? (
                      "Current Plan"
                    ) : (
                      <>
                        Upgrade to {plan.name}
                        <ExternalLink className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-slate-50 border-slate-200">
        <CardContent className="p-4 text-sm text-slate-600">
          <p className="font-medium text-slate-800 mb-1">How upgrades work</p>
          <p>
            Click <strong>Upgrade</strong> to open the secure payment page. After completing payment,
            share your payment ID with the admin. Once verified, your plan will be activated within
            24 hours. Plans are billed monthly.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}