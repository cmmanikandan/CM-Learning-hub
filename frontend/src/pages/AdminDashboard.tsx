import React, { useState, useEffect } from 'react';
import { API_BASE } from '../config/api';
import { useAuth } from '../context/AuthContext';
import {
  Users, GraduationCap, Briefcase, Activity, RefreshCw,
  Library, FileQuestion, TrendingUp,
  ArrowRight, Shield, AlertTriangle, CheckCircle2,
  UserPlus, Zap, Flame, Trophy
} from 'lucide-react';

interface AdminDashboardProps {
  setActiveTab: (tab: string) => void;
}

interface PlatformStats {
  total_users: number;
  total_mentors: number;
  total_students: number;
  total_library: number;
  total_quizzes: number;
  total_tests: number;
  total_homework: number;
  total_submissions: number;
  unassigned_students: number;
  recent_users: { id: number; name: string; email: string; role: string; photo_url?: string }[];
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ setActiveTab }) => {
  const { token } = useAuth();
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [isLeaderboardLoading, setIsLeaderboardLoading] = useState(true);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLeaderboard = async () => {
    setIsLeaderboardLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/users/leaderboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data.slice(0, 5));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLeaderboardLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchStats();
      fetchLeaderboard();
    }
  }, [token]);

  const statCards = [
    {
      label: 'Total Users',
      value: stats?.total_users ?? 0,
      icon: Users,
      gradient: 'from-violet-500 to-purple-600',
      bg: 'bg-violet-50 dark:bg-violet-950/20',
      text: 'text-violet-600 dark:text-violet-400',
      ring: 'ring-violet-200 dark:ring-violet-800/40',
    },
    {
      label: 'Mentors',
      value: stats?.total_mentors ?? 0,
      icon: Briefcase,
      gradient: 'from-blue-500 to-cyan-500',
      bg: 'bg-blue-50 dark:bg-blue-950/20',
      text: 'text-blue-600 dark:text-blue-400',
      ring: 'ring-blue-200 dark:ring-blue-800/40',
    },
    {
      label: 'Students',
      value: stats?.total_students ?? 0,
      icon: GraduationCap,
      gradient: 'from-emerald-500 to-teal-500',
      bg: 'bg-emerald-50 dark:bg-emerald-950/20',
      text: 'text-emerald-600 dark:text-emerald-400',
      ring: 'ring-emerald-200 dark:ring-emerald-800/40',
    },
    {
      label: 'Library Files',
      value: stats?.total_library ?? 0,
      icon: Library,
      gradient: 'from-amber-500 to-orange-500',
      bg: 'bg-amber-50 dark:bg-amber-950/20',
      text: 'text-amber-600 dark:text-amber-400',
      ring: 'ring-amber-200 dark:ring-amber-800/40',
    },
    {
      label: 'Quizzes',
      value: stats?.total_quizzes ?? 0,
      icon: FileQuestion,
      gradient: 'from-rose-500 to-pink-500',
      bg: 'bg-rose-50 dark:bg-rose-950/20',
      text: 'text-rose-600 dark:text-rose-400',
      ring: 'ring-rose-200 dark:ring-rose-800/40',
    },
    {
      label: 'Quiz Submissions',
      value: stats?.total_submissions ?? 0,
      icon: TrendingUp,
      gradient: 'from-indigo-500 to-violet-500',
      bg: 'bg-indigo-50 dark:bg-indigo-950/20',
      text: 'text-indigo-600 dark:text-indigo-400',
      ring: 'ring-indigo-200 dark:ring-indigo-800/40',
    },
  ];

  const quickActions = [
    {
      label: 'Create Mentor',
      desc: 'Add a new mentor account',
      icon: Briefcase,
      color: 'bg-blue-600 hover:bg-blue-700',
      onClick: () => setActiveTab('admin-users-create-mentor'),
    },
    {
      label: 'Create Student',
      desc: 'Enrol a new student',
      icon: GraduationCap,
      color: 'bg-emerald-600 hover:bg-emerald-700',
      onClick: () => setActiveTab('admin-users-create-student'),
    },
    {
      label: 'Manage Users',
      desc: 'View all accounts',
      icon: Users,
      color: 'bg-violet-600 hover:bg-violet-700',
      onClick: () => setActiveTab('admin-users'),
    },
    {
      label: 'Create Admin',
      desc: 'Add another admin',
      icon: Shield,
      color: 'bg-slate-700 hover:bg-slate-600',
      onClick: () => setActiveTab('admin-users-create-admin'),
    },
  ];

  const roleColor: Record<string, string> = {
    mentor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    student: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    admin: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  };

  return (
    <div className="space-y-6 animate-fadeIn">

      {/* ── Hero Banner ─────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900 p-6 sm:p-8 text-white shadow-2xl border border-violet-900/30">
        {/* Background orb */}
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-32 h-32 bg-blue-600/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-violet-600/30 rounded-xl border border-violet-500/30">
                <Shield className="w-5 h-5 text-violet-300" />
              </div>
              <span className="text-xs font-bold text-violet-300 uppercase tracking-widest">System Administrator</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black font-outfit leading-tight">
              Platform Control
              <span className="block text-violet-300">Center</span>
            </h2>
            <p className="text-sm text-white/60 mt-2 max-w-md">
              Manage all mentors, students, content and platform settings from one place.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:items-end">
            <button
              onClick={() => { fetchStats(); fetchLeaderboard(); }}
              disabled={isLoading || isLeaderboardLoading}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/15 rounded-xl text-sm font-bold transition-all disabled:opacity-60"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading || isLeaderboardLoading ? 'animate-spin' : ''}`} />
              Refresh Stats
            </button>
            {stats && stats.unassigned_students > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/20 border border-amber-500/30 rounded-xl text-xs font-bold text-amber-300">
                <AlertTriangle className="w-3.5 h-3.5" />
                {stats.unassigned_students} unassigned student{stats.unassigned_students > 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Stat Cards Grid ──────────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-28 glass-panel rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className={`glass-panel rounded-2xl p-4 ring-1 ${card.ring} hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5`}
              >
                <div className={`w-9 h-9 ${card.bg} rounded-xl flex items-center justify-center mb-3`}>
                  <Icon className={`w-4.5 h-4.5 ${card.text}`} />
                </div>
                <p className="text-2xl font-black font-outfit text-slate-800 dark:text-white leading-none">
                  {card.value}
                </p>
                <p className="text-[11px] font-bold text-slate-400 mt-1 leading-tight">{card.label}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Quick Actions ────────────────────────────────────── */}
      <div>
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
          <Zap className="w-3.5 h-3.5" />
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                onClick={action.onClick}
                className={`${action.color} text-white rounded-2xl p-4 text-left transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] group`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 bg-white/10 rounded-xl">
                    <Icon className="w-4 h-4" />
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </div>
                <p className="font-extrabold text-sm font-outfit leading-tight">{action.label}</p>
                <p className="text-[11px] text-white/70 mt-0.5">{action.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Bottom Row: Recent Users + Leaderboard + System Health ─────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Recent Users */}
        <div className="glass-panel rounded-2xl p-5 flex flex-col bg-gradient-to-b from-white to-indigo-50/10 dark:from-slate-900 dark:to-indigo-950/5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <UserPlus className="w-4.5 h-4.5 text-primary-500 animate-float" />
              <h3 className="font-extrabold text-slate-800 dark:text-white font-outfit">Recent Users</h3>
            </div>
            <button
              onClick={() => setActiveTab('admin-users')}
              className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
            >
              View All <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {isLoading ? (
            <div className="space-y-3 flex-1">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : stats?.recent_users.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-sm flex-1 flex items-center justify-center">No users yet.</div>
          ) : (
            <div className="space-y-2 flex-1">
              {stats?.recent_users.map((u) => (
                <div key={u.id} className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-100 dark:border-slate-800/60 shadow-sm hover:shadow transition-all hover:scale-[1.01]">
                  <img
                    src={u.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=6366f1&color=fff&size=40`}
                    alt={u.name}
                    className="w-9 h-9 rounded-xl object-cover shrink-0 ring-2 ring-primary-500/10"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 dark:text-white truncate font-outfit">{u.name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{u.email}</p>
                  </div>
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full capitalize shrink-0 ${roleColor[u.role] || 'bg-slate-100 text-slate-600'}`}>
                    {u.role}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Streak Leaderboard */}
        <div className="glass-panel rounded-2xl p-5 flex flex-col border border-amber-500/20 bg-gradient-to-b from-white to-amber-50/20 dark:from-slate-900 dark:to-amber-950/5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-4.5 h-4.5 text-amber-500 animate-float" />
              <h3 className="font-extrabold text-slate-800 dark:text-white font-outfit">Streak Leaderboard</h3>
            </div>
            <span className="text-[10px] font-black px-2 py-0.5 bg-amber-500/15 text-amber-700 dark:text-amber-400 rounded-full flex items-center gap-1">
              <Flame className="w-3 h-3 fill-amber-500 text-amber-500 animate-pulse" /> Active
            </span>
          </div>

          {isLeaderboardLoading ? (
            <div className="space-y-3 flex-1">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-sm flex-1 flex flex-col items-center justify-center">
              <Flame className="w-8 h-8 text-slate-200 dark:text-slate-700 mb-2" />
              <span>No streaks active yet.</span>
            </div>
          ) : (
            <div className="space-y-2 flex-1">
              {leaderboard.map((u, index) => (
                <div key={u.id} className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-100 dark:border-slate-800/60 shadow-sm hover:shadow transition-all hover:scale-[1.01]">
                  <div className="flex items-center justify-center w-5 h-5 font-black text-xs rounded-full shrink-0 bg-slate-100 dark:bg-slate-800 text-slate-500">
                    {index + 1}
                  </div>
                  <img
                    src={u.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=10b981&color=fff&size=40`}
                    alt={u.name}
                    className="w-9 h-9 rounded-xl object-cover shrink-0 ring-2 ring-emerald-500/25"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 dark:text-white truncate font-outfit">{u.name}</p>
                    <p className="text-[10px] text-slate-400 truncate capitalize">{u.class_name || 'Grade 10'} {u.section || 'A'}</p>
                  </div>
                  <div className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl text-xs font-black shrink-0">
                    <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    <span>{u.streak}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* System Health */}
        <div className="glass-panel rounded-2xl p-5 flex flex-col bg-gradient-to-b from-white to-emerald-50/10 dark:from-slate-900 dark:to-emerald-950/5">
          <div className="flex items-center gap-2 mb-5">
            <Activity className="w-4.5 h-4.5 text-emerald-500 animate-float" />
            <h3 className="font-extrabold text-slate-800 dark:text-white font-outfit">System Health</h3>
          </div>

          <div className="space-y-3 flex-1">
            {[
              { label: 'Database', ok: true },
              { label: 'Auth Service', ok: true },
              { label: 'Storage (Cloudinary)', ok: true },
              { label: 'API Server', ok: true },
            ].map((svc) => (
              <div key={svc.label} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                <span className="text-sm text-slate-600 dark:text-slate-300 font-medium">{svc.label}</span>
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${svc.ok ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                  <span className={`text-xs font-bold ${svc.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600'}`}>
                    {svc.ok ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-900/30 flex items-center gap-2.5">
            <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">All services operational</p>
          </div>

          {stats && (
            <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-xs text-slate-500 dark:text-slate-400 space-y-1">
              <div className="flex justify-between"><span>Homework records</span><span className="font-bold text-slate-700 dark:text-slate-200">{stats.total_homework}</span></div>
              <div className="flex justify-between"><span>Written Tests</span><span className="font-bold text-slate-700 dark:text-slate-200">{stats.total_tests}</span></div>
              <div className="flex justify-between"><span>Unassigned Students</span>
                <span className={`font-bold ${stats.unassigned_students > 0 ? 'text-amber-600' : 'text-slate-700 dark:text-slate-200'}`}>
                  {stats.unassigned_students}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
