import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import VisualEditAgent from '@/lib/VisualEditAgent'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import SupportUs from './pages/SupportUs';
import AIQuestionPaperGenerator from './pages/AIQuestionPaperGenerator';
import FindTeachersNearYou from './pages/FindTeachersNearYou';
import BecomeHomeTutor from './pages/BecomeHomeTutor';
import TutorSubscription from './pages/TutorSubscription';
import AdminHomeTutorApproval from './pages/AdminHomeTutorApproval';
import OnlineBooks from './pages/OnlineBooks';
import AdminBookApprovals from './pages/AdminBookApprovals';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/" element={
        <LayoutWrapper currentPageName={mainPageKey}>
          <MainPage />
        </LayoutWrapper>
      } />
      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            <LayoutWrapper currentPageName={path}>
              <Page />
            </LayoutWrapper>
          }
        />
      ))}
      <Route 
        path="/SupportUs" 
        element={
          <LayoutWrapper currentPageName="SupportUs">
            <SupportUs />
          </LayoutWrapper>
        } 
      />
      <Route 
        path="/AIQuestionPaperGenerator" 
        element={
          <LayoutWrapper currentPageName="AI Question Paper Generator">
            <AIQuestionPaperGenerator />
          </LayoutWrapper>
        } 
      />
      <Route 
        path="/FindTeachersNearYou" 
        element={
          <LayoutWrapper currentPageName="Find Teachers Near You">
            <FindTeachersNearYou />
          </LayoutWrapper>
        } 
      />
      <Route 
        path="/BecomeHomeTutor" 
        element={
          <LayoutWrapper currentPageName="Become a Home Tutor">
            <BecomeHomeTutor />
          </LayoutWrapper>
        } 
      />
      <Route 
        path="/TutorSubscription" 
        element={
          <LayoutWrapper currentPageName="Subscription Plans">
            <TutorSubscription />
          </LayoutWrapper>
        } 
      />
      <Route 
        path="/AdminHomeTutorApproval" 
        element={
          <LayoutWrapper currentPageName="Home Tutor Approvals">
            <AdminHomeTutorApproval />
          </LayoutWrapper>
        } 
      />
      <Route 
        path="/OnlineBooks" 
        element={
          <LayoutWrapper currentPageName="Online Books">
            <OnlineBooks />
          </LayoutWrapper>
        } 
      />
      <Route 
        path="/AdminBookApprovals" 
        element={
          <LayoutWrapper currentPageName="Book Approvals">
            <AdminBookApprovals />
          </LayoutWrapper>
        } 
      />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <NavigationTracker />
          <AuthenticatedApp />
        </Router>
        <Toaster />
        <VisualEditAgent />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App