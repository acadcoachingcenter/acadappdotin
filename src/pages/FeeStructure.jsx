import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IndianRupee, BookOpen, Heart, ExternalLink, CheckCircle, Phone, Mail } from "lucide-react";
import { Link } from "react-router-dom";

export default function FeeStructure() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await User.me();
        setUser(userData);
      } catch (error) {
        console.log("User not logged in");
      }
    };
    loadUser();
  }, []);

  const pricingTiers = [
    {
      grade: "Class 11 & 12",
      price: 2000,
      subjects: ["Mathematics", "Physics", "Chemistry", "Biology", "Computer Science", "Accountancy"],
      features: [
        "Board Exam Focused",
        "JEE/NEET Preparation",
        "Live Interactive Classes",
        "Study Materials Included",
        "Weekly Assessments",
        "Doubt Clearing Sessions"
      ],
      color: "from-purple-500 to-indigo-600"
    },
    {
      grade: "Class 9 & 10",
      price: 1500,
      subjects: ["Mathematics", "Science", "Social Science", "English", "Hindi"],
      features: [
        "CBSE/State Board Focus",
        "Board Exam Preparation",
        "Live Classes",
        "Study Materials",
        "Regular Tests",
        "Progress Tracking"
      ],
      color: "from-blue-500 to-cyan-600"
    },
    {
      grade: "Class 6, 7 & 8",
      price: 1000,
      subjects: ["Mathematics", "Science", "Social Studies", "English", "Hindi"],
      features: [
        "Foundation Building",
        "Concept Clarity",
        "Interactive Learning",
        "Study Materials",
        "Monthly Tests",
        "Parent Updates"
      ],
      color: "from-green-500 to-teal-600"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1565C0] to-blue-700 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4 mb-4">
            <IndianRupee className="w-12 h-12" />
            <h1 className="text-4xl md:text-5xl font-bold">Fee Structure</h1>
          </div>
          <p className="text-xl text-blue-100">
            Affordable quality education for every student • Updated Monthly
          </p>
          <p className="text-sm text-blue-200 mt-2">
            Last Updated: November 2024
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Scholarship Banner */}
        <Card className="mb-12 border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
          <CardContent className="p-8">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-green-900 mb-2">
                  🎓 FREE Education for Deserving Students
                </h3>
                <p className="text-lg text-green-800 mb-4">
                  Families with annual income below ₹1,00,000 are eligible for <span className="font-bold">completely FREE tuition</span> across all subjects and grades.
                </p>
                <div className="bg-white p-4 rounded-lg border-2 border-green-300">
                  <h4 className="font-semibold text-green-900 mb-2">How to Apply for Scholarship:</h4>
                  <ol className="list-decimal list-inside space-y-1 text-green-800">
                    <li>Submit income certificate from competent authority</li>
                    <li>Contact us via WhatsApp or Email</li>
                    <li>Get approval within 24-48 hours</li>
                    <li>Start learning for FREE!</li>
                  </ol>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing Cards */}
        <h2 className="text-3xl font-bold text-center mb-8 text-slate-900">
          Monthly Fee Structure (Per Subject)
        </h2>
        
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {pricingTiers.map((tier, index) => (
            <Card key={index} className="hover:shadow-2xl transition-all duration-300 overflow-hidden">
              <div className={`h-2 bg-gradient-to-r ${tier.color}`}></div>
              <CardHeader className="text-center pb-4">
                <Badge className={`bg-gradient-to-r ${tier.color} text-white text-sm px-4 py-1 mb-3 mx-auto`}>
                  {tier.grade}
                </Badge>
                <div className="flex items-center justify-center gap-2">
                  <IndianRupee className="w-8 h-8 text-slate-700" />
                  <span className="text-5xl font-bold text-slate-900">{tier.price}</span>
                </div>
                <CardDescription className="text-lg font-medium mt-2">
                  per month / per subject
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    Subjects Available:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {tier.subjects.map((subject, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {subject}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-slate-900 mb-3">What's Included:</h4>
                  <ul className="space-y-2">
                    {tier.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Payment Section */}
        <Card className="mb-8 border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl mb-2">Make Payment Easily</CardTitle>
            <CardDescription className="text-lg">
              Pay securely using our official PayU payment gateway
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-white p-6 rounded-xl border-2 border-blue-300 max-w-2xl mx-auto">
              <h3 className="text-xl font-bold text-blue-900 mb-4 text-center">
                Official Payment Gateway
              </h3>
              
              <Button 
                asChild
                size="lg"
                className="w-full bg-gradient-to-r from-[#1565C0] to-blue-700 hover:from-blue-700 hover:to-[#1565C0] text-white text-lg py-6 mb-4"
              >
                <a 
                  href="https://payu.in/pay/A18B47D72B70BCC700B7AA6F9A3185FF" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3"
                >
                  <IndianRupee className="w-6 h-6" />
                  Pay Now via PayU
                  <ExternalLink className="w-5 h-5" />
                </a>
              </Button>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Payment Instructions:</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                  <li>Click the "Pay Now via PayU" button above</li>
                  <li>Enter payment amount based on your grade and number of subjects</li>
                  <li>Complete payment using Credit/Debit Card, UPI, or Net Banking</li>
                  <li>Save your transaction ID and receipt</li>
                  <li>Share transaction details with us for enrollment confirmation</li>
                </ol>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto">
              <div className="bg-white p-4 rounded-lg border-2 border-slate-200">
                <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <Phone className="w-5 h-5 text-[#1565C0]" />
                  WhatsApp Support
                </h4>
                <p className="text-slate-700 mb-2">For payment queries:</p>
                <a href="https://wa.me/919790818436" className="text-[#1565C0] hover:underline font-medium">
                  +91 9790818436
                </a>
              </div>
              
              <div className="bg-white p-4 rounded-lg border-2 border-slate-200">
                <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <Mail className="w-5 h-5 text-[#1565C0]" />
                  Email Support
                </h4>
                <p className="text-slate-700 mb-2">Send payment proof to:</p>
                <a href="mailto:acadcoachingcenter@gmail.com" className="text-[#1565C0] hover:underline font-medium break-all">
                  acadcoachingcenter@gmail.com
                </a>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Hindi Course Fee Structure */}
        <Card className="mb-8 border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl mb-2">Hindi Course Fee Structure</CardTitle>
            <CardDescription className="text-lg">
              Learn Hindi at your own pace with our specialized courses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Parichaya */}
              <Card className="border-2 border-orange-300 hover:shadow-xl transition-all">
                <CardHeader className="pb-3">
                  <Badge className="bg-orange-500 text-white mb-2 w-fit">PARICHAYA</Badge>
                  <CardTitle className="text-lg">Beginner Level</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-center">
                    <div className="text-sm text-slate-500 line-through mb-1">₹1,000</div>
                    <div className="flex items-center justify-center gap-1">
                      <IndianRupee className="w-6 h-6 text-orange-600" />
                      <span className="text-3xl font-bold text-orange-600">700</span>
                    </div>
                    <p className="text-sm text-slate-600 mt-1">per month (full course)</p>
                  </div>
                  <Button 
                    asChild
                    size="sm"
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    <a href="https://pmny.in/xJuAmT6XgxX7" target="_blank" rel="noopener noreferrer">
                      Grab the Offer
                    </a>
                  </Button>
                </CardContent>
              </Card>

              {/* Prathamic */}
              <Card className="border-2 border-orange-300 hover:shadow-xl transition-all">
                <CardHeader className="pb-3">
                  <Badge className="bg-blue-500 text-white mb-2 w-fit">PRATHAMIC</Badge>
                  <CardTitle className="text-lg">Beginner Level</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-center">
                    <div className="text-sm text-slate-500 line-through mb-1">₹1,500</div>
                    <div className="flex items-center justify-center gap-1">
                      <IndianRupee className="w-6 h-6 text-blue-600" />
                      <span className="text-3xl font-bold text-blue-600">800</span>
                    </div>
                    <p className="text-sm text-slate-600 mt-1">per month (full course)</p>
                  </div>
                  <Button 
                    asChild
                    size="sm"
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    <a href="https://pmny.in/xJuAmT6XgxX7" target="_blank" rel="noopener noreferrer">
                      Grab the Offer
                    </a>
                  </Button>
                </CardContent>
              </Card>

              {/* Madhyama */}
              <Card className="border-2 border-green-300 hover:shadow-xl transition-all">
                <CardHeader className="pb-3">
                  <Badge className="bg-green-500 text-white mb-2 w-fit">MADHYAMA</Badge>
                  <CardTitle className="text-lg">Next Level</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-center">
                    <div className="text-sm text-slate-500 line-through mb-1">₹2,000</div>
                    <div className="flex items-center justify-center gap-1">
                      <IndianRupee className="w-6 h-6 text-green-600" />
                      <span className="text-3xl font-bold text-green-600">1,000</span>
                    </div>
                    <p className="text-sm text-slate-600 mt-1">per month (full course)</p>
                  </div>
                  <Button 
                    asChild
                    size="sm"
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    <a href="https://pmny.in/xJuAmT6XgxX7" target="_blank" rel="noopener noreferrer">
                      Grab the Offer
                    </a>
                  </Button>
                </CardContent>
              </Card>

              {/* Rashtrabhasha */}
              <Card className="border-2 border-purple-300 hover:shadow-xl transition-all">
                <CardHeader className="pb-3">
                  <Badge className="bg-purple-500 text-white mb-2 w-fit">RASHTRABHASHA</Badge>
                  <CardTitle className="text-lg">Advanced School Level</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-center">
                    <div className="text-sm text-slate-500 line-through mb-1">₹2,900</div>
                    <div className="flex items-center justify-center gap-1">
                      <IndianRupee className="w-6 h-6 text-purple-600" />
                      <span className="text-3xl font-bold text-purple-600">1,200</span>
                    </div>
                    <p className="text-sm text-slate-600 mt-1">per month (full course)</p>
                  </div>
                  <Button 
                    asChild
                    size="sm"
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    <a href="https://pmny.in/xJuAmT6XgxX7" target="_blank" rel="noopener noreferrer">
                      Grab the Offer
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Important Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Important Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-slate-900 mb-2">📅 Payment Schedule</h4>
                <ul className="text-sm text-slate-700 space-y-1">
                  <li>• Monthly fees to be paid by 5th of each month</li>
                  <li>• Advance payment for 3 months: Get 5% discount</li>
                  <li>• Advance payment for 6 months: Get 10% discount</li>
                  <li>• Annual payment: Get 15% discount</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-slate-900 mb-2">📝 Enrollment Process</h4>
                <ul className="text-sm text-slate-700 space-y-1">
                  <li>• Make payment via PayU link above</li>
                  <li>• Share transaction details on WhatsApp</li>
                  <li>• Receive enrollment confirmation within 24 hours</li>
                  <li>• Get access to online classes and materials</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-slate-900 mb-2">🔄 Refund Policy</h4>
                <ul className="text-sm text-slate-700 space-y-1">
                  <li>• Full refund if cancelled within 7 days</li>
                  <li>• Pro-rata refund after 7 days</li>
                  <li>• Refund processed within 15 working days</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-slate-900 mb-2">💡 Additional Benefits</h4>
                <ul className="text-sm text-slate-700 space-y-1">
                  <li>• Free demo class before enrollment</li>
                  <li>• Sibling discount: 10% for second child</li>
                  <li>• Referral bonus: ₹500 per successful referral</li>
                  <li>• Group discounts available</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <div className="mt-12 text-center bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-8">
          <h3 className="text-2xl font-bold mb-4">Ready to Start Your Learning Journey?</h3>
          <p className="text-slate-300 mb-6 max-w-2xl mx-auto">
            Join thousands of students who trust ACAD for quality education. Make your payment now and get instant access to our premium courses.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              asChild
              size="lg"
              className="bg-[#1565C0] hover:bg-[#1e88e5]"
            >
              <a 
                href="https://payu.in/pay/A18B47D72B70BCC700B7AA6F9A3185FF" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <IndianRupee className="w-5 h-5 mr-2" />
                Make Payment Now
                <ExternalLink className="w-4 h-4 ml-2" />
              </a>
            </Button>
            
            {!user && (
              <Button 
                asChild
                size="lg"
                variant="outline"
                className="bg-white text-slate-900 hover:bg-slate-100"
              >
                <Link to="/Welcome">
                  Register for Free Demo
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}