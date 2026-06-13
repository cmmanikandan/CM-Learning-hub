import React from 'react';
import { useApp } from '../context/AppContext';
import type { Quiz, WrittenTest } from '../context/AppContext';
import {
  BookOpen,
  Calendar as CalendarIcon,
  Clock,
  FileText,
  Flame,
  GraduationCap,
  PlusCircle,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  BarChart3,
  Zap,
  Users,
  Award,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

interface MentorDashboardProps {
  setActiveTab: (tab: string) => void;
  openHomeworkModal: () => void;
  openQuizModal: () => void;
  openMaterialModal: () => void;
  openTestModal: () => void;
}

export const MentorDashboard: React.FC<MentorDashboardProps> = ({
  setActiveTab,
  openHomeworkModal,
  openQuizModal,
  openMaterialModal,
  openTestModal
}) => {
  const {
    studentProfile,
    mentorProfile,
    homeworkList,
    quizList,
    quizSubmissions,
    writtenTests,
    writtenTestSubmissions,
    streakDays,
    updateMentorNotes
  } = useApp();

  const [stickyNotes,       setStickyNotes]       = React.useState(studentProfile?.mentor_notes || '');
  const [isSavingNotes,     setIsSavingNotes]     = React.useState(false);
  const [saveNotesSuccess,  setSaveNotesSuccess]  = React.useState(false);

  React.useEffect(() => {
    setStickyNotes(studentProfile?.mentor_notes || '');
  }, [studentProfile]);

  const handleSaveNotes = async () => {
    if (!studentProfile?.id) return;
    setIsSavingNotes(true);
    const ok = await updateMentorNotes(studentProfile.id, stickyNotes);
    setIsSavingNotes(false);
    if (ok) { setSaveNotesSuccess(true); setTimeout(() => setSaveNotesSuccess(false), 2000); }
  };

  const studentHwList  = homeworkList.filter(hw => hw.studentId === studentProfile?.id);
  const studentQuizSubs = quizSubmissions.filter(sub => sub.studentId === studentProfile?.id);
  const studentTestSubs = writtenTestSubmissions.filter(sub => sub.studentId === studentProfile?.id);

  const todayStr    = new Date().toISOString().split('T')[0];
  const todaysHomework = studentHwList.filter(hw => hw.date === todayStr);
  const totalHw     = todaysHomework.length;
  const completedHw = todaysHomework.filter(hw => hw.status === 'Completed').length;
  const pendingHw   = totalHw - completedHw;
  const hwPct       = totalHw > 0 ? Math.round((completedHw / totalHw) * 100) : 0;

  const upcomingQuiz: Quiz | undefined        = quizList[0];
  const upcomingTest: WrittenTest | undefined = writtenTests[0];

  const avgQuizAcc = studentQuizSubs.length > 0
    ? Math.round(studentQuizSubs.reduce((s, x) => s + x.accuracy, 0) / studentQuizSubs.length)
    : 0;

  const gradedTests = studentTestSubs.filter(s => s.status === 'Graded');
  const avgTestScore = gradedTests.length > 0
    ? Math.round(gradedTests.reduce((s, x) => s + ((x.marksObtained || 0) / x.totalMarks * 100), 0) / gradedTests.length)
    : 0;

  const performanceData = [
    { name: 'Wk 1', QuizScore: 60, TestScore: 65 },
    { name: 'Wk 2', QuizScore: 68, TestScore: 72 },
    { name: 'Wk 3', QuizScore: 75, TestScore: 80 },
    { name: 'Wk 4', QuizScore: avgQuizAcc || 82, TestScore: avgTestScore || 85 },
  ];

  /* ── Calendar ── */
  const renderCalendarDays = () => {
    const today = new Date();
    const yr = today.getFullYear(), mo = today.getMonth();
    const firstDay = new Date(yr, mo, 1).getDay();
    const daysInMonth = new Date(yr, mo + 1, 0).getDate();
    const days: React.ReactNode[] = [];
    for (let i = 0; i < firstDay; i++) days.push(<div key={`b${i}`} className="p-2 text-transparent">.</div>);
    for (let d = 1; d <= daysInMonth; d++) {
      const ds = `${yr}-${String(mo + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const hasHw   = studentHwList.some(hw => hw.date === ds || hw.dueDate === ds);
      const hasQuiz = studentQuizSubs.some(qs => qs.submittedAt.startsWith(ds));
      const hasTest = studentTestSubs.some(t => t.submissionDate?.startsWith(ds));
      const isToday = d === today.getDate();
      days.push(
        <div key={d} className={`p-1.5 min-h-[40px] border rounded-lg flex flex-col justify-between relative ${
          isToday ? 'bg-indigo-500/15 border-indigo-500/50' : 'border-slate-100 dark:border-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-800/20'
        }`}>
          <span className={`text-xs font-bold ${isToday ? 'text-indigo-500 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400'}`}>{d}</span>
          <div className="flex space-x-0.5 justify-center mt-0.5">
            {hasHw   && <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
            {hasQuiz && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
            {hasTest && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
          </div>
        </div>
      );
    }
    return days;
  };

  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  /* ── Stat card data ── */
  const statCards = [
    {
      label: "Today's Homework",
      value: `${completedHw}/${totalHw}`,
      sub: `${pendingHw} pending`,
      icon: BookOpen,
      gradient: 'from-blue-500 to-indigo-600',
      shadow: 'shadow-blue-500/25',
      iconBg: 'bg-blue-400/20',
      ring: 'ring-blue-400/30',
      badge: hwPct + '%',
      badgeColor: 'bg-blue-400/20 text-blue-200',
    },
    {
      label: 'Quiz Accuracy',
      value: avgQuizAcc ? `${avgQuizAcc}%` : 'N/A',
      sub: `${studentQuizSubs.length} submissions`,
      icon: Zap,
      gradient: 'from-emerald-500 to-teal-600',
      shadow: 'shadow-emerald-500/25',
      iconBg: 'bg-emerald-400/20',
      ring: 'ring-emerald-400/30',
      badge: upcomingQuiz ? 'Quiz scheduled' : 'No quiz',
      badgeColor: 'bg-emerald-400/20 text-emerald-200',
    },
    {
      label: 'Test Score Avg',
      value: avgTestScore ? `${avgTestScore}%` : 'N/A',
      sub: `${gradedTests.length} graded`,
      icon: FileText,
      gradient: 'from-amber-500 to-orange-600',
      shadow: 'shadow-amber-500/25',
      iconBg: 'bg-amber-400/20',
      ring: 'ring-amber-400/30',
      badge: upcomingTest ? 'Test pending' : 'No test',
      badgeColor: 'bg-amber-400/20 text-amber-200',
    },
    {
      label: 'Study Streak',
      value: `${streakDays}d`,
      sub: 'Consecutive days',
      icon: Flame,
      gradient: 'from-pink-500 to-rose-600',
      shadow: 'shadow-pink-500/25',
      iconBg: 'bg-pink-400/20',
      ring: 'ring-pink-400/30',
      badge: streakDays >= 7 ? '🔥 On fire!' : 'Keep going',
      badgeColor: 'bg-pink-400/20 text-pink-200',
    },
  ];

  /* ── Quick actions ── */
  const quickActions = [
    {
      label: 'Add Homework',
      icon: PlusCircle,
      onClick: openHomeworkModal,
      gradient: 'from-blue-500 to-indigo-600',
      shadow: 'shadow-blue-500/30',
      bg: 'bg-blue-500/10 hover:bg-blue-500/20 dark:bg-blue-900/20 dark:hover:bg-blue-900/40',
      text: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-200/60 dark:border-blue-800/50',
    },
    {
      label: 'Create Quiz',
      icon: GraduationCap,
      onClick: openQuizModal,
      gradient: 'from-emerald-500 to-teal-600',
      shadow: 'shadow-emerald-500/30',
      bg: 'bg-emerald-500/10 hover:bg-emerald-500/20 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40',
      text: 'text-emerald-600 dark:text-emerald-400',
      border: 'border-emerald-200/60 dark:border-emerald-800/50',
    },
    {
      label: 'Upload Material',
      icon: UploadCloud,
      onClick: openMaterialModal,
      gradient: 'from-cyan-500 to-sky-600',
      shadow: 'shadow-cyan-500/30',
      bg: 'bg-cyan-500/10 hover:bg-cyan-500/20 dark:bg-cyan-900/20 dark:hover:bg-cyan-900/40',
      text: 'text-cyan-600 dark:text-cyan-400',
      border: 'border-cyan-200/60 dark:border-cyan-800/50',
    },
    {
      label: 'Schedule Test',
      icon: FileText,
      onClick: openTestModal,
      gradient: 'from-amber-500 to-orange-600',
      shadow: 'shadow-amber-500/30',
      bg: 'bg-amber-500/10 hover:bg-amber-500/20 dark:bg-amber-900/20 dark:hover:bg-amber-900/40',
      text: 'text-amber-600 dark:text-amber-400',
      border: 'border-amber-200/60 dark:border-amber-800/50',
    },
  ];

  return (
    <div className="space-y-6">

      {/* ── Hero Banner ─────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl p-6 text-white"
        style={{ background: 'linear-gradient(135deg,#6366f1 0%,#8b5cf6 50%,#ec4899 100%)' }}>
        {/* Decorative blobs */}
        <div className="absolute -top-8 -right-8 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-6 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-widest text-white/60">Mentor Portal</span>
            </div>
            <h2 className="text-2xl font-black font-outfit">Welcome back, {mentorProfile?.name || 'Mentor'}! 👋</h2>
            <p className="text-white/75 text-sm mt-1">
              Monitoring <strong className="text-white">{studentProfile.name}</strong> · Let's check today's progress.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <div className="flex items-center gap-2.5 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/15">
              <Flame className="w-5 h-5 text-amber-300 fill-amber-300 animate-pulse" />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-white/70 font-semibold">Streak</p>
                <p className="text-sm font-extrabold font-outfit">{streakDays} Days 🔥</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/15">
              <Award className="w-5 h-5 text-yellow-300" />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-white/70 font-semibold">Quizzes</p>
                <p className="text-sm font-extrabold font-outfit">{quizList.length} Active</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Colourful Stat Cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(card => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={`relative overflow-hidden rounded-2xl p-5 text-white shadow-lg ${card.shadow} bg-gradient-to-br ${card.gradient}`}
            >
              {/* Decorative circle */}
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full" />
              <div className={`w-10 h-10 ${card.iconBg} ring-1 ${card.ring} rounded-xl flex items-center justify-center mb-3`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-3xl font-extrabold font-outfit leading-none mb-1">{card.value}</p>
              <p className="text-xs text-white/70 font-semibold uppercase tracking-wider">{card.label}</p>
              <p className="text-xs text-white/60 mt-0.5">{card.sub}</p>
              <span className={`mt-2 inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${card.badgeColor}`}>
                {card.badge}
              </span>
            </div>
          );
        })}
      </div>

      {/* ── Chart + Calendar ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Area Chart */}
        <div className="lg:col-span-2 glass-panel p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-base text-slate-800 dark:text-white font-outfit flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-500" />
                Student Progress
              </h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Weekly quiz & test performance trend</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex gap-3 text-xs font-semibold text-slate-500">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-500" /> Quiz</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-cyan-400" /> Test</span>
              </div>
              <button onClick={() => setActiveTab('reports')} className="text-xs text-indigo-500 font-bold hover:underline">
                Full Report →
              </button>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gQuiz" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gTest" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#06b6d4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:stroke-slate-800" />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis domain={[0, 100]} stroke="#94A3B8" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.15)' }} />
                <Area type="monotone" dataKey="QuizScore" name="Quiz %" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#gQuiz)" dot={{ r: 4, fill: '#6366f1', strokeWidth: 0 }} />
                <Area type="monotone" dataKey="TestScore"  name="Test %" stroke="#06b6d4" strokeWidth={2.5} fillOpacity={1} fill="url(#gTest)"  dot={{ r: 4, fill: '#06b6d4', strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Calendar */}
        <div className="glass-panel p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-indigo-500" />
              <h3 className="font-bold text-sm text-slate-800 dark:text-white font-outfit">
                {monthNames[new Date().getMonth()]} {new Date().getFullYear()}
              </h3>
            </div>
            <button onClick={() => setActiveTab('homework')} className="text-xs text-indigo-500 dark:text-indigo-400 font-bold hover:underline">
              Full View
            </button>
          </div>
          {/* Legend */}
          <div className="flex gap-3 mb-2 text-[10px] font-bold text-slate-500">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> HW</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Quiz</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Test</span>
          </div>
          <div className="grid grid-cols-7 gap-0.5 text-center font-bold text-[10px] text-slate-400 uppercase mb-1">
            {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => <div key={d}>{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-0.5">{renderCalendarDays()}</div>
        </div>
      </div>

      {/* ── Homework Table Preview ─────────────────────────────────────────── */}
      {studentHwList.length > 0 && (
        <div className="glass-panel rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-base text-slate-800 dark:text-white font-outfit flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-500" />
              Recent Homework
            </h3>
            <button onClick={() => setActiveTab('homework')} className="text-xs font-bold text-indigo-500 hover:underline">View All →</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50">
                  <th className="text-left px-5 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Subject</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Title</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Due</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Priority</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {studentHwList.slice(0, 5).map(hw => (
                  <tr key={hw.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold"
                        style={{ background: subjectColor(hw.subject).bg, color: subjectColor(hw.subject).text }}>
                        {hw.subject}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300 font-medium truncate max-w-[160px]">{hw.title}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs font-medium">{hw.dueDate}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${priorityClass(hw.priority)}`}>
                        {hw.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {hw.status === 'Completed'
                        ? <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                            <CheckCircle2 className="w-3 h-3" /> Done
                          </span>
                        : <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                            <AlertTriangle className="w-3 h-3" /> Pending
                          </span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Sticky Notes ─────────────────────────────────────────────────── */}
      {studentProfile?.id && (
        <div className="glass-panel p-5 rounded-2xl border-l-4 border-amber-400 dark:border-amber-500">
          <div className="flex flex-col md:flex-row gap-5 items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-amber-100 dark:bg-amber-950/30 rounded-2xl flex items-center justify-center shrink-0">
                <span className="text-xl">📌</span>
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-800 dark:text-white font-outfit">Sticky Notes for {studentProfile.name}</h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">Student sees this instantly on their dashboard.</p>
              </div>
            </div>
            <div className="flex-1 w-full space-y-3">
              <textarea
                value={stickyNotes}
                onChange={e => setStickyNotes(e.target.value)}
                placeholder="e.g. Complete chapter 5 worksheet. Keep up the great work!"
                className="w-full min-h-[80px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3.5 rounded-xl text-xs text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-amber-400 font-medium resize-y"
              />
              <div className="flex items-center justify-end gap-3">
                {saveNotesSuccess && <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold animate-fadeIn">✓ Saved!</span>}
                <button
                  onClick={handleSaveNotes}
                  disabled={isSavingNotes || studentProfile.mentor_notes === stickyNotes}
                  className="px-4 py-2 text-xs font-bold bg-amber-400 hover:bg-amber-500 disabled:opacity-50 text-white rounded-xl transition-all shadow-sm active:scale-95"
                >
                  {isSavingNotes ? 'Saving…' : 'Save Note'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Quick Actions ─────────────────────────────────────────────────── */}
      <div className="glass-panel p-5 rounded-2xl">
        <h3 className="font-bold text-base text-slate-800 dark:text-white mb-4 font-outfit border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-500" />
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map(qa => {
            const Icon = qa.icon;
            return (
              <button
                key={qa.label}
                onClick={qa.onClick}
                className={`flex flex-col items-center justify-center p-5 rounded-2xl ${qa.bg} ${qa.text} transition-all border ${qa.border} group active:scale-95 relative overflow-hidden`}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  style={{ background: `linear-gradient(135deg,${qa.gradient.includes('blue') ? '#3b82f610' : '#10b98110'},transparent)` }} />
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${qa.gradient} flex items-center justify-center mb-3 shadow-lg ${qa.shadow} group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs font-bold font-outfit">{qa.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/* ── Helpers ── */
function priorityClass(p: string) {
  if (p === 'High')   return 'bg-red-100    text-red-700    dark:bg-red-900/30    dark:text-red-400';
  if (p === 'Medium') return 'bg-amber-100  text-amber-700  dark:bg-amber-900/30  dark:text-amber-400';
  return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
}

function subjectColor(s: string): { bg: string; text: string } {
  const map: Record<string, { bg: string; text: string }> = {
    Mathematics: { bg: '#eff6ff', text: '#2563eb' },
    Science:     { bg: '#f0fdf4', text: '#16a34a' },
    English:     { bg: '#fdf4ff', text: '#9333ea' },
    History:     { bg: '#fff7ed', text: '#ea580c' },
    Geography:   { bg: '#ecfdf5', text: '#059669' },
    Physics:     { bg: '#f0f9ff', text: '#0284c7' },
    Chemistry:   { bg: '#fef3c7', text: '#d97706' },
    Biology:     { bg: '#f0fdf4', text: '#15803d' },
  };
  return map[s] || { bg: '#f8fafc', text: '#475569' };
}
