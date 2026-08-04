import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FileText, Sparkles, CheckCircle, AlertCircle, Lightbulb, Award } from "lucide-react";

export default function WritingModule({ selectedLevel, levels }) {
  const [writingType, setWritingType] = useState("");
  const [topic, setTopic] = useState("");
  const [content, setContent] = useState("");
  const [evaluation, setEvaluation] = useState(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const writingTypes = [
    { value: "Essay", label: "Essay (निबंध)" },
    { value: "Formal Letter", label: "Formal Letter (औपचारिक पत्र)" },
    { value: "Informal Letter", label: "Informal Letter (अनौपचारिक पत्र)" },
    { value: "Paragraph", label: "Paragraph (अनुच्छेद)" },
    { value: "Precis", label: "Precis (सार लेखन)" }
  ];

  const wordCount = content.trim().split(/\s+/).filter(word => word.length > 0).length;
  const charCount = content.length;
  const minWords = 50;

  const handleSubmitForEvaluation = async () => {
    if (!writingType) {
      alert("Please select a writing type");
      return;
    }

    if (wordCount < minWords) {
      alert(`Please write at least ${minWords} words`);
      return;
    }

    setIsEvaluating(true);
    setIsSaved(false);

    try {
      const levelName = levels.find(l => l.id === selectedLevel)?.name || "Hindi";
      
      const prompt = `You are an expert Hindi language examiner evaluating a student's writing for Hindi Sabha ${levelName} level examination.

Writing Type: ${writingType}
Topic: ${topic || "General"}
Student's Writing:
${content}

Evaluate this writing comprehensively and provide:
1. Overall score out of 100
2. List of corrections needed (grammar, spelling, structure errors)
3. A model answer showing how it should be written
4. Detailed feedback on strengths and weaknesses
5. Specific improvement tips
6. Identified weaknesses in categories (grammar, vocabulary, structure, coherence)

Be constructive, specific, and helpful in your evaluation.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            score: { type: "number" },
            max_score: { type: "number" },
            corrections: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  error: { type: "string" },
                  correction: { type: "string" },
                  explanation: { type: "string" }
                }
              }
            },
            model_answer: { type: "string" },
            feedback: { type: "string" },
            improvement_tips: {
              type: "array",
              items: { type: "string" }
            },
            weaknesses: {
              type: "object",
              properties: {
                grammar: { type: "number" },
                vocabulary: { type: "number" },
                structure: { type: "number" },
                coherence: { type: "number" }
              }
            }
          }
        }
      });

      console.log("AI Evaluation:", response);
      setEvaluation(response);
    } catch (error) {
      console.error("Error evaluating writing:", error);
      alert("Failed to evaluate your writing. Please try again.");
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleSaveSubmission = async () => {
    if (!evaluation) return;

    try {
      const user = await base44.auth.me();

      await base44.entities.StudentSubmission.create({
        user_id: user.id,
        level_id: selectedLevel,
        submission_type: writingType,
        content: content,
        ai_score: evaluation.score,
        ai_feedback: evaluation.feedback,
        weaknesses: evaluation.weaknesses
      });

      setIsSaved(true);
      alert("Your submission has been saved successfully!");
    } catch (error) {
      console.error("Error saving submission:", error);
      alert("Failed to save submission. Please try again.");
    }
  };

  const handleReset = () => {
    setWritingType("");
    setTopic("");
    setContent("");
    setEvaluation(null);
    setIsSaved(false);
  };

  return (
    <div className="space-y-6">
      {/* Writing Configuration */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Writing Practice Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Writing Type */}
            <div className="space-y-2">
              <Label className="font-semibold">Writing Type *</Label>
              <Select value={writingType} onValueChange={setWritingType} disabled={!!evaluation}>
                <SelectTrigger>
                  <SelectValue placeholder="Select writing type" />
                </SelectTrigger>
                <SelectContent>
                  {writingTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Topic (Optional) */}
            <div className="space-y-2">
              <Label className="font-semibold">Topic (Optional)</Label>
              <Input
                placeholder="Enter topic or leave blank"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                disabled={!!evaluation}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Writing Editor */}
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Your Writing</CardTitle>
            <div className="flex gap-4 text-sm">
              <Badge variant="outline">
                {wordCount} words {wordCount < minWords && `(min ${minWords})`}
              </Badge>
              <Badge variant="outline">
                {charCount} characters
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Start writing here... (Hindi or English)"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={!!evaluation}
            className="min-h-[400px] text-base leading-relaxed font-hindi"
            style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}
          />

          {wordCount < minWords && content.length > 0 && (
            <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-3 flex items-center gap-2 text-amber-800">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">
                You need at least {minWords - wordCount} more words to submit
              </p>
            </div>
          )}

          {!evaluation && (
            <Button
              onClick={handleSubmitForEvaluation}
              disabled={isEvaluating || !writingType || wordCount < minWords}
              className="w-full bg-[#1565C0] hover:bg-[#0d47a1]"
              size="lg"
            >
              {isEvaluating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Evaluating Your Writing...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Submit for AI Evaluation
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Evaluation Results */}
      {evaluation && (
        <div className="space-y-6">
          {/* Score Panel */}
          <Card className="border-2 bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                  <Award className="w-6 h-6 text-blue-600" />
                  Your Score
                </h3>
                <div className="text-right">
                  <div className="text-4xl font-bold text-blue-600">
                    {evaluation.score}/{evaluation.max_score}
                  </div>
                  <div className="text-sm text-slate-600">
                    {Math.round((evaluation.score / evaluation.max_score) * 100)}%
                  </div>
                </div>
              </div>
              <Progress value={(evaluation.score / evaluation.max_score) * 100} className="h-3" />
            </CardContent>
          </Card>

          {/* Corrections */}
          {evaluation.corrections && evaluation.corrections.length > 0 && (
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="w-5 h-5" />
                  Corrections Needed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {evaluation.corrections.map((corr, index) => (
                    <div key={index} className="border-2 border-red-100 bg-red-50 rounded-lg p-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-semibold text-red-800 mb-1">Error:</p>
                          <p className="text-sm text-slate-900">{corr.error}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-green-800 mb-1">Correction:</p>
                          <p className="text-sm text-slate-900">{corr.correction}</p>
                        </div>
                      </div>
                      {corr.explanation && (
                        <div className="mt-2 pt-2 border-t border-red-200">
                          <p className="text-xs text-slate-600">{corr.explanation}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Model Answer */}
          {evaluation.model_answer && (
            <Card className="border-2 border-green-300 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="w-5 h-5" />
                  Model Answer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <p className="text-slate-800 whitespace-pre-wrap leading-relaxed font-hindi" style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                    {evaluation.model_answer}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Feedback */}
          {evaluation.feedback && (
            <Card className="border-2 border-blue-300 bg-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-700">
                  <FileText className="w-5 h-5" />
                  Detailed Feedback
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-800 whitespace-pre-wrap leading-relaxed">
                  {evaluation.feedback}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Improvement Tips */}
          {evaluation.improvement_tips && evaluation.improvement_tips.length > 0 && (
            <Card className="border-2 border-amber-300 bg-amber-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-700">
                  <Lightbulb className="w-5 h-5" />
                  Improvement Tips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {evaluation.improvement_tips.map((tip, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-amber-600 font-bold mt-1">•</span>
                      <span className="text-slate-800">{tip}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Weakness Analysis */}
          {evaluation.weaknesses && (
            <Card className="border-2">
              <CardHeader>
                <CardTitle>Weakness Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(evaluation.weaknesses).map(([category, score]) => (
                  <div key={category}>
                    <div className="flex justify-between mb-2">
                      <span className="font-semibold capitalize">{category}</span>
                      <span className="text-sm text-slate-600">{score}/10</span>
                    </div>
                    <Progress value={score * 10} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            {!isSaved && (
              <Button onClick={handleSaveSubmission} className="flex-1" size="lg">
                <CheckCircle className="w-5 h-5 mr-2" />
                Save Submission
              </Button>
            )}
            <Button onClick={handleReset} variant="outline" className="flex-1" size="lg">
              Start New Writing
            </Button>
          </div>

          {isSaved && (
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 text-center">
              <p className="text-green-800 font-semibold">
                ✓ Submission saved successfully! Your progress has been recorded.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}