/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AcademicEssentials from './pages/AcademicEssentials';
import AdminCourseManagement from './pages/AdminCourseManagement';
import AdminDashboard from './pages/AdminDashboard';
import AdminEnrollmentManagement from './pages/AdminEnrollmentManagement';
import AdminEventManagement from './pages/AdminEventManagement';
import AdminInquiryManagement from './pages/AdminInquiryManagement';
import AdminTutorManagement from './pages/AdminTutorManagement';
import AttendanceManagement from './pages/AttendanceManagement';
import Blog from './pages/Blog';
import CourseDetails from './pages/CourseDetails';
import CreateCourse from './pages/CreateCourse';
import DeepavaliOffer from './pages/DeepavaliOffer';
import Events from './pages/Events';
import FeeStructure from './pages/FeeStructure';
import FestiveSeasonOffer from './pages/FestiveSeasonOffer';
import FindHomeTuitions from './pages/FindHomeTuitions';
import HindiSabha from './pages/HindiSabha';
import MarkAttendance from './pages/MarkAttendance';
import MonthlyAttendance from './pages/MonthlyAttendance';
import MyCourses from './pages/MyCourses';
import MyStudyMaterials from './pages/MyStudyMaterials';
import MyTuitionRequests from './pages/MyTuitionRequests';
import NeetJeeSupport from './pages/NeetJeeSupport';
import Onboarding from './pages/Onboarding';
import ParentDashboard from './pages/ParentDashboard';
import PostTuitionRequest from './pages/PostTuitionRequest';
import Profile from './pages/Profile';
import RegisterInquiry from './pages/RegisterInquiry';
import ScheduleClass from './pages/ScheduleClass';
import Settings from './pages/Settings';
import StudentDashboard from './pages/StudentDashboard';
import SupportUs from './pages/SupportUs';
import TutorDashboard from './pages/TutorDashboard';
import Welcome from './pages/Welcome';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AcademicEssentials": AcademicEssentials,
    "AdminCourseManagement": AdminCourseManagement,
    "AdminDashboard": AdminDashboard,
    "AdminEnrollmentManagement": AdminEnrollmentManagement,
    "AdminEventManagement": AdminEventManagement,
    "AdminInquiryManagement": AdminInquiryManagement,
    "AdminTutorManagement": AdminTutorManagement,
    "AttendanceManagement": AttendanceManagement,
    "Blog": Blog,
    "CourseDetails": CourseDetails,
    "CreateCourse": CreateCourse,
    "DeepavaliOffer": DeepavaliOffer,
    "Events": Events,
    "FeeStructure": FeeStructure,
    "FestiveSeasonOffer": FestiveSeasonOffer,
    "FindHomeTuitions": FindHomeTuitions,
    "HindiSabha": HindiSabha,
    "MarkAttendance": MarkAttendance,
    "MonthlyAttendance": MonthlyAttendance,
    "MyCourses": MyCourses,
    "MyStudyMaterials": MyStudyMaterials,
    "MyTuitionRequests": MyTuitionRequests,
    "NeetJeeSupport": NeetJeeSupport,
    "Onboarding": Onboarding,
    "ParentDashboard": ParentDashboard,
    "PostTuitionRequest": PostTuitionRequest,
    "Profile": Profile,
    "RegisterInquiry": RegisterInquiry,
    "ScheduleClass": ScheduleClass,
    "Settings": Settings,
    "StudentDashboard": StudentDashboard,
    "SupportUs": SupportUs,
    "TutorDashboard": TutorDashboard,
    "Welcome": Welcome,
}

export const pagesConfig = {
    mainPage: "Welcome",
    Pages: PAGES,
    Layout: __Layout,
};