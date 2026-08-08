import React, { useState, useEffect } from "react";
import { apiClient } from "@/api/apiClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GraduationCap, Users, BookOpen, Award, ArrowRight, Star, Play, CheckCircle, Home, Phone, Mail, Clock, User as UserIcon, X, Calendar, Sparkles, QrCode, Download, Share2, MapPin } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import BookReleaseBanner from "../components/welcome/BookReleaseBanner";
import TestimonialPopup from "../components/welcome/TestimonialPopup";
import AdminTutorApprovalPanel from "../components/welcome/AdminTutorApprovalPanel";
import { Badge } from "@/components/ui/badge";

export default function Welcome() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showBookNotificationModal, setShowBookNotificationModal] = useState(false);
  const [showTutorModal, setShowTutorModal] = useState(false);

  useEffect(() => {
    if (!window._chatbaseLoaded) {
      window._chatbaseLoaded = true;
      window.embeddedChatbotConfig = { chatbotId: "aQvUmZnkx4GwYvF0V0Mjh", domain: "www.chatbase.co" };
      const s = document.createElement("script");
      s.src = "https://www.chatbase.co/embed.min.js";
      s.setAttribute("chatbotId", "aQvUmZnkx4GwYvF0V0Mjh");
      s.setAttribute("domain", "www.chatbase.co");
      s.defer = true;
      document.body.appendChild(s);
    }
  }, []);

  useEffect(() => {
    const fetchUserStatus = async () => {
      setIsLoading(true);
      try {
        const userData = await apiClient.auth.me();
        setUser(userData);
      } catch (error) {
        setUser(null);
      }
      setIsLoading(false);
    };
    
    fetchUserStatus();
  }, []);

  const handleLogin = async () => {
    await apiClient.auth.redirectToLogin(window.location.origin + createPageUrl('Onboarding'));
  };

  const handleGetStarted = () => {
    if (!user) {
      handleLogin();
    } else if (!user.user_type) {
      navigate(createPageUrl('Onboarding'));
    } else {
      navigateToUserDashboard();
    }
  };

  const handleWatchDemo = () => {
    setShowVideoModal(true);
  };

  const navigateToUserDashboard = () => {
    if (!user) return;
    
    switch(user.user_type) {
      case 'student':
        navigate(createPageUrl('StudentDashboard'));
        break;
      case 'parent':
        navigate(createPageUrl('ParentDashboard'));
        break;
      case 'tutor':
        navigate(createPageUrl('TutorDashboard'));
        break;
      case 'admin':
        navigate(createPageUrl('AdminDashboard'));
        break;
      default:
        navigate(createPageUrl('Onboarding'));
    }
  };

  const getButtonConfig = () => {
    if (!user) {
      return {
        text: "Get Started - Join ACAD",
        icon: ArrowRight,
        action: handleGetStarted
      };
    } else if (!user.user_type) {
      return {
        text: "Complete Your Profile",
        icon: UserIcon,
        action: handleGetStarted
      };
    } else {
      return {
        text: "Go to My Dashboard",
        icon: Home,
        action: handleGetStarted
      };
    }
  };

  const getEmbedUrl = (driveUrl) => {
    const fileId = driveUrl.match(/\/d\/([a-zA-Z0-9-_]+)/)?.[1];
    return fileId ? `https://drive.google.com/file/d/${fileId}/preview` : driveUrl;
  };

  const registrationUrl = window.location.origin + createPageUrl('RegisterInquiry');
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(registrationUrl)}`;

  const handleDownloadQR = () => {
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = 'ACAD-Registration-QR.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShareQR = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join ACAD Online Tuition',
          text: 'Register for quality online education with verified tutors',
          url: registrationUrl
        });
      } catch (err) {
        console.log('Share failed:', err);
      }
    } else {
      navigator.clipboard.writeText(registrationUrl);
      alert('Registration link copied to clipboard!');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1565C0] mx-auto"></div>
          <p className="mt-4 text-slate-600 text-lg">Loading ACAD...</p>
        </div>
      </div>
    );
  }

  const buttonConfig = getButtonConfig();

  const envImages = [
  {
    src: "/images/footerImage1.png",
    alt: "Indian male student studying mathematics online with focused concentration using ACAD tutoring app",
    title: "Focused Learning",
    desc: "Distraction-free environment"
  },
  {
    src: "/images/footerImage2.png",
    alt: "Smiling Indian female student learning online courses with flexible schedule on ACAD education platform",
    title: "Flexible Schedule",
    desc: "Learn at your own pace"
  },
  {
    src: "/images/footerImage3.png",
    alt: "Interactive online classroom with digital whiteboard for live teaching sessions on ACAD tutoring platform",
    title: "Interactive Classes",
    desc: "Live whiteboard sessions"
  },
  {
    src: "/images/footerImage4.png",
    alt: "Students celebrating academic success and excellent exam results with ACAD online tutoring",
    title: "Academic Success",
    desc: "Proven Results"
  }
];
  
  const features = [
    {
      icon: BookOpen,
      title: "Expert-Led Online Courses",
      desc: "Learn from verified, experienced tutors across Mathematics, Physics, Chemistry, Biology and other subjects with personalized attention for Class 6-12 students.",
      accent: "bg-[#1565C0]"
    },
    {
      icon: Users,
      title: "Live Interactive Learning",
      desc: "Engage in live classes with digital whiteboards, real-time chat, instant doubt solving, and interactive quizzes for maximum student engagement.",
      accent: "bg-emerald-500"
    },
    {
      icon: Award,
      title: "Progress Tracking & Analytics",
      desc: "Monitor academic performance with detailed analytics, assignments tracking, parent dashboard features, and comprehensive progress reports.",
      accent: "bg-violet-500"
    }
  ];

  const stats = [
    { value: "10,000+", label: "Happy Students Learning Online" },
    { value: "500+", label: "Expert Verified Tutors" },
    { value: "50+", label: "Subjects & Courses Available" },
    { value: "95%", label: "Student Success Rate" }
  ];

  return (
    <div className="min-h-screen bg-white">
      <TestimonialPopup />

      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "EducationalOrganization",
          "name": "ACAD Online Learning Platform",
          "alternateName": "ACAD Coaching Center",
          "description": "Online educational platform connecting students with verified tutors",
          "url": "https://acadapp.in",
          "logo": "https://acadapp.in/logo.png",
          "image": "https://acadapp.in/og-image.jpg",
          "telephone": "+91-9790818436",
          "email": "acadcoachingcenter@gmail.com",
          "address": {
            "@type": "PostalAddress",
            "addressCountry": "IN"
          },
          "sameAs": [
            "https://acadapp.in"
          ],
          "serviceType": "Online Education",
          "areaServed": "India",
          "offers": {
            "@type": "Offer",
            "description": "Online tutoring services for Class 6-12 students in all subjects",
            "category": "Education"
          },
          "contactPoint": {
            "@type": "ContactPoint",
            "telephone": "+91-9790818436",
            "contactType": "customer service",
            "email": "acadcoachingcenter@gmail.com",
            "availableLanguage": ["English", "Hindi"]
          }
        })}
      </script>

      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

          .ed-body { font-family: 'Inter', system-ui, sans-serif; }

          [data-radix-select-content] {
            background-color: #FFFFFF !important;
            border: 1px solid #e2e8f0 !important;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.10) !important;
            z-index: 9999 !important;
          }
          [data-radix-select-item] {
            background-color: #FFFFFF !important;
            color: #1e293b !important;
            font-weight: 500 !important;
            padding: 8px 12px !important;
          }
          [data-radix-select-item]:hover,
          [data-radix-select-item]:focus {
            background-color: #1565C0 !important;
            color: #FFFFFF !important;
          }

          * { box-sizing: border-box; }
          img { max-width: 100%; height: auto; }
          .hero-image { aspect-ratio: 4/3; object-fit: cover; }
        `}
      </style>

      <div className="ed-body">

      {/* Contact Info Bar */}
      <div className="bg-[#0d47a1] text-white py-2.5 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between text-sm gap-2">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 opacity-90" />
              <span className="font-medium">WhatsApp: 9790818436</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 opacity-90" />
              <span className="font-medium">acadcoachingcenter@gmail.com</span>
            </div>
          </div>
          <div className="text-xs text-blue-100">
            Get in touch for any queries
          </div>
        </div>
      </div>

      {user && (
        <div className="bg-emerald-50 border-b border-emerald-100 py-2.5 px-4">
          <div className="max-w-7xl mx-auto">
            <p className="text-sm text-emerald-800 text-center font-medium">
              Welcome back, {user.full_name || user.email}!
              {!user.user_type && " Please complete your profile to continue."}
            </p>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 py-16 md:py-24">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-[#1565C0] rounded-xl flex items-center justify-center">
                  <GraduationCap className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">ACAD</h1>
                  <p className="text-sm font-semibold text-[#1565C0] uppercase tracking-widest">Connect. Learn. Excel.</p>
                </div>
              </div>

              <p className="text-sm font-semibold uppercase tracking-widest text-[#1565C0] mb-4">
                India's Trusted Online Tuition Platform
              </p>
              <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 leading-tight tracking-tight">
                Best Online Tuition App for Students &amp; Teachers in India
              </h2>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed max-w-xl">
                Find verified tutors for Mathematics, Physics, Chemistry, Biology. Join live classes, get personalized learning, and achieve academic excellence with India's most trusted online education platform.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full">

  {/* Get Started */}
  <button
    onClick={buttonConfig.action}
    className="w-full h-32 bg-[#1565C0] hover:bg-[#0d47a1] text-white
               px-3 rounded-xl shadow-sm transition-all duration-200
               flex items-center justify-center text-center
               font-semibold text-base leading-snug"
    aria-label="Join ACAD online tuition platform"
  >
    <span className="flex flex-col items-center justify-center gap-1">
      {buttonConfig.icon && (
        <buttonConfig.icon className="w-5 h-5 mb-1" />
      )}
      <span>{buttonConfig.text}</span>
    </span>
  </button>

  {/* Register Interest */}
  <Link
    to={createPageUrl("RegisterInquiry")}
    className="w-full h-32 border border-slate-300
               text-slate-700 hover:bg-slate-50 hover:border-slate-400
               px-3 rounded-xl transition-all duration-200
               flex items-center justify-center text-center
               font-semibold text-base leading-snug"
    aria-label="Register your interest in ACAD"
  >
    <span className="flex flex-col items-center justify-center gap-1">
      <UserIcon className="w-5 h-5" />
      <span>Register Interest</span>
    </span>
  </Link>

  {/* Find Tutor */}
  <Link
    to={createPageUrl("FindTeachersNearYou")}
    className="w-full h-32 bg-emerald-500 hover:bg-emerald-600
               text-white px-3 rounded-xl shadow-sm
               transition-all duration-200
               flex items-center justify-center text-center
               font-semibold text-base leading-snug"
    aria-label="Find a tutor near your location"
  >
    <span className="flex flex-col items-center justify-center gap-1">
      <MapPin className="w-5 h-5" />
      <span>Find Tutor Near Me</span>
    </span>
  </Link>

  {/* Become a Tutor */}
  <button
    onClick={() => setShowTutorModal(true)}
    className="w-full h-32 bg-amber-500 hover:bg-amber-600
               text-white px-3 rounded-xl shadow-sm
               transition-all duration-200
               flex items-center justify-center text-center
               font-semibold text-base leading-snug"
    aria-label="Enroll as a tutor on ACAD"
  >
    <span className="flex flex-col items-center justify-center gap-1">
      <GraduationCap className="w-5 h-5" />
      <span>Become a Tutor</span>
    </span>
  </button>

</div>
              </div>

              <div className="flex flex-wrap items-center gap-x-8 gap-y-3 mt-10 pt-8 border-t border-slate-200">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-400 fill-current" />
                  <span className="text-slate-700 font-medium text-sm">4.9/5 Rating</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#1565C0]" />
                  <span className="text-slate-700 font-medium text-sm">10,000+ Students</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  <span className="text-slate-700 font-medium text-sm">Verified Tutors</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-white">
                <img
  src="/images/acad-online-tuition.jpg"
  alt="Indian female student learning online with laptop using ACAD tutoring app - online education platform for students and teachers in India"
  className="w-full hero-image"
  loading="eager"
  width="600"
  height="450"
  fetchPriority="high"
/>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Book Release Banner */}
      <div className="max-w-7xl mx-auto px-6">
        <BookReleaseBanner />
      </div>

      {/* Admin Tutor Approval Panel (only for owner) */}
      {user && user.email === 'krishiv.advt@gmail.com' && (
        <div className="max-w-7xl mx-auto px-6 py-6">
          <AdminTutorApprovalPanel />
        </div>
      )}

      {/* Registration CTA */}
      <section className="py-16 md:py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <Card className="border border-slate-200 shadow-sm overflow-hidden rounded-2xl">
            <div className="grid md:grid-cols-2 items-center">
              <div className="p-8 md:p-12">
                <p className="text-sm font-semibold uppercase tracking-widest text-[#1565C0] mb-3">📱 Quick Registration</p>
                <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-4 tracking-tight">
                  Start your learning journey today
                </h3>
                <p className="text-base text-slate-600 mb-8 leading-relaxed">
                  Scan the QR code or click the button below to register your interest. Get personalized course recommendations and start your learning journey today!
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    asChild
                    size="lg"
                    className="bg-[#1565C0] hover:bg-[#0d47a1] text-white px-7 py-3.5 text-base font-semibold rounded-xl shadow-sm h-auto"
                  >
                    <Link to={createPageUrl("RegisterInquiry")}>
                      <UserIcon className="w-5 h-5 mr-2" />
                      Register Now - It's Free!
                    </Link>
                  </Button>
                  <Button
                    onClick={() => setShowQRModal(true)}
                    variant="outline"
                    size="lg"
                    className="border border-slate-300 text-slate-700 hover:bg-slate-50 px-7 py-3.5 text-base font-semibold rounded-xl h-auto"
                  >
                    <QrCode className="w-5 h-5 mr-2" />
                    View QR Code
                  </Button>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center bg-white border-t md:border-t-0 md:border-l border-slate-200 p-8 md:p-12">
                <img
                  src={qrCodeUrl}
                  alt="ACAD Registration QR Code"
                  className="w-52 h-52 border border-slate-200 rounded-xl"
                />
                <p className="text-center text-sm text-slate-500 mt-4 font-medium">
                  Scan to Register Instantly
                </p>
                <div className="flex gap-2 mt-4">
                  <Button
                    onClick={handleDownloadQR}
                    size="sm"
                    variant="outline"
                    className="rounded-lg"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                  <Button
                    onClick={handleShareQR}
                    size="sm"
                    variant="outline"
                    className="rounded-lg"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Learning Environment */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12 max-w-2xl mx-auto">
            <p className="text-sm font-semibold uppercase tracking-widest text-[#1565C0] mb-3">Learning Environment</p>
            <h3 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">Experience Our Online Learning Environment</h3>
            <p className="text-lg text-slate-600">Join thousands of students in their journey to academic excellence with India's best online tutors</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
            {envImages.map((img, i) => (
              <div key={i} className="group relative overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
                <img
                  src={img.src}
                  alt={img.alt}
                  className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                  width="300"
                  height="200"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/10 to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <h5 className="font-semibold text-lg leading-tight">{img.title}</h5>
                  <p className="text-sm text-slate-200 mt-0.5">{img.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <Card key={i} className="border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl overflow-hidden">
                <div className={`h-1.5 w-full ${f.accent}`}></div>
                <CardContent className="p-8 text-center">
                  <div className={`w-14 h-14 ${f.accent} rounded-xl flex items-center justify-center mx-auto mb-5`}>
                    <f.icon className="w-7 h-7 text-white" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 mb-3">{f.title}</h4>
                  <p className="text-slate-600 leading-relaxed text-sm">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-14 bg-[#0d47a1]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
            {stats.map((s, i) => (
              <div key={i} className="md:border-r md:last:border-r-0 border-white/15">
                <div className="text-4xl md:text-5xl font-extrabold mb-2 tracking-tight">{s.value}</div>
                <div className="text-blue-200 text-sm font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Explore ACAD */}
      <section className="py-16 md:py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12 max-w-2xl mx-auto">
            <p className="text-sm font-semibold uppercase tracking-widest text-[#1565C0] mb-3">Explore ACAD</p>
            <h3 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">Discover what's happening</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <Link to={createPageUrl("Events")} className="group">
              <Card className="border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl overflow-hidden h-full">
                <div className="h-1.5 w-full bg-[#1565C0]"></div>
                <CardContent className="p-8 text-center">
                  <div className="flex justify-center mb-4">
                    <Badge className="bg-[#1565C0] text-white border-0 mb-2">NEW</Badge>
                  </div>
                  <Calendar className="w-12 h-12 mx-auto mb-4 text-[#1565C0] group-hover:scale-110 transition-transform" />
                  <h4 className="text-xl font-bold text-slate-900 mb-2">Events &amp; Achievements</h4>
                  <p className="text-slate-600 text-sm">Celebrate success stories and view student achievements</p>
                </CardContent>
              </Card>
            </Link>

            <Link to={createPageUrl("DeepavaliOffer")} className="group">
              <Card className="border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl overflow-hidden h-full">
                <div className="h-1.5 w-full bg-orange-500"></div>
                <CardContent className="p-8 text-center">
                  <div className="flex justify-center mb-4">
                    <Badge className="bg-orange-500 text-white border-0 mb-2">LIMITED TIME</Badge>
                  </div>
                  <Sparkles className="w-12 h-12 mx-auto mb-4 text-orange-500 group-hover:scale-110 transition-transform" />
                  <h4 className="text-xl font-bold text-slate-900 mb-2">Festive Season Special</h4>
                  <p className="text-slate-600 text-sm">Get 20% off on all courses - Limited time offer!</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 md:py-24 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-300 mb-3">Get Started</p>
          <h3 className="text-3xl md:text-5xl font-extrabold mb-5 tracking-tight">Ready to Start Your Online Learning Journey?</h3>
          <p className="text-lg text-slate-300 mb-9 max-w-2xl mx-auto leading-relaxed">
            Join thousands of students and parents who trust ACAD for quality online education. Find the best tutors, get personalized learning, and achieve academic excellence!
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={buttonConfig.action}
              className="bg-[#1565C0] hover:bg-[#0d47a1] text-white px-9 py-3.5 text-base font-semibold rounded-xl shadow-sm transition-all duration-200 inline-flex items-center justify-center"
              aria-label="Start learning with ACAD online tuition app"
            >
              {buttonConfig.text}
              {buttonConfig.icon && <buttonConfig.icon className="w-5 h-5 ml-2" />}
            </button>
            <button
              onClick={handleWatchDemo}
              className="border border-slate-600 text-white hover:bg-white/10 hover:border-slate-500 px-9 py-3.5 text-base font-semibold rounded-xl transition-all duration-200 inline-flex items-center justify-center"
              aria-label="Watch ACAD platform demo"
            >
              <Play className="w-5 h-5 mr-2" />
              Watch How It Works
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-14">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-[#0d47a1] rounded-2xl p-8 mb-12 text-white">
            <div className="text-center">
              <h3 className="text-xl md:text-2xl font-bold mb-6 tracking-tight">Get in Touch with ACAD Support</h3>
              <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                <div className="flex items-center gap-3 bg-white/10 rounded-full pl-3 pr-6 py-2.5">
                  <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-sm">WhatsApp Support</div>
                    <div className="text-blue-100 text-xs">+91 9790818436</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-white/10 rounded-full pl-3 pr-6 py-2.5">
                  <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-sm">Email Support</div>
                    <div className="text-blue-100 text-xs">acadcoachingcenter@gmail.com</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-white/10 rounded-full pl-3 pr-6 py-2.5">
                  <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-sm">Support Hours</div>
                    <div className="text-blue-100 text-xs">24/7 Available</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-10">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-[#1565C0] rounded-xl flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <h4 className="text-white font-bold text-lg">ACAD</h4>
              </div>
              <p className="text-sm mb-5 leading-relaxed">India's premier online tutoring platform connecting students with verified teachers for transformative learning experiences.</p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-[#1565C0]" />
                  <span>+91 9790818436</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#1565C0]" />
                  <span>acadcoachingcenter@gmail.com</span>
                </div>
              </div>
            </div>

            <div>
              <h5 className="font-semibold text-white mb-4">For Students</h5>
              <ul className="space-y-2.5 text-sm">
                <li className="hover:text-white cursor-pointer transition-colors">Find Online Tutors</li>
                <li className="hover:text-white cursor-pointer transition-colors">Join Live Classes</li>
                <li><Link to={createPageUrl("Events")} className="hover:text-white transition-colors">View Events &amp; Achievements</Link></li>
                <li className="hover:text-white cursor-pointer transition-colors">Track Academic Progress</li>
                <li><Link to={createPageUrl("Blog")} className="hover:text-white transition-colors">Read Our Blog</Link></li>
              </ul>
            </div>

            <div>
              <h5 className="font-semibold text-white mb-4">For Teachers</h5>
              <ul className="space-y-2.5 text-sm">
                <li className="hover:text-white cursor-pointer transition-colors">Create Online Courses</li>
                <li className="hover:text-white cursor-pointer transition-colors">Schedule Live Classes</li>
                <li className="hover:text-white cursor-pointer transition-colors">Manage Student Progress</li>
                <li className="hover:text-white cursor-pointer transition-colors">Earn Money Teaching</li>
                <li><Link to={createPageUrl("Blog")} className="hover:text-white transition-colors">Teaching Resources</Link></li>
              </ul>
            </div>

            <div>
              <h5 className="font-semibold text-white mb-4">Support &amp; Info</h5>
              <ul className="space-y-2.5 text-sm">
                <li className="hover:text-white cursor-pointer transition-colors">Help Center</li>
                <li className="hover:text-white cursor-pointer transition-colors">Contact Support</li>
                <li><Link to={createPageUrl("Blog")} className="hover:text-white transition-colors">Blog &amp; Articles</Link></li>
                <li className="hover:text-white cursor-pointer transition-colors">Privacy Policy</li>
                <li className="hover:text-white cursor-pointer transition-colors">Terms of Service</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 mt-12 pt-8 text-center">
            <p className="text-sm">&copy; {new Date().getFullYear()} ACAD Online Tuition Platform. All rights reserved.</p>
            <div className="flex items-center justify-center gap-4 mt-2 text-xs">
              <span>Contact: acadcoachingcenter@gmail.com | WhatsApp: +91 9790818436</span>
            </div>
          </div>
        </div>
      </footer>
      </div>

      {/* Demo Video Modal */}
      <Dialog open={showVideoModal} onOpenChange={setShowVideoModal}>
        <DialogContent className="max-w-4xl w-full h-[80vh] p-0">
          <DialogHeader className="p-6 pb-0">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl font-bold text-slate-900">
                  ACAD Platform Demo
                </DialogTitle>
                <DialogDescription className="text-slate-600 mt-2">
                  See how ACAD connects students with verified tutors for quality online education
                </DialogDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowVideoModal(false)}
                className="h-8 w-8"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogHeader>
          <div className="flex-1 p-6 pt-4">
            <div className="w-full h-full rounded-lg overflow-hidden shadow-lg bg-slate-100">
              <iframe
                src={getEmbedUrl("https://drive.google.com/file/d/147mqMEr0kE6jVLfF5-h2UTLQu7MWu2b3/view?usp=sharing")}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                title="ACAD Platform Demo Video"
                loading="lazy"
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* QR Code Modal */}
      <Dialog open={showQRModal} onOpenChange={setShowQRModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">
              ACAD Registration QR Code
            </DialogTitle>
            <DialogDescription className="text-center">
              Scan to register or share with students/parents
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center py-6 space-y-6">
            <img
              src={qrCodeUrl}
              alt="ACAD Registration QR Code"
              className="w-72 h-72 border-4 border-slate-200 rounded-xl shadow-lg"
            />
            <div className="text-center space-y-2">
              <p className="text-sm text-slate-600 font-mono break-all px-4">
                {registrationUrl}
              </p>
            </div>
            <div className="flex gap-3 w-full px-4">
              <Button
                onClick={handleDownloadQR}
                className="flex-1 bg-[#1565C0] hover:bg-[#0d47a1]"
              >
                <Download className="w-4 h-4 mr-2" />
                Download QR
              </Button>
              <Button
                onClick={handleShareQR}
                variant="outline"
                className="flex-1"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share Link
              </Button>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 w-full">
              <p className="text-xs text-blue-800 text-center">
                💡 <strong>Tip:</strong> Print this QR code and display it at your coaching center or share it on WhatsApp/social media!
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Book Notification Modal */}
      <Dialog open={showBookNotificationModal} onOpenChange={setShowBookNotificationModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center mb-2">
              📚 Revised Edition Update
            </DialogTitle>
            <DialogDescription className="text-center text-base leading-relaxed">
              This title is currently undergoing a revised edition update to support broader distribution across authorized platforms.
              <br /><br />
              Access to the digital and print editions will be restored shortly. Thank you for your understanding.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-4">
            <Button
              className="w-full bg-[#1565C0] hover:bg-[#0d47a1]"
              onClick={() => {
                setShowBookNotificationModal(false);
                alert('Thank you! We will notify you when the book is available.');
              }}
            >
              Notify Me When Available
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowBookNotificationModal(false)}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Become a Tutor Modal */}
      <Dialog open={showTutorModal} onOpenChange={setShowTutorModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">Become a Tutor</DialogTitle>
            <DialogDescription className="text-center">
              Choose your preferred mode of teaching to get started
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <button
              onClick={() => { setShowTutorModal(false); navigate(createPageUrl("BecomeHomeTutor") + "?mode=home"); }}
              className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50 transition-all text-left"
            >
              <div className="w-11 h-11 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
                <Home className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">Home Tuition</p>
                <p className="text-sm text-slate-500">Teach students at their home (in-person)</p>
              </div>
            </button>
            <button
              onClick={() => { setShowTutorModal(false); navigate(createPageUrl("BecomeHomeTutor") + "?mode=online"); }}
              className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-all text-left"
            >
              <div className="w-11 h-11 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">Online Classes</p>
                <p className="text-sm text-slate-500">Teach students remotely via live online classes</p>
              </div>
            </button>
            <button
              onClick={() => { setShowTutorModal(false); navigate(createPageUrl("BecomeHomeTutor") + "?mode=offline"); }}
              className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 transition-all text-left"
            >
              <div className="w-11 h-11 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0">
                <GraduationCap className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">Offline / In-person</p>
                <p className="text-sm text-slate-500">Teach at a coaching center or your own location</p>
              </div>
            </button>
          </div>
        </DialogContent>
      </Dialog>
      </div>
  );
}
