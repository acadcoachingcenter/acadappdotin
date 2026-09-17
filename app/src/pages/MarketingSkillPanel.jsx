import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  ThumbsUp,
  Pencil,
  ThumbsDown,
  Loader2,
  Copy,
  Check,
  Trash2,
  Image as ImageIcon,
  Settings,
  X,
} from "lucide-react";

const CONTENT_TYPES = [
  { value: "batch_promo", label: "Batch/course promo" },
  { value: "fee_reminder", label: "Fee reminder" },
  { value: "admission_drive", label: "Admission drive" },
  { value: "festival_greeting", label: "Festival greeting" },
  { value: "re_engagement", label: "Re-engagement nudge" },
  { value: "review_request", label: "Review request" },
];

function CopyButton({ text, small }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (error) {
      console.error("Copy failed:", error);
      alert("Couldn't copy automatically — please select and copy the text manually.");
    }
  }

  return (
    <Button
      onClick={handleCopy}
      variant="outline"
      size={small ? "sm" : "default"}
    >
      {copied ? (
        <>
          <Check className="w-4 h-4 mr-2 text-green-600" />
          Copied
        </>
      ) : (
        <>
          <Copy className="w-4 h-4 mr-2" />
          Copy Text
        </>
      )}
    </Button>
  );
}

/**
 * Canvas-based branded graphic: approved text over a template with
 * the ACAD logo (if configured) and a contact-info footer. Renders
 * client-side, no image-generation API needed.
 */
