import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, FlaskConical, Atom, BookOpen, ClipboardList } from "lucide-react";

const mockTests = [
  {
    title: "NEET | JEE Weekly Test Series",
    description: "Weekly updated NEET & JEE questions — new test series added every week covering Biology, Physics, Chemistry & Maths. Stay consistent and track your progress.",
    subject: "NEET & JEE",
    url: "https://acad-neet-v3.vercel.app",
    color: "from-orange-500 to-red-600",
    badgeColor: "bg-orange-500",
    icon: ClipboardList,
    tags: ["Weekly Updated", "NEET", "JEE", "All Subjects"]
  },
  {
    title: "JEE Notes & Study Material",
    description: "Complete JEE study notes covering all topics in Mathematics, Physics, and Chemistry with formulas and key concepts.",
    subject: "JEE",
    url: "https://jee-notes-three.vercel.app/",
    color: "from-indigo-500 to-blue-600",
    badgeColor: "bg-indigo-500",
    icon: BookOpen,
    tags: ["Notes", "Formulas", "Concepts"]
  }
];

export default function NeetJeeSupport() {
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 md:p-12 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
            <Atom className="w-8 h-8" />
          </div>
          <Badge className="bg-white/20 text-white border-0 text-base">Competitive Exam Prep</Badge>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">NEET & JEE Support</h1>
        <p className="text-xl text-blue-100 max-w-3xl">
          Boost your NEET and JEE preparation with our curated mock test series — timed, topic-wise, and exam-pattern aligned.
        </p>
      </div>

      {/* Info Banner */}
      <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <BookOpen className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <p className="text-amber-800 text-sm">
          All mock tests open in a new tab. Complete the tests at your own pace and use the detailed answer keys to identify weak areas.
        </p>
      </div>

      {/* Mock Test Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {mockTests.map((test, index) => {
          const Icon = test.icon;
          return (
            <Card key={index} className="border-2 hover:shadow-xl transition-all duration-300 overflow-hidden group">
              <div className={`h-2 bg-gradient-to-r ${test.color}`} />
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${test.color} flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <Badge className={`${test.badgeColor} text-white border-0`}>{test.subject}</Badge>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {test.title}
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{test.description}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {test.tags.map((tag, i) => (
                    <Badge key={i} variant="outline" className="text-xs">{tag}</Badge>
                  ))}
                </div>
                <Button
                  asChild
                  className={`w-full bg-gradient-to-r ${test.color} hover:opacity-90 text-white`}
                  size="lg"
                >
                  <a href={test.url} target="_blank" rel="noopener noreferrer">
                    {test.title === "NEET | JEE Weekly Test Series" ? "Open Weekly Series" : "Start Mock Test"}
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Footer Note */}
      <div className="text-center text-slate-500 text-sm pb-4">
        💡 Tip: Attempt each mock test under exam conditions — no distractions, timed, and without referring to notes.
      </div>
    </div>
  );
}