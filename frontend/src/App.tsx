import React, { useState, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import './App.css';

import { AppProvider, useApp } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';

import { LandingPage } from './pages/LandingPage';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { MentorDashboard } from './pages/MentorDashboard';
import { StudentDashboard } from './pages/StudentDashboard';
import { HomeworkManager } from './pages/HomeworkManager';
import { LibraryManager } from './pages/LibraryManager';
import { QuizManager } from './pages/QuizManager';
import { TestManager } from './pages/TestManager';
import { StudentsManager } from './pages/StudentsManager';
import { Reports } from './pages/Reports';
import { Notifications } from './pages/Notifications';
import { Profile } from './pages/Profile';
import { Settings } from './pages/Settings';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminUsers } from './pages/AdminUsers';
import { ChatManager } from './pages/ChatManager';
import { StudentsInfo } from './pages/StudentsInfo';
import { MentorsInfo } from './pages/MentorsInfo';
import { FeaturesInfo } from './pages/FeaturesInfo';
import { Help } from './pages/Help';
import { LibraryInfo } from './pages/LibraryInfo';
import { Blog } from './pages/Blog';
import { Community } from './pages/Community';
import { Privacy } from './pages/Privacy';
import { Terms } from './pages/Terms';
import { Cookies } from './pages/Cookies';
import { Pricing } from './pages/Pricing';

/* ── Error Boundary ───────────────────────────────────────────
   Catches errors from DashboardLayout (e.g. HMR context loss)
   and shows a soft reload prompt rather than a blank screen. */
interface EBState { hasError: boolean; errorMessage: string }
class AppErrorBoundary extends React.Component<{ children: React.ReactNode }, EBState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }
  static getDerivedStateFromError(error: Error): EBState {
    return { hasError: true, errorMessage: error.message };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[AppErrorBoundary]', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-950 text-white gap-4 font-outfit">
          <div className="text-5xl">⚠️</div>
          <h2 className="text-xl font-bold">Something went wrong</h2>
          <p className="text-slate-400 text-sm max-w-sm text-center">{this.state.errorMessage}</p>
          <button
            onClick={() => { this.setState({ hasError: false, errorMessage: '' }); window.location.reload(); }}
            className="mt-2 px-6 py-2.5 bg-primary-600 hover:bg-primary-700 rounded-xl text-sm font-bold transition-colors"
          >
            Reload App
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  return <>{children}</>;
};

