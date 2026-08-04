import React from "react";

export default function PaperContent({ paper, meta }) {
  const title = paper.paper_title || meta?.title || "Question Paper";
  const sections = paper.sections || [];
  const instructions = paper.instructions || [];

  return (
    <div className="space-y-4 text-slate-800">
      <div className="text-center border-b border-slate-300 pb-3">
        <h2 className="text-2xl font-bold">{title}</h2>
        <div className="text-sm text-slate-600 mt-1 flex flex-wrap justify-center gap-x-4">
          {meta?.subject && <span>Subject: {meta.subject}</span>}
          {meta?.grade_level && <span>Class: {meta.grade_level}</span>}
          {meta?.total_marks != null && <span>Max Marks: {meta.total_marks}</span>}
          {meta?.duration_minutes != null && <span>Duration: {meta.duration_minutes} min</span>}
        </div>
      </div>

      {instructions.length > 0 && (
        <div className="text-sm">
          <p className="font-semibold mb-1">General Instructions:</p>
          <ul className="list-disc pl-6 space-y-0.5">
            {instructions.map((i, idx) => <li key={idx}>{i}</li>)}
          </ul>
        </div>
      )}

      {sections.map((sec, si) => (
        <div key={si} className="space-y-2">
          <div className="flex items-center justify-between border-b border-dashed border-slate-300 pb-1">
            <h3 className="font-semibold">{sec.name}</h3>
            <span className="text-xs text-slate-500">
              {sec.marks_per_question} marks × {sec.questions?.length || 0}
            </span>
          </div>
          <ol className="space-y-3">
            {sec.questions?.map((q, qi) => (
              <li key={qi}>
                <div className="flex gap-2">
                  <span className="font-medium whitespace-nowrap">Q{qi + 1}.</span>
                  <div className="flex-1">
                    <p className="whitespace-pre-wrap">{q.text}</p>
                    {q.options?.length > 0 && (
                      <div className="grid sm:grid-cols-2 gap-x-4 gap-y-1 mt-1 text-sm">
                        {q.options.map((o, oi) => (
                          <div key={oi} className="pl-2">
                            <span className="font-medium">{String.fromCharCode(65 + oi)})</span> {o}
                          </div>
                        ))}
                      </div>
                    )}
                    {(q.answer || q.answer_hint) && (
                      <div className="mt-1 text-sm bg-slate-50 print:bg-white border border-slate-200 print:border-0 px-2 py-1 rounded">
                        {q.answer && (
                          <p><span className="font-medium text-green-700">Ans:</span> {q.answer}</p>
                        )}
                        {q.answer_hint && (
                          <p className="text-slate-600"><span className="font-medium">Hint:</span> {q.answer_hint}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      ))}
    </div>
  );
}