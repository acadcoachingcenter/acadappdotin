import React, { useState, useEffect } from "react";
import { apiClient } from "@/api/apiClient";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";

import { Button } from "@/components/ui/button";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";

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
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Video,
  MonitorPlay,
  Sparkles,
} from "lucide-react";


export default function Layout({ children, currentPageName }) {

  const location = useLocation();

  const [user, setUser] = useState(null);

  const [isMobileMenuOpen, setIsMobileMenuOpen] =
    useState(false);

  const [isSidebarCollapsed, setIsSidebarCollapsed] =
    useState(false);

  /*
   * All sections start CLOSED.
   *
   * Only one section can be open at a time.
   */
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


  /* =========================================================
     CHATBASE
  ========================================================= */

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

        window.chatbase = new Proxy(
          window.chatbase,
          {
            get(target, prop) {

              if (prop === "q") {
                return target.q;
              }

              return (...args) =>
                target(prop, ...args);
            },
          }
        );
      }

      const script =
        document.createElement("script");

      script.src =
        "https://www.chatbase.co/embed.min.js";

      script.id =
        "aQvUmZnkx4GwYvF0V0Mjh";

      script.setAttribute(
        "domain",
        "www.chatbase.co"
      );

      document.body.appendChild(script);

    })();

  }, []);


  /* =========================================================
     GET CURRENT USER
  ========================================================= */

  useEffect(() => {

    if (currentPageName === "Welcome") {

      setUser(null);

      return;
    }

    const fetchUser = async () => {

      try {

        const userData =
          await apiClient.auth.me();

        setUser(userData);

      } catch (error) {

        console.log(
          "User not logged in"
        );

        setUser(null);
      }
    };

    fetchUser();

  }, [currentPageName]);


  /* =========================================================
     LOGOUT
  ========================================================= */

  const handleLogout = async () => {

    try {

      await apiClient.auth.logout();

    } catch (error) {

      console.error(
        "Logout failed:",
        error
      );

    } finally {

      window.location.href =
        createPageUrl("Welcome");
    }
  };


  /* =========================================================
     SECTION TOGGLE
  ========================================================= */

  const toggleSection = (sectionName) => {

    setExpandedSections((previous) => {

      const isCurrentlyOpen =
        !!previous[sectionName];

      const nextState = {};

      Object.keys(previous).forEach(
        (section) => {
          nextState[section] = false;
        }
      );

      nextState[sectionName] =
        !isCurrentlyOpen;

      return nextState;
    });
  };


  /* =========================================================
     COMMON ACAD TOOLS
  ========================================================= */

  const getToolsNavigation = () => [

    {
      title: "ACAD TOOLS",
      isHeader: true,
    },
{
  title: "ACAD Smart Classroom",
  url: "https://smart-tutor.acadapp.in/",
  icon: Sparkles,
  external: true,
},

{
  title: "ACAD Classroom",
  url: "https://classroom.acadapp.in/",
  icon: Video,
  external: true,
},

{
  title: "Revision",
  url: "https://revision.acadapp.in",
  icon: ClipboardList,
  external: true,
},
    
    {
      title: "Academic Essentials",
      url:
        "https://acad-formulabox.netlify.app/",
      icon: BookOpen,
      external: true,
    },

    {
      title: "Learn Abacus",
      url:
        "https://abacus.acadapp.in/",
      icon: BookOpen,
      external: true,
    },

    {
      title: "Make Time Table",
      url:
        "https://tymr-two.vercel.app",
      icon: Clock,
      external: true,
    },

    {
      title: "Foundation",
      url:
        "https://foundation.acadapp.in",
      icon: Award,
      external: true,
    },

    {
      title: "Smart Tutor",
      url:
        "https://smart-tutor.acadapp.in",
      icon: GraduationCap,
      external: true,
    },

    {
      title: "After School",
      url:
        "https://after-school.acadapp.in/",
      icon: Home,
      external: true,
    },

    {
      title: "EEIC",
      url:
        "https://eeic.acadapp.in/",
      icon: BookOpen,
      external: true,
    },

    {
      title: "School Projects",
      url:
        "https://acad-school.acadapp.in",
      icon: BookOpen,
      external: true,
    },

    {
      title: "Electronics Lab",
      url:
        "https://electronics.acadapp.in",
      icon: BookOpen,
      external: true,
    },

  ];


  /* =========================================================
     EXAM PREPARATION
  ========================================================= */

  const getExamNavigation = () => [

    {
      title: "EXAM PREP",
      isHeader: true,
    },

    {
      title: "NEET | JEE Support",
      url:
        createPageUrl("NeetJeeSupport"),
      icon: BookOpen,
    },

    {
      title: "Hindi Sabha Exam",
      url:
        createPageUrl("HindiSabha"),
      icon: BookOpen,
    },

    {
      title: "Hindi Sabha Practice",
      url:
        "https://acad-hindi.netlify.app/",
      icon: Award,
      external: true,
    },

  ];


  /* =========================================================
     LEARNING WEBSITES
  ========================================================= */

  const getLearningWebsitesNavigation =
    () => [

      {
        title: "LEARNING WEBSITES",
        isHeader: true,
      },

      {
        title: "PhET Simulations",
        url:
          "https://phet.colorado.edu/",
        icon: BookOpen,
        external: true,
      },

      {
        title: "Learning Resource 1",
        url:
          "https://share.google/PuX3WnxzJoYGQQuRQ",
        icon: BookOpen,
        external: true,
      },

      {
        title: "Learning Resource 2",
        url:
          "https://share.google/ZSKrUcW2GF8okeBwS",
        icon: BookOpen,
        external: true,
      },

    ];


  /* =========================================================
     NAVIGATION
  ========================================================= */

  const getNavigationItems = () => {

    /* ---------------------------------------------------------
       PUBLIC / NOT LOGGED IN
    --------------------------------------------------------- */

    if (!user) {

      return [

        {
          title: "Home",
          url: "/",
          icon: Home,
          standalone: true,
        },

        {
          title: "LEARNING",
          isHeader: true,
        },

        {
          title: "Online Books",
          url:
            createPageUrl("OnlineBooks"),
          icon: BookOpen,
        },

        {
          title: "Find Teachers Near You",
          url:
            createPageUrl(
              "FindTeachersNearYou"
            ),
          icon: MapPin,
        },

        {
          title: "Events",
          url:
            createPageUrl("Events"),
          icon: Calendar,
        },

        {
          title: "Fee Structure",
          url:
            createPageUrl(
              "FeeStructure"
            ),
          icon: IndianRupee,
        },

        {
          title: "Blog",
          url:
            createPageUrl("Blog"),
          icon: BookOpen,
        },

        ...getToolsNavigation(),

        ...getExamNavigation(),

        ...getLearningWebsitesNavigation(),

        {
          title: "Support Us ☕",
          url:
            createPageUrl("SupportUs"),
          icon: Coffee,
          standalone: true,
        },

      ];
    }


    /* ---------------------------------------------------------
       ADMIN
    --------------------------------------------------------- */

    const ADMIN_EMAILS = [
      "krishiv.advt@gmail.com",
    ];

    const userEmail =
      String(user.email || "")
        .toLowerCase();

    const isAdmin =
      ADMIN_EMAILS.includes(
        userEmail
      );


    if (isAdmin) {

      return [

        {
          title: "Home",
          url: "/",
          icon: Home,
          standalone: true,
        },

        {
          title: "MANAGEMENT",
          isHeader: true,
        },

        {
          title: "Admin Dashboard",
          url:
            createPageUrl(
              "AdminDashboard"
            ),
          icon: Shield,
        },

        {
          title: "Inquiries",
          url:
            createPageUrl(
              "AdminInquiryManagement"
            ),
          icon: ClipboardList,
        },

        {
          title: "Enrollments",
          url:
            createPageUrl(
              "AdminEnrollmentManagement"
            ),
          icon: Users,
        },

        {
          title: "Tutor Management",
          url:
            createPageUrl(
              "AdminTutorManagement"
            ),
          icon: UserPlus,
        },

        {
          title: "Home Tutor Approvals",
          url:
            createPageUrl(
              "AdminHomeTutorApproval"
            ),
          icon: ShieldCheck,
        },

        {
          title: "Book Approvals",
          url:
            createPageUrl(
              "AdminBookApprovals"
            ),
          icon: ShieldCheck,
        },

        {
          title: "Course Management",
          url:
            createPageUrl(
              "AdminCourseManagement"
            ),
          icon: FolderKanban,
        },

        {
          title: "Classroom Links",
          url:
            createPageUrl(
              "AdminClassroomLinks"
            ),
          icon: Video,
        },

        {
          title: "Online Classroom",
          url:
            createPageUrl(
              "OnlineClassroom"
            ),
          icon: Video,
        },

        {
          title: "AI Paper Generator",
          url:
            createPageUrl(
              "AIQuestionPaperGenerator"
            ),
          icon: FileText,
        },

        {
          title: "Event Management",
          url:
            createPageUrl(
              "AdminEventManagement"
            ),
          icon: Calendar,
        },

        {
          title: "Attendance",
          url:
            createPageUrl(
              "MonthlyAttendance"
            ),
          icon: CalendarDays,
        },

        {
          title: "CONTENT",
          isHeader: true,
        },

        {
          title: "Online Books",
          url:
            createPageUrl("OnlineBooks"),
          icon: BookOpen,
        },

        {
          title: "Events",
          url:
            createPageUrl("Events"),
          icon: Award,
        },

        {
          title: "Fee Structure",
          url:
            createPageUrl(
              "FeeStructure"
            ),
          icon: IndianRupee,
        },

        {
          title: "Blog",
          url:
            createPageUrl("Blog"),
          icon: BookOpen,
        },

        ...getToolsNavigation(),

        ...getExamNavigation(),

        ...getLearningWebsitesNavigation(),

        {
          title: "Profile",
          url:
            createPageUrl("Profile"),
          icon: UserIcon,
          standalone: true,
        },

        {
          title: "Support Us ☕",
          url:
            createPageUrl("SupportUs"),
          icon: Coffee,
          standalone: true,
        },

      ];
    }


    /* ---------------------------------------------------------
       STUDENT
    --------------------------------------------------------- */

    if (
      String(user.user_type)
        .toLowerCase() === "student"
    ) {

      return [

        {
          title: "Home",
          url: "/",
          icon: Home,
          standalone: true,
        },

        {
          title: "LEARNING",
          isHeader: true,
        },

        {
          title: "Dashboard",
          url:
            createPageUrl(
              "StudentDashboard"
            ),
          icon: Home,
        },

        {
          title: "Online Classroom",
          url:
            createPageUrl(
              "OnlineClassroom"
            ),
          icon: Video,
        },

        {
          title: "Online Books",
          url:
            createPageUrl(
              "OnlineBooks"
            ),
          icon: BookOpen,
        },

        {
          title: "Find Teachers Near You",
          url:
            createPageUrl(
              "FindTeachersNearYou"
            ),
          icon: MapPin,
        },

        {
          title: "My Study Materials",
          url:
            createPageUrl(
              "MyStudyMaterials"
            ),
          icon: BookOpen,
        },

        {
          title: "My Attendance",
          url:
            createPageUrl(
              "MonthlyAttendance"
            ),
          icon: CalendarDays,
        },

        {
          title: "INFO",
          isHeader: true,
        },

        {
          title: "Events",
          url:
            createPageUrl("Events"),
          icon: Calendar,
        },

        {
          title: "Fee Structure",
          url:
            createPageUrl(
              "FeeStructure"
            ),
          icon: IndianRupee,
        },

        {
          title: "Festive Offers",
          url:
            createPageUrl(
              "FestiveSeasonOffer"
            ),
          icon: Gift,
        },

        {
          title: "Blog",
          url:
            createPageUrl("Blog"),
          icon: BookOpen,
        },

        ...getToolsNavigation(),

        ...getExamNavigation(),

        ...getLearningWebsitesNavigation(),

        {
          title: "Profile",
          url:
            createPageUrl("Profile"),
          icon: UserIcon,
          standalone: true,
        },

        {
          title: "Support Us ☕",
          url:
            createPageUrl("SupportUs"),
          icon: Coffee,
          standalone: true,
        },

      ];
    }


    /* ---------------------------------------------------------
       PARENT
    --------------------------------------------------------- */

    if (
      String(user.user_type)
        .toLowerCase() === "parent"
    ) {

      return [

        {
          title: "Home",
          url: "/",
          icon: Home,
          standalone: true,
        },

        {
          title: "LEARNING",
          isHeader: true,
        },

        {
          title: "Dashboard",
          url:
            createPageUrl(
              "ParentDashboard"
            ),
          icon: Home,
        },

        {
          title: "Online Books",
          url:
            createPageUrl(
              "OnlineBooks"
            ),
          icon: BookOpen,
        },

        {
          title: "Find Teachers Near You",
          url:
            createPageUrl(
              "FindTeachersNearYou"
            ),
          icon: MapPin,
        },

        {
          title: "Attendance",
          url:
            createPageUrl(
              "MonthlyAttendance"
            ),
          icon: CalendarDays,
        },

        {
          title: "My Tuition Requests",
          url:
            createPageUrl(
              "MyTuitionRequests"
            ),
          icon: ClipboardList,
        },

        {
          title: "INFO",
          isHeader: true,
        },

        {
          title: "Events",
          url:
            createPageUrl("Events"),
          icon: Calendar,
        },

        {
          title: "Fee Structure",
          url:
            createPageUrl(
              "FeeStructure"
            ),
          icon: IndianRupee,
        },

        {
          title: "Festive Offers",
          url:
            createPageUrl(
              "FestiveSeasonOffer"
            ),
          icon: Gift,
        },

        {
          title: "Blog",
          url:
            createPageUrl("Blog"),
          icon: BookOpen,
        },

        ...getToolsNavigation(),

        ...getExamNavigation(),

        ...getLearningWebsitesNavigation(),

        {
          title: "Profile",
          url:
            createPageUrl("Profile"),
          icon: UserIcon,
          standalone: true,
        },

        {
          title: "Support Us ☕",
          url:
            createPageUrl("SupportUs"),
          icon: Coffee,
          standalone: true,
        },

      ];
    }


    /* ---------------------------------------------------------
       TUTOR
    --------------------------------------------------------- */

    if (
      String(user.user_type)
        .toLowerCase() === "tutor"
    ) {

      return [

        {
          title: "Home",
          url: "/",
          icon: Home,
          standalone: true,
        },

        {
          title: "TEACHING",
          isHeader: true,
        },

        {
          title: "Dashboard",
          url:
            createPageUrl(
              "TutorDashboard"
            ),
          icon: Home,
        },

        {
          title: "Online Classroom",
          url:
            createPageUrl(
              "OnlineClassroom"
            ),
          icon: Video,
        },

        {
          title: "Online Books",
          url:
            createPageUrl(
              "OnlineBooks"
            ),
          icon: BookOpen,
        },

        {
          title: "Become a Home Tutor",
          url:
            createPageUrl(
              "BecomeHomeTutor"
            ),
          icon: GraduationCap,
        },

        {
          title: "Subscription Plans",
          url:
            createPageUrl(
              "TutorSubscription"
            ),
          icon: Crown,
        },

        {
          title: "Attendance",
          url:
            createPageUrl(
              "MonthlyAttendance"
            ),
          icon: CalendarDays,
        },

        {
          title: "Events",
          url:
            createPageUrl("Events"),
          icon: Calendar,
        },

        {
          title: "Fee Structure",
          url:
            createPageUrl(
              "FeeStructure"
            ),
          icon: IndianRupee,
        },

        {
          title: "Find Home Tuitions",
          url:
            createPageUrl(
              "FindHomeTuitions"
            ),
          icon: MapPin,
        },

        {
          title: "My Courses",
          url:
            createPageUrl("MyCourses"),
          icon: BookOpen,
        },

        {
          title: "AI Paper Generator",
          url:
            createPageUrl(
              "AIQuestionPaperGenerator"
            ),
          icon: FileText,
        },

        {
          title: "Blog",
          url:
            createPageUrl("Blog"),
          icon: BookOpen,
        },

        ...getToolsNavigation(),

        ...getExamNavigation(),

        ...getLearningWebsitesNavigation(),

        {
          title: "Profile",
          url:
            createPageUrl("Profile"),
          icon: UserIcon,
          standalone: true,
        },

        {
          title: "Support Us ☕",
          url:
            createPageUrl("SupportUs"),
          icon: Coffee,
          standalone: true,
        },

      ];
    }


    /* ---------------------------------------------------------
       FALLBACK
    --------------------------------------------------------- */

    return [

      {
        title: "Home",
        url: "/",
        icon: Home,
        standalone: true,
      },

      {
        title: "INFO",
        isHeader: true,
      },

      {
        title: "Events",
        url:
          createPageUrl("Events"),
        icon: Calendar,
      },

      {
        title: "Fee Structure",
        url:
          createPageUrl(
            "FeeStructure"
          ),
        icon: IndianRupee,
      },

      {
        title: "Blog",
        url:
          createPageUrl("Blog"),
        icon: BookOpen,
      },

      ...getToolsNavigation(),

      ...getExamNavigation(),

      ...getLearningWebsitesNavigation(),

      {
        title: "Profile",
        url:
          createPageUrl("Profile"),
        icon: UserIcon,
        standalone: true,
      },

      {
        title: "Support Us ☕",
        url:
          createPageUrl("SupportUs"),
        icon: Coffee,
        standalone: true,
      },

    ];
  };


  const navigationItems =
    getNavigationItems();


  /* =========================================================
     RENDER NAVIGATION
  ========================================================= */

  const renderNav = (
    items,
    onNavigate = null
  ) => {

    const rendered = [];

    let currentSection = null;

    items.forEach((item) => {

      /* -------------------------------------------------------
         SECTION HEADER
      ------------------------------------------------------- */

      if (item.isHeader) {

        currentSection =
          item.title;

        const isExpanded =
          !!expandedSections[
            item.title
          ];


        /* Collapsed sidebar */
        if (isSidebarCollapsed) {

          rendered.push(

            <div
              key={`separator-${item.title}`}
              className="my-2 border-t border-slate-100"
              title={item.title}
            />

          );

          return;
        }


        rendered.push(

          <button
            key={`section-${item.title}`}
            type="button"
            onClick={() =>
              toggleSection(
                item.title
              )
            }
            className="w-full flex items-center justify-between px-3 pt-4 pb-2 text-left rounded-lg hover:bg-slate-50 transition-colors"
          >

            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {item.title}
            </span>

            <ChevronDown
              className={`
                w-4 h-4
                text-slate-400
                transition-transform
                duration-200
                ${
                  isExpanded
                    ? "rotate-180"
                    : ""
                }
              `}
            />

          </button>

        );

        return;
      }


      /* -------------------------------------------------------
         SECTION VISIBILITY
      ------------------------------------------------------- */

      const isVisible =
        item.standalone ||
        !currentSection ||
        !!expandedSections[
          currentSection
        ];

      if (!isVisible) {
        return;
      }


      const Icon =
        item.icon || BookOpen;


      const isHome =
        item.url === "/" ||
        item.url === createPageUrl(
          "Welcome"
        );


      const isActive =
        isHome
          ? location.pathname === "/"
          : location.pathname ===
            item.url;


      const activeClass =
        isActive
          ? "bg-blue-50 text-blue-600"
          : "text-slate-700 hover:bg-slate-100";


      /* -------------------------------------------------------
         COLLAPSED SIDEBAR
      ------------------------------------------------------- */

      if (isSidebarCollapsed) {

        if (item.external) {

          rendered.push(

            <a
              key={item.title}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onNavigate}
              title={item.title}
              className={`
                group relative
                flex items-center
                justify-center
                w-12 h-12
                mx-auto
                rounded-xl
                transition-colors
                ${activeClass}
              `}
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
              className={`
                group relative
                flex items-center
                justify-center
                w-12 h-12
                mx-auto
                rounded-xl
                transition-colors
                ${activeClass}
              `}
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


      /* -------------------------------------------------------
         EXPANDED SIDEBAR - EXTERNAL
      ------------------------------------------------------- */

      if (item.external) {

        rendered.push(

          <a
            key={item.title}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onNavigate}
            className={`
              flex items-center
              gap-3
              px-3 py-3
              rounded-xl
              transition-colors
              ${activeClass}
            `}
          >

            <Icon className="w-5 h-5 shrink-0" />

            <span className="truncate">
              {item.title}
            </span>

          </a>

        );

        return;
      }


      /* -------------------------------------------------------
         EXPANDED SIDEBAR - INTERNAL
      ------------------------------------------------------- */

      rendered.push(

        <Link
          key={item.title}
          to={item.url}
          onClick={onNavigate}
          className={`
            flex items-center
            gap-3
            px-3 py-3
            rounded-xl
            transition-colors
            ${activeClass}
          `}
        >

          <Icon className="w-5 h-5 shrink-0" />

          <span className="truncate">
            {item.title}
          </span>

        </Link>

      );

    });

    return rendered;
  };


  /* =========================================================
     USER INITIAL
  ========================================================= */

  const userInitial =
    user?.full_name
      ?.charAt(0)
      ?.toUpperCase() ||
    user?.email
      ?.charAt(0)
      ?.toUpperCase() ||
    "A";


  /* =========================================================
     RENDER
  ========================================================= */

  return (

    <div className="min-h-screen bg-slate-100">

      <style>{`

        @import url(
          'https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari&display=swap'
        );

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


        {/* =====================================================
            DESKTOP SIDEBAR
        ===================================================== */}

        <aside
          className={`
            hidden lg:flex
            flex-col
            shrink-0
            bg-white
            border-r border-slate-200
            transition-all duration-300
            ${isSidebarCollapsed
              ? "w-20"
              : "w-72"
            }
          `}
        >


          {/* ===================================================
              ACAD LOGO / HOME
          =================================================== */}

          <Link
            to="/"
            className={`
              flex items-center
              h-20
              border-b border-slate-100
              hover:bg-slate-50
              transition-colors
              ${
                isSidebarCollapsed
                  ? "justify-center"
                  : "px-5 gap-3"
              }
            `}
            aria-label="ACAD Home"
            title="ACAD Home"
          >

            <div className="w-11 h-11 bg-[#1565C0] rounded-xl flex items-center justify-center shrink-0 shadow-sm">

              <GraduationCap
                className="w-6 h-6 text-white"
              />

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

          </Link>


          {/* ===================================================
              SIDEBAR NAVIGATION
          =================================================== */}

          <div className="flex-1 overflow-y-auto px-3 py-4">

            <nav className="flex flex-col gap-1">

              {renderNav(
                navigationItems
              )}

            </nav>

          </div>


          {/* ===================================================
              COLLAPSE BUTTON
          =================================================== */}

          <div className="border-t border-slate-100 p-3">

            <button
              type="button"
              onClick={() =>
                setIsSidebarCollapsed(
                  (previous) =>
                    !previous
                )
              }
              className={`
                w-full
                flex items-center
                rounded-xl
                text-slate-500
                hover:bg-slate-100
                transition-colors
                ${
                  isSidebarCollapsed
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

                <ChevronRight
                  className="w-5 h-5"
                />

              ) : (

                <>
                  <ChevronLeft
                    className="w-5 h-5"
                  />

                  <span className="text-sm font-medium">
                    Collapse Menu
                  </span>
                </>

              )}

            </button>

          </div>

        </aside>


        {/* =====================================================
            MAIN APPLICATION
        ===================================================== */}

        <div className="flex-1 min-w-0 flex flex-col">


          {/* ===================================================
              HEADER
          =================================================== */}

          <header className="bg-white border-b border-slate-200 sticky top-0 z-40">

            <div className="container mx-auto px-4">

              <div className="flex items-center justify-between h-16">


                {/* LEFT SIDE */}

                <div className="flex items-center gap-3">


                  {/* MOBILE MENU */}

                  <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden"
                    onClick={() =>
                      setIsMobileMenuOpen(
                        (previous) =>
                          !previous
                      )
                    }
                    aria-label="Toggle menu"
                  >

                    {isMobileMenuOpen ? (

                      <X className="w-5 h-5" />

                    ) : (

                      <Menu className="w-5 h-5" />

                    )}

                  </Button>


                  {/* MOBILE ACAD HOME */}

                  <Link
                    to="/"
                    className="lg:hidden w-9 h-9 bg-[#1565C0] rounded-lg flex items-center justify-center"
                    aria-label="ACAD Home"
                    title="ACAD Home"
                  >

                    <GraduationCap
                      className="w-5 h-5 text-white"
                    />

                  </Link>


                  <h2 className="text-lg font-semibold text-slate-800">

                    {currentPageName || "ACAD"}

                  </h2>

                </div>


                {/* USER */}

                {user && (

                  <DropdownMenu>

                    <DropdownMenuTrigger
                      asChild
                    >

                      <button
                        type="button"
                        className="rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >

                        <Avatar className="w-9 h-9 cursor-pointer">

                          {user.profile_image ? (

                            <AvatarImage
                              src={
                                user.profile_image
                              }
                              alt={
                                `${
                                  user.full_name ||
                                  "User"
                                } avatar`
                              }
                            />

                          ) : (

                            <AvatarFallback className="bg-blue-500 text-white">

                              {userInitial}

                            </AvatarFallback>

                          )}

                        </Avatar>

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

                          <span className="text-sm font-medium">

                            {
                              user.full_name ||
                              user.email
                            }

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

                        <Link
                          to={createPageUrl(
                            "Profile"
                          )}
                        >

                          <UserIcon className="w-4 h-4 mr-2" />

                          Profile

                        </Link>

                      </DropdownMenuItem>


                      <DropdownMenuSeparator />


                      <DropdownMenuItem
                        onClick={
                          handleLogout
                        }
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


          {/* ===================================================
              MOBILE NAVIGATION
          =================================================== */}

          {isMobileMenuOpen && (

            <div className="lg:hidden bg-white border-b border-slate-200 shadow-sm">

              <nav className="p-4 flex flex-col gap-1 max-h-[calc(100vh-64px)] overflow-y-auto">

                {renderNav(
                  navigationItems,
                  () =>
                    setIsMobileMenuOpen(
                      false
                    )
                )}


                {user && (

                  <>

                    <div className="border-t border-slate-200 my-3" />

                    <button
                      type="button"
                      onClick={() => {

                        setIsMobileMenuOpen(
                          false
                        );

                        handleLogout();

                      }}
                      className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-red-50 text-red-600 font-medium transition-colors"
                    >

                      <LogOut
                        className="w-5 h-5"
                      />

                      Sign Out

                    </button>

                  </>

                )}

              </nav>

            </div>

          )}


          {/* ===================================================
              MAIN CONTENT
          =================================================== */}

          <main className="bg-slate-100 p-4 sm:p-6 flex-1 min-w-0">

            {children}

          </main>

        </div>

      </div>

    </div>

  );
}
