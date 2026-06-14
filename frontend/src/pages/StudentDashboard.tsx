import React, { useState, useEffect } from 'react';
import { API_BASE } from '../config/api';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { ModalPortal } from '../components/Modal';
import { 
  BookOpen, 
  Clock, 
  FileText, 
  Flame, 
  Quote, 
  Trophy,
  Briefcase,
  Loader2,
  CheckCircle,
  AlertTriangle,
  TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface StudentDashboardProps {
  setActiveTab: (tab: string) => void;
}

const MOTIVATIONAL_QUOTES = [
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "The expert in anything was once a beginner.", author: "Helen Hayes" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "Our greatest weakness lies in giving up. The most certain way to succeed is always to try just one more time.", author: "Thomas A. Edison" }
];

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ setActiveTab }) => {
  const { 
    studentProfile, 
    homeworkList, 
    quizList, 
    quizSubmissions, 
    writtenTests, 
    streakDays, 
    achievements,
    leaderboard,
    fetchLeaderboard,
    attendanceStats
  } = useApp();
  
  const { token, fetchProfile } = useAuth();

  const [quote, setQuote] = useState(MOTIVATIONAL_QUOTES[0]);

  // Mentor Selection Modal State
  const [showMentorModal, setShowMentorModal] = useState(false);
  const [mentorsList, setMentorsList] = useState<any[]>([]);
  const [selectedMentor, setSelectedMentor] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  useEffect(() => {
    const randomIdx = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
    setQuote(MOTIVATIONAL_QUOTES[randomIdx]);
  }, []);

  // Check if mentor is needed
  useEffect(() => {
    if (studentProfile && studentProfile.id && !studentProfile.mentor_id) {
      setShowMentorModal(true);
      fetch(`${API_BASE}/api/users/mentors`)
        .then(res => res.json())
        .then(data => setMentorsList(data))
        .catch(err => console.error("Failed to fetch mentors", err));
    }
  }, [studentProfile]);

  const handleSelectMentor = async () => {
    if (!selectedMentor) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/users/change-mentor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ mentor_id: selectedMentor })
      });
      if (res.ok) {
        await fetchProfile(); // refresh auth context user
        setShowMentorModal(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Homework calculations
  const todayStr = new Date().toISOString().split('T')[0];
  const pendingHwList = homeworkList.filter(hw => hw.status === 'Pending');
  const todaysHwList = homeworkList.filter(hw => hw.date === todayStr);
  const completedHwCount = homeworkList.filter(hw => hw.date === todayStr && hw.status === 'Completed').length;
  
  // Upcoming items
  const nextQuiz = quizList[0];
  const nextTest = writtenTests[0];
  
  // Recent Results (merge submissions for lists)
  const recentQuizSub = quizSubmissions[0];

  // ── Yesterday Absent Check ────────────────────────────────────────────
  const yesterdayStr = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  })();
  const wasAbsentYesterday = attendanceStats?.history?.some(
    h => h.date === yesterdayStr && h.status === 'Absent'
  ) ?? false;

  // ── Overall Progress ─────────────────────────────────────────────────
  const totalHwCount = homeworkList.length;
  const completedAllHw = homeworkList.filter(h => h.status === 'Completed').length;
  const hwPct = totalHwCount > 0 ? Math.round((completedAllHw / totalHwCount) * 100) : 100;
  const quizAvgScore = quizSubmissions.length > 0
    ? Math.round(quizSubmissions.reduce((sum, s) => sum + s.accuracy, 0) / quizSubmissions.length)
    : 0;
  const attendancePct = attendanceStats?.percentage ?? 100;
  const overallScore = Math.round((hwPct + quizAvgScore + attendancePct) / 3);

  // ── SVG Ring Chart helper ─────────────────────────────────────────────
  const RingChart = ({ percentage, color, size = 80 }: { percentage: number; color: string; size?: number }) => {
    const r = (size - 12) / 2;
    const circ = 2 * Math.PI * r;
    const offset = circ - (percentage / 100) * circ;
    return (
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="currentColor" strokeWidth="6" className="text-slate-200 dark:text-slate-700" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
        />
      </svg>
    );
  };

  return (
    <div className="space-y-6 relative">
      
      {/* Latest Achievement Celebration Banner */}
      {achievements.length > 0 && (
        <div className="p-4 bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-transparent border border-amber-200/50 dark:border-amber-900/30 rounded-2xl flex items-center justify-between animate-fadeIn">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-amber-500 text-white rounded-xl flex items-center justify-center text-lg animate-bounce">
              🏆
            </div>
            <div>
              <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wider">Latest Unlock</p>
              <h4 className="text-sm font-extrabold text-slate-800 dark:text-white font-outfit">Unlocked Achievement: {achievements[0].name}</h4>
              <p className="text-xs text-slate-400 mt-0.5">{achievements[0].description}</p>
            </div>
          </div>
          <span className="text-[10px] font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2.5 py-1 rounded-lg">
            +{achievements.length * 100} XP
          </span>
        </div>
      )}
      
      {/* Mentor Selection Modal */}
      <AnimatePresence>
        {showMentorModal && (
          <ModalPortal onClose={() => setShowMentorModal(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full p-8 border border-slate-200 dark:border-slate-800"
            >
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <Briefcase className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              </div>
              <h2 className="text-2xl font-bold font-outfit text-center text-slate-800 dark:text-white mb-2">Welcome, {studentProfile.name}!</h2>
              <p className="text-center text-slate-500 dark:text-slate-400 mb-8">
                Before you dive into your dashboard, please select a mentor to guide your journey.
              </p>

              <div className="space-y-4">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <select
                    value={selectedMentor}
                    onChange={(e) => setSelectedMentor(Number(e.target.value) || '')}
                    className="block w-full pl-11 pr-10 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 font-medium appearance-none"
                  >
                    <option value="">-- Choose a Mentor --</option>
                    {mentorsList.map(m => (
                      <option key={m.id} value={m.id}>{m.name} ({m.tid})</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleSelectMentor}
                  disabled={!selectedMentor || isSubmitting}
                  className="w-full flex items-center justify-center py-3.5 px-4 rounded-xl shadow-lg text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Confirm Selection
                      <CheckCircle className="w-5 h-5 ml-2" />
                    </>
                  )}
                </button>

                <button
                  onClick={() => setShowMentorModal(false)}
                  className="w-full flex items-center justify-center py-2 px-4 text-sm font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                >
                  Skip for now
                </button>
              </div>
            </motion.div>
          </ModalPortal>
        )}
      </AnimatePresence>

      {/* ── Yesterday Absent Alert ── */}
      {wasAbsentYesterday && (
        <div className="p-4 bg-orange-500/10 border border-orange-400/30 dark:border-orange-900/30 rounded-2xl flex items-start gap-3 animate-fadeIn">
          <div className="w-9 h-9 bg-orange-100 dark:bg-orange-950/30 rounded-xl flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <p className="text-sm font-bold text-orange-700 dark:text-orange-400">You were marked Absent yesterday ({yesterdayStr})</p>
            <p className="text-xs text-orange-600/70 dark:text-orange-500/70 mt-0.5">Please check with your mentor if this was a mistake.</p>
          </div>
        </div>
      )}

      {/* Student Banner */}
      <div className="relative overflow-hidden rounded-2xl p-6 text-white"
        style={{ background: 'linear-gradient(135deg,#0ea5e9 0%,#6366f1 50%,#ec4899 100%)' }}>
        <div className="absolute -top-8 -right-8 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-6 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="bg-white/20 text-white font-bold text-[10px] px-2.5 py-1 rounded-full uppercase tracking-widest">
              Student Portal
            </span>
            <h2 className="text-xl sm:text-2xl font-black font-outfit mt-2">Hi, {studentProfile.name}! 👋</h2>
            <p className="text-white/75 text-sm mt-1">Keep up the great momentum. Here's your daily overview.</p>
          </div>
          <div className="flex items-center gap-3 self-start md:self-auto">
            <div className="flex items-center gap-2.5 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/15">
              <Flame className="w-5 h-5 text-orange-300 fill-orange-300 animate-bounce" />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-white/70 font-semibold">My Streak</p>
                <p className="text-sm font-extrabold font-outfit">{streakDays} Days 🔥</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/15">
              <Trophy className="w-5 h-5 text-yellow-300" />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-white/70 font-semibold">Achievements</p>
                <p className="text-sm font-extrabold font-outfit">{achievements.length} Unlocked</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Note from Mentor */}
      {studentProfile.mentor_notes && (
        <div className="p-5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 rounded-2xl flex items-start gap-4 shadow-sm animate-fadeIn">
          <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/40 rounded-xl flex items-center justify-center shrink-0 shadow-inner">
            <span className="text-lg">📌</span>
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-extrabold text-amber-800 dark:text-amber-300 font-outfit leading-tight">Sticky Note from Mentor</h4>
            <p className="text-xs text-slate-700 dark:text-slate-350 mt-1 leading-relaxed whitespace-pre-wrap font-medium">{studentProfile.mentor_notes}</p>
          </div>
        </div>
      )}

      {/* ── Gradient Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Attendance */}
        <div className="relative overflow-hidden rounded-2xl p-5 text-white shadow-lg shadow-blue-500/25 bg-gradient-to-br from-blue-500 to-indigo-600">
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full" />
          <div className="w-10 h-10 bg-blue-400/20 ring-1 ring-blue-400/30 rounded-xl flex items-center justify-center mb-3">
            <CheckCircle className="w-5 h-5 text-white" />
          </div>
          <div className="flex items-center gap-3 mb-1">
            <p className="text-3xl font-extrabold font-outfit">
              {attendanceStats ? `${Math.round(attendanceStats.percentage)}%` : '100%'}
            </p>
            <RingChart percentage={attendanceStats?.percentage ?? 100} color="rgba(255,255,255,0.9)" size={48} />
          </div>
          <p className="text-xs text-white/70 font-semibold uppercase tracking-wider">Attendance</p>
          <p className="text-xs text-white/60 mt-0.5">{attendanceStats?.present_count ?? 0} / {attendanceStats?.total_days ?? 0} days</p>
        </div>

        {/* Today's Homework */}
        <div className="relative overflow-hidden rounded-2xl p-5 text-white shadow-lg shadow-indigo-500/25 bg-gradient-to-br from-indigo-500 to-purple-600">
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full" />
          <div className="w-10 h-10 bg-indigo-400/20 ring-1 ring-indigo-400/30 rounded-xl flex items-center justify-center mb-3">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <p className="text-3xl font-extrabold font-outfit mb-1">{completedHwCount}/{todaysHwList.length}</p>
          <p className="text-xs text-white/70 font-semibold uppercase tracking-wider">Today's Homework</p>
          <p className="text-xs text-white/60 mt-0.5">{todaysHwList.length - completedHwCount} pending</p>
          <button onClick={() => setActiveTab('homework')} className="mt-2 text-[10px] font-bold bg-white/20 hover:bg-white/30 px-2.5 py-1 rounded-full transition-colors">
            Open →
          </button>
        </div>

        {/* Next Quiz */}
        <div className="relative overflow-hidden rounded-2xl p-5 text-white shadow-lg shadow-emerald-500/25 bg-gradient-to-br from-emerald-500 to-teal-600">
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full" />
          <div className="w-10 h-10 bg-emerald-400/20 ring-1 ring-emerald-400/30 rounded-xl flex items-center justify-center mb-3">
            <Clock className="w-5 h-5 text-white" />
          </div>
          {nextQuiz ? (
            <>
              <p className="text-sm font-extrabold font-outfit leading-tight mb-1 line-clamp-2">{nextQuiz.quizName}</p>
              <p className="text-xs text-white/70 font-semibold uppercase tracking-wider">Next Quiz</p>
              <p className="text-xs text-white/60 mt-0.5">{nextQuiz.subject} · {nextQuiz.questions.length}Q</p>
              <button onClick={() => setActiveTab('quizzes')} className="mt-2 text-[10px] font-bold bg-white/20 hover:bg-white/30 px-2.5 py-1 rounded-full transition-colors">
                Start →
              </button>
            </>
          ) : (
            <>
              <p className="text-sm font-extrabold font-outfit">All Done! ✨</p>
              <p className="text-xs text-white/70 font-semibold uppercase tracking-wider mt-1">Next Quiz</p>
            </>
          )}
        </div>

        {/* Upcoming Test */}
        <div className="relative overflow-hidden rounded-2xl p-5 text-white shadow-lg shadow-amber-500/25 bg-gradient-to-br from-amber-500 to-orange-600">
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full" />
          <div className="w-10 h-10 bg-amber-400/20 ring-1 ring-amber-400/30 rounded-xl flex items-center justify-center mb-3">
            <FileText className="w-5 h-5 text-white" />
          </div>
          {nextTest ? (
            <>
              <p className="text-sm font-extrabold font-outfit leading-tight mb-1 line-clamp-2">{nextTest.testName}</p>
              <p className="text-xs text-white/70 font-semibold uppercase tracking-wider">Upcoming Test</p>
              <p className="text-xs text-white/60 mt-0.5">Due: {new Date(nextTest.endDate || '').toLocaleDateString()}</p>
              <button onClick={() => setActiveTab('tests')} className="mt-2 text-[10px] font-bold bg-white/20 hover:bg-white/30 px-2.5 py-1 rounded-full transition-colors">
                View →
              </button>
            </>
          ) : (
            <>
              <p className="text-sm font-extrabold font-outfit">No exams 📚</p>
              <p className="text-xs text-white/70 font-semibold uppercase tracking-wider mt-1">Upcoming Test</p>
            </>
          )}
        </div>
      </div>


      {/* ── Overall Progress Summary ── */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-200/50 dark:border-slate-700/40">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-primary-500" />
          <h3 className="font-bold text-sm uppercase tracking-wider text-slate-700 dark:text-slate-300">Overall Progress</h3>
          <span className="ml-auto text-xs font-black text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/20 px-2.5 py-1 rounded-full">
            {overallScore}% Combined
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {[
            { label: 'Homework', pct: hwPct, color: '#2563eb', desc: `${completedAllHw}/${totalHwCount} done` },
            { label: 'Quiz Avg', pct: quizAvgScore, color: '#16a34a', desc: `${quizSubmissions.length} taken` },
            { label: 'Attendance', pct: Math.round(attendancePct), color: '#d97706', desc: `${attendanceStats?.present_count ?? 0} days present` },
          ].map(item => (
            <div key={item.label} className="flex flex-col items-center gap-2">
              <div className="relative">
                <RingChart percentage={item.pct} color={item.color} size={70} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-black text-slate-800 dark:text-white">{item.pct}%</span>
                </div>
              </div>
              <div className="text-center">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{item.label}</p>
                <p className="text-[10px] text-slate-400">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main split grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Pending Homework & Recent Result */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pending homework cards */}
          <div className="glass-panel p-5 rounded-2xl">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-800 dark:text-white font-outfit">Pending Homework</h3>
              <span className="text-xs text-slate-400 font-bold">{pendingHwList.length} Tasks Left</span>
            </div>

            {pendingHwList.length > 0 ? (
              <div className="space-y-3">
                {pendingHwList.slice(0, 3).map((hw) => (
                  <div key={hw.id} className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl flex items-center justify-between border border-slate-200/40 dark:border-slate-800/40 hover:border-indigo-200 dark:hover:border-indigo-800/40 transition-colors">
                    <div className="flex-1 min-w-0 mr-3">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          hw.priority === 'High'   ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                          hw.priority === 'Medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                          'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                          {hw.priority}
                        </span>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                          {hw.subject}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-slate-800 dark:text-white font-outfit truncate">{hw.title}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">Due: {hw.dueDate}</p>
                    </div>
                    <button
                      onClick={() => setActiveTab('homework')}
                      className="px-3 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-sm transition-all active:scale-95 shrink-0"
                    >
                      Solve
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-emerald-600 font-bold">🎉 All Homework Completed Today!</p>
              </div>
            )}
          </div>

          {/* Recent Performance Result summary */}
          {recentQuizSub && (
            <div className="glass-panel p-5 rounded-2xl bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-900/30">
              <h3 className="font-bold text-base text-slate-800 dark:text-white font-outfit mb-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                Recent Quiz Report
              </h3>
              
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h4 className="font-bold text-base text-slate-800 dark:text-white font-outfit">{recentQuizSub.quizName}</h4>
                  <p className="text-xs text-slate-400 mt-1">Accuracy: <strong className="text-success-600 dark:text-success-400">{recentQuizSub.accuracy.toFixed(0)}%</strong> • Completed in {(recentQuizSub.timeTaken / 60).toFixed(1)} mins</p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="text-center bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 p-2.5 rounded-xl min-w-[70px]">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Score</p>
                    <p className="text-base font-extrabold text-slate-800 dark:text-white">{recentQuizSub.score} / {recentQuizSub.totalMarks}</p>
                  </div>
                  <button 
                    onClick={() => setActiveTab('analytics')}
                    className="px-3.5 py-2.5 text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-bold rounded-xl transition-all"
                  >
                    Details
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Achievements & Quotes */}
        <div className="space-y-6">
          {/* Motivational Quote */}
          <div className="glass-panel p-5 rounded-2xl bg-gradient-to-br from-primary-500/10 to-transparent border-primary-200/30">
            <Quote className="w-6 h-6 text-primary-500 opacity-60 mb-2" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 italic leading-relaxed">
              "{quote.text}"
            </p>
            <p className="text-xs font-bold text-primary-600 dark:text-primary-400 mt-3 text-right">
              — {quote.author}
            </p>
          </div>

          {/* Streak Leaderboard Widget */}
          <div className="glass-panel p-5 rounded-2xl">
            <div className="flex items-center space-x-2 mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Flame className="w-5 h-5 text-orange-500" />
              <h3 className="font-bold text-sm text-slate-800 dark:text-white font-outfit">Streak Leaderboard</h3>
            </div>
            <div className="space-y-2.5">
              {leaderboard.slice(0, 5).map((student, idx) => {
                const isSelf = student.id === studentProfile.id;
                return (
                  <div key={student.id} className={`flex items-center justify-between p-2 rounded-xl text-xs ${isSelf ? 'bg-orange-50 dark:bg-orange-950/20 border border-orange-200/50 dark:border-orange-900/30' : ''}`}>
                    <div className="flex items-center space-x-2.5">
                      <span className="font-extrabold text-slate-400 w-4 text-center">#{idx + 1}</span>
                      <img 
                        src={student.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=0D8ABC&color=fff`} 
                        alt={student.name} 
                        className="w-7 h-7 rounded-lg object-cover ring-1 ring-slate-150"
                      />
                      <span className={`font-bold ${isSelf ? 'text-orange-700 dark:text-orange-300 font-extrabold' : 'text-slate-650 dark:text-slate-300'}`}>
                        {student.name} {isSelf && '(You)'}
                      </span>
                    </div>
                    <span className="font-extrabold flex items-center text-orange-600 dark:text-orange-400">
                      <Flame className="w-3.5 h-3.5 mr-0.5 fill-current" />
                      {isSelf ? streakDays : student.streak}d
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Achievements Unlocked Badge Widget */}
          <div className="glass-panel p-5 rounded-2xl">
            <div className="flex items-center space-x-2 mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Trophy className="w-5 h-5 text-amber-500" />
              <h3 className="font-bold text-sm text-slate-800 dark:text-white font-outfit">My Achievements</h3>
            </div>

            <div className="space-y-3.5">
              {achievements.map((ach) => (
                <div key={ach.id} className="flex items-start space-x-3 group">
                  <div className="w-9 h-9 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-lg shadow-sm border border-slate-200/30 dark:border-slate-700/30 group-hover:scale-110 transition-transform">
                    {ach.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-white font-outfit leading-tight">{ach.name}</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5 truncate">{ach.description}</p>
                    <p className="text-[9px] text-slate-400/80 mt-0.5">Unlocked: {new Date(ach.unlockedAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
