import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE } from '../config/api';
import { useAuth } from './AuthContext';

// Interfaces matching backend tables
export interface AttendanceStats {
  student_id: number;
  present_count: number;
  absent_count: number;
  total_days: number;
  percentage: number;
  history: { date: string; status: string }[];
}

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  role: 'mentor' | 'student' | 'admin';
  name: string;
  photoUrl?: string;
  school?: string;
  className?: string;
  section?: string;
  parentContact?: string;
  mentor_id?: number;
  streak?: number;
  sid?: string;
  tid?: string;
  mentor_notes?: string;
}

export interface Homework {
  id: number;
  date: string; // YYYY-MM-DD
  subject: string;
  homeworkType: 'School Homework' | 'Extra Practice Homework';
  title: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High';
  estimatedTime: number; // in mins
  dueDate: string; // YYYY-MM-DD
  attachmentUrl?: string;
  attachmentName?: string;
  remarks?: string;
  status: 'Pending' | 'Completed';
  createdTime: string;
  carriedFromId?: number;
  studentId?: number;
  studentName?: string;
  students?: {
    student_id: number | null;
    student_name: string;
    status: 'Pending' | 'Completed';
  }[];
  completion_percentage?: number;
}

export interface LibraryMaterial {
  id: number;
  title: string;
  subject: string;
  category: string;
  description: string;
  tags: string[];
  fileUrl: string;
  fileName: string;
  thumbnailUrl?: string;
  visibility: 'Public' | 'Private';
  createdTime: string;
  bookmarksCount?: number;
  viewsCount?: number;
  isBookmarked?: boolean;
  student_id?: number | null;
  student_name?: string;
}

export interface QuizQuestion {
  id: string;
  questionType: 'mcq' | 'true_false' | 'fill_blank' | 'match' | 'short';
  questionText: string;
  options?: string[]; // for MCQ: 4 options, for Match: Column A choices (can be stringified JSON)
  matchColumnB?: string[]; // for Match: Column B choices
  correctAnswer: string; // or correct order index, or true/false
  explanation?: string;
  marks: number;
}

export interface Quiz {
  id: number;
  quizName: string;
  subject: string;
  chapter: string;
  lesson: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  instructions: string;
  timeLimit: number; // in minutes
  passingMarks: number;
  totalMarks: number;
  is_bank?: boolean;
  assignment_date?: string;
  start_time?: string;
  end_time?: string;
  student_id?: number;
  student_name?: string;
  questions: QuizQuestion[];
  questions_count?: number;
  createdTime: string;

}

export interface QuizSubmission {
  id: number;
  quizId: number;
  quizName: string;
  subject: string;
  studentId: number;
  score: number;
  totalMarks: number;
  accuracy: number; // percentage
  timeTaken: number; // seconds
  correctCount: number;
  totalQuestions: number;
  strongAreas: string;
  weakAreas: string;
  submittedAt: string;
}

export interface WrittenTest {
  id: number;
  testName: string;
  subject: string;
  description: string;
  instructions: string;
  duration: number; // minutes
  totalMarks: number;
  startDate?: string;
  endDate?: string;
  questionPaperUrl: string;
  questionPaperName: string;
  testType: 'Unit Test' | 'Chapter Test' | 'Monthly Test' | 'Quarterly Test' | 'Half-Yearly' | 'Annual Exam' | 'Model Exam' | 'Practice Exam';
  createdTime: string;
  is_bank?: boolean;
  assignment_date?: string;
  student_id?: number;
  student_name?: string;
}

export interface WrittenTestSubmission {
  id: number;
  testId: number;
  testName: string;
  subject: string;
  studentId: number;
  studentName?: string;
  answerSheetUrl: string; // PDF/Image data URI mock
  answerSheetName: string;
  submissionDate: string;
  marksObtained?: number;
  totalMarks: number;
  remarks?: string;
  status: 'Pending' | 'Graded';
  gradedAt?: string;
}

export interface Notification {
  id: number;
  title: string;
  content: string;
  isRead: boolean;
  type: 'homework' | 'quiz' | 'test' | 'result' | 'material' | 'achievement';
  createdTime: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  unlockedAt: string;
  icon: string;
}

