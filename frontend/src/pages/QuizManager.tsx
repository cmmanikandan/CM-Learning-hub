import React, { useState, useEffect } from 'react';
import { API_BASE } from '../config/api';
import { ModalPortal } from '../components/Modal';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import type { Quiz, QuizQuestion, QuizSubmission } from '../context/AppContext';
import { 
  Plus, 
  Clock, 
  AlertTriangle, 
  Award,
  RotateCcw,
  Upload,
  Download,
  Calendar,
  Trash2,
  FileText,
  BookOpen,
  Loader2
} from 'lucide-react';


const CARD_THEMES = [
  {
    gradient: "from-blue-500 to-cyan-500",
    badge: "bg-blue-600",
    text: "text-blue-600 dark:text-blue-450",
    border: "border-blue-105/30",
    bg: "bg-blue-50/30 dark:bg-blue-950/10"
  },
  {
    gradient: "from-purple-500 to-indigo-500",
    badge: "bg-purple-600",
    text: "text-purple-600 dark:text-purple-450",
    border: "border-purple-105/30",
    bg: "bg-purple-50/30 dark:bg-purple-950/10"
  },
  {
    gradient: "from-emerald-500 to-teal-500",
    badge: "bg-emerald-600",
    text: "text-emerald-600 dark:text-emerald-450",
    border: "border-emerald-105/30",
    bg: "bg-emerald-50/30 dark:bg-emerald-950/10"
  },
  {
    gradient: "from-amber-500 to-orange-500",
    badge: "bg-amber-600",
    text: "text-amber-600 dark:text-amber-450",
    border: "border-amber-105/30",
    bg: "bg-amber-50/30 dark:bg-amber-950/10"
  },
  {
    gradient: "from-rose-500 to-pink-500",
    badge: "bg-rose-600",
    text: "text-rose-600 dark:text-rose-450",
    border: "border-rose-105/30",
    bg: "bg-rose-50/30 dark:bg-rose-950/10"
  },
  {
    gradient: "from-violet-500 to-fuchsia-500",
    badge: "bg-violet-600",
    text: "text-violet-600 dark:text-violet-450",
    border: "border-violet-105/30",
    bg: "bg-violet-50/30 dark:bg-violet-950/10"
  }
];

const getCardTheme = (index: number) => CARD_THEMES[index % CARD_THEMES.length];

