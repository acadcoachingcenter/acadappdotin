import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  ThumbsUp,
  Pencil,
  ThumbsDown,
  Loader2,
} from "lucide-react";

const CONTENT_TYPES = [
  { value: "batch_promo", label: "Batch/course promo" },
  { value: "fee_reminder", label: "Fee reminder" },
  { value: "admission_drive", label: "Admission drive" },
  { value: "festival_greeting", label: "Festival greeting" },
  { value: "re_engagement", label: "Re-engagement nudge" },
  { value: "review_request", label: "Review request" },
];

export default function MarketingSkillPanel() {
  const [contentType, setContentType] = useState("batch_promo");
  const [channel, setChannel] = useState("whatsapp");
  const [requestText, setRequestText] = useState("");
  const [draft, setDraft] = useState(null);
  const [editedText, setEditedText] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastLearned, setLastLearned] = useState(null);
  const [skills, setSkills] = useState([]);

  const API_BASE = import.meta.env.VITE_API_BASE;

  useEffect(() => {
    loadSkills();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentType]);

  async function loadSkills() {
    try {
      const res = await fetch(
        `${API_BASE}/api/marketing/skills?contentType=${contentType}`,
        {
          method: "GET",
          credentials: "include",
          headers: { Accept: "application/json" },
        }
      );
      if (res.ok) setSkills(await res.json());
    } catch (error) {
      console.error("Error fetching skills:", error);
    }
  }

  async function handleGenerate() {
    if (!requestText.trim()) return;
    setLoading(true);
    setDraft(null);
    setLastLearned(null);
    try {
      const res = await fetch(`${API_BASE}/api/marketing/generate`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ contentType, channel, requestText }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setDraft(data);
      setEditedText(data.draftText);
    } catch (error) {
      console.error("Error generating draft:", error);
      alert("Generation failed: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleFeedback(status) {
    if (!draft) return;
    const finalText = status === "edited" ? editedText : draft.draftText;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/marketing/feedback`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ draftId: draft.draftId, status, finalText }),
      });
      const data = await res.json();
      if (status === "edited" && data.learnedSkill) {
        setLastLearned(data.learnedSkill);
      }
      setDraft(null);
      setRequestText("");
      setIsEditing(false);
      loadSkills();
    } catch (error) {
      console.error("Error submitting feedback:", error);
      alert("Feedback failed: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Marketing Content Assistant
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Gets better at ACAD's voice every time you edit or reject a draft.
          </p>
        </div>
        <div className="px-3 py-1 bg-teal-600 text-white rounded text-sm font-medium">
          <Sparkles className="w-4 h-4 mr-1 inline" />
          SELF-IMPROVING
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New request</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <select
              value={contentType}
              onChange={(e) => setContentType(e.target.value)}
              className="border border-slate-200 rounded-md px-3 py-2 text-sm"
            >
              {CONTENT_TYPES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              className="border border-slate-200 rounded-md px-3 py-2 text-sm"
            >
              <option value="whatsapp">WhatsApp</option>
              <option value="sms">SMS</option>
              <option value="email">Email</option>
              <option value="social">Social</option>
            </select>
          </div>

          <textarea
            value={requestText}
            onChange={(e) => setRequestText(e.target.value)}
            placeholder="e.g. Diwali greeting for NEET batch parents"
            rows={3}
            className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
          />

          <Button
            onClick={handleGenerate}
            disabled={loading || !requestText.trim()}
            className="bg-[#1565C0] hover:bg-[#0d47a1]"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            Generate draft
          </Button>
        </CardContent>
      </Card>

      {draft && (
        <Card className="border-2 border-blue-200">
          <CardHeader>
            <CardTitle className="text-base">Draft</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <textarea
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                rows={4}
                className="w-full border border-blue-300 rounded-md px-3 py-2 text-sm"
              />
            ) : (
              <p className="whitespace-pre-wrap text-slate-800 text-sm">
                {draft.draftText}
              </p>
            )}

            {draft.skillsApplied?.length > 0 && (
              <details className="text-xs text-slate-500">
                <summary className="cursor-pointer font-medium">
                  {draft.skillsApplied.length} learned rule(s) applied
                </summary>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  {draft.skillsApplied.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </details>
            )}

            <div className="flex flex-wrap gap-3">
              {!isEditing ? (
                <>
                  <Button
                    onClick={() => handleFeedback("accepted")}
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <ThumbsUp className="w-4 h-4 mr-2" />
                    Accept &amp; send
                  </Button>
                  <Button
                    onClick={() => setIsEditing(true)}
                    disabled={loading}
                    variant="outline"
                  >
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    onClick={() => handleFeedback("rejected")}
                    disabled={loading}
                    variant="outline"
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    <ThumbsDown className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => handleFeedback("edited")}
                  disabled={loading}
                  className="bg-[#1565C0] hover:bg-[#0d47a1]"
                >
                  Save edited version
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {lastLearned && (
        <div className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-md p-3">
          Learned: "{lastLearned}"
        </div>
      )}

      {skills.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Skills learned so far for this content type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-slate-600 space-y-2">
              {skills.map((s) => (
                <li key={s.id} className="flex items-start justify-between gap-4">
                  <span>{s.procedure_text}</span>
                  <span className="text-xs text-slate-400 whitespace-nowrap">
                    {s.success_count}✓ / {s.fail_count}✗
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
