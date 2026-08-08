import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
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
  ShieldCheck,
  Video,
  MonitorPlay,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

/*
 * ACAD Layout
 *
 * IMPORTANT:
 * - No Base44
 * - No Base44 SDK
 * - No Base44 authentication
 *
 * Authentication is intentionally kept independent from this layout.
 *
 * The parent application can pass:
 *
 * <Layout
 *   currentPageName="StudentDashboard"
 *   user={currentUser}
 *   onLogout={handleLogout}
 * >
 *   ...
 * </Layout>
 *
 * Expected user structure:
 *
 * {
 *   full_name: "Student Name",
 *   email: "student@example.com",
 *   user_type: "student",
 *   profile_image: "/images/profile.jpg"
 * }
 */

export default function Layout({
  children,
  currentPageName,
  user = null,
  onLogout = null,
}) {
  const location = useLocation();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const [expandedSections, setExpandedSections] = useState({
  LEARNING: false,
  MANAGEMENT: false,
  TEACHING: false,
  CONTENT: false,
  INFO: false,
  "ACAD TOOLS": false,
  "EXAM PREP": false,
  "LEARNING WEBSITES": false,
});

  /*
   * Chatbase
   */
  useEffect(() => {
    if (window._chatbaseLoaded) return;

    window._chatbaseLoaded = true;

    (function () {
      if (
        !window.chatbase ||
        window.chatbase("getState") !== "initialized"
      ) {
        window.chatbase = (...args) => {
          if (!window.chatbase.q) {
            window.chatbase.q = [];
          }

          window.chatbase.q.push(args);
        };

        window.chatbase = new Proxy(window.chatbase, {
          get(target, prop) {
            if (prop === "q") return target.q;
            return (...args) => target(prop, ...args);
          },
        });
      }

      const script = document.createElement("script");
      script.src = "https://www.chatbase.co/embed.min.js";
      script.id = "aQvUmZnkx4GwYvF0V0Mjh";
      script.setAttribute("domain", "www.chatbase.co");

      document.body.appendChild(script);
    })();
  }, []);

  /*
   * Close mobile navigation when route changes.
   */
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  /*
   * Navigation configuration
   */
  const ACAD_CLASSROOM = {
    title: "ACAD Classroom",
    url: "https://classroom.acadapp.in/",
    icon: MonitorPlay,
    external: true,
    standalone: true,
  };

  const getNavigationItems = () => {
    /*
     * PUBLIC / LOGGED-OUT USER
     */
    if (!user) {
      return [
        { title: "LEARNING", isHeader: true },

        {
          title: "Online Books",
          url: createPageUrl("OnlineBooks"),
          icon: BookOpen,
        },
        {
          title: "Find Teachers Near You",
          url: createPageUrl("FindTeachersNearYou"),
          icon: MapPin,
        },
        {
          title: "Events",
          url: createPageUrl("Events"),
          icon: Calendar,
        },
        {
          title: "Fee Structure",
          url: createPageUrl("FeeStructure"),
          icon: IndianRupee,
        },
        {
          title: "Blog",
          url: createPageUrl("Blog"),
          icon: BookOpen,
        },

        ACAD_CLASSROOM,

        { title: "ACAD TOOLS", isHeader: true },

        {
          title: "Academic Essentials",
          url: "https://acad-formulabox.netlify.app/",
          icon: BookOpen,
          external: true,
        },
        {
          title: "Make Time Table",
          url: "https://tymr-two.vercel.app",
          icon: Clock,
          external: true,
        },
        {
          title: "Foundation",
          url: "https://foundation.acadapp.in",
          icon: Award,
          external: true,
        },
        {
          title: "Smart Tutor",
          url: "https://smart-tutor.acadapp.in",
          icon: GraduationCap,
          external: true,
        },
        {
          title: "After School",
          url: "https://after-school.acadapp.in/",
          icon: Home,
          external: true,
        },
        {
          title: "School Projects",
          url: "https://acad-school.acadapp.in",
          icon: BookOpen,
          external: true,
        },
        {
          title: "Electronics Lab",
          url: "https://electronics.acadapp.in",
          icon: BookOpen,
          external: true,
        },

        { title: "EXAM PREP", isHeader: true },

        {
          title: "NEET | JEE Support",
          url: createPageUrl("NeetJeeSupport"),
          icon: BookOpen,
        },
        {
          title: "Hindi Sabha Exam",
          url: createPageUrl("HindiSabha"),
          icon: BookOpen,
        },
        {
          title: "Hindi Sabha Practice",
          url: "https://acad-hindi.netlify.app/",
          icon: Award,
          external: true,
        },

        { title: "LEARNING WEBSITES", isHeader: true },

        {
          title: "PhET Simulations",
          url: "https://phet.colorado.edu/",
          icon: BookOpen,
          external: true,
        },
        {
          title: "Learning Resource 1",
          url: "https://share.google/PuX3WnxzJoYGQQuRQ",
          icon: BookOpen,
          external: true,
        },
        {
          title: "Learning Resource 2",
          url: "https://share.google/ZSKrUcW2GF8okeBwS",
          icon: BookOpen,
          external: true,
        },

        {
          title: "Support Us ☕",
          url: createPageUrl("SupportUs"),
          icon: Coffee,
          standalone: true,
        },
      ];
    }

    /*
     * ADMIN
     */
    const ADMIN_EMAILS = ["krishiv.advt@gmail.com"];
    const isAdmin = ADMIN_EMAILS.includes(
      String(user.email || "").toLowerCase()
    );

    if (isAdmin) {
      return [
        { title: "MANAGEMENT", isHeader: true },

        {
          title: "Admin Dashboard",
          url: createPageUrl("AdminDashboard"),
          icon: Shield,
        },
        {
          title: "Inquiries",
          url: createPageUrl("AdminInquiryManagement"),
          icon: ClipboardList,
        },
        {
          title: "Enrollments",
          url: createPageUrl("AdminEnrollmentManagement"),
          icon: Users,
        },
        {
          title: "Tutor Management",
          url: createPageUrl("AdminTutorManagement"),
          icon: UserPlus,
        },
        {
          title: "Home Tutor Approvals",
          url: createPageUrl("AdminHomeTutorApproval"),
          icon: ShieldCheck,
        },
        {
          title: "Book Approvals",
          url: createPageUrl("AdminBookApprovals"),
          icon: ShieldCheck,
        },
        {
          title: "Course Management",
          url: createPageUrl("AdminCourseManagement"),
          icon: FolderKanban,
        },
        {
          title: "Live Classroom",
          url: createPageUrl("AdminLiveClassroom"),
          icon: Video,
        },
        {
          title: "AI Paper Generator",
          url: createPageUrl("AIQuestionPaperGenerator"),
          icon: FileText,
        },
        {
          title: "Event Management",
          url: createPageUrl("AdminEventManagement"),
          icon: Calendar,
        },
        {
          title: "Attendance",
          url: createPageUrl("MonthlyAttendance"),
          icon: CalendarDays,
        },

        { title: "CONTENT", isHeader: true },

        {
          title: "Online Books",
          url: createPageUrl("OnlineBooks"),
          icon: BookOpen,
        },
        {
          title: "Events",
          url: createPageUrl("Events"),
          icon: Award,
        },
        {
          title: "Fee Structure",
          url: createPageUrl("FeeStructure"),
          icon: IndianRupee,
        },
        {
          title: "Blog",
          url: createPageUrl("Blog"),
          icon: BookOpen,
        },

        ACAD_CLASSROOM,

        ...getToolsNavigation(),

        {
          title: "Profile",
          url: createPageUrl("Profile"),
          icon: UserIcon,
          standalone: true,
        },
        {
          title: "Support Us ☕",
          url: createPageUrl("SupportUs"),
          icon: Coffee,
          standalone: true,
        },
      ];
    }

    /*
     * ROLE-BASED NAVIGATION
     */
    switch (String(user.user_type || "").toLowerCase()) {
      case "student":
        return [
          { title: "LEARNING", isHeader: true },

          {
            title: "Dashboard",
            url: createPageUrl("StudentDashboard"),
            icon: Home,
          },
          {
            title: "Live Classroom",
            url: createPageUrl("LiveClassroom"),
            icon: Video,
          },
          {
            title: "Online Books",
            url: createPageUrl("OnlineBooks"),
            icon: BookOpen,
          },
          {
            title: "Find Teachers Near You",
            url: createPageUrl("FindTeachersNearYou"),
            icon: MapPin,
          },
          {
            title: "My Study Materials",
            url: createPageUrl("MyStudyMaterials"),
            icon: BookOpen,
          },
          {
            title: "My Attendance",
            url: createPageUrl("MonthlyAttendance"),
            icon: CalendarDays,
          },

          ACAD_CLASSROOM,

          { title: "INFO", isHeader: true },

          {
            title: "Events",
            url: createPageUrl("Events"),
            icon: Calendar,
          },
          {
            title: "Fee Structure",
            url: createPageUrl("FeeStructure"),
            icon: IndianRupee,
          },
          {
            title: "Festive Offers",
            url: createPageUrl("FestiveSeasonOffer"),
            icon: Gift,
          },
          {
            title: "Blog",
            url: createPageUrl("Blog"),
            icon: BookOpen,
          },

          ...getToolsNavigation(),

          ...getExamNavigation(),

          ...getLearningWebsitesNavigation(),

          {
            title: "Profile",
            url: createPageUrl("Profile"),
            icon: UserIcon,
            standalone: true,
          },
          {
            title: "Support Us ☕",
            url: createPageUrl("SupportUs"),
            icon: Coffee,
            standalone: true,
          },
        ];

      case "parent":
        return [
          { title: "LEARNING", isHeader: true },

          {
            title: "Dashboard",
            url: createPageUrl("ParentDashboard"),
            icon: Home,
          },
          {
            title: "Online Books",
            url: createPageUrl("OnlineBooks"),
            icon: BookOpen,
          },
          {
            title: "Find Teachers Near You",
            url: createPageUrl("FindTeachersNearYou"),
            icon: MapPin,
          },
          {
            title: "Attendance",
            url: createPageUrl("MonthlyAttendance"),
            icon: CalendarDays,
          },
          {
            title: "My Tuition Requests",
            url: createPageUrl("MyTuitionRequests"),
            icon: ClipboardList,
          },

          ACAD_CLASSROOM,

          { title: "INFO", isHeader: true },

          {
            title: "Events",
            url: createPageUrl("Events"),
            icon: Calendar,
          },
          {
            title: "Fee Structure",
            url: createPageUrl("FeeStructure"),
            icon: IndianRupee,
          },
          {
            title: "Festive Offers",
            url: createPageUrl("FestiveSeasonOffer"),
            icon: Gift,
          },
          {
            title: "Blog",
            url: createPageUrl("Blog"),
            icon: BookOpen,
          },

          ...getToolsNavigation(),

          ...getExamNavigation(),

          ...getLearningWebsitesNavigation(),

          {
            title: "Profile",
            url: createPageUrl("Profile"),
            icon: UserIcon,
            standalone: true,
          },
          {
            title: "Support Us ☕",
            url: createPageUrl("SupportUs"),
            icon: Coffee,
            standalone: true,
          },
        ];

      case "tutor":
        return [
          { title: "TEACHING", isHeader: true },

          {
            title: "Dashboard",
            url: createPageUrl("TutorDashboard"),
            icon: Home,
          },
          {
            title: "My Courses",
            url: createPageUrl("MyCourses"),
            icon: BookOpen,
          },
          {
            title: "Become a Home Tutor",
            url: createPageUrl("BecomeHomeTutor"),
            icon: GraduationCap,
          },
          {
            title: "Subscription Plans",
            url: createPageUrl("TutorSubscription"),
            icon: Crown,
          },
          {
            title: "Find Home Tuitions",
            url: createPageUrl("FindHomeTuitions"),
            icon: MapPin,
          },
          {
            title: "Attendance",
            url: createPageUrl("MonthlyAttendance"),
            icon: CalendarDays,
          },
          {
            title: "AI Paper Generator",
            url: createPageUrl("AIQuestionPaperGenerator"),
            icon: FileText,
          },

          ACAD_CLASSROOM,

          { title: "INFO", isHeader: true },

          {
            title: "Online Books",
            url: createPageUrl("OnlineBooks"),
            icon: BookOpen,
          },
          {
            title: "Events",
            url: createPageUrl("Events"),
            icon: Calendar,
          },
          {
            title: "Fee Structure",
            url: createPageUrl("FeeStructure"),
            icon: IndianRupee,
          },
          {
            title: "Blog",
            url: createPageUrl("Blog"),
            icon: BookOpen,
          },

          ...getToolsNavigation(),

          ...getExamNavigation(),

          ...getLearningWebsitesNavigation(),

          {
            title: "Profile",
            url: createPageUrl("Profile"),
            icon: UserIcon,
            standalone: true,
          },
          {
            title: "Support Us ☕",
            url: createPageUrl("SupportUs"),
            icon: Coffee,
            standalone: true,
          },
        ];

      default:
        return [
          { title: "INFO", isHeader: true },

          {
            title: "Events",
            url: createPageUrl("Events"),
            icon: Calendar,
          },
          {
            title: "Fee Structure",
            url: createPageUrl("FeeStructure"),
            icon: IndianRupee,
          },
          {
            title: "Blog",
            url: createPageUrl("Blog"),
            icon: BookOpen,
          },

          ACAD_CLASSROOM,

          ...getToolsNavigation(),

          ...getExamNavigation(),

          ...getLearningWebsitesNavigation(),

          {
            title: "Profile",
            url: createPageUrl("Profile"),
            icon: UserIcon,
            standalone: true,
          },
          {
            title: "Support Us ☕",
            url: createPageUrl("SupportUs"),
            icon: Coffee,
            standalone: true,
          },
        ];
    }
  };

  /*
   * Reusable navigation groups
   */
  function getToolsNavigation() {
    return [
      { title: "ACAD TOOLS", isHeader: true },

      {
        title: "Academic Essentials",
        url: "https://acad-formulabox.netlify.app/",
        icon: BookOpen,
        external: true,
      },
      {
        title: "Make Time Table",
        url: "https://tymr-two.vercel.app",
        icon: Clock,
        external: true,
      },
      {
        title: "Foundation",
        url: "https://foundation.acadapp.in",
        icon: Award,
        external: true,
      },
      {
        title: "Smart Tutor",
        url: "https://smart-tutor.acadapp.in",
        icon: GraduationCap,
        external: true,
      },
      {
        title: "After School",
        url: "https://after-school.acadapp.in/",
        icon: Home,
        external: true,
      },
      {
        title: "EEIC",
        url: "https://eeic.acadapp.in/",
        icon: BookOpen,
        external: true,
      },
      {
        title: "School Projects",
        url: "https://acad-school.acadapp.in",
        icon: BookOpen,
        external: true,
      },
      {
        title: "Electronics Lab",
        url: "https://electronics.acadapp.in",
        icon: BookOpen,
        external: true,
      },
    ];
  }

  function getExamNavigation() {
    return [
      { title: "EXAM PREP", isHeader: true },

      {
        title: "NEET | JEE Support",
        url: createPageUrl("NeetJeeSupport"),
        icon: BookOpen,
      },
      {
        title: "Hindi Sabha Exam",
        url: createPageUrl("HindiSabha"),
        icon: BookOpen,
      },
      {
        title: "Hindi Sabha Practice",
        url: "https://acad-hindi.netlify.app/",
        icon: Award,
        external: true,
      },
    ];
  }

  function getLearningWebsitesNavigation() {
    return [
      { title: "LEARNING WEBSITES", isHeader: true },

      {
        title: "PhET Simulations",
        url: "https://phet.colorado.edu/",
        icon: BookOpen,
        external: true,
      },
      {
        title: "Learning Resource 1",
        url: "https://share.google/PuX3WnxzJoYGQQuRQ",
        icon: BookOpen,
        external: true,
      },
      {
        title: "Learning Resource 2",
        url: "https://share.google/ZSKrUcW2GF8okeBwS",
        icon: BookOpen,
        external: true,
      },
    ];
  }

  const navigationItems = getNavigationItems();

  /*
   * Toggle navigation section
   */
  const toggleSection = (title) => {
  setExpandedSections((previous) => {
    const isCurrentlyOpen = !!previous[title];

    const nextState = {};

    Object.keys(previous).forEach((section) => {
      nextState[section] = false;
    });

    nextState[title] = !isCurrentlyOpen;

    return nextState;
  });
};

  /*
   * Logout
   */
  const handleLogout = async () => {
    if (typeof onLogout === "function") {
      await onLogout();
      return;
    }

    /*
     * No authentication provider is assumed here.
     *
     * If your application has its own auth system, pass:
     *
     * onLogout={handleLogout}
     *
     * from the parent component.
     */
    console.warn(
      "ACAD Layout: onLogout was not supplied."
    );
  };

  /*
   * Render navigation
   */
  const renderNav = (items, onNavigate) => {
    const rendered = [];
    let currentSection = null;

    items.forEach((item) => {
      /*
       * Section heading
       */
      if (item.isHeader) {
        currentSection = item.title;

        const expanded = !!expandedSections[item.title];

        /*
         * In collapsed sidebar mode, show only the section icon marker.
         */
        if (isSidebarCollapsed) {
          rendered.push(
            <div
              key={`collapsed-${item.title}`}
              className="my-2 border-t border-slate-100"
              title={item.title}
            />
          );

          return;
        }

        rendered.push(
          <button
            type="button"
            key={`header-${item.title}`}
            onClick={() => toggleSection(item.title)}
            className="w-full flex items-center justify-between pt-4 pb-2 px-3 text-left hover:bg-slate-50 rounded-md transition-colors"
          >
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {item.title}
            </span>

            <ChevronDown
              className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                expanded ? "rotate-180" : ""
              }`}
            />
          </button>
        );

        return;
      }

      /*
       * Section visibility
       */
      const visible =
        item.standalone ||
        !currentSection ||
        !!expandedSections[currentSection];

      if (!visible) return;

      const isActive =
        location.pathname === item.url ||
        location.pathname === createPageUrl(item.url);

      const activeClass = isActive
        ? "bg-blue-50 text-blue-600"
        : "text-slate-700 hover:bg-slate-100";

      /*
       * Collapsed sidebar
       */
      if (isSidebarCollapsed) {
        const Icon = item.icon;

        if (item.external) {
          rendered.push(
            <a
              key={item.title}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onNavigate}
              title={item.title}
              className={`group relative flex items-center justify-center w-12 h-12 mx-auto rounded-xl transition-colors ${activeClass}`}
            >
              <Icon className="w-5 h-5" />

              <span className="pointer-events-none absolute left-14 z-50 hidden group-hover:block whitespace-nowrap rounded-lg bg-slate-900 px-3 py-2 text-xs text-white shadow-lg">
                {item.title}
              </span>
            </a>
          );
        } else {
          rendered.push(
            <Link
              key={item.title}
              to={item.url}
              onClick={onNavigate}
              title={item.title}
              className={`group relative flex items-center justify-center w-12 h-12 mx-auto rounded-xl transition-colors ${activeClass}`}
            >
              <Icon className="w-5 h-5" />

              <span className="pointer-events-none absolute left-14 z-50 hidden group-hover:block whitespace-nowrap rounded-lg bg-slate-900 px-3 py-2 text-xs text-white shadow-lg">
                {item.title}
              </span>
            </Link>
          );
        }

        return;
      }

      /*
       * Expanded sidebar - external link
       */
      if (item.external) {
        const Icon = item.icon;

        rendered.push(
          <a
            key={item.title}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onNavigate}
            className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${activeClass}`}
          >
            <Icon className="w-5 h-5 shrink-0" />
            <span className="truncate">{item.title}</span>
          </a>
        );

        return;
      }

      /*
       * Expanded sidebar - internal link
       */
      const Icon = item.icon;

      rendered.push(
        <Link
          key={item.title}
          to={item.url}
          onClick={onNavigate}
          className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${activeClass}`}
        >
          <Icon className="w-5 h-5 shrink-0" />
          <span className="truncate">{item.title}</span>
        </Link>
      );
    });

    return rendered;
  };

  /*
   * User display
   */
  const userInitial =
    user?.full_name?.charAt(0)?.toUpperCase() ||
    user?.email?.charAt(0)?.toUpperCase() ||
    "A";

  /*
   * Render
   */
  return (
    <div className="min-h-screen bg-slate-100">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari&display=swap');

        html {
          scroll-behavior: smooth;
        }

        body {
          margin: 0;
        }

        * {
          box-sizing: border-box;
        }
      `}</style>

      <div className="flex min-h-screen">

        {/* =========================================================
            DESKTOP SIDEBAR
        ========================================================= */}
        <aside
          className={`
            hidden lg:flex
            flex-col
            shrink-0
            bg-white
            border-r border-slate-200
            transition-all duration-300
            ${isSidebarCollapsed ? "w-20" : "w-72"}
          `}
        >
          {/* Logo */}
          <div
            className={`
              flex items-center
              h-20
              border-b border-slate-100
              ${isSidebarCollapsed ? "justify-center" : "px-5 gap-3"}
            `}
          >
            <div className="w-11 h-11 bg-[#1565C0] rounded-xl flex items-center justify-center shrink-0 shadow-sm">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>

            {!isSidebarCollapsed && (
              <div className="min-w-0">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  ACAD
                </h1>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">
                  Learn. Practice. Succeed.
                </p>
              </div>
            )}
          </div>

          {/* Sidebar navigation */}
          <div className="flex-1 overflow-y-auto px-3 py-4">
            <nav className="flex flex-col gap-1">
              {renderNav(navigationItems)}
            </nav>
          </div>

          {/* Collapse button */}
          <div className="border-t border-slate-100 p-3">
            <button
              type="button"
              onClick={() =>
                setIsSidebarCollapsed((previous) => !previous)
              }
              className={`
                w-full flex items-center
                rounded-xl
                text-slate-500
                hover:bg-slate-100
                transition-colors
                ${isSidebarCollapsed
                  ? "justify-center p-3"
                  : "gap-3 px-3 py-3"
                }
              `}
              title={
                isSidebarCollapsed
                  ? "Expand sidebar"
                  : "Collapse sidebar"
              }
            >
              {isSidebarCollapsed ? (
                <ChevronRight className="w-5 h-5" />
              ) : (
                <>
                  <ChevronLeft className="w-5 h-5" />
                  <span className="text-sm font-medium">
                    Collapse Menu
                  </span>
                </>
              )}
            </button>
          </div>
        </aside>

        {/* =========================================================
            MAIN APPLICATION
        ========================================================= */}
        <div className="flex-1 min-w-0 flex flex-col">

          {/* =======================================================
              HEADER
          ======================================================= */}
          <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
            <div className="px-4 sm:px-6">
              <div className="flex items-center justify-between h-16">

                {/* Left */}
                <div className="flex items-center gap-3">

                  {/* Mobile menu */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden"
                    onClick={() =>
                      setIsMobileMenuOpen(
                        (previous) => !previous
                      )
                    }
                    aria-label="Toggle navigation"
                  >
                    {isMobileMenuOpen ? (
                      <X className="w-5 h-5" />
                    ) : (
                      <Menu className="w-5 h-5" />
                    )}
                  </Button>

                  {/* Mobile ACAD logo */}
                  <div className="lg:hidden w-9 h-9 bg-[#1565C0] rounded-lg flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-white" />
                  </div>

                  <div>
                    <h2 className="text-lg font-semibold text-slate-800">
                      {currentPageName || "ACAD"}
                    </h2>
                  </div>
                </div>

                {/* User */}
                {user && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      >
                        {user.profile_image ? (
                          <img
                            src={user.profile_image}
                            alt={`${user.full_name || "User"} avatar`}
                            className="w-9 h-9 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
                            {userInitial}
                          </div>
                        )}
                      </button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent
                      align="end"
                      className="bg-white w-56"
                    >
                      <DropdownMenuItem
                        disabled
                        className="bg-white"
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-slate-900">
                            {user.full_name || "ACAD User"}
                          </span>

                          {user.email && (
                            <span className="text-xs text-slate-500 truncate">
                              {user.email}
                            </span>
                          )}
                        </div>
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />

                      <DropdownMenuItem
                        asChild
                        className="bg-white"
                      >
                        <Link to={createPageUrl("Profile")}>
                          <UserIcon className="w-4 h-4 mr-2" />
                          Profile
                        </Link>
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />

                      <DropdownMenuItem
                        onClick={handleLogout}
                        className="bg-white text-red-600"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          </header>

          {/* =======================================================
              MOBILE NAVIGATION
          ======================================================= */}
          {isMobileMenuOpen && (
            <div className="lg:hidden bg-white border-b border-slate-200 shadow-sm">
              <nav className="p-4 flex flex-col gap-1 max-h-[calc(100vh-64px)] overflow-y-auto">
                {renderNav(
                  navigationItems,
                  () => setIsMobileMenuOpen(false)
                )}

                {user && (
                  <>
                    <div className="border-t border-slate-200 my-3" />

                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        handleLogout();
                      }}
                      className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-red-50 text-red-600 font-medium transition-colors"
                    >
                      <LogOut className="w-5 h-5" />
                      Sign Out
                    </button>
                  </>
                )}
              </nav>
            </div>
          )}

          {/* =======================================================
              MAIN CONTENT
          ======================================================= */}
          <main className="bg-slate-100 p-4 sm:p-6 flex-1 min-w-0">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
