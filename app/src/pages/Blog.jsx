import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  BookOpen, 
  TrendingUp, 
  Award, 
  Users, 
  Clock, 
  Target, 
  Laptop, 
  CheckCircle,
  ArrowRight,
  Sparkles,
  GraduationCap,
  BarChart,
  Calendar
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Blog() {
  const [selectedArticle, setSelectedArticle] = useState(null);

  const blogPosts = [
    {
      title: "Board Exam Success Tips for 10th & 12th Students",
      excerpt: "Essential strategies and preparation tips to help you ace your board examinations and secure excellent marks in your final exams.",
      fullContent: `Board exams are crucial milestones in every student's academic journey. Here are proven strategies to excel:

**Start Early - Don't Procrastinate**
Begin your preparation at least 3-4 months before exams. Create a realistic timetable covering all subjects systematically.

**Understand the Syllabus and Exam Pattern**
Know exactly what topics are important. Check previous years' question papers to understand which areas carry more weightage.

**Make Concise Notes**
Create short, crisp notes for each chapter. Use diagrams, flowcharts, and mind maps for better retention. These notes will be invaluable during revision.

**Practice Previous Year Papers**
Solve at least 5-7 years of previous board papers for each subject. This helps you understand question patterns and time management.

**Focus on NCERT Textbooks**
For CBSE boards, NCERT books are your bible. Read them thoroughly, understand every concept, and solve all exercise questions.

**Manage Time Effectively**
Practice writing answers within time limits. Learn to allocate time per question based on marks.

**Regular Revision is Key**
Revise completed portions regularly. Use the 3-day revision cycle: revise after 1 day, then after 3 days, then after 7 days.

**Take Care of Your Health**
Get 7-8 hours of sleep. Eat nutritious food. Take short breaks while studying. A healthy body supports a sharp mind.

**Avoid Last-Minute Cramming**
Don't try to learn new topics in the final week. Use this time only for revision and solving sample papers.

**Stay Calm and Confident**
Believe in your preparation. Practice meditation or breathing exercises to manage exam stress.

**Subject-Specific Tips:**
- **Mathematics:** Practice daily. Focus on theorems and formulas. Solve numerical problems multiple times.
- **Science:** Understand concepts, don't just memorize. Draw diagrams clearly. Remember chemical equations and formulas.
- **Languages:** Read sample answers to understand format. Practice writing within word limits.
- **Social Science:** Make timeline charts for history. Create maps for geography. Understand concepts in civics and economics.

**During the Exam:**
- Read questions carefully
- Start with questions you know well
- Allocate time wisely
- Write neat and legible answers
- Review your answers if time permits

Remember: Board exams test your understanding, not just memory. Prepare smartly, stay consistent, and success will follow!`,
      category: "Board Exams",
      readTime: "10 min read",
      icon: GraduationCap,
      color: "bg-red-500"
    },
    {
      title: "Why Online Coaching is Essential for Academic Success",
      excerpt: "Discover how online coaching platforms are revolutionizing education and helping students achieve their academic goals more effectively than traditional methods.",
      fullContent: `Online coaching has become a game-changer in modern education. Here's why:

**Flexibility and Convenience**
Students can learn from anywhere, at any time. No more rushing to coaching centers or worrying about traffic. Your tutor is just a click away!

**Personalized Attention**
Unlike crowded classrooms, online coaching provides one-on-one attention. Tutors can focus on your specific weaknesses and help you improve faster.

**Access to Best Teachers**
Geography is no longer a limitation. You can learn from the best tutors across India, regardless of where you live.

**Cost-Effective**
Online coaching typically costs less than traditional coaching centers, making quality education accessible to more students.

**Recorded Sessions**
Most online platforms provide recorded sessions, allowing students to revise concepts at their own pace.

**Interactive Learning Tools**
Digital whiteboards, screen sharing, and interactive quizzes make learning more engaging and effective.`,
      category: "Education",
      readTime: "5 min read",
      icon: BookOpen,
      color: "bg-blue-500"
    },
    {
      title: "Preparing for Competitive Exams: A Complete Guide",
      excerpt: "Learn the proven strategies and techniques used by top performers to excel in competitive examinations like JEE, NEET, and board exams.",
      fullContent: `Success in competitive exams requires strategic preparation. Follow these proven methods:

**1. Start Early**
Don't wait until the last moment. Give yourself at least 12-18 months for JEE/NEET preparation.

**2. Understand the Syllabus**
Know exactly what topics are covered. Focus on high-weightage areas first.

**3. Create a Study Schedule**
Divide your day into study blocks. Include regular breaks and revision sessions.

**4. Practice Mock Tests**
Solve previous year papers and take regular mock tests. This helps you understand exam patterns and improve time management.

**5. Focus on Weak Areas**
Identify subjects or topics where you're struggling. Spend extra time strengthening these areas.

**6. Stay Consistent**
Daily practice is more effective than marathon study sessions. Consistency is key!

**7. Take Care of Health**
Good sleep, regular exercise, and healthy eating improve concentration and memory.

**8. Join Quality Coaching**
Expert guidance can make a huge difference. Choose tutors with proven track records.`,
      category: "Exam Prep",
      readTime: "8 min read",
      icon: Target,
      color: "bg-green-500"
    },
    {
      title: "Benefits of One-on-One Online Tutoring",
      excerpt: "Understand how personalized attention from expert tutors can dramatically improve student performance and confidence.",
      fullContent: `One-on-one tutoring provides unique advantages:

**Customized Learning Pace**
Every student learns differently. Personal tutoring allows lessons to move at YOUR pace, not the class average.

**Direct Attention**
No competition for the teacher's attention. Ask unlimited questions without hesitation.

**Flexible Scheduling**
Schedule classes when it suits you best - early morning, late evening, or weekends.

**Immediate Feedback**
Get instant corrections and explanations. Don't carry doubts forward.

**Builds Confidence**
Private sessions create a safe space to make mistakes and learn. Students become more confident in their abilities.

**Better Results**
Studies show students with personal tutors improve grades by 2-3 points on average.

**Focused Preparation**
Whether preparing for boards or competitive exams, tutors can create targeted study plans.

**Parental Visibility**
Parents can track progress more closely and communicate directly with tutors.`,
      category: "Learning",
      readTime: "6 min read",
      icon: Users,
      color: "bg-purple-500"
    }
  ];

  const openArticle = (article) => {
    setSelectedArticle(article);
  };

  const closeArticle = () => {
    setSelectedArticle(null);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#1565C0] to-blue-700 rounded-2xl p-8 md:p-12 text-white">
        <div className="flex items-center gap-3 mb-4">
          <BookOpen className="w-8 h-8" />
          <Badge className="bg-white/20 text-white border-0">ACAD Blog</Badge>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          The Power of Online Coaching in Modern Education
        </h1>
        <p className="text-xl text-blue-100 mb-6 max-w-3xl">
          Explore how digital learning platforms are transforming education, helping students excel in academics, and preparing them for competitive examinations.
        </p>
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>Updated Daily</span>
          </div>
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4" />
            <span>Expert Insights</span>
          </div>
        </div>
      </div>

      {/* Main Article */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-[#1565C0] to-blue-600 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl">Why Online Coaching Matters More Than Ever</CardTitle>
              <p className="text-sm text-slate-500">Essential reading for students, parents, and educators</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="prose max-w-none">
            <h3 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#1565C0]" />
              The Changing Landscape of Education
            </h3>
            <p className="text-slate-700 leading-relaxed mb-4">
              In today's fast-paced world, traditional classroom learning alone may not be sufficient to help students reach their full potential. Online coaching has emerged as a powerful complement to regular schooling, providing personalized attention, flexible learning schedules, and access to expert tutors from anywhere in the country.
            </p>

            <h3 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2 mt-6">
              <Award className="w-5 h-5 text-green-600" />
              Key Benefits of Online Coaching
            </h3>
            
            <div className="grid md:grid-cols-2 gap-4 my-6">
              <Card className="border-2 border-blue-100 bg-blue-50/50">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-[#1565C0] mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold mb-2">Personalized Learning</h4>
                      <p className="text-sm text-slate-600">Get one-on-one attention tailored to your learning pace and style</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-green-100 bg-green-50/50">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold mb-2">Flexible Scheduling</h4>
                      <p className="text-sm text-slate-600">Learn at times that suit your routine, no commute needed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-purple-100 bg-purple-50/50">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <Laptop className="w-5 h-5 text-purple-600 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold mb-2">Access to Best Tutors</h4>
                      <p className="text-sm text-slate-600">Connect with expert educators regardless of location</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-orange-100 bg-orange-50/50">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <BarChart className="w-5 h-5 text-orange-600 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold mb-2">Performance Tracking</h4>
                      <p className="text-sm text-slate-600">Monitor progress with detailed analytics and reports</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <h3 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2 mt-8">
              <Target className="w-5 h-5 text-red-600" />
              Excelling in Competitive Examinations
            </h3>
            <p className="text-slate-700 leading-relaxed mb-4">
              Competitive exams like JEE, NEET, UPSC, and state board examinations require specialized preparation strategies. Online coaching provides:
            </p>

            <ul className="space-y-3 mb-6">
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 bg-[#1565C0] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
                <div>
                  <span className="font-semibold">Comprehensive Study Materials:</span> Access to curated content, mock tests, and previous year question papers
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 bg-[#1565C0] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
                <div>
                  <span className="font-semibold">Expert Guidance:</span> Learn tips, tricks, and shortcuts from tutors who have cracked these exams themselves
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 bg-[#1565C0] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
                <div>
                  <span className="font-semibold">Regular Assessment:</span> Frequent tests and quizzes to identify weak areas and improve consistently
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 bg-[#1565C0] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
                <div>
                  <span className="font-semibold">Time Management Skills:</span> Learn to solve questions efficiently under time pressure
                </div>
              </li>
            </ul>

            <h3 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2 mt-8">
              <Sparkles className="w-5 h-5 text-yellow-600" />
              How ACAD Enhances Student Performance
            </h3>
            <p className="text-slate-700 leading-relaxed mb-4">
              At ACAD, we understand that every student is unique. Our platform combines the best of technology and education to provide:
            </p>

            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-6 border-2 border-blue-200">
              <h4 className="font-bold text-lg mb-4 text-slate-900">Success Statistics</h4>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-[#1565C0] mb-2">85%</div>
                  <div className="text-sm text-slate-600">Students improved by 2+ grades</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-600 mb-2">95%</div>
                  <div className="text-sm text-slate-600">Parent satisfaction rate</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-purple-600 mb-2">1000+</div>
                  <div className="text-sm text-slate-600">Students cleared competitive exams</div>
                </div>
              </div>
            </div>

            <h3 className="text-xl font-bold text-slate-900 mb-3 mt-8">For Parents: Why Invest in Online Coaching?</h3>
            <p className="text-slate-700 leading-relaxed mb-4">
              As a parent, you want the best for your child's education. Online coaching offers:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700 mb-4">
              <li>Safe learning environment from home</li>
              <li>Transparent progress tracking - monitor your child's performance in real-time</li>
              <li>Cost-effective compared to traditional coaching centers</li>
              <li>Access to recordings for revision</li>
              <li>Regular parent-tutor communication</li>
            </ul>

            <h3 className="text-xl font-bold text-slate-900 mb-3 mt-8">For Students: Take Control of Your Learning</h3>
            <p className="text-slate-700 leading-relaxed mb-4">
              Online coaching empowers you to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700 mb-4">
              <li>Learn at your own pace without peer pressure</li>
              <li>Ask doubts freely in a comfortable environment</li>
              <li>Access quality education from top tutors across India</li>
              <li>Balance studies with extracurricular activities</li>
              <li>Build confidence and self-discipline</li>
            </ul>

            <h3 className="text-xl font-bold text-slate-900 mb-3 mt-8">For Tutors: Join the Digital Revolution</h3>
            <p className="text-slate-700 leading-relaxed mb-4">
              If you're an educator, online coaching allows you to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700 mb-6">
              <li>Reach students nationwide, not just your locality</li>
              <li>Create flexible schedules that suit your lifestyle</li>
              <li>Use interactive tools to make teaching more engaging</li>
              <li>Build your reputation and student base faster</li>
              <li>Earn competitive income while making a difference</li>
            </ul>

            <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-xl p-8 border-2 border-green-200 mt-8">
              <h3 className="text-2xl font-bold text-slate-900 mb-4 text-center">Ready to Experience the ACAD Difference?</h3>
              <p className="text-center text-slate-700 mb-6">
                Join thousands of successful students, supportive parents, and expert tutors who trust ACAD for quality online education.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="bg-[#1565C0] hover:bg-[#1e88e5]">
                  <Link to={createPageUrl("RegisterInquiry")}>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Start Your Journey Today
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-2">
                  <Link to={createPageUrl("Welcome")}>
                    <ArrowRight className="w-5 h-5 mr-2" />
                    Explore Courses
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Related Articles */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Related Articles</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {blogPosts.map((post, index) => (
            <Card key={index} className="hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className={`w-12 h-12 ${post.color} rounded-xl flex items-center justify-center mb-4`}>
                  <post.icon className="w-6 h-6 text-white" />
                </div>
                <Badge className="mb-2 w-fit">{post.category}</Badge>
                <CardTitle className="text-lg">{post.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 text-sm mb-4">{post.excerpt}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">{post.readTime}</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-[#1565C0] hover:text-[#1e88e5]"
                    onClick={() => openArticle(post)}
                  >
                    Read More <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Article Modal */}
      <Dialog open={!!selectedArticle} onOpenChange={closeArticle}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3 mb-2">
                {selectedArticle && (
                  <div className={`w-10 h-10 ${selectedArticle.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                    <selectedArticle.icon className="w-5 h-5 text-white" />
                  </div>
                )}
                <div>
                  <DialogTitle className="text-2xl">{selectedArticle?.title}</DialogTitle>
                  <div className="flex items-center gap-3 mt-2">
                    <Badge>{selectedArticle?.category}</Badge>
                    <span className="text-sm text-slate-500">{selectedArticle?.readTime}</span>
                  </div>
                </div>
              </div>
            </div>
          </DialogHeader>
          <DialogDescription asChild>
            <div className="prose max-w-none mt-4">
              {selectedArticle?.fullContent.split('\n\n').map((paragraph, idx) => {
                if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
                  return (
                    <h3 key={idx} className="text-lg font-bold text-slate-900 mt-6 mb-3">
                      {paragraph.replace(/\*\*/g, '')}
                    </h3>
                  );
                }
                return (
                  <p key={idx} className="text-slate-700 leading-relaxed mb-4">
                    {paragraph}
                  </p>
                );
              })}
            </div>
          </DialogDescription>
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <Button variant="outline" onClick={closeArticle}>
              Close
            </Button>
            <Button asChild className="bg-[#1565C0] hover:bg-[#1e88e5]">
              <Link to={createPageUrl("RegisterInquiry")}>
                Get Started
              </Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}