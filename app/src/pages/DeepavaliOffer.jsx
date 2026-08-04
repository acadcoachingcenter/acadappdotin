import React, { useState, useEffect } from "react";
import { apiClient } from "@/api/apiClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Gift, Sparkles, Clock, Users, CheckCircle, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import EnrollmentRequestModal from "../components/student/EnrollmentRequestModal";

export default function ChristmasNewYearOffer() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const userData = await apiClient.auth.me();
      setUser(userData);
    } catch (error) {
      setUser(null);
    }

    try {
      const publishedCourses = await apiClient.entities.Course.filter({ status: 'published' }, '-created_date');
      setCourses(publishedCourses);
    } catch (error) {
      console.error("Error loading courses:", error);
    }
    setIsLoading(false);
  };

  const handleLogin = async () => {
    await apiClient.auth.redirectToLogin(window.location.origin + createPageUrl('Onboarding'));
  };

  const handleEnrollRequest = (course) => {
    if (!user) {
      alert("Please login first to enroll in courses!");
      handleLogin();
      return;
    }
    setSelectedCourse(course);
  };

  const handleEnrollmentSuccess = () => {
    setSelectedCourse(null);
    alert("Enrollment request submitted successfully!");
    loadData();
  };

  const calculateDiscountedPrice = (originalPrice) => {
    return Math.round(originalPrice * 0.8); // 20% off
  };

  const getSubjectColor = (subject) => {
    const colors = {
      Mathematics: "bg-blue-100 text-blue-800",
      Physics: "bg-purple-100 text-purple-800",
      Chemistry: "bg-green-100 text-green-800",
      Biology: "bg-teal-100 text-teal-800",
      English: "bg-pink-100 text-pink-800",
      default: "bg-slate-100 text-slate-800"
    };
    return colors[subject] || colors.default;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-red-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading holiday offers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-green-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-red-600 via-green-600 to-red-600 text-white py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 text-6xl animate-bounce">🎄</div>
          <div className="absolute top-20 right-20 text-5xl animate-bounce" style={{ animationDelay: '0.5s' }}>❄️</div>
          <div className="absolute bottom-20 left-20 text-5xl animate-bounce" style={{ animationDelay: '1s' }}>🎁</div>
          <div className="absolute bottom-10 right-10 text-6xl animate-bounce" style={{ animationDelay: '1.5s' }}>🎅</div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-block mb-6">
              <Badge className="bg-white text-red-600 text-lg px-6 py-2 shadow-lg">
                🎁 Limited Time Holiday Offer
              </Badge>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-pulse">
              🎄 Merry Christmas & Happy New Year 2026! 🎅
            </h1>
            
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-8 mb-8 border-2 border-white">
              <p className="text-6xl font-bold mb-4">20% OFF</p>
              <p className="text-2xl font-semibold">On All Online Courses</p>
            </div>
            
            <p className="text-xl mb-8 leading-relaxed">
              🎉 Celebrate the festive season with the gift of quality education! 
              Enroll in any course and get an instant 20% discount. 
              Limited seats available - Hurry up!
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {!user && (
                <Button 
                  onClick={handleLogin}
                  size="lg"
                  className="bg-white text-red-600 hover:bg-red-50 px-8 py-6 text-lg font-bold shadow-xl"
                >
                  <Gift className="w-5 h-5 mr-2" />
                  Login to Claim Offer
                </Button>
              )}
              <Button 
                onClick={() => window.scrollTo({ top: document.getElementById('courses').offsetTop - 100, behavior: 'smooth' })}
                size="lg"
                variant={user ? "default" : "outline"}
                className={user ? "bg-green-700 hover:bg-green-800 px-8 py-6 text-lg font-bold shadow-xl" : "border-2 border-white text-white hover:bg-white/10 px-8 py-6 text-lg font-bold"}
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Browse Holiday Courses
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12 text-slate-900">
            🎁 Why Choose ACAD This Holiday Season?
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center hover:shadow-xl transition-shadow border-2 border-red-200">
              <CardContent className="pt-8">
                <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3">20% Instant Discount</h3>
                <p className="text-slate-600">No coupon codes needed - discount automatically applied on all courses!</p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-xl transition-shadow border-2 border-green-200">
              <CardContent className="pt-8">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3">Expert Verified Tutors</h3>
                <p className="text-slate-600">Learn from the best - all tutors are verified and experienced professionals.</p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-xl transition-shadow border-2 border-red-200">
              <CardContent className="pt-8">
                <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Gift className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3">Perfect Holiday Gift</h3>
                <p className="text-slate-600">Give the gift of knowledge - enroll your child in quality education this season!</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Courses Section */}
      <section id="courses" className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 text-slate-900">
              ❄️ Available Holiday Courses with 20% OFF
            </h2>
            <p className="text-xl text-slate-600">
              All prices shown below include the special holiday discount!
            </p>
          </div>

          {courses.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Gift className="w-16 h-16 mx-auto text-slate-400 mb-4" />
                <p className="text-slate-600 text-lg">No courses available at the moment. Check back soon!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => {
                const originalPrice = course.price;
                const discountedPrice = calculateDiscountedPrice(originalPrice);
                const savings = originalPrice - discountedPrice;

                return (
                  <Card key={course.id} className="hover:shadow-2xl transition-all duration-300 border-2 border-red-200 hover:border-red-400 relative overflow-hidden">
                    {/* Holiday Ribbon */}
                    <div className="absolute top-4 -right-12 bg-gradient-to-r from-red-600 to-green-600 text-white px-12 py-1 rotate-45 text-xs font-bold shadow-lg">
                      20% OFF
                    </div>

                    <CardHeader>
                      <div className="flex items-start justify-between mb-3">
                        <Badge className={getSubjectColor(course.subject)}>
                          {course.subject}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {course.grade_level}
                        </Badge>
                      </div>
                      <CardTitle className="text-xl">{course.title}</CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <p className="text-slate-600 text-sm line-clamp-3">
                        {course.description}
                      </p>

                      <div className="flex items-center gap-4 text-sm text-slate-600">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {course.duration_weeks} weeks
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {course.enrolled_students || 0}/{course.max_students}
                        </div>
                      </div>

                      <div className="border-t pt-4">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="text-xs text-slate-500 line-through">
                              Original: ₹{originalPrice.toLocaleString()}
                            </p>
                            <div className="flex items-baseline gap-2">
                              <p className="text-3xl font-bold text-green-600">
                                ₹{discountedPrice.toLocaleString()}
                              </p>
                              <Badge className="bg-red-100 text-red-700">
                                Save ₹{savings}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <div className="bg-green-50 border border-green-200 rounded-lg p-2 mb-3">
                          <p className="text-xs text-green-800 font-medium text-center">
                            🎁 Holiday Special: Pay ₹{discountedPrice.toLocaleString()} instead of ₹{originalPrice.toLocaleString()}
                          </p>
                        </div>

                        <Button 
                          onClick={() => handleEnrollRequest(course)}
                          className="w-full bg-gradient-to-r from-red-600 to-green-600 hover:from-red-700 hover:to-green-700"
                        >
                          <Gift className="w-4 h-4 mr-2" />
                          Enroll Now with 20% Off
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-red-600 to-green-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">
            🎄 Don't Miss This Limited Time Holiday Offer!
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join thousands of students who are already learning with ACAD. 
            This 20% discount won't last forever - enroll today and start your learning journey!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {!user ? (
              <Button 
                onClick={handleLogin}
                size="lg"
                className="bg-white text-red-600 hover:bg-red-50 px-8 py-6 text-lg font-bold"
              >
                <Gift className="w-5 h-5 mr-2" />
                Login to Claim Your Holiday Offer
              </Button>
            ) : (
              <Button 
                onClick={() => navigate(createPageUrl("StudentDashboard"))}
                size="lg"
                className="bg-white text-green-600 hover:bg-green-50 px-8 py-6 text-lg font-bold"
              >
                <ArrowRight className="w-5 h-5 mr-2" />
                Go to My Dashboard
              </Button>
            )}
          </div>
          <p className="text-sm mt-6 opacity-90">
            ❄️ Offer valid through New Year 2026 • Limited seats available • Terms apply
          </p>
        </div>
      </section>

      {selectedCourse && (
        <EnrollmentRequestModal
          course={selectedCourse}
          open={!!selectedCourse}
          onOpenChange={(open) => !open && setSelectedCourse(null)}
          onEnrollmentSuccess={handleEnrollmentSuccess}
        />
      )}
    </div>
  );
}