import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  BookOpen,
  Library,
  FileQuestion,
  FileText,
  TrendingUp,
  ClipboardList,
  Bell,
  User,
  Settings,
  LogOut,
  Moon,
  Sun,
  Menu,
  X,
  Users,
  MessageSquare,
  UserCheck,
  ChevronLeft
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

/* Each nav item gets a unique gradient colour pair */
const NAV_COLORS: Record<string, { from: string; to: string; shadow: string }> = {
  'dashboard':      { from: '#6366f1', to: '#8b5cf6', shadow: 'rgba(99,102,241,0.35)' },
  'admin-dashboard':{ from: '#6366f1', to: '#8b5cf6', shadow: 'rgba(99,102,241,0.35)' },
  'my-students':    { from: '#10b981', to: '#059669', shadow: 'rgba(16,185,129,0.35)' },
  'homework':       { from: '#3b82f6', to: '#2563eb', shadow: 'rgba(59,130,246,0.35)' },
  'library':        { from: '#f59e0b', to: '#d97706', shadow: 'rgba(245,158,11,0.35)' },
  'quizzes':        { from: '#06b6d4', to: '#0891b2', shadow: 'rgba(6,182,212,0.35)' },
  'tests':          { from: '#f97316', to: '#ea580c', shadow: 'rgba(249,115,22,0.35)' },
  'reports':        { from: '#8b5cf6', to: '#7c3aed', shadow: 'rgba(139,92,246,0.35)' },
  'analytics':      { from: '#8b5cf6', to: '#7c3aed', shadow: 'rgba(139,92,246,0.35)' },
  'chat':           { from: '#ec4899', to: '#db2777', shadow: 'rgba(236,72,153,0.35)' },
  'notifications':  { from: '#ef4444', to: '#dc2626', shadow: 'rgba(239,68,68,0.35)' },
  'profile':        { from: '#14b8a6', to: '#0d9488', shadow: 'rgba(20,184,166,0.35)' },
  'settings':       { from: '#64748b', to: '#475569', shadow: 'rgba(100,116,139,0.35)' },
  'admin-users':    { from: '#0ea5e9', to: '#0284c7', shadow: 'rgba(14,165,233,0.35)' },
};

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const {
    role,
    mentorProfile,
    studentProfile,
    theme,
    setTheme,
    notifications,
    unreadChatCount
  } = useApp();

  const { logout } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('cm_sidebar_collapsed') === 'true';
  });

  interface NavItem {
    id: string;
    name: string;
    icon: React.ComponentType<any>;
    badge?: number;
  }

  const profile = role === 'mentor'
    ? mentorProfile
    : (role === 'student'
      ? studentProfile
      : { name: 'Admin', email: 'admin@system', photoUrl: `https://ui-avatars.com/api/?name=Admin&background=6366f1&color=fff` });

  const unreadNotifications = notifications.filter(n => !n.isRead).length;

  const mentorNavItems: NavItem[] = [
    { id: 'dashboard',   name: 'Dashboard',       icon: LayoutDashboard },
    { id: 'my-students', name: 'My Students',      icon: UserCheck },
    { id: 'homework',    name: 'Homework',          icon: BookOpen },
    { id: 'library',     name: 'Library',           icon: Library },
    { id: 'quizzes',     name: 'Quiz Management',   icon: FileQuestion },
    { id: 'tests',       name: 'Test Management',   icon: FileText },
    { id: 'reports',     name: 'Reports',           icon: ClipboardList },
    { id: 'chat',        name: 'Chat Room',         icon: MessageSquare, badge: unreadChatCount },
    { id: 'notifications', name: 'Notifications',  icon: Bell, badge: unreadNotifications },
    { id: 'profile',     name: 'Profile',           icon: User },
    { id: 'settings',    name: 'Settings',          icon: Settings },
  ];

  const studentNavItems: NavItem[] = [
    { id: 'dashboard',     name: 'Dashboard',       icon: LayoutDashboard },
    { id: 'homework',      name: 'Homework',         icon: BookOpen },
    { id: 'library',       name: 'Library',          icon: Library },
    { id: 'quizzes',       name: 'Quizzes',          icon: FileQuestion },
    { id: 'tests',         name: 'Written Tests',    icon: FileText },
    { id: 'analytics',     name: 'Study Analytics',  icon: TrendingUp },
    { id: 'chat',          name: 'Chat Room',        icon: MessageSquare, badge: unreadChatCount },
    { id: 'notifications', name: 'Notifications',   icon: Bell, badge: unreadNotifications },
    { id: 'profile',       name: 'Profile',          icon: User },
    { id: 'settings',      name: 'Settings',         icon: Settings },
  ];

  const adminNavItems: NavItem[] = [
    { id: 'admin-dashboard', name: 'Overview',       icon: LayoutDashboard },
    { id: 'admin-users',     name: 'Manage Users',   icon: Users },
    { id: 'library',         name: 'Library',        icon: Library },
    { id: 'chat',            name: 'Messages',       icon: MessageSquare, badge: unreadChatCount },
    { id: 'notifications',   name: 'Notifications',  icon: Bell, badge: unreadNotifications },
    { id: 'settings',        name: 'System Settings',icon: Settings },
  ];

  const navItems = role === 'admin' ? adminNavItems : (role === 'mentor' ? mentorNavItems : studentNavItems);

  const mobileBottomNavItems = role === 'mentor'
    ? [
        { id: 'dashboard',   name: 'Home',     icon: LayoutDashboard },
        { id: 'my-students', name: 'Students', icon: UserCheck },
        { id: 'homework',    name: 'Homework', icon: BookOpen },
        { id: 'reports',     name: 'Reports',  icon: ClipboardList },
        { id: 'chat',        name: 'Chat',     icon: MessageSquare, badge: unreadChatCount },
      ]
    : role === 'student'
    ? [
        { id: 'dashboard', name: 'Home',     icon: LayoutDashboard },
        { id: 'homework',  name: 'Homework', icon: BookOpen },
        { id: 'quizzes',   name: 'Quizzes',  icon: FileQuestion },
        { id: 'library',   name: 'Library',  icon: Library },
        { id: 'chat',      name: 'Chat',     icon: MessageSquare, badge: unreadChatCount },
      ]
    : [
        { id: 'admin-dashboard', name: 'Overview', icon: LayoutDashboard },
        { id: 'admin-users',     name: 'Users',    icon: Users },
        { id: 'library',         name: 'Library',  icon: Library },
        { id: 'settings',        name: 'Settings', icon: Settings },
      ];

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  const handleNavClick = (tabId: string) => {
    setActiveTab(tabId);
    setIsOpen(false);
  };

  const currentTabName = navItems.find(n => n.id === activeTab)?.name || 'Dashboard';
  const isDashboard = activeTab === 'dashboard' || activeTab === 'admin-dashboard';

  const getColor = (id: string) => NAV_COLORS[id] || { from: '#6366f1', to: '#8b5cf6', shadow: 'rgba(99,102,241,0.35)' };

  return (
    <>
      {/* ═══ MOBILE HEADER ══════════════════════════════════════════════════ */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-[#0f172a] border-b border-slate-800/80 sticky top-0 z-30 text-white shadow-lg">
        <div className="flex items-center gap-2 min-w-0">
          {!isDashboard ? (
            <>
              <button
                onClick={() => setActiveTab('dashboard')}
                className="flex items-center justify-center w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all shrink-0 active:scale-95"
                aria-label="Go back to Dashboard"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-md shrink-0"
                style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                CM
              </div>
            </>
          ) : null}
          <div className="min-w-0">
            {isDashboard ? (
              <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 font-outfit text-[15px] truncate">CM Learning Hub</span>
            ) : (
              <span className="font-bold text-white font-outfit text-[15px] truncate">{currentTabName}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button onClick={toggleTheme} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all" aria-label="Toggle theme">
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>
          <button onClick={() => handleNavClick('notifications')} className="relative w-8 h-8 flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all" aria-label="Notifications">
            <Bell className="w-4 h-4" />
            {unreadNotifications > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center ring-1 ring-[#0f172a]">
                {unreadNotifications > 9 ? '9+' : unreadNotifications}
              </span>
            )}
          </button>
          <button onClick={() => setIsOpen(!isOpen)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all" aria-label="Open menu">
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* ═══ DESKTOP SIDEBAR ════════════════════════════════════════════════ */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 bg-[#0a0f1e] border-r border-slate-800/60 flex flex-col justify-between transition-all duration-300 ease-in-out
        lg:static lg:translate-x-0
        ${isCollapsed ? 'lg:w-[72px] w-72' : 'lg:w-64 w-72'}
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Top Branding */}
        <div className="flex flex-col min-h-0">
          <div className="p-4 border-b border-slate-800/60 flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-3 overflow-hidden">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-base font-outfit shadow-lg shrink-0"
                style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6,#ec4899)', boxShadow: '0 4px 14px rgba(99,102,241,0.4)' }}
              >
                CM
              </div>
              {!isCollapsed && (
                <div className="animate-fadeIn">
                  <h1 className="font-black text-white font-outfit text-sm leading-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">CM Learning Hub</h1>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Personal LMS</p>
                </div>
              )}
            </div>
            <button
              onClick={() => {
                const newVal = !isCollapsed;
                setIsCollapsed(newVal);
                localStorage.setItem('cm_sidebar_collapsed', String(newVal));
              }}
              className="hidden lg:block p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-800/80 transition-colors focus:outline-none"
              title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>

          {/* Role badge */}
          {!isCollapsed && (
            <div className="mx-3 mt-3 mb-1 px-3 py-2 bg-slate-800/40 rounded-xl border border-slate-700/40 animate-fadeIn shrink-0">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Active Role</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  role === 'admin'  ? 'bg-purple-900/50 text-purple-300 ring-1 ring-purple-700/40'
                  : role === 'mentor' ? 'bg-blue-900/50 text-blue-300 ring-1 ring-blue-700/40'
                  : 'bg-emerald-900/50 text-emerald-300 ring-1 ring-emerald-700/40'
                }`}>
                  {role === 'admin' ? '⚙ Admin' : role === 'mentor' ? '🎓 Mentor' : '📚 Student'}
                </span>
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="px-2.5 py-2 space-y-0.5 overflow-y-auto flex-1">
            {navItems.map((item) => {
              const Icon  = item.icon;
              const isActive = activeTab === item.id || (item.id === 'admin-users' && activeTab.startsWith('admin-users'));
              const color = getColor(item.id);

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  title={isCollapsed ? item.name : undefined}
                  className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group relative`}
                  style={isActive ? {
                    background: `linear-gradient(135deg, ${color.from}, ${color.to})`,
                    boxShadow: `0 4px 12px ${color.shadow}`,
                  } : {}}
                >
                  {/* Hover ghost for inactive */}
                  {!isActive && (
                    <span className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-150 bg-slate-800/70" />
                  )}

                  <div className="flex items-center space-x-3 overflow-hidden relative z-10">
                    {/* Icon bubble */}
                    {isActive ? (
                      <span className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-white" />
                      </span>
                    ) : (
                      <span
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 opacity-70 group-hover:opacity-100 transition-opacity"
                        style={{ background: `linear-gradient(135deg,${color.from}22,${color.to}22)` }}
                      >
                        <Icon className="w-4 h-4" style={{ color: color.from }} />
                      </span>
                    )}

                    {!isCollapsed && (
                      <span className={`truncate animate-fadeIn font-semibold ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-100'}`}>
                        {item.name}
                      </span>
                    )}
                  </div>

                  {/* Badge */}
                  {item.badge !== undefined && item.badge > 0 && (
                    isCollapsed ? (
                      <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-[#0a0f1e] shrink-0 z-20" />
                    ) : (
                      <span className="px-1.5 py-0.5 text-[9px] font-black bg-red-500 text-white rounded-full shrink-0 relative z-10 min-w-[18px] text-center">
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Profile */}
        <div className="p-3 border-t border-slate-800/60 bg-[#060b18]/60 shrink-0">
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} mb-3`}>
            <img
              src={profile.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || 'User')}&background=6366f1&color=fff`}
              alt={profile.name}
              referrerPolicy="no-referrer"
              className="w-9 h-9 rounded-xl object-cover ring-2 ring-slate-700 shrink-0"
            />
            {!isCollapsed && (
              <div className="min-w-0 flex-1 animate-fadeIn">
                <p className="text-sm font-bold text-slate-200 truncate leading-tight font-outfit">{profile.name}</p>
                <p className="text-xs text-slate-500 truncate font-medium">{profile.email}</p>
              </div>
            )}
          </div>

          <div className={`flex ${isCollapsed ? 'flex-col space-y-1.5 items-center' : 'items-center justify-between'} pt-2 border-t border-slate-800/40 text-slate-500`}>
            <button onClick={toggleTheme} className="p-2 hover:bg-slate-800 hover:text-white rounded-lg transition-colors focus:outline-none" title="Toggle Theme">
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
            <button onClick={() => handleNavClick('settings')} className="p-2 hover:bg-slate-800 hover:text-white rounded-lg transition-colors focus:outline-none" title="Settings">
              <Settings className="w-4 h-4" />
            </button>
            <button onClick={() => logout()} className="p-2 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors focus:outline-none" title="Logout">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {isOpen && <div onClick={() => setIsOpen(false)} className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden" />}

      {/* ═══ MOBILE BOTTOM NAV BAR ═══════════════════════════════════════════ */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#0a0f1e]/95 backdrop-blur-xl border-t border-slate-800/60">
        <div className="flex items-stretch">
          {mobileBottomNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const color = getColor(item.id);
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className="flex-1 flex flex-col items-center justify-center py-2.5 gap-1 relative transition-all active:scale-90"
              >
                {isActive && (
                  <span
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                    style={{ background: `linear-gradient(90deg,${color.from},${color.to})` }}
                  />
                )}
                <div className={`relative p-1.5 rounded-xl transition-all ${isActive ? 'bg-white/10' : ''}`}>
                  <Icon
                    className="w-5 h-5"
                    style={isActive ? { color: color.from } : { color: '#64748b' }}
                  />
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 text-white text-[7px] font-black rounded-full flex items-center justify-center">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </div>
                <span
                  className="text-[9px] font-bold leading-none"
                  style={isActive ? { color: color.from } : { color: '#475569' }}
                >
                  {item.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};