const LiveCountdown: React.FC<{ startTime?: string; endTime?: string; onUpdate?: () => void }> = ({ startTime, endTime, onUpdate }) => {
  const [status, setStatus] = useState<'future' | 'active' | 'expired'>('active');
  const [timeLeftString, setTimeLeftString] = useState('');

  useEffect(() => {
    if (!startTime && !endTime) {
      setStatus('active');
      setTimeLeftString('Open');
      return;
    }

    const updateTimer = () => {
      const now = new Date().getTime();
      const start = startTime ? new Date(startTime).getTime() : 0;
      const end = endTime ? new Date(endTime).getTime() : Infinity;

      if (startTime && now < start) {
        setStatus('future');
        const diff = start - now;
        const hrs = Math.floor(diff / 3600000);
        const mins = Math.floor((diff % 3600000) / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        setTimeLeftString(`Starts in: ${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
      } else if (endTime && now > end) {
        setStatus('expired');
        setTimeLeftString('Closed');
        if (onUpdate) onUpdate();
      } else {
        setStatus('active');
        if (endTime && end !== Infinity) {
          const diff = end - now;
          const hrs = Math.floor(diff / 3600000);
          const mins = Math.floor((diff % 3600000) / 60000);
          const secs = Math.floor((diff % 60000) / 1000);
          setTimeLeftString(`Ends in: ${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
        } else {
          setTimeLeftString('Open');
        }
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [startTime, endTime]);

  if (status === 'future') {
    return (
      <span className="flex items-center gap-1 bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400 text-[10px] px-2 py-0.5 rounded font-bold border border-amber-250/20">
        <Clock className="w-3.5 h-3.5 animate-pulse text-amber-500" />
        {timeLeftString}
      </span>
    );
  }

  if (status === 'expired') {
    return (
      <span className="flex items-center gap-1 bg-red-50 text-red-650 dark:bg-red-950/20 dark:text-red-400 text-[10px] px-2 py-0.5 rounded font-bold border border-red-255/20">
        <AlertTriangle className="w-3.5 h-3.5 text-red-550" />
        {timeLeftString}
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1 bg-success-50 text-success-650 dark:bg-success-950/20 dark:text-success-400 text-[10px] px-2 py-0.5 rounded font-bold border border-success-255/20">
      <Clock className="w-3.5 h-3.5 text-success-500" />
      {timeLeftString}
    </span>
  );
};

interface QuizManagerProps {
  showCreateModal: boolean;
  setShowCreateModal: (show: boolean) => void;
}

export const QuizManager: React.FC<QuizManagerProps> = ({ 
  showCreateModal, 
  setShowCreateModal 
}) => {
  const { 
    role, 
    quizList, 
    quizBank,
    addQuiz, 
    assignQuiz,
    deleteQuiz,
    quizSubmissions, 
    submitQuiz,
    myStudents,
    refreshData
  } = useApp();

  const { token } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshData();
    } catch (e) {
      console.error(e);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Target assignment states
  const [assignTarget, setAssignTarget] = useState<'all' | 'class' | 'students'>('all');
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [assignStartTime, setAssignStartTime] = useState('');
  const [assignEndTime, setAssignEndTime] = useState('');

  const [selectedScheduleDate, setSelectedScheduleDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const groupedActiveQuizzes = React.useMemo(() => {
    // Filter active quizzes for the selected date
    const dayQuizzes = quizList.filter(q => 
      !q.is_bank && q.assignment_date === selectedScheduleDate
    );

    // Group them by quizName + subject
    const groups: Record<string, {
      quizName: string;
      subject: string;
      chapter: string;
      timeLimit: number;
      passingMarks: number;
      totalMarks: number;
      start_time: string;
      end_time: string;
      clones: any[];
    }> = {};

    dayQuizzes.forEach(quiz => {
      const key = `${quiz.quizName}_${quiz.subject}`;
      if (!groups[key]) {
        groups[key] = {
          quizName: quiz.quizName,
          subject: quiz.subject,
          chapter: quiz.chapter || '',
          timeLimit: quiz.timeLimit || 10,
          passingMarks: quiz.passingMarks || 50,
          totalMarks: quiz.totalMarks || 10,
          start_time: quiz.start_time || '',
          end_time: quiz.end_time || '',
          clones: []
        };
      }
      groups[key].clones.push(quiz);
    });

    return Object.values(groups);
  }, [quizList, selectedScheduleDate]);

  const uniqueClasses = Array.from(new Set((myStudents || []).map(s => s.className || '').filter(Boolean)));


  // Active student view states
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [isStartingQuiz, setIsStartingQuiz] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [cheatWarnings, setCheatWarnings] = useState(0);
  const [showCheatAlert, setShowCheatAlert] = useState(false);
  const [quizStartTime, setQuizStartTime] = useState(0);

  // Score report state (Student)
  const [recentReport, setRecentReport] = useState<Omit<QuizSubmission, 'id' | 'studentId' | 'submittedAt'> | null>(null);

  // Mentor Tabs
  const [activeTab, setActiveTab] = useState<'dashboard' | 'bank'>('dashboard');

  // Assign Quiz Modal State
  const [showAssignModal, setShowAssignModal] = useState<number | null>(null);
  const [assignDate, setAssignDate] = useState('');

  // Quiz Preview State
  const [previewQuiz, setPreviewQuiz] = useState<Quiz | null>(null);

  const handlePreviewQuiz = async (quizId: number) => {
    try {
      const res = await fetch(`${API_BASE}/api/quiz/${quizId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setPreviewQuiz(data);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to load quiz details for preview.");
    }
  };


  // Creator states
  const [quizName, setQuizName] = useState('');
  const [subject, setSubject] = useState('Mathematics');
  const [chapter, setChapter] = useState('');
  const [lesson, setLesson] = useState('');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [instructions, setInstructions] = useState('');
  const [timeLimit, setTimeLimit] = useState(10);
  const [passingMarks, setPassingMarks] = useState(50);
  const [isBank, setIsBank] = useState(true);
  
  // Dynamic question array in creator
  const [questions, setQuestions] = useState<QuizQuestion[]>([
    {
      id: 'q1',
      questionType: 'mcq',
      questionText: '',
      options: ['', '', '', ''],
      correctAnswer: '',
      explanation: '',
      marks: 1
    }
  ]);

  // Anti-cheating listeners (tab changes)
  useEffect(() => {
    if (!activeQuiz) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setCheatWarnings(prev => {
          const next = prev + 1;
          setShowCheatAlert(true);
          return next;
        });
      }
    };

    const handleBlur = () => {
      setCheatWarnings(prev => {
        const next = prev + 1;
        setShowCheatAlert(true);
        return next;
      });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [activeQuiz]);

  // Timer loop
  useEffect(() => {
    if (!activeQuiz || timeLeft <= 0) {
      if (activeQuiz && timeLeft === 0) {
        handleQuizSubmit(true); // Auto-submit on timeout
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [activeQuiz, timeLeft]);

  // Load auto-saved answers if student refreshes or resumes quiz
  const startQuiz = async (quiz: Quiz) => {
    setIsStartingQuiz(quiz.id);
    try {
      const res = await fetch(`${API_BASE}/api/quiz/${quiz.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const fullQuiz = await res.json();
        setActiveQuiz(fullQuiz);
        setTimeLeft(fullQuiz.timeLimit * 60);
        setCheatWarnings(0);
        setQuizStartTime(Date.now());
        
        // Check local storage for auto-save
        const autoSaved = localStorage.getItem(`cm_autosave_quiz_${quiz.id}`);
        if (autoSaved) {
          setQuizAnswers(JSON.parse(autoSaved));
        } else {
          setQuizAnswers({});
        }
      } else {
        alert("Failed to load quiz questions. Please try again.");
      }
    } catch (err) {
      console.error(err);
      alert("Error loading quiz questions.");
    } finally {
      setIsStartingQuiz(null);
    }
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setQuizAnswers(prev => {
      const next = { ...prev, [questionId]: answer };
      if (activeQuiz) {
        // Save state for auto-save
        localStorage.setItem(`cm_autosave_quiz_${activeQuiz.id}`, JSON.stringify(next));
      }
      return next;
    });
  };

  const handleQuizSubmit = async (_auto = false) => {
    if (!activeQuiz) return;

    const timeTaken = Math.round((Date.now() - quizStartTime) / 1000);

    const newSubmission = {
      quizId: activeQuiz.id,
      quizName: activeQuiz.quizName,
      subject: activeQuiz.subject,
      score: 0, // calculated on backend
      totalMarks: activeQuiz.totalMarks,
      accuracy: 0, // calculated on backend
      timeTaken,
      correctCount: 0, // calculated on backend
      totalQuestions: activeQuiz.questions.length,
      strongAreas: '', // calculated on backend
      weakAreas: '' // calculated on backend
    };

    const res = await submitQuiz(newSubmission, quizAnswers);
    if (res) {
        setRecentReport({
            ...newSubmission,
            score: res.score,
            accuracy: res.accuracy,
            correctCount: res.correct_count,
        });
    }

    // Clean up auto-save
    localStorage.removeItem(`cm_autosave_quiz_${activeQuiz.id}`);
    setActiveQuiz(null);
  };

  // Creator functions
  const addQuestionField = (type: QuizQuestion['questionType'] = 'mcq') => {
    setQuestions(prev => [
      ...prev,
      {
        id: 'q_' + Date.now() + '_' + prev.length,
        questionType: type,
        questionText: '',
        options: type === 'mcq' ? ['', '', '', ''] : [],
        correctAnswer: '',
        explanation: '',
        marks: 1
      }
    ]);
  };

  const deleteQuestionField = (idx: number) => {
    setQuestions(prev => prev.filter((_, i) => i !== idx));
  };

  const handleQuestionFieldChange = (idx: number, field: keyof QuizQuestion, value: any) => {
    setQuestions(prev => prev.map((q, i) => {
      if (i === idx) {
        return { ...q, [field]: value };
      }
      return q;
    }));
  };

  const handleMCQOptionChange = (qIdx: number, optIdx: number, val: string) => {
    setQuestions(prev => prev.map((q, i) => {
      if (i === qIdx) {
        const opts = [...(q.options || [])];
        opts[optIdx] = val;
        return { ...q, options: opts };
      }
      return q;
    }));
  };



  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const lines = text.split('\n');
      const parsedQuestions: QuizQuestion[] = [];
      
      // Skip header line
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const row = lines[i].split(',').map(c => c.trim());
        // Simple CSV format: Type, Question, Options(semicolon separated), CorrectAnswer, Marks, Explanation
        if (row.length >= 5) {
          parsedQuestions.push({
            id: 'q_' + Date.now() + '_' + i,
            questionType: row[0].toLowerCase() as any,
            questionText: row[1],
            options: row[2] ? row[2].split(';') : [],
            correctAnswer: row[3],
            marks: parseInt(row[4]) || 1,
            explanation: row[5] || ''
          });
        }
      }
      if (parsedQuestions.length > 0) {
        setQuestions(parsedQuestions);
      }
    };
    reader.readAsText(file);
  };

  const downloadTemplate = () => {
    const content = "Type,Question,Options(semicolon separated),CorrectAnswer,Marks,Explanation\nmcq,What is 2+2?,3;4;5;6,4,1,Basic math\ntrue_false,The Earth is flat,,false,1,\nfill_blank,A dog is a ___,m_a_m_m_a_l,mammal,1,\n";
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'quiz_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const saveCreatedQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quizName || questions.some(q => !q.questionText)) return;

    let studentIds: number[] | undefined = undefined;
    if (!isBank) {
      if (assignTarget === 'class') {
        studentIds = (myStudents || [])
          .filter(s => s.className && selectedClasses.includes(s.className))
          .map(s => s.id);
      } else if (assignTarget === 'students') {
        studentIds = selectedStudentIds;
      }
    }

    addQuiz({
      quizName,
      subject,
      chapter,
      lesson,
      difficulty,
      instructions,
      timeLimit,
      passingMarks,
      is_bank: isBank,
      questions,
      student_ids: studentIds,
      start_time: !isBank && assignStartTime ? new Date(assignStartTime).toISOString() : undefined,
      end_time: !isBank && assignEndTime ? new Date(assignEndTime).toISOString() : undefined,
      assignment_date: !isBank ? assignDate : undefined
    });

    // Reset Form
    setQuizName('');
    setChapter('');
    setLesson('');
    setInstructions('');
    setTimeLimit(10);
    setQuestions([
      {
        id: 'q1',
        questionType: 'mcq',
        questionText: '',
        options: ['', '', '', ''],
        correctAnswer: '',
        explanation: '',
        marks: 1
      }
    ]);
    setIsBank(true);
    setAssignTarget('all');
    setSelectedClasses([]);
    setSelectedStudentIds([]);
    setAssignStartTime('');
    setAssignEndTime('');
    setAssignDate(new Date().toISOString().split('T')[0]);
    setShowCreateModal(false);
  };


  const renderCalendar = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    const days: React.ReactNode[] = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-2 text-transparent">.</div>);
    }
    
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isSelected = selectedScheduleDate === dateStr;
      const hasQuiz = quizList.some(q => !q.is_bank && q.assignment_date === dateStr);
      
      days.push(
        <button
          key={d}
          type="button"
          onClick={() => setSelectedScheduleDate(dateStr)}
          className={`p-2.5 border rounded-xl flex flex-col items-center justify-between transition-all relative ${
            isSelected 
              ? 'bg-primary-500 border-primary-500 text-white shadow-md shadow-primary-500/25' 
              : 'border-slate-100 dark:border-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-800/20 text-slate-850 dark:text-slate-200'
          }`}
        >
          <span className="text-xs font-black">{d}</span>
          {hasQuiz && (
            <span className={`w-1.5 h-1.5 rounded-full absolute bottom-1 ${isSelected ? 'bg-white' : 'bg-primary-500'}`} />
          )}
        </button>
      );
    }
    return days;
  };

  const handleAssignSubmit = (id: number) => {
    if (!assignDate) return;
    
    let studentIds: number[] | undefined = undefined;
    if (assignTarget === 'class') {
      studentIds = (myStudents || [])
        .filter(s => s.className && selectedClasses.includes(s.className))
        .map(s => s.id);
    } else if (assignTarget === 'students') {
      studentIds = selectedStudentIds;
    }
    
    assignQuiz(id, assignDate, {
      student_ids: studentIds,
      start_time: assignStartTime ? new Date(assignStartTime).toISOString() : undefined,
      end_time: assignEndTime ? new Date(assignEndTime).toISOString() : undefined
    });
    
    setShowAssignModal(null);
    setAssignDate('');
    setAssignStartTime('');
    setAssignEndTime('');
    setAssignTarget('all');
    setSelectedClasses([]);
    setSelectedStudentIds([]);
  };

  return (
    <div className="space-y-6">
      {/* ---------------- TEACHER PANEL ---------------- */}
      {role === 'mentor' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold font-outfit text-slate-800 dark:text-white flex items-center gap-2">
                Quiz Management
                <button 
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800 text-slate-450 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-300 transition-all active:scale-95 disabled:opacity-50"
                  title="Refresh Data"
                >
                  <RotateCcw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>
              </h2>
              <p className="text-xs text-slate-400 font-medium">Design skill exams, assign daily tests, and track progress</p>
            </div>
            
            <button 
              onClick={() => setShowCreateModal(true)}
              className="flex items-center px-3.5 py-2 text-xs font-bold rounded-xl text-white bg-primary-600 hover:bg-primary-700 transition-all shadow-sm active:scale-95 self-start sm:self-auto"
            >
              <Plus className="w-4.5 h-4.5 mr-1" />
              Create New Quiz
            </button>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-5 py-2.5 text-xs font-extrabold rounded-xl transition-all shadow-sm border ${
                activeTab === 'dashboard' 
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-blue-500 shadow-md shadow-blue-500/20' 
                  : 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-450 border-blue-200/50 dark:border-slate-700/50 hover:bg-blue-50/50 dark:hover:bg-blue-950/10'
              }`}
            >
              <Clock className="w-4 h-4" />
              Active Assignments
            </button>
            <button 
              onClick={() => setActiveTab('bank')}
              className={`flex items-center gap-2 px-5 py-2.5 text-xs font-extrabold rounded-xl transition-all shadow-sm border ${
                activeTab === 'bank' 
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20' 
                  : 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-450 border-emerald-200/50 dark:border-slate-700/50 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/10'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Quiz Bank
            </button>
          </div>

          {activeTab === 'dashboard' ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Calendar Column */}
              <div className="space-y-4">
                <div className="glass-panel p-5 rounded-2xl flex flex-col">
                  <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <Calendar className="w-4.5 h-4.5 text-primary-500" />
                    <h3 className="font-extrabold text-sm text-slate-850 dark:text-white font-outfit">
                      Schedule Calendar
                    </h3>
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-center font-bold text-[10px] text-slate-400 uppercase mb-2">
                    {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => <div key={d}>{d}</div>)}
                  </div>
                  <div className="grid grid-cols-7 gap-1.5">
                    {renderCalendar()}
                  </div>
                  <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 text-[10px] text-slate-550 dark:text-slate-400 font-semibold space-y-1.5">
                    <p className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
                      Dots indicate dates with assigned quizzes.
                    </p>
                    <p>Selected Date: <strong className="text-primary-500">{selectedScheduleDate}</strong></p>
                  </div>
                </div>
              </div>

              {/* Day's Assignments list */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-450 uppercase tracking-wider">Scheduled Quizzes for {selectedScheduleDate}</h3>
                  <span className="text-xs font-bold text-primary-500 bg-primary-50 dark:bg-primary-950/20 px-2 py-0.5 rounded-full">{groupedActiveQuizzes.length} Quizzes</span>
                </div>

                {groupedActiveQuizzes.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {groupedActiveQuizzes.map((grouped, index) => {
                      const theme = getCardTheme(index);
                      const totalAssigned = grouped.clones.length;
                      const completedClones = grouped.clones.filter(clone => 
                        quizSubmissions.some(sub => sub.quizId === clone.id)
                      );
                      const completedCount = completedClones.length;
                      const completionPercentage = totalAssigned > 0 ? Math.round((completedCount / totalAssigned) * 100) : 0;
                      
                      return (
                        <div key={grouped.quizName} className="premium-outline-card flex flex-col justify-between border border-slate-200 dark:border-slate-800 relative">
                          <div className={`h-1.5 w-full bg-gradient-to-r ${theme.gradient}`} />
                          <div className="p-5 flex-1 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between">
                                <span className={`bg-gradient-to-r ${theme.gradient} text-white px-2.5 py-1 text-[10px] font-bold uppercase rounded-lg tracking-wider`}>
                                  {grouped.subject}
                                </span>
                                
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => {
                                      grouped.clones.forEach(clone => deleteQuiz(clone.id));
                                    }}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-danger-650 hover:bg-danger-50 dark:hover:bg-danger-950/20 transition-colors"
                                    title="Delete Quiz Group"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>

                              <h3 className="font-extrabold text-base text-slate-805 dark:text-white mt-4 font-outfit uppercase tracking-wide leading-tight">{grouped.quizName}</h3>
                              <p className="text-xs text-slate-400 mt-1 font-semibold">Chapter: {grouped.chapter || 'N/A'}</p>
                              
                              <div className="mt-4 p-2.5 bg-slate-50 dark:bg-slate-800/85 rounded-xl border border-slate-100 dark:border-slate-800/40 flex flex-col gap-2">
                                <div className="flex items-center justify-between text-xs">
                                  <div className="flex items-center space-x-1.5 text-slate-500 min-w-0">
                                    <FileText className="w-4 h-4 text-slate-450 shrink-0" />
                                    <span className="truncate text-slate-655 dark:text-slate-350">{grouped.totalMarks} Marks • {grouped.timeLimit}m</span>
                                  </div>
                                  {grouped.clones[0] && (
                                    <button 
                                      onClick={() => handlePreviewQuiz(grouped.clones[0].id)}
                                      className="text-[10px] font-bold text-primary-500 hover:underline shrink-0"
                                    >
                                      Preview Quiz
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Scheduling timings */}
                              {(grouped.start_time || grouped.end_time) && (
                                <div className="mt-3.5 p-2 bg-slate-100/60 dark:bg-slate-800/40 rounded-xl text-[9px] text-slate-500 font-bold space-y-0.5">
                                  {grouped.start_time && (
                                    <p>Starts: <span className="text-slate-700 dark:text-slate-350">{new Date(grouped.start_time).toLocaleString()}</span></p>
                                  )}
                                  {grouped.end_time && (
                                    <p>Ends: <span className="text-slate-700 dark:text-slate-355">{new Date(grouped.end_time).toLocaleString()}</span></p>
                                  )}
                                </div>
                              )}

                              {/* Progress bar */}
                              <div className="mt-4">
                                <div className="flex justify-between items-center text-[10px] mb-1 font-bold text-slate-450 uppercase">
                                  <span>Completion</span>
                                  <span>{completedCount} / {totalAssigned} Students</span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-200/10">
                                  <div 
                                    className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${theme.gradient}`}
                                    style={{ width: `${completionPercentage}%` }}
                                  />
                                </div>
                              </div>

                              {/* Student completion details list */}
                              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/60">
                                <p className="text-[9px] font-bold text-slate-400 uppercase mb-1.5">Students Assigned:</p>
                                <div className="grid grid-cols-1 gap-1 max-h-24 overflow-y-auto pr-1">
                                  {grouped.clones.map(clone => {
                                    const isDone = quizSubmissions.some(sub => sub.quizId === clone.id);
                                    const studentSub = quizSubmissions.find(sub => sub.quizId === clone.id);
                                    return (
                                      <div key={clone.id} className="flex items-center justify-between p-1 bg-slate-50/50 dark:bg-slate-850/50 rounded-lg text-[10px]">
                                        <span className="font-extrabold text-slate-700 dark:text-slate-300 truncate max-w-[120px]">{clone.student_name}</span>
                                        <span className={`font-bold px-1.5 py-0.5 rounded-full ${
                                          isDone 
                                            ? 'bg-success-50 text-success-700 dark:bg-success-950/20 dark:text-success-400' 
                                            : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                                        }`}>
                                          {isDone ? `✓ ${studentSub?.score}/${clone.totalMarks}` : 'Pending'}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-16 flex flex-col items-center justify-center text-center glass-panel p-8 rounded-3xl bg-white dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60 shadow-sm animate-fadeIn">
                    <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-3 shadow-inner">
                      <Clock className="w-6 h-6 text-slate-400" />
                    </div>
                    <h3 className="font-bold text-slate-700 dark:text-slate-350 font-outfit text-base">No Quizzes Scheduled</h3>
                    <p className="text-xs text-slate-400 dark:text-slate-455 mt-1 max-w-xs leading-relaxed">There are no quizzes assigned for {selectedScheduleDate}. Create a template to get started!</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* QUIZ BANK TEMPLATES */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {quizBank.map((quiz, index) => {
                  const theme = getCardTheme(index);
                  return (
                    <div key={quiz.id} className="glass-panel p-5 rounded-2xl flex flex-col justify-between hover:shadow-md transition-shadow relative border border-slate-200 dark:border-slate-800 overflow-hidden">
                      <div className={`h-1.5 w-full absolute top-0 left-0 bg-gradient-to-r ${theme.gradient}`} />
                      <div className="pt-2">
                        <div className="flex items-center justify-between">
                          <span className={`bg-gradient-to-r ${theme.gradient} text-white px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-md tracking-wider`}>
                            {quiz.subject}
                          </span>
                          
                          <div className="flex space-x-2">
                             <button
                              onClick={() => {
                                setAssignDate(new Date().toISOString().split('T')[0]);
                                setShowAssignModal(quiz.id);
                              }}
                              className="p-1.5 rounded-lg text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950/20 transition-colors flex items-center text-xs font-bold"
                              title="Assign Quiz"
                            >
                              <Calendar className="w-4 h-4 mr-1" />
                              Assign
                            </button>
                            
                            <button
                              onClick={() => deleteQuiz(quiz.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-danger-655 hover:bg-danger-50 dark:hover:bg-danger-950/20 transition-colors"
                              title="Delete Template"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <h3 className="font-bold text-base text-slate-800 dark:text-white mt-3 font-outfit leading-tight">{quiz.quizName}</h3>
                        <p className="text-xs text-slate-400 mt-1">Template • {quiz.chapter || 'No Chapter'}</p>
                        
                        <div className="mt-3.5 p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl flex flex-col gap-2.5">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center space-x-1.5 text-slate-500 min-w-0">
                              <FileText className="w-4 h-4 text-slate-455 shrink-0" />
                              <span className="truncate text-slate-655 dark:text-slate-350" title={`${quiz.questions_count || quiz.questions?.length || 0} Questions`}>
                                {quiz.questions_count || quiz.questions?.length || 0} Questions
                              </span>
                            </div>
                            <button 
                              onClick={() => handlePreviewQuiz(quiz.id)}
                              className="text-[10px] font-bold text-primary-500 hover:underline shrink-0"
                            >
                              Preview
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs text-slate-400 font-bold">
                        <span className="flex items-center"><Clock className="w-3.5 h-3.5 mr-1" />{quiz.timeLimit} mins</span>
                        <span>Total Marks: {quiz.totalMarks || quiz.passingMarks * 2}</span>
                      </div>
                    </div>
                  );
                })}
                {quizBank.length === 0 && (
                  <div className="col-span-full py-12 text-center text-slate-400 font-medium">
                    No quizzes in the bank. Create one!
                  </div>
                )}
              </div>

              {/* Historical submissions Reports */}
              <div className="glass-panel p-5 rounded-2xl mt-6">
                <h3 className="font-bold text-base text-slate-800 dark:text-white mb-4 font-outfit">Recent Submissions</h3>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-400 text-[10px] uppercase font-bold border-b border-slate-100 dark:border-slate-800">
                        <th className="px-4 py-3">Quiz Name</th>
                        <th className="px-4 py-3">Subject</th>
                        <th className="px-4 py-3">Score</th>
                        <th className="px-4 py-3">Accuracy</th>
                        <th className="px-4 py-3">Time Taken</th>
                        <th className="px-4 py-3">Date Submitted</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                      {quizSubmissions.length > 0 ? (
                        quizSubmissions.map((sub) => (
                          <tr key={sub.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                            <td className="px-4 py-3 font-bold text-slate-800 dark:text-white font-outfit">{sub.quizName}</td>
                            <td className="px-4 py-3 font-semibold text-xs text-primary-650">{sub.subject}</td>
                            <td className="px-4 py-3 font-extrabold">{sub.score} / {sub.totalMarks}</td>
                            <td className="px-4 py-3 font-extrabold text-success-600">{sub.accuracy.toFixed(0)}%</td>
                            <td className="px-4 py-3 font-medium text-xs">{Math.floor(sub.timeTaken / 60)}m {sub.timeTaken % 60}s</td>
                            <td className="px-4 py-3 text-xs text-slate-400">{new Date(sub.submittedAt).toLocaleDateString()}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="text-center py-6 text-slate-400">No submissions recorded yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* Assign Modal */}
          {showAssignModal && (
             <ModalPortal onClose={() => {
               setShowAssignModal(null);
               setAssignTarget('all');
               setSelectedClasses([]);
               setSelectedStudentIds([]);
               setAssignStartTime('');
               setAssignEndTime('');
             }}>
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-md border border-slate-100 dark:border-slate-800 shadow-2xl overflow-y-auto max-h-[85vh] animate-scaleIn">
                <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-4 font-outfit">Assign Quiz & Schedule</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Assignment Date</label>
                    <input 
                      type="date" 
                      value={assignDate}
                      onChange={(e) => setAssignDate(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2.5 rounded-xl text-sm text-slate-850 dark:text-white focus:outline-none"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Start Time (Optional)</label>
                      <input 
                        type="datetime-local" 
                        value={assignStartTime}
                        onChange={(e) => setAssignStartTime(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2.5 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">End Time (Optional)</label>
                      <input 
                        type="datetime-local" 
                        value={assignEndTime}
                        onChange={(e) => setAssignEndTime(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2.5 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-100 dark:border-slate-800/40">
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 font-outfit tracking-wide">Target Students</label>
                    <div className="flex flex-col gap-2">
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-750 dark:text-slate-300 cursor-pointer">
                        <input 
                          type="radio" 
                          name="quizAssignTarget" 
                          value="all" 
                          checked={assignTarget === 'all'} 
                          onChange={() => setAssignTarget('all')} 
                          className="text-primary-600 focus:ring-primary-500" 
                        />
                        All Assigned Students
                      </label>
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-750 dark:text-slate-300 cursor-pointer">
                        <input 
                          type="radio" 
                          name="quizAssignTarget" 
                          value="class" 
                          checked={assignTarget === 'class'} 
                          onChange={() => setAssignTarget('class')} 
                          className="text-primary-600 focus:ring-primary-500" 
                        />
                        By Standard/Class
                      </label>
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-750 dark:text-slate-300 cursor-pointer">
                        <input 
                          type="radio" 
                          name="quizAssignTarget" 
                          value="students" 
                          checked={assignTarget === 'students'} 
                          onChange={() => setAssignTarget('students')} 
                          className="text-primary-600 focus:ring-primary-500" 
                        />
                        Specific Students
                      </label>
                    </div>

                    {assignTarget === 'class' && (
                      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                        <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1.5">Select Classes</label>
                        <div className="flex flex-wrap gap-1.5">
                          {uniqueClasses.map(cls => (
                            <label key={cls} className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2.5 py-1 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                              <input 
                                type="checkbox" 
                                checked={selectedClasses.includes(cls)} 
                                onChange={(e) => {
                                  if (e.target.checked) setSelectedClasses([...selectedClasses, cls]);
                                  else setSelectedClasses(selectedClasses.filter(c => c !== cls));
                                }}
                                className="text-primary-600 focus:ring-primary-500 rounded" 
                              />
                              {cls}
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {assignTarget === 'students' && (
                      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                        <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1.5">Select Students</label>
                        <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
                          {(myStudents || []).map(st => (
                            <label key={st.id} className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1.5 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                              <input 
                                type="checkbox" 
                                checked={selectedStudentIds.includes(st.id)} 
                                onChange={(e) => {
                                  if (e.target.checked) setSelectedStudentIds([...selectedStudentIds, st.id]);
                                  else setSelectedStudentIds(selectedStudentIds.filter(id => id !== st.id));
                                }}
                                className="text-primary-600 focus:ring-primary-500 rounded" 
                              />
                              <div className="truncate">
                                <p className="leading-tight truncate">{st.name}</p>
                                {st.className && <p className="text-[9px] text-slate-400 leading-none mt-0.5">{st.className}</p>}
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end space-x-2 mt-6">
                  <button 
                    onClick={() => {
                      setShowAssignModal(null);
                      setAssignTarget('all');
                      setSelectedClasses([]);
                      setSelectedStudentIds([]);
                      setAssignStartTime('');
                      setAssignEndTime('');
                    }} 
                    className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-xl text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 hover:bg-slate-50 focus:outline-none"
                  >
                    Cancel
                  </button>
                  <button onClick={() => handleAssignSubmit(showAssignModal)} className="px-5 py-2 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl active:scale-95 shadow-md transition-all">Assign Now</button>
                </div>
              </div>
            </ModalPortal>
          )}

        </div>
      )}

      {/* ---------------- STUDENT PANEL ---------------- */}
      {role === 'student' && !activeQuiz && !recentReport && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold font-outfit text-slate-800 dark:text-white flex items-center gap-2">
              Assigned Quizzes
              <button 
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800 text-slate-450 hover:text-slate-605 dark:text-slate-400 dark:hover:text-slate-300 transition-all active:scale-95 disabled:opacity-50"
                title="Refresh Data"
              >
                <RotateCcw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </h2>
            <p className="text-xs text-slate-400 font-medium">Complete your daily scheduled tests</p>
          </div>          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {quizList.filter(q => !q.is_bank).length > 0 ? (
              quizList.filter(q => !q.is_bank).map((quiz, index) => {
                const theme = getCardTheme(index);
                const hasSub = quizSubmissions.some(s => s.quizId === quiz.id);
                const sub = quizSubmissions.find(s => s.quizId === quiz.id);

                const startTimeMs = quiz.start_time ? new Date(quiz.start_time).getTime() : 0;
                const endTimeMs = quiz.end_time ? new Date(quiz.end_time).getTime() : Infinity;

                const isLocked = quiz.start_time ? currentTime < startTimeMs : false;
                const isExpired = quiz.end_time ? currentTime > endTimeMs : false;
                const isButtonDisabled = hasSub || isLocked || isExpired;

                return (
                  <div 
                    key={quiz.id} 
                    className={`premium-outline-card flex flex-col justify-between relative border ${
                      hasSub 
                        ? 'border-success-500/80' 
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className={`h-1.5 w-full ${hasSub ? 'bg-success-500' : `bg-gradient-to-r ${theme.gradient}`}`} />
                    
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-center">
                          <span className={`bg-gradient-to-r ${theme.gradient} text-white px-2.5 py-1 text-[10px] font-bold uppercase rounded-lg tracking-wider`}>
                            {quiz.subject}
                          </span>
                          {hasSub ? (
                            <span className="bg-success-50 text-success-650 dark:bg-success-950/20 dark:text-success-400 text-[10px] px-2.5 py-1 rounded-full font-bold flex items-center gap-1 border border-success-200/20">
                              ✓ Submitted
                            </span>
                          ) : (
                            <LiveCountdown startTime={quiz.start_time} endTime={quiz.end_time} />
                          )}
                        </div>

                        <h3 className="font-extrabold text-base text-slate-800 dark:text-white mt-4 font-outfit uppercase tracking-wide leading-tight">
                          {quiz.quizName}
                        </h3>
                        
                        <div className="flex items-center space-x-2 mt-2">
                          <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] px-2 py-0.5 rounded font-bold">
                            <Clock className="w-3 h-3" /> {quiz.timeLimit} mins
                          </span>
                          <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] px-2 py-0.5 rounded font-bold">
                            <Award className="w-3 h-3" /> {quiz.totalMarks} Marks
                          </span>
                        </div>

                        <div className="mt-4">
                          <div className="flex justify-between items-center text-xs mb-1">
                            <span className="text-slate-450 font-semibold">
                              {hasSub ? 'Your Score' : 'Passing Criteria'}
                            </span>
                            <span className="font-bold text-slate-700 dark:text-slate-200">
                              {hasSub ? `${sub?.score} / ${quiz.totalMarks}` : `${quiz.passingMarks}%`}
                            </span>
                          </div>
                          <div className="w-full bg-slate-150 dark:bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-200/20">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${hasSub ? 'bg-success-500' : 'bg-warning-550'}`}
                              style={{ width: `${hasSub ? (sub?.accuracy || 0) : quiz.passingMarks}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 pt-3">
                        <button
                          onClick={() => startQuiz(quiz)}
                          disabled={isButtonDisabled || isStartingQuiz === quiz.id}
                          className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                            isButtonDisabled || isStartingQuiz === quiz.id
                              ? 'bg-slate-50 dark:bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-200/10' 
                              : 'bg-success-600 hover:bg-success-700 text-white shadow-md shadow-success-550/10 active:scale-95'
                          }`}
                        >
                          {isStartingQuiz === quiz.id ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              Loading...
                            </>
                          ) : hasSub ? 'Evaluation Confirmed' : 
                           isLocked ? 'Locked (Starts soon)' :
                           isExpired ? 'Expired / Closed' :
                           '▶ Start Quiz Now'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full py-16 flex flex-col items-center justify-center text-center glass-panel p-8 rounded-3xl bg-white dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60 shadow-sm animate-fadeIn">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-3 shadow-inner">
                  <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="font-bold text-slate-700 dark:text-slate-350 font-outfit text-base">No Quizzes Assigned</h3>
                <p className="text-xs text-slate-400 dark:text-slate-455 mt-1 max-w-xs leading-relaxed">Your mentor hasn't scheduled or assigned any quizzes for you yet. Enjoy the break! ✨</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------------- ACTIVE QUIZ SCREEN (STUDENT FULLSCREEN SIMULATOR) ---------------- */}
      {role === 'student' && activeQuiz && (
        <ModalPortal>
          <div className="w-full max-w-3xl bg-slate-950 text-slate-100 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col justify-between min-h-[90vh]">
            {/* Header / Timer */}
            <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base font-outfit truncate text-white">{activeQuiz.quizName}</h3>
                <p className="text-xs text-slate-400 mt-0.5">Anti-Cheating Tracking Enabled</p>
              </div>

              <div className="flex items-center space-x-2 text-warning bg-warning-950/20 px-3 py-1.5 border border-warning-900/30 rounded-xl font-bold text-sm">
                <Clock className="w-4.5 h-4.5 animate-spin" />
                <span>
                  {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                </span>
              </div>
            </div>

            {/* Visual Progress Timer Bar */}
            {(() => {
              const totalSecs = activeQuiz.timeLimit * 60;
              const pct = Math.max(0, Math.min(100, (timeLeft / totalSecs) * 100));
              const barColor = pct < 20 
                ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]' 
                : pct < 50 
                ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]' 
                : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]';
              return (
                <div className="w-full h-1 bg-slate-850 relative overflow-hidden">
                  <div 
                    className={`h-full ${barColor} transition-all duration-1000 ease-linear`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              );
            })()}

            {/* Questions area */}
            <div className="p-6 space-y-6 flex-1 max-h-[70vh] overflow-y-auto">
              {activeQuiz.questions.map((q, idx) => (
                <div key={q.id} className="p-5 bg-slate-900/40 border border-slate-800/80 rounded-xl space-y-3.5">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-bold">Question {idx + 1} of {activeQuiz.questions.length}</span>
                    <span className="font-semibold">{q.marks} Mark</span>
                  </div>
                  
                  <h4 className="text-base font-bold text-white font-outfit">{q.questionText}</h4>

                  {/* Multiple Choice Options */}
                  {q.questionType === 'mcq' && q.options && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                      {q.options.map((opt) => (
                        <button
                          key={opt}
                          onClick={() => handleAnswerChange(q.id, opt)}
                          className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold border transition-all ${
                            quizAnswers[q.id] === opt 
                              ? 'bg-primary-950/50 border-primary text-white font-bold' 
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* True or False Options */}
                  {q.questionType === 'true_false' && (
                    <div className="flex space-x-4 pt-2">
                      {['true', 'false'].map((val) => (
                        <button
                          key={val}
                          onClick={() => handleAnswerChange(q.id, val)}
                          className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold border capitalize transition-all ${
                            quizAnswers[q.id] === val 
                              ? 'bg-primary-950/50 border-primary text-white' 
                              : 'bg-slate-900 border-slate-800 text-slate-400'
                          }`}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Fill in the Blank option */}
                  {q.questionType === 'fill_blank' && (
                    <input
                      type="text"
                      placeholder="Type your answer here..."
                      value={quizAnswers[q.id] || ''}
                      onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-primary"
                    />
                  )}

                  {/* Match selection */}
                  {q.questionType === 'match' && (
                    <div className="space-y-2 pt-2 text-xs">
                      <p className="text-slate-400 italic font-medium">Matching Option Helper: type matched response exactly</p>
                      <input 
                        type="text"
                        placeholder="e.g. A->2, B->1"
                        value={quizAnswers[q.id] || ''}
                        onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-primary"
                      />
                    </div>
                  )}

                  {/* Short answer input */}
                  {q.questionType === 'short' && (
                    <textarea
                      placeholder="Write your explanation answer details here..."
                      value={quizAnswers[q.id] || ''}
                      onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-primary h-20"
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Warning popup */}
            {showCheatAlert && (
              <div className="mx-6 my-2 p-3 bg-red-950/40 border border-red-900/30 text-red-400 text-xs rounded-xl flex items-center justify-between">
                <span className="flex items-center font-semibold">
                  <AlertTriangle className="w-4.5 h-4.5 mr-2 animate-bounce" />
                  Warning: Leaving full screen or changing tabs is flagged! Warning Count: {cheatWarnings}
                </span>
                <button onClick={() => setShowCheatAlert(false)} className="font-bold">✕</button>
              </div>
            )}

            {/* Footer submit */}
            <div className="px-6 py-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-semibold">Auto-save stores progress locally.</span>
              <button
                onClick={() => handleQuizSubmit(false)}
                className="px-6 py-2.5 text-xs font-bold bg-success hover:bg-success-600 text-white rounded-xl shadow-lg transition-all"
              >
                Submit Answers
              </button>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* ---------------- SCORECARD REPORT SCREEN (STUDENT) ---------------- */}
      {role === 'student' && recentReport && (
        <div className="glass-panel p-6 rounded-2xl max-w-xl mx-auto space-y-6 text-center shadow-md animate-scaleIn">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-success-50 dark:bg-success-950/20 text-success rounded-full flex items-center justify-center text-3xl shadow-sm mb-3">
              <Award className="w-8 h-8" />
            </div>
            
            <h3 className="text-xl font-bold font-outfit text-slate-800 dark:text-white">Quiz Evaluation Completed</h3>
            <p className="text-xs text-slate-400 font-medium mt-1">Excellent work, reviewing performance report metrics.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Quiz Score</span>
              <p className="text-2xl font-extrabold text-slate-800 dark:text-white mt-1">
                {recentReport.score} / {recentReport.totalMarks}
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Accuracy</span>
              <p className="text-2xl font-extrabold text-success-600 dark:text-success-400 mt-1">
                {recentReport.accuracy.toFixed(0)}%
              </p>
            </div>
          </div>

          <button
            onClick={() => setRecentReport(null)}
            className="w-full flex items-center justify-center py-2 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all"
          >
            <RotateCcw className="w-4 h-4 mr-1.5" />
            Back to Active Quizzes
          </button>
        </div>
      )}

      {/* ---------------- CREATOR MODAL PANEL (TEACHER) ---------------- */}
      {showCreateModal && role === 'mentor' && (
        <ModalPortal onClose={() => setShowCreateModal(false)}>
            <div className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 flex flex-col max-h-[88vh] animate-scaleIn relative">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
                <h3 className="font-bold text-base text-slate-800 dark:text-white font-outfit">Create Quiz Template</h3>
                
                <div className="flex items-center space-x-2">
                   <button onClick={downloadTemplate} className="flex items-center text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                    <Download className="w-4 h-4 mr-1" /> Template
                   </button>
                   <label className="flex items-center text-xs font-bold text-primary-600 hover:text-primary-700 cursor-pointer">
                    <Upload className="w-4 h-4 mr-1" /> Import CSV
                    <input type="file" accept=".csv" className="hidden" onChange={handleCSVUpload} />
                   </label>
                   <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-2"></div>
                   <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-500 focus:outline-none">✕</button>
                </div>
              </div>

              <form onSubmit={saveCreatedQuiz} className="p-6 overflow-y-auto space-y-4 grow">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Quiz Title</label>
                  <input 
                    type="text" 
                    value={quizName}
                    onChange={(e) => setQuizName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg text-sm text-slate-800 dark:text-white focus:outline-none"
                    placeholder="e.g. Chemical Bonding Quiz"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Subject</label>
                  <input 
                    type="text" 
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg text-sm text-slate-800 dark:text-white focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Chapter</label>
                  <input type="text" value={chapter} onChange={(e) => setChapter(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg text-xs" placeholder="Chapter 1" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Lesson</label>
                  <input type="text" value={lesson} onChange={(e) => setLesson(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg text-xs" placeholder="Lesson 1.2" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Difficulty</label>
                  <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as any)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg text-xs text-slate-600 focus:outline-none">
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Time Limit (mins)</label>
                  <input type="number" value={timeLimit} onChange={(e) => setTimeLimit(Number(e.target.value))} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg text-xs text-slate-800" min="1" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Passing Threshold (%)</label>
                  <input type="number" value={passingMarks} onChange={(e) => setPassingMarks(Number(e.target.value))} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg text-xs text-slate-800" min="10" max="100" required />
                </div>
              </div>

              {/* Questions Area */}
              <div className="space-y-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h4 className="font-bold text-sm text-slate-800 dark:text-white">Question Items ({questions.length})</h4>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-slate-400 font-bold mr-1">Add:</span>
                    <button type="button" onClick={() => addQuestionField('mcq')} className="px-2 py-1 bg-primary-50 dark:bg-primary-950/20 text-primary-600 rounded-md text-xs font-bold hover:bg-primary-100 transition-colors flex items-center">
                      <Plus className="w-3.5 h-3.5 mr-0.5" /> MCQ
                    </button>
                    <button type="button" onClick={() => addQuestionField('true_false')} className="px-2 py-1 bg-primary-50 dark:bg-primary-950/20 text-primary-600 rounded-md text-xs font-bold hover:bg-primary-100 transition-colors flex items-center">
                      <Plus className="w-3.5 h-3.5 mr-0.5" /> T/F
                    </button>
                    <button type="button" onClick={() => addQuestionField('fill_blank')} className="px-2 py-1 bg-primary-50 dark:bg-primary-950/20 text-primary-600 rounded-md text-xs font-bold hover:bg-primary-100 transition-colors flex items-center">
                      <Plus className="w-3.5 h-3.5 mr-0.5" /> Fill Blank
                    </button>
                    <button type="button" onClick={() => addQuestionField('match')} className="px-2 py-1 bg-primary-50 dark:bg-primary-950/20 text-primary-600 rounded-md text-xs font-bold hover:bg-primary-100 transition-colors flex items-center">
                      <Plus className="w-3.5 h-3.5 mr-0.5" /> Match
                    </button>
                    <button type="button" onClick={() => addQuestionField('short')} className="px-2 py-1 bg-primary-50 dark:bg-primary-950/20 text-primary-600 rounded-md text-xs font-bold hover:bg-primary-100 transition-colors flex items-center">
                      <Plus className="w-3.5 h-3.5 mr-0.5" /> Short
                    </button>
                  </div>
                </div>

                {questions.map((q, idx) => (
                  <div key={q.id} className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/50 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400">Q{idx + 1} Settings</span>
                      <button 
                        type="button" 
                        onClick={() => deleteQuestionField(idx)} 
                        className="text-xs text-danger-600 hover:underline"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1">Question Type</label>
                        <select 
                          value={q.questionType}
                          onChange={(e) => handleQuestionFieldChange(idx, 'questionType', e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 rounded-lg text-xs"
                        >
                          <option value="mcq">Multiple Choice</option>
                          <option value="true_false">True / False</option>
                          <option value="fill_blank">Fill in the Blank</option>
                          <option value="match">Match the Following</option>
                          <option value="short">Short Answer</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1">Marks</label>
                        <input 
                          type="number" 
                          value={q.marks} 
                          onChange={(e) => handleQuestionFieldChange(idx, 'marks', Number(e.target.value))} 
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 rounded-lg text-xs text-slate-800 dark:text-white" 
                          min="1" 
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">Question Statement</label>
                      <input 
                        type="text" 
                        value={q.questionText} 
                        onChange={(e) => handleQuestionFieldChange(idx, 'questionText', e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 rounded-lg text-xs text-slate-800 dark:text-white" 
                        placeholder="Type question text..." 
                        required 
                      />
                    </div>

                    {/* MCQ Choices Input */}
                    {q.questionType === 'mcq' && (
                      <div className="grid grid-cols-2 gap-2">
                        {[0, 1, 2, 3].map(optIdx => (
                          <div key={optIdx}>
                            <label className="block text-[9px] text-slate-400">Choice {optIdx + 1}</label>
                            <input 
                              type="text" 
                              value={q.options?.[optIdx] || ''} 
                              onChange={(e) => handleMCQOptionChange(idx, optIdx, e.target.value)}
                              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded text-xs text-slate-800 dark:text-white" 
                              required 
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Match Column Options */}
                    {q.questionType === 'match' && (
                      <div className="space-y-3">
                        <div>
                           <label className="block text-[10px] font-bold text-slate-400 mb-1">Number of Match Rows</label>
                           <input
                             type="number"
                             min="2"
                             max="10"
                             value={Math.max(q.options?.length || 4, q.matchColumnB?.length || 4)}
                             onChange={(e) => {
                               const len = Number(e.target.value);
                               const newA = [...(q.options || [])];
                               const newB = [...(q.matchColumnB || [])];
                               while (newA.length < len) newA.push('');
                               while (newB.length < len) newB.push('');
                               newA.length = len;
                               newB.length = len;
                               handleQuestionFieldChange(idx, 'options', newA);
                               handleQuestionFieldChange(idx, 'matchColumnB', newB);
                             }}
                             className="w-24 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 rounded-lg text-xs text-slate-800 dark:text-white focus:outline-none"
                           />
                        </div>

                        <div className="space-y-2">
                          {(q.options || ['', '', '', '']).map((_, rIdx) => (
                            <div key={rIdx} className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[9px] text-slate-400 mb-1">Row {rIdx + 1} - Column A</label>
                                <input 
                                  type="text" 
                                  value={q.options?.[rIdx] || ''} 
                                  onChange={(e) => {
                                    const opts = [...(q.options || ['', '', '', ''])];
                                    opts[rIdx] = e.target.value;
                                    handleQuestionFieldChange(idx, 'options', opts);
                                  }}
                                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 rounded text-xs text-slate-800 dark:text-white" 
                                  placeholder="Item A"
                                  required 
                                />
                              </div>
                              <div>
                                 <label className="block text-[9px] text-slate-400 mb-1">Row {rIdx + 1} - Column B</label>
                                <input 
                                  type="text" 
                                  value={q.matchColumnB?.[rIdx] || ''} 
                                  onChange={(e) => {
                                    const opts = [...(q.matchColumnB || ['', '', '', ''])];
                                    opts[rIdx] = e.target.value;
                                    handleQuestionFieldChange(idx, 'matchColumnB', opts);
                                  }}
                                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 rounded text-xs text-slate-800 dark:text-white" 
                                  placeholder="Match B"
                                  required 
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Correct answer specifications */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1">
                          Correct Answer {q.questionType === 'fill_blank' && "(Fuzzy matched)"}
                        </label>
                        {q.questionType === 'true_false' ? (
                          <select 
                            value={q.correctAnswer} 
                            onChange={(e) => handleQuestionFieldChange(idx, 'correctAnswer', e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 rounded-lg text-xs"
                          >
                            <option value="">Select...</option>
                            <option value="true">True</option>
                            <option value="false">False</option>
                          </select>
                        ) : (
                          <input 
                            type="text" 
                            value={q.correctAnswer} 
                            onChange={(e) => handleQuestionFieldChange(idx, 'correctAnswer', e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 rounded-lg text-xs text-slate-800 dark:text-white" 
                            placeholder="Type correct answer..." 
                            required={q.questionType !== 'short'} 
                          />
                        )}
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1">Explanation (Optional)</label>
                        <input 
                          type="text" 
                          value={q.explanation || ''} 
                          onChange={(e) => handleQuestionFieldChange(idx, 'explanation', e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 rounded-lg text-xs text-slate-800 dark:text-white" 
                          placeholder="e.g. Because..." 
                        />
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Duplicate Add Buttons at Bottom */}
                {questions.length > 3 && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/50">
                    <h4 className="font-bold text-sm text-slate-800 dark:text-white">Add More Questions</h4>
                    <div className="flex flex-wrap items-center gap-2">
                      <button type="button" onClick={() => addQuestionField('mcq')} className="px-2 py-1 bg-primary-50 dark:bg-primary-950/20 text-primary-600 rounded-md text-xs font-bold hover:bg-primary-100 transition-colors flex items-center">
                        <Plus className="w-3.5 h-3.5 mr-0.5" /> MCQ
                      </button>
                      <button type="button" onClick={() => addQuestionField('true_false')} className="px-2 py-1 bg-primary-50 dark:bg-primary-950/20 text-primary-600 rounded-md text-xs font-bold hover:bg-primary-100 transition-colors flex items-center">
                        <Plus className="w-3.5 h-3.5 mr-0.5" /> T/F
                      </button>
                      <button type="button" onClick={() => addQuestionField('fill_blank')} className="px-2 py-1 bg-primary-50 dark:bg-primary-950/20 text-primary-600 rounded-md text-xs font-bold hover:bg-primary-100 transition-colors flex items-center">
                        <Plus className="w-3.5 h-3.5 mr-0.5" /> Fill Blank
                      </button>
                      <button type="button" onClick={() => addQuestionField('match')} className="px-2 py-1 bg-primary-50 dark:bg-primary-950/20 text-primary-600 rounded-md text-xs font-bold hover:bg-primary-100 transition-colors flex items-center">
                        <Plus className="w-3.5 h-3.5 mr-0.5" /> Match
                      </button>
                      <button type="button" onClick={() => addQuestionField('short')} className="px-2 py-1 bg-primary-50 dark:bg-primary-950/20 text-primary-600 rounded-md text-xs font-bold hover:bg-primary-100 transition-colors flex items-center">
                        <Plus className="w-3.5 h-3.5 mr-0.5" /> Short
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Active Assignment Scheduling & Targeting options in Create Modal */}
                {!isBank && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/50 space-y-4 pt-4 mt-4 animate-fadeIn text-left">
                    <h4 className="font-extrabold text-xs text-slate-700 dark:text-slate-350 uppercase tracking-wide">Assign & Schedule Settings</h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Assignment Date</label>
                        <input 
                          type="date" 
                          value={assignDate}
                          onChange={(e) => setAssignDate(e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg text-xs text-slate-800 dark:text-white focus:outline-none"
                          required={!isBank}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Start Time (Optional)</label>
                        <input 
                          type="datetime-local" 
                          value={assignStartTime}
                          onChange={(e) => setAssignStartTime(e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg text-xs text-slate-805 dark:text-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">End Time (Optional)</label>
                        <input 
                          type="datetime-local" 
                          value={assignEndTime}
                          onChange={(e) => setAssignEndTime(e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg text-xs text-slate-805 dark:text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Target Students</label>
                      <div className="flex flex-col sm:flex-row gap-4 mb-2">
                        <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                          <input type="radio" name="createAssignTarget" value="all" checked={assignTarget === 'all'} onChange={() => setAssignTarget('all')} className="text-primary-600 focus:ring-primary-500" />
                          All Students
                        </label>
                        <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                          <input type="radio" name="createAssignTarget" value="class" checked={assignTarget === 'class'} onChange={() => setAssignTarget('class')} className="text-primary-600 focus:ring-primary-500" />
                          By Class/Standard
                        </label>
                        <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                          <input type="radio" name="createAssignTarget" value="students" checked={assignTarget === 'students'} onChange={() => setAssignTarget('students')} className="text-primary-600 focus:ring-primary-500" />
                          Specific Students
                        </label>
                      </div>

                      {assignTarget === 'class' && (
                        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                          <label className="block text-[9px] font-bold text-slate-450 uppercase mb-1">Select Classes</label>
                          <div className="flex flex-wrap gap-1.5">
                            {uniqueClasses.map(cls => (
                              <label key={cls} className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2.5 py-1 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                                <input type="checkbox" checked={selectedClasses.includes(cls)} onChange={(e) => {
                                  if (e.target.checked) setSelectedClasses([...selectedClasses, cls]);
                                  else setSelectedClasses(selectedClasses.filter(c => c !== cls));
                                }} className="text-primary-600 focus:ring-primary-500 rounded animate-fadeIn" />
                                {cls}
                              </label>
                            ))}
                          </div>
                        </div>
                      )}

                      {assignTarget === 'students' && (
                        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                          <label className="block text-[9px] font-bold text-slate-450 uppercase mb-1">Select Students</label>
                          <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
                            {(myStudents || []).map(st => (
                              <label key={st.id} className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1.5 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                                <input type="checkbox" checked={selectedStudentIds.includes(st.id)} onChange={(e) => {
                                  if (e.target.checked) setSelectedStudentIds([...selectedStudentIds, st.id]);
                                  else setSelectedStudentIds(selectedStudentIds.filter(id => id !== st.id));
                                }} className="text-primary-600 focus:ring-primary-500 rounded animate-fadeIn" />
                                <div className="truncate text-left">
                                  <p className="leading-tight truncate">{st.name}</p>
                                  {st.className && <p className="text-[9px] text-slate-405 leading-none mt-0.5">{st.className}</p>}
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              </form>
              
              <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50 dark:bg-slate-800/50 rounded-b-2xl">
                 <label className="flex items-center text-xs font-bold text-slate-600 dark:text-slate-300">
                    <input 
                      type="checkbox" 
                      checked={isBank} 
                      onChange={(e) => setIsBank(e.target.checked)}
                      className="mr-2"
                    />
                    Save to Quiz Bank (Template)
                 </label>
                <div className="flex space-x-2">
                  <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-xl text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 hover:bg-slate-50 focus:outline-none">Cancel</button>
                  <button onClick={saveCreatedQuiz} className="px-4 py-2 text-xs font-bold rounded-xl text-white bg-primary-600 hover:bg-primary-700 focus:outline-none">Save Quiz</button>
                </div>
              </div>
            </div>
        </ModalPortal>
      )}

      {/* Quiz Questions Preview Modal */}
      {previewQuiz && (
        <ModalPortal onClose={() => setPreviewQuiz(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-2xl border border-slate-100 dark:border-slate-800 shadow-2xl relative">
            <button 
              onClick={() => setPreviewQuiz(null)} 
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-bold p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              ✕
            </button>
            
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <span className="text-[10px] font-bold bg-primary-50 text-primary-600 dark:bg-primary-950/20 px-2.5 py-1 rounded">
                {previewQuiz.subject}
              </span>
              <h3 className="font-bold text-xl text-slate-800 dark:text-white font-outfit mt-2">{previewQuiz.quizName}</h3>
              <p className="text-xs text-slate-400 mt-1 font-semibold">
                Time Limit: {previewQuiz.timeLimit} mins • Passing: {previewQuiz.passingMarks}% • Total Marks: {previewQuiz.totalMarks}
              </p>
              {previewQuiz.instructions && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 bg-slate-50 dark:bg-slate-850 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/40">
                  <strong>Instructions: </strong>{previewQuiz.instructions}
                </p>
              )}
            </div>

            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
              {previewQuiz.questions && previewQuiz.questions.map((q, idx) => (
                <div key={q.id || idx} className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-bold">Question {idx + 1} ({q.questionType?.replace('_', ' ').toUpperCase()})</span>
                    <span className="font-semibold">{q.marks} Mark(s)</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-white font-outfit">{q.questionText}</h4>
                  
                  {q.questionType === 'mcq' && q.options && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {q.options.map((opt, oIdx) => (
                        <div 
                          key={opt || oIdx} 
                          className={`px-3 py-2 rounded-lg text-xs font-semibold border ${
                            q.correctAnswer === opt 
                              ? 'bg-success-50/50 border-success-200 text-success-700 dark:bg-success-950/10 dark:border-success-900/30 dark:text-success-400 font-bold' 
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {opt} {q.correctAnswer === opt && '✓'}
                        </div>
                      ))}
                    </div>
                  )}

                  {q.questionType === 'true_false' && (
                    <div className="flex space-x-2 pt-1">
                      {['true', 'false'].map((val) => (
                        <div 
                          key={val}
                          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold text-center border capitalize ${
                            q.correctAnswer?.toLowerCase() === val 
                              ? 'bg-success-50/50 border-success-200 text-success-700 dark:bg-success-950/10 dark:border-success-900/30 dark:text-success-400' 
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {val} {q.correctAnswer?.toLowerCase() === val && '✓'}
                        </div>
                      ))}
                    </div>
                  )}

                  {q.questionType !== 'mcq' && q.questionType !== 'true_false' && (
                    <div className="text-xs pt-1 space-y-1">
                      <p className="text-slate-505 dark:text-slate-400">
                        <strong className="text-slate-705 dark:text-slate-350">Correct Answer: </strong>
                        <span className="font-mono bg-slate-100 dark:bg-slate-850 px-1.5 py-0.5 rounded text-primary-650 dark:text-primary-400">{q.correctAnswer}</span>
                      </p>
                    </div>
                  )}

                  {q.explanation && (
                    <p className="text-[11px] text-slate-405 dark:text-slate-500 italic mt-1.5">
                      <strong>Explanation: </strong>{q.explanation}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
              <button 
                onClick={() => setPreviewQuiz(null)} 
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-all"
              >
                Close Preview
              </button>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
};