function GraphicModal({ item, brand, onClose }) {
  const canvasRef = useRef(null);
  const [downloadUrl, setDownloadUrl] = useState(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = 1080;
    canvas.width = W;
    const pad = 60;
    const contentW = W - pad * 2;

    function draw(logoImg) {
      // --- Measure everything first (nothing drawn yet) ---
      let headerHeight;
      let logoDrawW = 0;
      let logoDrawH = 0;
      if (logoImg) {
        logoDrawH = 90;
        logoDrawW = (logoImg.width / logoImg.height) * logoDrawH;
        headerHeight = logoDrawH + 30;
      } else {
        headerHeight = 100;
      }

      // Structured layout: the opening/closing lines stay centered, bullet
      // lines (see STRUCTURE_INSTRUCTIONS on the backend - the AI is now
      // prompted to write short bullets starting with an emoji) render
      // left-aligned instead of as one dense centered paragraph. Still
      // shrinks the font if the content runs long, same as before.
      const maxTextWidth = contentW - 80;
      const bulletLeftMargin = pad + 60;
      const bulletGap = 14; // extra breathing room before each new bullet
      let fontSize = 40;
      let layout, lineHeight, textBlockHeight;
      const minFontSize = 24;
      do {
        ctx.font = `500 ${fontSize}px system-ui, sans-serif`;
        layout = layoutLines(ctx, item.final_text || item.draft_text, {
          centerMaxWidth: maxTextWidth,
          bulletMaxWidth: maxTextWidth,
          bulletIndent: 0,
        });
        lineHeight = fontSize * 1.35;
        textBlockHeight = layout.reduce(
          (sum, l, i) => sum + lineHeight + (l.bullet && !l.continuation && i > 0 ? bulletGap : 0),
          0
        );
        if (textBlockHeight <= 680 || fontSize <= minFontSize) break;
        fontSize -= 2;
      } while (true);

      const contactLines = [
        brand?.contact_phone ? `📞 ${brand.contact_phone}` : null,
        brand?.contact_email ? `✉️ ${brand.contact_email}` : null,
        brand?.contact_website ? `🌐 ${brand.contact_website}` : null,
        brand?.contact_address || null,
      ].filter(Boolean);
      const footerLineHeight = 36;
      const footerHeight = 44 + contactLines.length * footerLineHeight;

      const topPad = pad + 70;
      const gapAfterText = 50;
      const footerTop = topPad + headerHeight + 40 + textBlockHeight + gapAfterText;
      // Canvas grows taller for long content instead of clipping/overlapping
      // - a 1080x1080 square is just the minimum, not a hard limit.
      const H = Math.max(1080, footerTop + footerHeight + pad);
      canvas.height = H;

      // --- Now actually draw, using the measurements above ---
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, "#0d47a1");
      grad.addColorStop(1, "#1565C0");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = "#ffffff";
      roundRect(ctx, pad, pad, contentW, H - pad * 2, 28);
      ctx.fill();

      let y = topPad;
      if (logoImg) {
        ctx.drawImage(logoImg, W / 2 - logoDrawW / 2, y, logoDrawW, logoDrawH);
      } else {
        ctx.fillStyle = "#1565C0";
        ctx.font = "bold 56px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(brand?.business_name || "ACAD", W / 2, y + 50);
      }
      y += headerHeight;

      ctx.fillStyle = "#1e293b";
      ctx.font = `500 ${fontSize}px system-ui, sans-serif`;
      let textY = y + 40 + lineHeight * 0.7;
      layout.forEach((l, i) => {
        if (l.bullet && !l.continuation && i > 0) textY += bulletGap;
        if (l.bullet) {
          ctx.textAlign = "left";
          ctx.fillText(l.text, bulletLeftMargin, textY);
        } else {
          ctx.textAlign = "center";
          ctx.fillText(l.text, W / 2, textY);
        }
        textY += lineHeight;
      });

      ctx.strokeStyle = "#e2e8f0";
      ctx.beginPath();
      ctx.moveTo(pad + 60, footerTop);
      ctx.lineTo(W - pad - 60, footerTop);
      ctx.stroke();

      ctx.font = "400 26px system-ui, sans-serif";
      ctx.fillStyle = "#475569";
      ctx.textAlign = "center";
      let footerY = footerTop + 44;
      contactLines.forEach((line) => {
        ctx.fillText(line, W / 2, footerY);
        footerY += footerLineHeight;
      });

      setDownloadUrl(canvas.toDataURL("image/png"));
    }

    if (brand?.logo_url) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => draw(img);
      img.onerror = () => draw(null);
      img.src = brand.logo_url;
    } else {
      draw(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item, brand]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-lg w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900">Generated graphic</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <canvas
          ref={canvasRef}
          className="w-full rounded-lg border border-slate-200"
        />
        <div className="flex gap-3 mt-4">
          <Button
            asChild={!!downloadUrl}
            disabled={!downloadUrl}
            className="bg-[#1565C0] hover:bg-[#0d47a1] flex-1"
          >
            {downloadUrl ? (
              <a href={downloadUrl} download={`acad-${item.content_type}-${item.id}.png`}>
                Download PNG
              </a>
            ) : (
              <span>Rendering…</span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapText(ctx, text, maxWidth) {
  const words = (text || "").split(/\s+/);
  const lines = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

// A "bullet" line is one that starts with an emoji or a plain bullet
// character - this is how the AI is now prompted to structure content
// (see STRUCTURE_INSTRUCTIONS on the backend). Bullets render left-aligned
// with a hanging indent; everything else (the opening hook line, the
// closing CTA line) stays centered, so the graphic reads like a designed
// card instead of one dense centered paragraph.
const BULLET_PATTERN = /^([\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}]|[•\-*])\s*/u;

function isBulletLine(line) {
  return BULLET_PATTERN.test(line.trim());
}

// Splits raw text into logical lines (respecting the AI's own newlines
// first), then word-wraps each one individually to fit its own max width -
// bullets get a narrower width to leave room for the hanging indent.
function layoutLines(ctx, rawText, { centerMaxWidth, bulletMaxWidth, bulletIndent }) {
  const rawLines = (rawText || "").split(/\n+/).map((l) => l.trim()).filter(Boolean);
  const out = [];
  for (const raw of rawLines) {
    const bullet = isBulletLine(raw);
    const match = raw.match(BULLET_PATTERN);
    const marker = bullet && match ? match[0].trim() : null;
    const body = bullet && match ? raw.slice(match[0].length) : raw;
    const wrapped = wrapText(ctx, body, bullet ? bulletMaxWidth - bulletIndent : centerMaxWidth);
    wrapped.forEach((text, i) => {
      out.push({
        text: bullet && i === 0 && marker ? `${marker} ${text}` : text,
        bullet,
        continuation: bullet && i > 0,
      });
    });
  }
  return out;
}

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
  const [approvedDrafts, setApprovedDrafts] = useState([]);
  const [brand, setBrand] = useState(null);
  const [showBrandSettings, setShowBrandSettings] = useState(false);
  const [brandForm, setBrandForm] = useState(null);
  const [graphicItem, setGraphicItem] = useState(null);

  const API_BASE = import.meta.env.VITE_API_BASE;

  useEffect(() => {
    loadSkills();
    loadApprovedDrafts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentType]);

  useEffect(() => {
    loadBrandProfile();
  }, []);

  async function apiGet(path) {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "GET",
      credentials: "include",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`Request failed: ${res.status}`);
    return res.json();
  }

  async function apiSend(path, method, body) {
    const res = await fetch(`${API_BASE}${path}`, {
      method,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return res.json();
  }

  async function loadSkills() {
    try {
      setSkills(await apiGet(`/api/marketing/skills?contentType=${contentType}`));
    } catch (error) {
      console.error("Error fetching skills:", error);
    }
  }

  async function loadApprovedDrafts() {
    try {
      setApprovedDrafts(await apiGet(`/api/marketing/drafts?contentType=${contentType}`));
    } catch (error) {
      console.error("Error fetching approved drafts:", error);
    }
  }

  async function loadBrandProfile() {
    try {
      const data = await apiGet(`/api/marketing/brand-profile`);
      setBrand(data);
      setBrandForm(data);
    } catch (error) {
      console.error("Error fetching brand profile:", error);
    }
  }

  async function handleSaveBrand() {
    setLoading(true);
    try {
      const updated = await apiSend("/api/marketing/brand-profile", "PUT", {
        contact_phone: brandForm.contact_phone,
        contact_email: brandForm.contact_email,
        contact_website: brandForm.contact_website,
        contact_address: brandForm.contact_address,
        logo_url: brandForm.logo_url,
      });
      setBrand(updated);
      setShowBrandSettings(false);
    } catch (error) {
      console.error("Error saving brand profile:", error);
      alert("Couldn't save contact settings: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerate() {
    if (!requestText.trim()) return;
    setLoading(true);
    setDraft(null);
    setLastLearned(null);
    try {
      const data = await apiSend("/api/marketing/generate", "POST", {
        contentType,
        channel,
        requestText,
      });
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
      const data = await apiSend("/api/marketing/feedback", "POST", {
        draftId: draft.draftId,
        status,
        finalText,
      });
      if (status === "edited" && data.learnedSkill) {
        setLastLearned(data.learnedSkill);
      }
      setDraft(null);
      setRequestText("");
      setIsEditing(false);
      loadSkills();
      if (status === "accepted" || status === "edited") {
        loadApprovedDrafts();
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      alert("Feedback failed: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteApproved(id) {
    if (!window.confirm("Delete this approved item? This can't be undone.")) return;
    try {
      await apiSend(`/api/marketing/drafts/${id}`, "DELETE");
      setApprovedDrafts((prev) => prev.filter((d) => d.id !== id));
    } catch (error) {
      console.error("Error deleting draft:", error);
      alert("Delete failed: " + error.message);
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
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowBrandSettings((v) => !v)}
          >
            <Settings className="w-4 h-4 mr-2" />
            Contact settings
          </Button>
          <div className="px-3 py-1 bg-teal-600 text-white rounded text-sm font-medium">
            <Sparkles className="w-4 h-4 mr-1 inline" />
            SELF-IMPROVING
          </div>
        </div>
      </div>

      {showBrandSettings && brandForm && (
        <Card className="border-2 border-teal-200">
          <CardHeader>
            <CardTitle className="text-base">
              Contact details for generated graphics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-slate-500">
              Shown in the footer of every generated graphic. Set once, reused everywhere.
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              <input
                value={brandForm.contact_phone || ""}
                onChange={(e) => setBrandForm({ ...brandForm, contact_phone: e.target.value })}
                placeholder="Phone, e.g. +91 9790818436"
                className="border border-slate-200 rounded-md px-3 py-2 text-sm"
              />
              <input
                value={brandForm.contact_email || ""}
                onChange={(e) => setBrandForm({ ...brandForm, contact_email: e.target.value })}
                placeholder="Email"
                className="border border-slate-200 rounded-md px-3 py-2 text-sm"
              />
              <input
                value={brandForm.contact_website || ""}
                onChange={(e) => setBrandForm({ ...brandForm, contact_website: e.target.value })}
                placeholder="Website, e.g. acadapp.in"
                className="border border-slate-200 rounded-md px-3 py-2 text-sm"
              />
              <input
                value={brandForm.contact_address || ""}
                onChange={(e) => setBrandForm({ ...brandForm, contact_address: e.target.value })}
                placeholder="Address"
                className="border border-slate-200 rounded-md px-3 py-2 text-sm"
              />
              <input
                value={brandForm.logo_url || ""}
                onChange={(e) => setBrandForm({ ...brandForm, logo_url: e.target.value })}
                placeholder="Logo image URL (optional — shown top-center on graphics)"
                className="border border-slate-200 rounded-md px-3 py-2 text-sm sm:col-span-2"
              />
            </div>
            <Button
              onClick={handleSaveBrand}
              disabled={loading}
              className="bg-teal-600 hover:bg-teal-700"
            >
              Save contact settings
            </Button>
          </CardContent>
        </Card>
      )}

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
              <CopyButton text={isEditing ? editedText : draft.draftText} />
              {!isEditing ? (
                <>
                  <Button
                    onClick={() => handleFeedback("accepted")}
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <ThumbsUp className="w-4 h-4 mr-2" />
                    Approve
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

      {approvedDrafts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Approved Content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {approvedDrafts.map((item) => (
              <div
                key={item.id}
                className="border border-slate-200 rounded-lg p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500 uppercase">
                    {CONTENT_TYPES.find((c) => c.value === item.content_type)?.label || item.content_type}
                    {" · "}{item.channel}
                  </span>
                  <span className="text-xs text-slate-400">
                    {new Date(item.reviewed_at || item.created_at).toLocaleDateString("en-IN")}
                  </span>
                </div>
                <p className="text-sm text-slate-800 whitespace-pre-wrap">
                  {item.final_text || item.draft_text}
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <CopyButton text={item.final_text || item.draft_text} small />
                  <Button
                    onClick={() => setGraphicItem(item)}
                    variant="outline"
                    size="sm"
                  >
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Generate graphic
                  </Button>
                  <Button
                    onClick={() => handleDeleteApproved(item.id)}
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
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

      {graphicItem && (
        <GraphicModal
          item={graphicItem}
          brand={brand}
          onClose={() => setGraphicItem(null)}
        />
      )}
    </div>
  );
}
