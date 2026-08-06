import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


import {
  GraduationCap,
  Home,
  Shield,
  Menu,
  X,
  LogOut,
  User as UserIcon,
  Users,
  BookOpen,
  FolderKanban,
  UserPlus,
  MapPin,
  ClipboardList,
  Calendar,
  Award,
  IndianRupee,
  Gift,
  CalendarDays,
  Clock,
  Coffee,
  FileText,
  Crown,
  ShieldCheck
} from "lucide-react";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (window._chatbaseLoaded) return;
    window._chatbaseLoaded = true;

    (function(){
      if (!window.chatbase || window.chatbase("getState") !== "initialized") {
        window.chatbase = (...args) => {
          if (!window.chatbase.q) window.chatbase.q = [];
          window.chatbase.q.push(args);
        };
        window.chatbase = new Proxy(window.chatbase, {
          get(target, prop) {
            if (prop === "q") return target.q;
            return (...args) => target(prop, ...args);
          }
        });
      }
      const s = document.createElement("script");
      s.src = "https://www.chatbase.co/embed.min.js";
      s.id = "aQvUmZnkx4GwYvF0V0Mjh";
      s.setAttribute("domain", "www.chatbase.co");
      document.body.appendChild(s);
    })();
  }, []);

  useEffect(() => {
    if (currentPageName === 'Welcome') {
      setUser(null);
      return;
    }

    const fetchUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch (error) {
        console.log("User not logged in");
        setUser(null);
      }
    };
    fetchUser();
  }, [currentPageName]);

  const handleLogout = async () => {
    await base44.auth.logout();
    window.location.href = createPageUrl('Welcome');
  };

  const getNavigationItems = () => {
    if (!user) {
      return [
        { title: "Online Books", url: createPageUrl("OnlineBooks"), icon: BookOpen },
        { title: "Find Teachers Near You", url: createPageUrl("FindTeachersNearYou"), icon: MapPin },
        { title: "Events", url: createPageUrl("Events"), icon: Calendar },
        { title: "Fee Structure", url: createPageUrl("FeeStructure"), icon: IndianRupee },
        { title: "Blog", url: createPageUrl("Blog"), icon: BookOpen },
        { title: "Academic Essentials", url: "https://acad-formulabox.netlify.app/", icon: BookOpen, external: true },
        { title: "Learn Abacus", url: "https://abacus.acadapp.in/", icon: BookOpen, external: true },
        { title: "NEET | JEE Support", url: createPageUrl("NeetJeeSupport"), icon: BookOpen },
        { title: "Hindi Sabha Exam", url: createPageUrl("HindiSabha"), icon: BookOpen },
        { title: "Hindi Sabha Practice", url: "https://acad-hindi.netlify.app/", icon: Award, external: true },
        { title: "Make Time Table", url: "https://tymr-two.vercel.app", icon: Clock, external: true },
        { title: "Foundation", url: "https://foundation.acadapp.in", icon: Award, external: true },
        { title: "Smart Tutor", url: "https://smart-tutor.acadapp.in", icon: GraduationCap, external: true },
        { title: "After School", url: "https://after-school.acadapp.in/", icon: Home, external: true },
        { title: "School Projects", url: "https://acad-school.acadapp.in", icon: BookOpen, external: true },
        { title: "Electronics Lab", url: "https://electronics.acadapp.in", icon: BookOpen, external: true },
        { title: "LEARNING WEBSITES", isHeader: true },
        { title: "PhET Simulations", url: "https://phet.colorado.edu/", icon: BookOpen, external: true },
        { title: "Learning Resource 1", url: "https://share.google/PuX3WnxzJoYGQQuRQ", icon: BookOpen, external: true },
        { title: "Learning Resource 2", url: "https://share.google/ZSKrUcW2GF8okeBwS", icon: BookOpen, external: true },
        { title: "Support Us ☕", url: createPageUrl("SupportUs"), icon: Coffee }
      ];
    }

    const ADMIN_EMAILS = ['krishiv.advt@gmail.com'];
    const isAdmin = ADMIN_EMAILS.includes(user.email);

    if (isAdmin) {
      return [
        { title: "Admin Dashboard", url: createPageUrl("AdminDashboard"), icon: Shield },
        { title: "Inquiries", url: createPageUrl("AdminInquiryManagement"), icon: ClipboardList },
        { title: "Enrollments", url: createPageUrl("AdminEnrollmentManagement"), icon: Users },
        { title: "Tutor Management", url: createPageUrl("AdminTutorManagement"), icon: UserPlus },
        { title: "Home Tutor Approvals", url: createPageUrl("AdminHomeTutorApproval"), icon: ShieldCheck },
        { title: "Online Books", url: createPageUrl("OnlineBooks"), icon: BookOpen },
        { title: "Book Approvals", url: createPageUrl("AdminBookApprovals"), icon: ShieldCheck },
        { title: "Course Management", url: createPageUrl("AdminCourseManagement"), icon: FolderKanban },
        { title: "AI Paper Generator", url: createPageUrl("AIQuestionPaperGenerator"), icon: FileText },
        { title: "Event Management", url: createPageUrl("AdminEventManagement"), icon: Calendar },
        { title: "Attendance", url: createPageUrl("MonthlyAttendance"), icon: CalendarDays },
	{ title: "Live Class Schedule", url: "https://classroom.acadapp.in", icon: CalendarDays, external: true },
        { title: "Events", url: createPageUrl("Events"), icon: Award },
        { title: "Fee Structure", url: createPageUrl("FeeStructure"), icon: IndianRupee },
        { title: "Blog", url: createPageUrl("Blog"), icon: BookOpen },
        { title: "Academic Essentials", url: "https://acad-formulabox.netlify.app/", icon: BookOpen, external: true },
        { title: "Learn Abacus", url: "https://abacus.acadapp.in/", icon: BookOpen, external: true },
        { title: "NEET | JEE Support", url: createPageUrl("NeetJeeSupport"), icon: BookOpen },
        { title: "Hindi Sabha Exam", url: createPageUrl("HindiSabha"), icon: BookOpen },
        { title: "Hindi Sabha Practice", url: "https://acad-hindi.netlify.app/", icon: Award, external: true },
        { title: "Profile", url: createPageUrl("Profile"), icon: UserIcon },
        { title: "Make Time Table", url: "https://tymr-two.vercel.app", icon: Clock, external: true },
        { title: "Foundation", url: "https://foundation.acadapp.in", icon: Award, external: true },
        { title: "Smart Tutor", url: "https://smart-tutor.acadapp.in", icon: GraduationCap, external: true },
        { title: "After School", url: "https://after-school.acadapp.in/", icon: Home, external: true },
        { title: "School Projects", url: "https://acad-school.acadapp.in", icon: BookOpen, external: true },
        { title: "Electronics Lab", url: "https://electronics.acadapp.in", icon: BookOpen, external: true },
        { title: "LEARNING WEBSITES", isHeader: true },
        { title: "PhET Simulations", url: "https://phet.colorado.edu/", icon: BookOpen, external: true },
        { title: "Learning Resource 1", url: "https://share.google/PuX3WnxzJoYGQQuRQ", icon: BookOpen, external: true },
        { title: "Learning Resource 2", url: "https://share.google/ZSKrUcW2GF8okeBwS", icon: BookOpen, external: true },
        { title: "Profile", url: createPageUrl("Profile"), icon: UserIcon },
        { title: "Support Us ☕", url: createPageUrl("SupportUs"), icon: Coffee }
        ];
        }

        switch (user.user_type) {
      case 'student':
        return [
          { title: "Dashboard", url: createPageUrl("StudentDashboard"), icon: Home },
          { title: "Online Books", url: createPageUrl("OnlineBooks"), icon: BookOpen },
          { title: "Find Teachers Near You", url: createPageUrl("FindTeachersNearYou"), icon: MapPin },
          { title: "My Study Materials", url: createPageUrl("MyStudyMaterials"), icon: BookOpen },
          { title: "My Attendance", url: createPageUrl("MonthlyAttendance"), icon: CalendarDays },
	  { title: "Live Class Schedule", url: "https://classroom.acadapp.in", icon: CalendarDays, external: true },
          { title: "Events", url: createPageUrl("Events"), icon: Calendar },
          { title: "Fee Structure", url: createPageUrl("FeeStructure"), icon: IndianRupee },
          { title: "Festive Offers", url: createPageUrl("FestiveSeasonOffer"), icon: Gift },
          { title: "Blog", url: createPageUrl("Blog"), icon: BookOpen },
          { title: "Academic Essentials", url: "https://acad-formulabox.netlify.app/", icon: BookOpen, external: true },
          { title: "Learn Abacus", url: "https://abacus.acadapp.in/", icon: BookOpen, external: true },
          { title: "NEET | JEE Support", url: createPageUrl("NeetJeeSupport"), icon: BookOpen },
          { title: "Hindi Sabha Exam", url: createPageUrl("HindiSabha"), icon: BookOpen },
          { title: "Hindi Sabha Practice", url: "https://acad-hindi.netlify.app/", icon: Award, external: true },
          { title: "Make Time Table", url: "https://tymr-two.vercel.app", icon: Clock, external: true },
          { title: "Foundation", url: "https://foundation.acadapp.in", icon: Award, external: true },
          { title: "Smart Tutor", url: "https://smart-tutor.acadapp.in", icon: GraduationCap, external: true },
          { title: "After School", url: "https://after-school.acadapp.in/", icon: Home, external: true },
          { title: "EEIC", url: "https://eeic.acadapp.in/", icon: BookOpen, external: true },
          { title: "School Projects", url: "https://acad-school.acadapp.in", icon: BookOpen, external: true },
          { title: "Electronics Lab", url: "https://electronics.acadapp.in", icon: BookOpen, external: true },
          { title: "LEARNING WEBSITES", isHeader: true },
          { title: "PhET Simulations", url: "https://phet.colorado.edu/", icon: BookOpen, external: true },
          { title: "Learning Resource 1", url: "https://share.google/PuX3WnxzJoYGQQuRQ", icon: BookOpen, external: true },
          { title: "Learning Resource 2", url: "https://share.google/ZSKrUcW2GF8okeBwS", icon: BookOpen, external: true },
          { title: "Profile", url: createPageUrl("Profile"), icon: UserIcon },
          { title: "Support Us ☕", url: createPageUrl("SupportUs"), icon: Coffee }
        ];
      case 'parent':
        return [
          { title: "Dashboard", url: createPageUrl("ParentDashboard"), icon: Home },
          { title: "Online Books", url: createPageUrl("OnlineBooks"), icon: BookOpen },
          { title: "Find Teachers Near You", url: createPageUrl("FindTeachersNearYou"), icon: MapPin },
          { title: "Attendance", url: createPageUrl("MonthlyAttendance"), icon: CalendarDays },
          { title: "Events", url: createPageUrl("Events"), icon: Calendar },
          { title: "Fee Structure", url: createPageUrl("FeeStructure"), icon: IndianRupee },
          { title: "My Tuition Requests", url: createPageUrl("MyTuitionRequests"), icon: ClipboardList },
          { title: "Festive Offers", url: createPageUrl("FestiveSeasonOffer"), icon: Gift },
          { title: "Blog", url: createPageUrl("Blog"), icon: BookOpen },
          { title: "Academic Essentials", url: "https://acad-formulabox.netlify.app/", icon: BookOpen, external: true },
        { title: "Learn Abacus", url: "https://abacus.acadapp.in/", icon: BookOpen, external: true },
          { title: "NEET | JEE Support", url: createPageUrl("NeetJeeSupport"), icon: BookOpen },
          { title: "Hindi Sabha Exam", url: createPageUrl("HindiSabha"), icon: BookOpen },
          { title: "Hindi Sabha Practice", url: "https://acad-hindi.netlify.app/", icon: Award, external: true },
          { title: "Make Time Table", url: "https://tymr-two.vercel.app", icon: Clock, external: true },
          { title: "Foundation", url: "https://foundation.acadapp.in", icon: Award, external: true },
          { title: "Smart Tutor", url: "https://smart-tutor.acadapp.in", icon: GraduationCap, external: true },
          { title: "After School", url: "https://after-school.acadapp.in/", icon: Home, external: true },
          { title: "EEIC", url: "https://eeic.acadapp.in/", icon: BookOpen, external: true },
          { title: "School Projects", url: "https://acad-school.acadapp.in", icon: BookOpen, external: true },
          { title: "Electronics Lab", url: "https://electronics.acadapp.in", icon: BookOpen, external: true },
          { title: "LEARNING WEBSITES", isHeader: true },
          { title: "PhET Simulations", url: "https://phet.colorado.edu/", icon: BookOpen, external: true },
          { title: "Learning Resource 1", url: "https://share.google/PuX3WnxzJoYGQQuRQ", icon: BookOpen, external: true },
          { title: "Learning Resource 2", url: "https://share.google/ZSKrUcW2GF8okeBwS", icon: BookOpen, external: true },
          { title: "Profile", url: createPageUrl("Profile"), icon: UserIcon },
          { title: "Support Us ☕", url: createPageUrl("SupportUs"), icon: Coffee }
        ];
      case 'tutor':
        return [
          { title: "Dashboard", url: createPageUrl("TutorDashboard"), icon: Home },
          { title: "Online Books", url: createPageUrl("OnlineBooks"), icon: BookOpen },
          { title: "Become a Home Tutor", url: createPageUrl("BecomeHomeTutor"), icon: GraduationCap },
          { title: "Subscription Plans", url: createPageUrl("TutorSubscription"), icon: Crown },
          { title: "Attendance", url: createPageUrl("MonthlyAttendance"), icon: CalendarDays },
	  { title: "Live Class Schedule", url: "https://classroom.acadapp.in", icon: CalendarDays, external: true },
          { title: "Events", url: createPageUrl("Events"), icon: Calendar },
          { title: "Fee Structure", url: createPageUrl("FeeStructure"), icon: IndianRupee },
          { title: "Find Home Tuitions", url: createPageUrl("FindHomeTuitions"), icon: MapPin },
          { title: "My Courses", url: createPageUrl("MyCourses"), icon: BookOpen },
          { title: "AI Paper Generator", url: createPageUrl("AIQuestionPaperGenerator"), icon: FileText },
          { title: "Blog", url: createPageUrl("Blog"), icon: BookOpen },
          { title: "Academic Essentials", url: "https://acad-formulabox.netlify.app/", icon: BookOpen, external: true },
        { title: "Learn Abacus", url: "https://abacus.acadapp.in/", icon: BookOpen, external: true },
          { title: "NEET | JEE Support", url: createPageUrl("NeetJeeSupport"), icon: BookOpen },
          { title: "Hindi Sabha Exam", url: createPageUrl("HindiSabha"), icon: BookOpen },
          { title: "Hindi Sabha Practice", url: "https://acad-hindi.netlify.app/", icon: Award, external: true },
          { title: "Make Time Table", url: "https://tymr-two.vercel.app", icon: Clock, external: true },
          { title: "Foundation", url: "https://foundation.acadapp.in", icon: Award, external: true },
          { title: "Smart Tutor", url: "https://smart-tutor.acadapp.in", icon: GraduationCap, external: true },
          { title: "After School", url: "https://after-school.acadapp.in/", icon: Home, external: true },
          { title: "EEIC", url: "https://eeic.acadapp.in/", icon: BookOpen, external: true },
          { title: "School Projects", url: "https://acad-school.acadapp.in", icon: BookOpen, external: true },
          { title: "Electronics Lab", url: "https://electronics.acadapp.in", icon: BookOpen, external: true },
          { title: "LEARNING WEBSITES", isHeader: true },
          { title: "PhET Simulations", url: "https://phet.colorado.edu/", icon: BookOpen, external: true },
          { title: "Learning Resource 1", url: "https://share.google/PuX3WnxzJoYGQQuRQ", icon: BookOpen, external: true },
          { title: "Learning Resource 2", url: "https://share.google/ZSKrUcW2GF8okeBwS", icon: BookOpen, external: true },
          { title: "Profile", url: createPageUrl("Profile"), icon: UserIcon },
          { title: "Support Us ☕", url: createPageUrl("SupportUs"), icon: Coffee }
        ];
      default:
        return [
          { title: "Events", url: createPageUrl("Events"), icon: Calendar },
          { title: "Fee Structure", url: createPageUrl("FeeStructure"), icon: IndianRupee },
          { title: "Blog", url: createPageUrl("Blog"), icon: BookOpen },
          { title: "Academic Essentials", url: "https://acad-formulabox.netlify.app/", icon: BookOpen, external: true },
          { title: "Learn Abacus", url: "https://abacus.acadapp.in/", icon: BookOpen, external: true },
          { title: "NEET | JEE Support", url: createPageUrl("NeetJeeSupport"), icon: BookOpen },
          { title: "Hindi Sabha Exam", url: createPageUrl("HindiSabha"), icon: BookOpen },
          { title: "Hindi Sabha Practice", url: "https://acad-hindi.netlify.app/", icon: Award, external: true },
          { title: "Make Time Table", url: "https://tymr-two.vercel.app", icon: Clock, external: true },
          { title: "Foundation", url: "https://foundation.acadapp.in", icon: Award, external: true },
          { title: "Smart Tutor", url: "https://smart-tutor.acadapp.in", icon: GraduationCap, external: true },
          { title: "After School", url: "https://after-school.acadapp.in/", icon: Home, external: true },
          { title: "EEIC", url: "https://eeic.acadapp.in/", icon: BookOpen, external: true },
          { title: "School Projects", url: "https://acad-school.acadapp.in", icon: BookOpen, external: true },
          { title: "Electronics Lab", url: "https://electronics.acadapp.in", icon: BookOpen, external: true },
          { title: "LEARNING WEBSITES", isHeader: true },
          { title: "PhET Simulations", url: "https://phet.colorado.edu/", icon: BookOpen, external: true },
          { title: "Learning Resource 1", url: "https://share.google/PuX3WnxzJoYGQQuRQ", icon: BookOpen, external: true },
          { title: "Learning Resource 2", url: "https://share.google/ZSKrUcW2GF8okeBwS", icon: BookOpen, external: true },
          { title: "Profile", url: createPageUrl("Profile"), icon: UserIcon },
          { title: "Support Us ☕", url: createPageUrl("SupportUs"), icon: Coffee }
          ];
          }
  };

  const navigationItems = getNavigationItems();

  return (
    <div className="min-h-screen bg-slate-100">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari&display=swap');
      `}</style>

      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden lg:block w-64 bg-white border-r border-slate-200 p-4">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-[#1565C0] rounded-xl flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">ACAD</h1>
        </div>
        <nav className="flex flex-col gap-2">
          {navigationItems.map((item) => (
            item.isHeader ? (
              <div key={item.title} className="pt-3 pb-1 px-3">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{item.title}</p>
              </div>
            ) : item.external ? (
              <a
                key={item.title}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-100 text-slate-700"
              >
                <item.icon className="w-5 h-5" />
                {item.title}
              </a>
            ) : (
              <Link
                key={item.title}
                to={item.url}
                className={`flex items-center gap-3 p-3 rounded-lg hover:bg-slate-100 ${location.pathname === item.url ? 'bg-slate-100 text-blue-600' : 'text-slate-700'}`}
              >
                <item.icon className="w-5 h-5" />
                {item.title}
              </Link>
            )
          ))}
        </nav>
        </aside>

        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-between h-16">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  >
                    {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                  </Button>
                  <h2 className="text-lg font-semibold text-slate-800">{currentPageName}</h2>
                </div>

                {user && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Avatar className="w-9 h-9 cursor-pointer">
                        {user.profile_image ? (
                          <AvatarImage src={user.profile_image} alt={`${user.full_name}'s avatar`} />
                        ) : (
                          <AvatarFallback className="bg-blue-500 text-white">
                            {user.full_name?.charAt(0) || user.email?.charAt(0)}
                          </AvatarFallback>
                        )}
                      </Avatar>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-white">
                      <DropdownMenuItem disabled className="bg-white">
                        <p className="text-sm font-medium">{user.full_name || user.email}</p>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild className="bg-white">
                        <Link to={createPageUrl("Profile")}>Profile</Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout} className="bg-white text-red-600">
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          </header>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <div className="lg:hidden bg-white border-b border-slate-200">
              <nav className="flex flex-col gap-1 p-4">
                {navigationItems.map((item) => (
                  item.isHeader ? (
                    <div key={item.title} className="pt-3 pb-1 px-3">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{item.title}</p>
                    </div>
                  ) : item.external ? (
                    <a
                      key={item.title}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-100 text-slate-700"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <item.icon className="w-5 h-5" />
                      {item.title}
                    </a>
                  ) : (
                    <Link
                      key={item.title}
                      to={item.url}
                      className={`flex items-center gap-3 p-3 rounded-lg hover:bg-slate-100 ${location.pathname === item.url ? 'bg-slate-100 text-blue-600' : 'text-slate-700'}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <item.icon className="w-5 h-5" />
                      {item.title}
                    </Link>
                  )
                ))}
                
                {/* Logout Button for Mobile */}
                {user && (
                  <>
                    <div className="border-t border-slate-200 my-2"></div>
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        handleLogout();
                      }}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-red-50 text-red-600 font-medium transition-colors"
                    >
                      <LogOut className="w-5 h-5" />
                      Sign Out
                    </button>
                  </>
                )}
              </nav>
            </div>
          )}

          {/* Main Content */}
          <main className="bg-slate-100 p-6 flex-1">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}


