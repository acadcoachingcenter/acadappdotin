import React, { useState, useEffect, useRef } from "react";
import { Loader2, AlertCircle } from "lucide-react";

function loadPdfJs() {
  return new Promise((resolve, reject) => {
    if (window.pdfjsLib) { resolve(); return; }
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    script.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      resolve();
    };
    script.onerror = () => reject(new Error("Failed to load PDF viewer library"));
    document.body.appendChild(script);
  });
}

export default function PdfPreview({ pdfUrl, previewPages }) {
  const [status, setStatus] = useState("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [renderedCount, setRenderedCount] = useState(0);
  const containerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const render = async () => {
      try {
        await loadPdfJs();
        if (cancelled) return;

        const pdf = await window.pdfjsLib.getDocument(pdfUrl).promise;
        if (cancelled) return;

        const numPreview = previewPages || Math.max(1, Math.ceil(pdf.numPages * 0.16));
        const container = containerRef.current;
        if (!container) return;
        container.innerHTML = "";

        for (let i = 1; i <= numPreview; i++) {
          if (cancelled) return;
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 3 });

          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.className = "block mx-auto mb-4 shadow-lg rounded bg-white";
          canvas.style.maxWidth = "100%";
          canvas.style.height = "auto";

          await page.render({ canvasContext: ctx, viewport }).promise;
          if (cancelled) return;

          container.appendChild(canvas);
          setRenderedCount(i);
          if (i === 1) setStatus("ready");
        }
      } catch (e) {
        console.error("PDF preview error:", e);
        if (!cancelled) {
          setErrorMsg(e.message || "Failed to load preview");
          setStatus("error");
        }
      }
    };

    render();
    return () => { cancelled = true; };
  }, [pdfUrl, previewPages]);

  return (
    <div>
      {status === "loading" && renderedCount === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
          <p className="text-sm">Loading preview pages...</p>
        </div>
      )}
      {status === "error" && (
        <div className="flex flex-col items-center justify-center py-20 text-red-500">
          <AlertCircle className="w-8 h-8 mb-2" />
          <p className="text-sm">{errorMsg}</p>
        </div>
      )}
      <div ref={containerRef} />
    </div>
  );
}