const DashboardLayout: React.FC = () => {
  const { role, notifications, myStudents, activeStudent, setActiveStudent, toast } = useApp();
  const [activeTab, setActiveTabRaw] = useState('dashboard');

  // Admin create-user role shortcut (from dashboard quick actions)
  const [adminCreateRole, setAdminCreateRole] = useState<'mentor' | 'student' | 'admin' | null>(null);

  const handleCreateRoleConsumed = useCallback(() => {
    setAdminCreateRole(null);
  }, []);

  // Intercept admin quick-action tab names and convert to state
  const setActiveTab = (tab: string) => {
    if (tab === 'admin-users-create-mentor') {
      setAdminCreateRole('mentor');
      setActiveTabRaw('admin-users');
    } else if (tab === 'admin-users-create-student') {
      setAdminCreateRole('student');
      setActiveTabRaw('admin-users');
    } else if (tab === 'admin-users-create-admin') {
      setAdminCreateRole('admin');
      setActiveTabRaw('admin-users');
    } else {
      setAdminCreateRole(null);
      setActiveTabRaw(tab);
    }
  };

  // Cross-page modal open states (Quick Actions can open modals from dashboard)
  const [showHomeworkModal, setShowHomeworkModal] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);

  const unread = notifications.filter(n => !n.isRead).length;

  const handleQuickAction = (action: string) => {
    if (action === 'homework') {
      setActiveTab('homework');
      setShowHomeworkModal(true);
    } else if (action === 'quiz') {
      setActiveTab('quizzes');
      setShowQuizModal(true);
    } else if (action === 'material') {
      setActiveTab('library');
      setShowMaterialModal(true);
    } else if (action === 'test') {
      setActiveTab('tests');
      setShowTestModal(true);
    }
  };

  const renderPage = () => {
    switch (activeTab) {
      case 'admin-dashboard':
      case 'dashboard':
        if (role === 'admin') {
          return <AdminDashboard setActiveTab={setActiveTab} />;
        }
        return role === 'mentor' ? (
          <MentorDashboard
            setActiveTab={setActiveTab}
            openHomeworkModal={() => handleQuickAction('homework')}
            openQuizModal={() => handleQuickAction('quiz')}
            openMaterialModal={() => handleQuickAction('material')}
            openTestModal={() => handleQuickAction('test')}
          />
        ) : (
          <StudentDashboard setActiveTab={setActiveTab} />
        );

      case 'admin-users':
        return <AdminUsers
          initialCreateRole={adminCreateRole}
          onCreateRoleConsumed={handleCreateRoleConsumed}
        />;

      case 'homework':
        return (
          <HomeworkManager
            showCreateModal={showHomeworkModal}
            setShowCreateModal={setShowHomeworkModal}
          />
        );

      case 'my-students':
        return <StudentsManager />;

      case 'library':
        return (
          <LibraryManager
            showUploadModal={showMaterialModal}
            setShowUploadModal={setShowMaterialModal}
          />
        );

      case 'quizzes':
        return (
          <QuizManager
            showCreateModal={showQuizModal}
            setShowCreateModal={setShowQuizModal}
          />
        );

      case 'tests':
        return (
          <TestManager
            showCreateModal={showTestModal}
            setShowCreateModal={setShowTestModal}
          />
        );

      case 'reports':
      case 'analytics':
        return <Reports />;

      case 'notifications':
        return <Notifications />;

      case 'profile':
        return <Profile />;

      case 'settings':
        return <Settings />;

      case 'chat':
        return <ChatManager />;

      default:
        return (
          <div className="text-center py-16 text-slate-400 font-medium">
            Page not found.
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-[100dvh] overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 min-h-0 overflow-y-auto pt-0 lg:pt-0">
        <div className="hidden lg:flex items-center justify-between px-8 py-4 border-b border-slate-800 bg-[#0f172a] sticky top-0 z-20 text-white shadow-sm">
          <div>
            <h1 className="font-bold text-white font-outfit capitalize">
              {activeTab === 'reports' || activeTab === 'analytics' ? 'Study Analytics' : activeTab.replace('-', ' ')}
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => setActiveTab('notifications')}
              className="relative p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-danger text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {unread}
                </span>
              )}
            </button>

            {role === 'mentor' && myStudents.length > 0 && (
              <div className="flex items-center space-x-2 mr-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase shrink-0">Viewing Student:</span>
                <select
                  value={activeStudent?.id || ''}
                  onChange={(e) => {
                    const selected = myStudents.find(s => s.id === Number(e.target.value));
                    if (selected) setActiveStudent(selected);
                  }}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold focus:outline-none text-slate-700 dark:text-slate-200"
                >
                  {myStudents.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            )}


          </div>
        </div>

        <div className="p-4 sm:p-5 lg:p-8 pb-24 lg:pb-8">
          {renderPage()}
        </div>
      </main>

      {/* Floating Toast Notification - above bottom nav on mobile */}
      {toast.show && (
        <div className="fixed bottom-20 lg:bottom-5 right-4 lg:right-5 z-50 max-w-[calc(100vw-2rem)] sm:max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-4 animate-fadeIn flex items-start space-x-3 ring-2 ring-primary-500/20">
          <div className="w-9 h-9 bg-primary-100 dark:bg-primary-950/20 rounded-xl flex items-center justify-center text-primary-600 dark:text-primary-400 shrink-0 text-base">
            💬
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-extrabold text-slate-800 dark:text-white font-outfit truncate">{toast.title}</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">{toast.message}</p>
          </div>
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppProvider>
        <Router>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/students" element={<StudentsInfo />} />
            <Route path="/mentors" element={<MentorsInfo />} />
            <Route path="/features" element={<FeaturesInfo />} />
            <Route path="/help" element={<Help />} />
            <Route path="/library-info" element={<LibraryInfo />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/community" element={<Community />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/cookies" element={<Cookies />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/dashboard/*" element={
              <ProtectedRoute>
                <AppErrorBoundary>
                  <DashboardLayout />
                </AppErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Router>
      </AppProvider>
    </AuthProvider>
  );
};

export default App;