interface AppContextType {
  role: 'mentor' | 'student' | 'admin';
  setRole: (role: 'mentor' | 'student' | 'admin') => void;
  mentorProfile: UserProfile;
  setMentorProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  studentProfile: UserProfile;
  setStudentProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  homeworkList: Homework[];
  addHomework: (hw: Omit<Homework, 'id' | 'createdTime' | 'status'> & { student_ids?: number[] }) => void;
  updateHomework: (id: number, fields: Partial<Homework>) => void;
  deleteHomework: (id: number) => void;
  duplicateHomework: (id: number) => void;
  libraryList: LibraryMaterial[];
  addLibraryMaterial: (mat: Omit<LibraryMaterial, 'id' | 'createdTime' | 'viewsCount' | 'bookmarksCount' | 'isBookmarked'> & { student_ids?: number[] }) => void;
  deleteLibraryMaterial: (id: number) => void;
  toggleBookmarkMaterial: (id: number) => void;
  quizList: Quiz[];
  quizBank: Quiz[];
  addQuiz: (quiz: Omit<Quiz, 'id' | 'createdTime' | 'totalMarks'> & { student_ids?: number[]; start_time?: string; end_time?: string }) => void;
  assignQuiz: (quizId: number, assignmentDate: string, payload?: { student_ids?: number[]; start_time?: string; end_time?: string }) => void;
  deleteQuiz: (id: number) => void;
  quizSubmissions: QuizSubmission[];
  submitQuiz: (sub: Omit<QuizSubmission, 'id' | 'studentId' | 'submittedAt'>, answers: any) => Promise<any>;
  writtenTests: WrittenTest[];
  writtenTestBank: WrittenTest[];
  addWrittenTest: (test: Omit<WrittenTest, 'id' | 'createdTime'> & { is_bank?: boolean; student_ids?: number[] }) => Promise<void>;
  assignWrittenTest: (testId: number, startDate: string, endDate: string, student_ids?: number[]) => Promise<void>;
  deleteWrittenTest: (id: number) => void;
  writtenTestSubmissions: WrittenTestSubmission[];
  submitWrittenTest: (testId: number, answerSheetUrl: string, answerSheetName: string) => void;
  gradeWrittenSubmission: (subId: number, marks: number, remarks: string) => void;
  notifications: Notification[];
  addNotification: (title: string, content: string, type: Notification['type']) => void;
  markAllNotificationsRead: () => void;
  dismissNotification: (id: number) => void;
  clearAllNotifications: () => void;
  achievements: Achievement[];
  unlockAchievement: (name: string, description: string, icon: string) => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  streakDays: number;
  incrementStreak: () => void;
  myStudents: UserProfile[];
  activeStudent: UserProfile | null;
  setActiveStudent: (student: UserProfile | null) => void;
  chatMessages: any[];
  fetchChatMessages: (recipientId?: number) => void;
  sendChatMessage: (recipientId: number | null, content: string) => Promise<any>;
  leaderboard: any[];
  fetchLeaderboard: () => void;
  allChatMessages: any[];
  unreadChatCount: number;
  toast: { message: string; title: string; show: boolean };
  showToast: (title: string, message: string) => void;
  attendanceStats: AttendanceStats | null;
  updateMentorNotes: (studentId: number, notes: string) => Promise<boolean>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token, fetchProfile } = useAuth();

  // Authentication Role Switcher
  const [role, setRoleState] = useState<'mentor' | 'student' | 'admin'>('student');
  const [mentorProfile, setMentorProfile] = useState<UserProfile>({} as UserProfile);
  const [studentProfile, setStudentProfile] = useState<UserProfile>({} as UserProfile);

  useEffect(() => {
    if (user) {
      setRoleState(user.role);
      const mappedProfile = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        name: user.name,
        photoUrl: user.photo_url || '',
        school: user.school || '',
        className: user.class_name || '',
        section: user.section || '',
        parentContact: user.parent_contact || '',
        mentor_id: user.mentor_id || undefined,
        streak: user.streak || 0,
        mentor_notes: user.mentor_notes || '',
      };
      if (user.role === 'mentor') {
        setMentorProfile(mappedProfile);
        setStreakDays(0);
      } else if (user.role === 'student') {
        setStudentProfile(mappedProfile);
        if (typeof user.streak === 'number') {
          setStreakDays(user.streak);
        }
      } else if (user.role === 'admin') {
        setStreakDays(0);
      }
    }
  }, [user]);

  const setRole = (_newRole: 'mentor' | 'student' | 'admin') => {
    console.warn("Manual role switching disabled when using live API.");
  };

  // Theme — respects system preference on first load
  const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
    const stored = localStorage.getItem('cm_theme');
    if (stored === 'light' || stored === 'dark') return stored;
    // Auto-detect system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const setTheme = (newTheme: 'light' | 'dark' | 'system') => {
    if (newTheme === 'system') {
      localStorage.removeItem('cm_theme');
      const sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setThemeState(sysDark ? 'dark' : 'light');
    } else {
      setThemeState(newTheme);
      localStorage.setItem('cm_theme', newTheme);
    }
  };

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Listen for OS theme changes (only when user hasn't manually picked)
  useEffect(() => {
    const checkTheme = () => {
      const stored = localStorage.getItem('cm_theme');
      if (!stored) {
        const sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setThemeState(sysDark ? 'dark' : 'light');
      }
    };

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => checkTheme();
    
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Streak days
  const [streakDays, setStreakDays] = useState<number>(() => {
    return Number(localStorage.getItem('cm_streak_days') || '0');
  });

  const incrementStreak = () => {
    setStreakDays(prev => {
      const next = prev + 1;
      localStorage.setItem('cm_streak_days', String(next));
      return next;
    });
  };

  const [homeworkList, setHomeworkList] = useState<Homework[]>([]);
  const [libraryList, setLibraryList] = useState<LibraryMaterial[]>([]);
  const [quizList, setQuizList] = useState<Quiz[]>([]);
  const [quizBank, setQuizBank] = useState<Quiz[]>([]);
  const [quizSubmissions, setQuizSubmissions] = useState<QuizSubmission[]>([]);
  const [writtenTests, setWrittenTests] = useState<WrittenTest[]>([]);
  const [writtenTestBank, setWrittenTestBank] = useState<WrittenTest[]>([]);
  const [writtenTestSubmissions, setWrittenTestSubmissions] = useState<WrittenTestSubmission[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  // New State variables
  const [myStudents, setMyStudents] = useState<UserProfile[]>([]);
  const [activeStudent, setActiveStudentState] = useState<UserProfile | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [allChatMessages, setAllChatMessages] = useState<any[]>([]);
  const [unreadChatCount, setUnreadChatCount] = useState<number>(0);
  const [toast, setToast] = useState<{ message: string; title: string; show: boolean }>({ message: '', title: '', show: false });
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats | null>(null);

  const showToast = (title: string, message: string) => {
    setToast({ title, message, show: true });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 4000);
  };

  const setActiveStudent = (student: UserProfile | null) => {
    setActiveStudentState(student);
    if (student) {
      setStudentProfile(student);
    }
  };


  // Fetch all live data when user and token are ready
  const fetchLiveData = () => {
    if (!user || !token) return;
    const headers = { 'Authorization': `Bearer ${token}` };

    fetch(`${API_BASE}/api/homework`, { headers })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setHomeworkList(data.map(h => ({
          ...h, homeworkType: h.homework_type, estimatedTime: h.estimated_time, dueDate: h.due_date, attachmentUrl: h.attachment_url, createdTime: h.created_at, carriedFromId: h.carried_from_id, studentId: h.student_id, studentName: h.student_name, students: h.students, completion_percentage: h.completion_percentage
        })));
      }).catch(console.error);

    fetch(`${API_BASE}/api/library`, { headers })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setLibraryList(data.map(m => ({
          ...m,
          fileUrl: m.file_url,
          fileName: m.file_url ? m.file_url.split('/').pop() || 'File' : 'File',
          thumbnailUrl: m.thumbnail_url,
          createdTime: m.created_at,
          isBookmarked: !!m.is_bookmarked
        })));
      }).catch(console.error);

    fetch(`${API_BASE}/api/quiz`, { headers })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setQuizList(data.map(q => ({
          ...q, quizName: q.quiz_name, timeLimit: q.time_limit, passingMarks: q.passing_marks, totalMarks: q.total_marks, createdTime: q.created_at, assignment_date: q.assignment_date, is_bank: q.is_bank
        })));
      }).catch(console.error);

    fetch(`${API_BASE}/api/quiz/bank`, { headers })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setQuizBank(data.map(q => ({
          ...q, quizName: q.quiz_name, timeLimit: q.time_limit, passingMarks: q.passing_marks, totalMarks: q.total_marks, createdTime: q.created_at, is_bank: true
        })));
      }).catch(console.error);

    fetch(`${API_BASE}/api/tests`, { headers })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setWrittenTests(data.map(t => ({
          ...t, testName: t.test_name, startDate: t.start_date, endDate: t.end_date, totalMarks: t.total_marks, questionPaperUrl: t.question_paper_url, createdTime: t.created_at, is_bank: t.is_bank
        })));
      }).catch(console.error);

    fetch(`${API_BASE}/api/tests/bank`, { headers })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setWrittenTestBank(data.map(t => ({
          ...t, testName: t.test_name, startDate: t.start_date, endDate: t.end_date, totalMarks: t.total_marks, questionPaperUrl: t.question_paper_url, createdTime: t.created_at, is_bank: t.is_bank
        })));
      }).catch(console.error);

    fetch(`${API_BASE}/api/tests/submissions`, { headers })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setWrittenTestSubmissions(data.map(s => ({
          ...s, testId: s.test_id, testName: s.test_name, studentId: s.student_id, studentName: s.student_name, answerSheetUrl: s.answer_sheet_url, submissionDate: s.submission_date, marksObtained: s.marks_obtained, totalMarks: s.total_marks, gradedAt: s.graded_at
        })));
      }).catch(console.error);

    fetch(`${API_BASE}/api/notifications`, { headers })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setNotifications(data);
      }).catch(console.error);

    // Dynamic Achievements Fetch
    if (user.role === 'mentor' && activeStudent) {
      fetch(`${API_BASE}/api/achievements/student/${activeStudent.id}`, { headers })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setAchievements(data);
        }).catch(console.error);
    } else if (user.role === 'student') {
      fetch(`${API_BASE}/api/achievements`, { headers })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setAchievements(data);
        }).catch(console.error);
    }

    // Quiz Submissions Fetch
    fetch(`${API_BASE}/api/quiz/submissions`, { headers })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setQuizSubmissions(data.map(s => ({
          ...s, quizId: s.quiz_id, quizName: s.quiz_name, studentId: s.student_id, studentName: s.student_name, totalMarks: s.total_marks, submittedAt: s.submitted_at, timeTaken: s.time_taken, strongAreas: s.strong_areas, weakAreas: s.weak_areas
        })));
      }).catch(console.error);

    // Mentor specific: Fetch students
    if (user.role === 'mentor') {
      fetch(`${API_BASE}/api/users/my-students`, { headers })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            const mappedStudents: UserProfile[] = data.map((s: any) => ({
              id: s.id,
              username: s.username || s.email || '',
              email: s.email || '',
              role: 'student' as const,
              name: s.name || '',
              photoUrl: s.photo_url || '',
              school: s.school || '',
              className: s.class_name || '',
              section: s.section || '',
              parentContact: s.parent_contact || '',
              mentor_id: s.mentor_id,
              streak: s.streak || 0,
              sid: s.sid || '',
              tid: s.tid || '',
              mentor_notes: s.mentor_notes || '',
            }));
            setMyStudents(mappedStudents);
            if (mappedStudents.length > 0 && !activeStudent) {
              // Ensure we check local storage or keep it
              setActiveStudent(mappedStudents[0]);
            }
          }
        }).catch(console.error);
    }

    // Leaderboard Fetch
    fetch(`${API_BASE}/api/users/leaderboard`, { headers })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setLeaderboard(data);
      }).catch(console.error);

    // Initial all chat messages fetch
    fetch(`${API_BASE}/api/chat/all-messages`, { headers })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setAllChatMessages(data);
      }).catch(console.error);

    // Fetch attendance stats
    if (user.role === 'mentor' && activeStudent) {
      fetch(`${API_BASE}/api/attendance/stats?student_id=${activeStudent.id}`, { headers })
        .then(res => res.json())
        .then(data => {
          if (data && typeof data.percentage === 'number') setAttendanceStats(data);
        }).catch(console.error);
    } else if (user.role === 'student') {
      fetch(`${API_BASE}/api/attendance/stats`, { headers })
        .then(res => res.json())
        .then(data => {
          if (data && typeof data.percentage === 'number') setAttendanceStats(data);
        }).catch(console.error);
    }
  };

  useEffect(() => {
    fetchLiveData();
  }, [user, token, activeStudent?.id]);

  const prevMessagesRef = React.useRef<any[]>([]);

  const calculateUnreadChatCount = (messages: any[]) => {
    if (!user) return 0;
    let count = 0;
    messages.forEach(msg => {
      if (msg.sender_id === user.id) return;
      let threadKey = 'group';
      if (msg.recipient_id !== null) {
        threadKey = msg.sender_id === user.id ? String(msg.recipient_id) : String(msg.sender_id);
      }
      const lastReadStr = localStorage.getItem(`cm_chat_last_read_${threadKey}`);
      if (!lastReadStr) {
        count++;
      } else {
        const lastReadTime = new Date(lastReadStr).getTime();
        const msgTime = new Date(msg.timestamp).getTime();
        if (msgTime > lastReadTime) {
          count++;
        }
      }
    });
    return count;
  };

  // Request notification permission on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, []);

  const prevNotificationsRef = React.useRef<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const prevIds = new Set(prevNotificationsRef.current.map(n => n.id));
    const newNotifs = notifications.filter(n => !prevIds.has(n.id));
    if (newNotifs.length > 0 && prevNotificationsRef.current.length > 0) {
      newNotifs.forEach(notif => {
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification(notif.title, {
              body: notif.content,
              icon: '/favicon.ico'
            });
          } catch (e) {
            console.error('Failed to show push notification:', e);
          }
        }
      });
    }
    prevNotificationsRef.current = notifications;
  }, [notifications, user?.id]);

  useEffect(() => {
    setUnreadChatCount(calculateUnreadChatCount(allChatMessages));
  }, [allChatMessages, user?.id]);

  useEffect(() => {
    if (!user) return;
    const prevIds = new Set(prevMessagesRef.current.map(m => m.id));
    const newMessages = allChatMessages.filter(m => !prevIds.has(m.id) && m.sender_id !== user.id);
    if (newMessages.length > 0 && prevMessagesRef.current.length > 0) {
      const latest = newMessages[newMessages.length - 1];
      showToast(`New Message from ${latest.sender_name}`, latest.content);

      // Trigger browser push notification for chat message
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification(`New Message from ${latest.sender_name}`, {
            body: latest.content,
            icon: '/favicon.ico'
          });
        } catch (e) {
          console.error('Failed to show chat push notification:', e);
        }
      }

      const newNotif: Notification = {
        id: Date.now(),
        title: `Chat from ${latest.sender_name}`,
        content: latest.content,
        isRead: false,
        type: 'homework',
        createdTime: new Date().toISOString()
      };
      setNotifications(prev => [newNotif, ...prev]);
    }
    prevMessagesRef.current = allChatMessages;
  }, [allChatMessages, user?.id]);

  useEffect(() => {
    if (!user || !token) return;
    const interval = setInterval(() => {
      const headers = { 'Authorization': `Bearer ${token}` };
      fetch(`${API_BASE}/api/chat/all-messages`, { headers })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setAllChatMessages(data);
          }
        }).catch(console.error);
    }, 4000);
    return () => clearInterval(interval);
  }, [user, token]);


  // Operations

  const getHeaders = () => ({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  });

  const addHomework = (hw: Omit<Homework, 'id' | 'createdTime' | 'status'> & { student_ids?: number[] }) => {
    fetch(`${API_BASE}/api/homework`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        date: hw.date,
        subject: hw.subject,
        homework_type: hw.homeworkType,
        title: hw.title,
        description: hw.description,
        priority: hw.priority,
        estimated_time: hw.estimatedTime,
        due_date: hw.dueDate,
        attachment_url: hw.attachmentUrl,
        remarks: hw.remarks,
        student_ids: hw.student_ids
      })
    }).then(res => {
      if (res.ok) fetchLiveData();
    }).catch(console.error);
  };

  const updateHomework = (id: number, fields: Partial<Homework>) => {
    // Optimistically update the UI list immediately so checking the box is instant
    setHomeworkList(prev => prev.map(hw => {
      if (hw.id === id) {
        return { ...hw, ...fields };
      }
      return hw;
    }));

    const payload: any = {};
    if (fields.status !== undefined) payload.status = fields.status;
    if (fields.title !== undefined) payload.title = fields.title;
    if (fields.subject !== undefined) payload.subject = fields.subject;
    if (fields.description !== undefined) payload.description = fields.description;
    if (fields.date !== undefined) payload.date = fields.date;
    if (fields.dueDate !== undefined) payload.due_date = fields.dueDate;
    if (fields.homeworkType !== undefined) payload.homework_type = fields.homeworkType;
    if (fields.priority !== undefined) payload.priority = fields.priority;
    if (fields.estimatedTime !== undefined) payload.estimated_time = fields.estimatedTime;
    if (fields.attachmentUrl !== undefined) payload.attachment_url = fields.attachmentUrl;
    if (fields.remarks !== undefined) payload.remarks = fields.remarks;
    
    fetch(`${API_BASE}/api/homework/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    }).then(res => {
      if (res.ok) {
        fetchLiveData();
        fetchProfile();
      } else {
        // Rollback on failure
        fetchLiveData();
      }
    }).catch(err => {
      console.error(err);
      fetchLiveData();
    });
  };

  const deleteHomework = (id: number) => {
    fetch(`${API_BASE}/api/homework/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    }).then(res => {
      if (res.ok) fetchLiveData();
    }).catch(console.error);
  };

  const duplicateHomework = (id: number) => {
    const target = homeworkList.find(hw => hw.id === id);
    if (!target) return;
    addHomework({
      ...target,
      title: `${target.title} (Copy)`
    });
  };

  const addLibraryMaterial = (mat: Omit<LibraryMaterial, 'id' | 'createdTime' | 'viewsCount' | 'bookmarksCount' | 'isBookmarked'> & { student_ids?: number[] }) => {
    fetch(`${API_BASE}/api/library`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        title: mat.title,
        subject: mat.subject,
        category: mat.category,
        description: mat.description,
        tags: mat.tags.join(','),
        file_url: mat.fileUrl,
        visibility: mat.visibility,
        student_ids: mat.student_ids
      })
    }).then(res => {
      if (res.ok) fetchLiveData();
    }).catch(console.error);
  };

  const deleteLibraryMaterial = (id: number) => {
    fetch(`${API_BASE}/api/library/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    }).then(res => {
      if (res.ok) fetchLiveData();
    }).catch(console.error);
  };

  const toggleBookmarkMaterial = (id: number) => {
    // Optimistic update — flip immediately in UI
    setLibraryList(prev => prev.map(m =>
      m.id === id ? { ...m, isBookmarked: !m.isBookmarked } : m
    ));

    fetch(`${API_BASE}/api/library/${id}/bookmark`, {
      method: 'POST',
      headers: getHeaders()
    })
      .then(res => res.json())
      .then(data => {
        // Sync with server truth in case of mismatch
        setLibraryList(prev => prev.map(m =>
          m.id === id ? { ...m, isBookmarked: !!data.is_bookmarked } : m
        ));
        if (data.is_bookmarked) {
          showToast('Bookmarked!', 'Material saved to your bookmarks.');
        } else {
          showToast('Removed', 'Bookmark removed.');
        }
      })
      .catch(err => {
        console.error('Bookmark toggle failed:', err);
        // Rollback on error
        setLibraryList(prev => prev.map(m =>
          m.id === id ? { ...m, isBookmarked: !m.isBookmarked } : m
        ));
      });
  };

  const addQuiz = (quiz: Omit<Quiz, 'id' | 'createdTime' | 'totalMarks'> & { student_ids?: number[]; start_time?: string; end_time?: string }) => {
    fetch(`${API_BASE}/api/quiz`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        quiz_name: quiz.quizName,
        subject: quiz.subject,
        chapter: quiz.chapter,
        lesson: quiz.lesson,
        difficulty: quiz.difficulty,
        instructions: quiz.instructions,
        time_limit: quiz.timeLimit,
        passing_marks: quiz.passingMarks,
        questions: quiz.questions,
        is_bank: quiz.is_bank,
        assignment_date: quiz.assignment_date,
        student_ids: quiz.student_ids,
        start_time: quiz.start_time,
        end_time: quiz.end_time
      })
    }).then(res => {
      if (res.ok) fetchLiveData();
    }).catch(console.error);
  };

  const assignQuiz = (quizId: number, assignmentDate: string, payload?: { student_ids?: number[]; start_time?: string; end_time?: string }) => {
    fetch(`${API_BASE}/api/quiz/assign`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        quiz_id: quizId,
        assignment_date: assignmentDate,
        student_ids: payload?.student_ids,
        start_time: payload?.start_time,
        end_time: payload?.end_time
      })
    }).then(res => {
      if (res.ok) fetchLiveData();
    }).catch(console.error);
  };

  const deleteQuiz = (id: number) => {
    fetch(`${API_BASE}/api/quiz/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    }).then(res => {
      if (res.ok) fetchLiveData();
    }).catch(console.error);
  };


  const submitQuiz = async (sub: Omit<QuizSubmission, 'id' | 'studentId' | 'submittedAt'>, answers: any) => {
    try {
      const res = await fetch(`${API_BASE}/api/quiz/${sub.quizId}/submit`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          answers: answers,
          time_taken: sub.timeTaken,
          strong_areas: sub.strongAreas,
          weak_areas: sub.weakAreas
        })
      });
      if (res.ok) {
        fetchLiveData();
        return await res.json();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const addWrittenTest = async (test: Omit<WrittenTest, 'id' | 'createdTime'> & { is_bank?: boolean; student_ids?: number[] }) => {
    const res = await fetch(`${API_BASE}/api/tests`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        test_name: test.testName,
        subject: test.subject,
        test_type: test.testType,
        description: test.description,
        instructions: test.instructions,
        duration: test.duration,
        total_marks: test.totalMarks,
        start_date: test.startDate,
        end_date: test.endDate,
        question_paper_url: test.questionPaperUrl,
        question_paper_name: test.questionPaperName,
        is_bank: test.is_bank,
        student_ids: test.student_ids
      })
    });
    
    if (res.ok) {
      await fetchLiveData();
    } else {
      const err = await res.json();
      throw new Error(err.message || 'Failed to add written test');
    }
  };

  const assignWrittenTest = async (testId: number, startDate: string, endDate: string, student_ids?: number[]) => {
    const res = await fetch(`${API_BASE}/api/tests/assign`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        test_id: testId,
        start_date: startDate,
        end_date: endDate,
        student_ids: student_ids
      })
    });
    if (res.ok) {
      await fetchLiveData();
    } else {
      const err = await res.json();
      throw new Error(err.message || 'Failed to assign written test');
    }
  };

  const deleteWrittenTest = (id: number) => {
    fetch(`${API_BASE}/api/tests/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    }).then(res => {
      if (res.ok) fetchLiveData();
    }).catch(console.error);
  };

  const submitWrittenTest = (testId: number, answerSheetUrl: string, _answerSheetName: string) => {
    fetch(`${API_BASE}/api/tests/${testId}/submit`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        answer_sheet_url: answerSheetUrl
      })
    }).then(res => {
      if (res.ok) fetchLiveData();
    }).catch(console.error);
  };

  const gradeWrittenSubmission = (subId: number, marks: number, remarks: string) => {
    fetch(`${API_BASE}/api/tests/submissions/${subId}/grade`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        marks_obtained: marks,
        remarks: remarks
      })
    }).then(res => {
      if (res.ok) fetchLiveData();
    }).catch(console.error);
  };

  const addNotification = (_title: string, _content: string, _type: Notification['type']) => {
    // Notifications are handled mostly on the backend side, so we ignore local writes
  };

  const markAllNotificationsRead = () => {
    fetch(`${API_BASE}/api/notifications/mark-read`, {
      method: 'POST',
      headers: getHeaders()
    }).then(res => {
      if (res.ok) setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    }).catch(console.error);
  };

  const dismissNotification = (id: number) => {
    // Optimistic remove
    setNotifications(prev => prev.filter(n => n.id !== id));
    fetch(`${API_BASE}/api/notifications/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    }).catch(err => {
      console.error('Failed to dismiss notification:', err);
      // Rollback on error
      fetchLiveData();
    });
  };

  const clearAllNotifications = () => {
    // Optimistic clear
    setNotifications([]);
    fetch(`${API_BASE}/api/notifications/clear-all`, {
      method: 'DELETE',
      headers: getHeaders()
    }).catch(err => {
      console.error('Failed to clear all notifications:', err);
      fetchLiveData();
    });
  };

  const unlockAchievement = (name: string, description: string, _icon: string) => {
    fetch(`${API_BASE}/api/achievements`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ name, description })
    }).then(res => {
      if (res.ok) fetchLiveData();
    }).catch(console.error);
  };

  const fetchChatMessages = (recipientId?: number) => {
    if (!token) return;
    const url = recipientId 
      ? `${API_BASE}/api/chat?recipient_id=${recipientId}` 
      : `${API_BASE}/api/chat`;
    fetch(url, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setChatMessages(data);
      }).catch(console.error);
  };

  const sendChatMessage = async (recipientId: number | null, content: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ recipient_id: recipientId, content })
      });
      if (res.ok) {
        const newMsg = await res.json();
        setChatMessages(prev => [...prev, newMsg]);
        return newMsg;
      }
    } catch (err) {
      console.error("Failed to send chat message:", err);
    }
  };

  const fetchLeaderboard = () => {
    if (!token) return;
    fetch(`${API_BASE}/api/users/leaderboard`, { 
      headers: { 'Authorization': `Bearer ${token}` } 
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setLeaderboard(data);
      }).catch(console.error);
  };

  const updateMentorNotes = async (studentId: number, notes: string) => {
    if (!token) return false;
    try {
      const res = await fetch(`${API_BASE}/api/users/${studentId}/mentor-notes`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notes })
      });
      if (res.ok) {
        // Update local student lists
        setMyStudents(prev => prev.map(s => {
          if (s.id === studentId) {
            return { ...s, mentor_notes: notes };
          }
          return s;
        }));
        // Update activeStudent if it matches
        if (activeStudent && activeStudent.id === studentId) {
          setActiveStudent({ ...activeStudent, mentor_notes: notes });
        }
        return true;
      }
    } catch (err) {
      console.error("Failed to update mentor notes:", err);
    }
    return false;
  };

  return (
    <AppContext.Provider value={{
      role,
      setRole,
      mentorProfile,
      setMentorProfile,
      studentProfile,
      setStudentProfile,
      homeworkList,
      addHomework,
      updateHomework,
      deleteHomework,
      duplicateHomework,
      libraryList,
      addLibraryMaterial,
      deleteLibraryMaterial,
      toggleBookmarkMaterial,
      quizList,
      quizBank,
      addQuiz,
      assignQuiz,
      deleteQuiz,
      quizSubmissions,
      submitQuiz,
      writtenTests,
      writtenTestBank,
      addWrittenTest,
      assignWrittenTest,
      deleteWrittenTest,
      writtenTestSubmissions,
      submitWrittenTest,
      gradeWrittenSubmission,
      notifications,
      addNotification,
      markAllNotificationsRead,
      dismissNotification,
      clearAllNotifications,
      achievements,
      unlockAchievement,
      theme,
      setTheme,
      streakDays,
      incrementStreak,
      myStudents,
      activeStudent,
      setActiveStudent,
      chatMessages,
      fetchChatMessages,
      sendChatMessage,
      leaderboard,
      fetchLeaderboard,
      allChatMessages,
      unreadChatCount,
      toast,
      showToast,
      attendanceStats,
      updateMentorNotes
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
