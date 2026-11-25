import React from 'react';
import { BrowserRouter, HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { PlatformProvider, usePlatform } from './context/PlatformContext';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { TeacherLayout } from './components/teacher/TeacherLayout';

// Student Pages
import { StudentHomePage } from './pages/student/StudentHomePage';
import { LevelsPage } from './pages/student/LevelsPage';
import { SectionsPage } from './pages/student/SectionsPage';
import { LessonsListPage } from './pages/student/LessonsListPage';
import { LessonViewerPage } from './pages/student/LessonViewerPage';
import { QuizzesPage } from './pages/student/QuizzesPage';
import { ResultsPage } from './pages/student/ResultsPage';
import { StudentProfilePage } from './pages/student/StudentProfilePage';
import { MessagesPage } from './pages/student/MessagesPage';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { TeacherLoginPage } from './pages/auth/TeacherLoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { AccountPendingPage } from './pages/auth/AccountPendingPage';
import { AccountRejectedPage } from './pages/auth/AccountRejectedPage';

// Teacher Pages
import { TeacherDashboardPage } from './pages/teacher/TeacherDashboardPage';
import { StudentsPage } from './pages/teacher/StudentsPage';
import { RegistrationRequestsPage } from './pages/teacher/RegistrationRequestsPage';
import { GroupsPage } from './pages/teacher/GroupsPage';
import { ManageLevelsPage } from './pages/teacher/ManageLevelsPage';
import { ManageSectionsPage } from './pages/teacher/ManageSectionsPage';
import { ManageLessonsPage } from './pages/teacher/ManageLessonsPage';
import { ManageMaterialsPage } from './pages/teacher/ManageMaterialsPage';
import { ManageQuizzesPage } from './pages/teacher/ManageQuizzesPage';
import { ReportsPage } from './pages/teacher/ReportsPage';
import { TeacherMessagesPage } from './pages/teacher/TeacherMessagesPage';
import { AnnouncementsPage } from './pages/teacher/AnnouncementsPage';
import { SettingsPage } from './pages/teacher/SettingsPage';

// Scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

// Student Guard: Enforces that unauthenticated users or 'pending' and 'rejected' students CANNOT access educational content
const StudentContentGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, isAuthenticated } = usePlatform();

  if (!isAuthenticated || !currentUser.id) {
    return <Navigate to="/login" replace />;
  }

  if (currentUser.role === 'student') {
    if (currentUser.status === 'pending') {
      return <Navigate to="/account/pending" replace />;
    }
    if (currentUser.status === 'rejected') {
      return <Navigate to="/account/rejected" replace />;
    }
  }

  return <>{children}</>;
};

// Teacher Guard: Enforces that only verified active teachers can access the teacher dashboard
const TeacherRouteGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, isAuthenticated } = usePlatform();

  if (!isAuthenticated || !currentUser.id || currentUser.role !== 'teacher') {
    return <Navigate to="/login" replace />;
  }
  if (currentUser.isActive === false) {
    return <Navigate to="/teacher-login" replace />;
  }

  return <>{children}</>;
};

// Student Layout Wrapper
const StudentShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans selection:bg-brand-500 selection:text-white">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {children}
      </main>
      <Footer />
    </div>
  );
};

// Teacher Layout Wrapper
const TeacherShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans selection:bg-brand-500 selection:text-white">
      <Navbar />
      <TeacherLayout>
        {children}
      </TeacherLayout>
    </div>
  );
};

const isFileProtocol = typeof window !== 'undefined' && window.location.protocol === 'file:';
const Router = isFileProtocol ? HashRouter : BrowserRouter;

