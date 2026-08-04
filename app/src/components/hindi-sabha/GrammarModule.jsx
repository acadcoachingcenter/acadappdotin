import React, { useState, useEffect } from "react";
import { apiClient } from "@/api/apiClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BookOpen, Lightbulb, Sparkles, CheckCircle, XCircle, Lock } from "lucide-react";

export default function GrammarModule({ selectedLevel, levels }) {
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [generatedQuestions, setGeneratedQuestions] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});
  const [quizResults, setQuizResults] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showContactAdmin, setShowContactAdmin] = useState(false);

  useEffect(() => {
    const fetchTopics = async () => {
      if (!selectedLevel) return;
      
      setIsLoading(true);
      try {
        const allTopics = await apiClient.entities.Topic.filter({
          level_id: selectedLevel,
          category: "Grammar"
        });
        setTopics(allTopics);
        setSelectedTopic(null);
        setGeneratedQuestions(null);
        setQuizResults(null);
      } catch (error) {
        console.error("Error fetching topics:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTopics();
  }, [selectedLevel]);

  const handleTopicClick = (topic) => {
    setSelectedTopic(topic);
    setGeneratedQuestions(null);
    setUserAnswers({});
    setQuizResults(null);
  };

  const generatePracticeQuestions = async () => {
    if (!selectedTopic) return;

    setIsGenerating(true);
    try {
      const levelName = levels.find(l => l.id === selectedLevel)?.name || "Hindi";
      
      const prompt = `You are a Hindi language examination expert. Generate 5 multiple-choice questions for the following grammar topic:

Level: ${levelName}
Topic: ${selectedTopic.title}
Content: ${selectedTopic.content || "Basic grammar topic"}

Create questions that test understanding of this grammar concept. Each question should have 4 options (A, B, C, D) with only one correct answer.

Requirements:
- Questions should be in Hindi or English as appropriate for the topic
- Options should be clear and concise
- Include the correct answer
- Mix of easy and moderate difficulty`;

      const response = await apiClient.integrations.Core.InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            questions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  question: { type: "string" },
                  options: {
                    type: "array",
                    items: { type: "string" }
                  },
                  correct_answer: { type: "string" }
                }
              }
            }
          }
        }
      });

      console.log("Generated questions:", response);
      setGeneratedQuestions(response.questions);
      setUserAnswers({});
      setQuizResults(null);
    } catch (error) {
      console.error("Error generating questions:", error);
      alert("Failed to generate questions. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnswerChange = (questionIndex, answer) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionIndex]: answer
    }));
  };

  const submitQuiz = () => {
    if (!generatedQuestions) return;

    let correct = 0;
    let incorrect = 0;
    const results = generatedQuestions.map((q, index) => {
      const userAnswer = userAnswers[index];
      const isCorrect = userAnswer === q.correct_answer;
      if (isCorrect) correct++;
      else incorrect++;

      return {
        question: q.question,
        userAnswer,
        correctAnswer: q.correct_answer,
        isCorrect
      };
    });

    setQuizResults({
      total: generatedQuestions.length,
      correct,
      incorrect,
      percentage: Math.round((correct / generatedQuestions.length) * 100),
      results
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#1565C0] mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading grammar topics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Left Panel - Topic List */}
      <Card className="lg:col-span-1 border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Grammar Topics
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topics.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <p>No grammar topics available yet.</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-2">
                {topics.map((topic) => (
                  <div
                    key={topic.id}
                    onClick={() => handleTopicClick(topic)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedTopic?.id === topic.id
                        ? "bg-blue-50 border-blue-500"
                        : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-md"
                    }`}
                  >
                    <h4 className="font-semibold text-slate-900">{topic.title}</h4>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

            {/* Locked / Premium topics - contact admin to unlock */}
            <div className="border-t-2 border-slate-200 mt-4 pt-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700">और अधिक विषय (More Topics)</p>
                <Badge className="bg-amber-100 text-amber-700 border-0">🔒 Premium</Badge>
              </div>
              {["संधि - विस्तृत अभ्यास", "समास - सभी भेद", "अलंकार पहचान अभ्यास"].map((title, i) => (
                <div
                  key={i}
                  onClick={() => setShowContactAdmin(true)}
                  className="flex items-center justify-between p-4 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 hover:border-amber-400 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Lock className="w-4 h-4 text-slate-400" />
                    <span className="font-medium text-slate-500">{title}</span>
                  </div>
                  <span className="text-xs text-amber-600 font-semibold">Contact Admin</span>
                </div>
              ))}

              {showContactAdmin && (
                <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-4 text-sm space-y-1">
                  <p className="font-semibold text-amber-900">और विषयों के लिए संपर्क करें / Contact Admin to Unlock</p>
                  <p className="text-amber-800">अधिक विषय और अभ्यास सामग्री एडमिन द्वारा अनलॉक की जाएगी।</p>
                  <p className="text-amber-800">📞 WhatsApp: 9790818436</p>
                  <p className="text-amber-800">✉️ Email: acadcoachingcenter@gmail.com</p>
                  <Button variant="outline" size="sm" className="mt-2" onClick={() => setShowContactAdmin(false)}>
                    बंद करें (Close)
                  </Button>
                </div>
              )}
            </div>
        </CardContent>
      </Card>

      {/* Right Panel - Topic Details */}
      <div className="lg:col-span-2 space-y-6">
        {!selectedTopic ? (
          <Card className="border-2">
            <CardContent className="p-12 text-center">
              <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                Select a Topic
              </h3>
              <p className="text-slate-600">
                Choose a grammar topic from the list to view details and practice questions
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Topic Content */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-2xl">{selectedTopic.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Content */}
                {selectedTopic.content && (
                  <div className="prose max-w-none">
                    <div className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                      {selectedTopic.content}
                    </div>
                  </div>
                )}

                {/* Examples */}
                {selectedTopic.examples && Object.keys(selectedTopic.examples).length > 0 && (
                  <div className="bg-slate-50 border-2 border-slate-200 rounded-lg p-4">
                    <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-amber-500" />
                      Examples
                    </h4>
                    <div className="space-y-2 text-slate-700">
                      {Object.entries(selectedTopic.examples).map(([key, value]) => (
                        <div key={key} className="text-sm">
                          <span className="font-medium">{key}:</span> {JSON.stringify(value)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Exam Tips */}
                {selectedTopic.exam_tips && (
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                      <Sparkles className="w-5 h-5" />
                      Exam Tips
                    </h4>
                    <p className="text-blue-800 text-sm">{selectedTopic.exam_tips}</p>
                  </div>
                )}

                {/* Generate Practice Button */}
                <div className="pt-4 border-t-2">
                  <Button
                    onClick={generatePracticeQuestions}
                    disabled={isGenerating}
                    className="w-full bg-[#1565C0] hover:bg-[#0d47a1]"
                    size="lg"
                  >
                    {isGenerating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Generating Questions...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 mr-2" />
                        Generate Practice Questions
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Practice Questions */}
            {generatedQuestions && (
              <Card className="border-2">
                <CardHeader>
                  <CardTitle>Practice Questions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {generatedQuestions.map((q, index) => (
                    <div key={index} className="border-2 border-slate-200 rounded-lg p-4">
                      <h4 className="font-semibold text-slate-900 mb-3">
                        {index + 1}. {q.question}
                      </h4>
                      <div className="space-y-2">
                        {q.options.map((option, optIndex) => {
                          const optionLetter = String.fromCharCode(65 + optIndex);
                          const isSelected = userAnswers[index] === optionLetter;
                          
                          return (
                            <label
                              key={optIndex}
                              className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                quizResults
                                  ? quizResults.results[index].correctAnswer === optionLetter
                                    ? "bg-green-50 border-green-500"
                                    : quizResults.results[index].userAnswer === optionLetter
                                    ? "bg-red-50 border-red-500"
                                    : "bg-white border-slate-200"
                                  : isSelected
                                  ? "bg-blue-50 border-blue-500"
                                  : "bg-white border-slate-200 hover:border-slate-300"
                              }`}
                            >
                              <input
                                type="radio"
                                name={`question-${index}`}
                                value={optionLetter}
                                checked={isSelected}
                                onChange={(e) => handleAnswerChange(index, e.target.value)}
                                disabled={!!quizResults}
                                className="w-4 h-4"
                              />
                              <span className="flex-1">
                                <strong>{optionLetter}.</strong> {option}
                              </span>
                              {quizResults && quizResults.results[index].correctAnswer === optionLetter && (
                                <CheckCircle className="w-5 h-5 text-green-600" />
                              )}
                              {quizResults && quizResults.results[index].userAnswer === optionLetter && 
                               quizResults.results[index].correctAnswer !== optionLetter && (
                                <XCircle className="w-5 h-5 text-red-600" />
                              )}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  {!quizResults ? (
                    <Button
                      onClick={submitQuiz}
                      disabled={Object.keys(userAnswers).length !== generatedQuestions.length}
                      className="w-full"
                      size="lg"
                    >
                      Submit Answers
                    </Button>
                  ) : (
                    <div className="space-y-4">
                      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300">
                        <CardContent className="p-6">
                          <h3 className="text-2xl font-bold text-center mb-4">Quiz Results</h3>
                          <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                              <div className="text-3xl font-bold text-blue-600">{quizResults.percentage}%</div>
                              <div className="text-sm text-slate-600">Score</div>
                            </div>
                            <div>
                              <div className="text-3xl font-bold text-green-600">{quizResults.correct}</div>
                              <div className="text-sm text-slate-600">Correct</div>
                            </div>
                            <div>
                              <div className="text-3xl font-bold text-red-600">{quizResults.incorrect}</div>
                              <div className="text-sm text-slate-600">Incorrect</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Button
                        onClick={generatePracticeQuestions}
                        variant="outline"
                        className="w-full"
                        size="lg"
                      >
                        Generate New Questions
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}