export function App() {
  return (
    <PlatformProvider>
      <Router>
        <ScrollToTop />
        <Routes>
          {/* Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/teacher-login" element={<TeacherLoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/account/pending" element={<AccountPendingPage />} />
          <Route path="/account/rejected" element={<AccountRejectedPage />} />

          {/* Student Routes with Strict Content Access Guard */}
          <Route path="/" element={
            <StudentShell>
              <StudentContentGuard>
                <StudentHomePage />
              </StudentContentGuard>
            </StudentShell>
          } />
          
          <Route path="/levels" element={
            <StudentShell>
              <StudentContentGuard>
                <LevelsPage />
              </StudentContentGuard>
            </StudentShell>
          } />
          
          <Route path="/levels/:levelId/sections" element={
            <StudentShell>
              <StudentContentGuard>
                <SectionsPage />
              </StudentContentGuard>
            </StudentShell>
          } />
          
          <Route path="/sections/:sectionId/lessons" element={
            <StudentShell>
              <StudentContentGuard>
                <LessonsListPage />
              </StudentContentGuard>
            </StudentShell>
          } />
          
          <Route path="/lessons/:lessonId" element={
            <StudentShell>
              <StudentContentGuard>
                <LessonViewerPage />
              </StudentContentGuard>
            </StudentShell>
          } />
          
          <Route path="/quizzes" element={
            <StudentShell>
              <StudentContentGuard>
                <QuizzesPage />
              </StudentContentGuard>
            </StudentShell>
          } />
          
          <Route path="/results" element={
            <StudentShell>
              <StudentContentGuard>
                <ResultsPage />
              </StudentContentGuard>
            </StudentShell>
          } />
          
          <Route path="/profile" element={
            <StudentShell>
              <StudentContentGuard>
                <StudentProfilePage />
              </StudentContentGuard>
            </StudentShell>
          } />
          <Route path="/messages" element={
            <StudentShell>
              <StudentContentGuard>
                <MessagesPage />
              </StudentContentGuard>
            </StudentShell>
          } />

          {/* Teacher Routes with Exclusive Teacher Guard */}
          <Route path="/teacher" element={
            <TeacherRouteGuard>
              <TeacherShell><TeacherDashboardPage /></TeacherShell>
            </TeacherRouteGuard>
          } />
          <Route path="/teacher/students" element={
            <TeacherRouteGuard>
              <TeacherShell><StudentsPage /></TeacherShell>
            </TeacherRouteGuard>
          } />
          <Route path="/teacher/registration-requests" element={
            <TeacherRouteGuard>
              <TeacherShell><RegistrationRequestsPage /></TeacherShell>
            </TeacherRouteGuard>
          } />
          <Route path="/teacher/groups" element={
            <TeacherRouteGuard>
              <TeacherShell><GroupsPage /></TeacherShell>
            </TeacherRouteGuard>
          } />
          <Route path="/teacher/levels" element={
            <TeacherRouteGuard>
              <TeacherShell><ManageLevelsPage /></TeacherShell>
            </TeacherRouteGuard>
          } />
          <Route path="/teacher/sections" element={
            <TeacherRouteGuard>
              <TeacherShell><ManageSectionsPage /></TeacherShell>
            </TeacherRouteGuard>
          } />
          <Route path="/teacher/lessons" element={
            <TeacherRouteGuard>
              <TeacherShell><ManageLessonsPage /></TeacherShell>
            </TeacherRouteGuard>
          } />
          <Route path="/teacher/materials" element={
            <TeacherRouteGuard>
              <TeacherShell><ManageMaterialsPage /></TeacherShell>
            </TeacherRouteGuard>
          } />
          <Route path="/teacher/quizzes" element={
            <TeacherRouteGuard>
              <TeacherShell><ManageQuizzesPage /></TeacherShell>
            </TeacherRouteGuard>
          } />
          <Route path="/teacher/results" element={
            <TeacherRouteGuard>
              <TeacherShell><ReportsPage /></TeacherShell>
            </TeacherRouteGuard>
          } />
          <Route path="/teacher/messages" element={
            <TeacherRouteGuard>
              <TeacherShell><TeacherMessagesPage /></TeacherShell>
            </TeacherRouteGuard>
          } />
          <Route path="/teacher/announcements" element={
            <TeacherRouteGuard>
              <TeacherShell><AnnouncementsPage /></TeacherShell>
            </TeacherRouteGuard>
          } />
          <Route path="/teacher/settings" element={
            <TeacherRouteGuard>
              <TeacherShell><SettingsPage /></TeacherShell>
            </TeacherRouteGuard>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </PlatformProvider>
  );
}

export default App;
