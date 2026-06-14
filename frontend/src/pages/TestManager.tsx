import React, { useState, useEffect, useRef } from 'react';
import { ModalPortal } from '../components/Modal';
import { useApp } from '../context/AppContext';
import type { WrittenTest, WrittenTestSubmission } from '../context/AppContext';
import { uploadToCloudinary, getCloudinaryDownloadUrl } from '../utils/cloudinary';
import { 
  Plus, 
  Trash2, 
  Download, 
  UploadCloud, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  CheckCircle, 
  FileText, 
  Calendar, 
  Clock, 
  Award,
  AlertTriangle
} from 'lucide-react';

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
      <span className="flex items-center gap-1 bg-red-50 text-red-655 dark:bg-red-950/20 dark:text-red-400 text-[10px] px-2 py-0.5 rounded font-bold border border-red-250/20">
        <AlertTriangle className="w-3.5 h-3.5 text-red-550" />
        {timeLeftString}
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1 bg-success-50 text-success-655 dark:bg-success-950/20 dark:text-success-400 text-[10px] px-2 py-0.5 rounded font-bold border border-success-250/20">
      <Clock className="w-3.5 h-3.5 text-success-500" />
      {timeLeftString}
    </span>
  );
};


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


interface TestManagerProps {
  showCreateModal: boolean;
  setShowCreateModal: (show: boolean) => void;
}

const TEST_TYPES = [
  "Unit Test", "Chapter Test", "Monthly Test", "Quarterly Test", 
  "Half-Yearly", "Annual Exam", "Model Exam", "Practice Exam"
];

export const TestManager: React.FC<TestManagerProps> = ({ 
  showCreateModal, 
  setShowCreateModal 
}) => {
  const { 
    role, 
    writtenTests, 
    writtenTestBank,
    addWrittenTest, 
    assignWrittenTest,
    deleteWrittenTest, 
    writtenTestSubmissions, 
    submitWrittenTest, 
    gradeWrittenSubmission,
    myStudents
  } = useApp();

  // Tick state for live countdowns
  const [currentTime, setCurrentTime] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Teacher states
  const [evaluatingSub, setEvaluatingSub] = useState<WrittenTestSubmission | null>(null);
  const [marksInput, setMarksInput] = useState<number>(0);
  const [remarksInput, setRemarksInput] = useState('');

  // Rubric breakdown states
  const [useRubric, setUseRubric] = useState(false);
  const [rubricRows, setRubricRows] = useState<{ id: number; label: string; maxMarks: number; score: number }[]>([
    { id: 1, label: 'Section A (Short Qs)', maxMarks: 20, score: 0 },
    { id: 2, label: 'Section B (Long Qs)', maxMarks: 45, score: 0 },
    { id: 3, label: 'Section C (Diagrams/Vivas)', maxMarks: 35, score: 0 },
  ]);

  const handleRubricScoreChange = (id: number, score: number) => {
    const updated = rubricRows.map(row => row.id === id ? { ...row, score: Math.min(row.maxMarks, Math.max(0, score)) } : row);
    setRubricRows(updated);
    const sum = updated.reduce((sum, r) => sum + r.score, 0);
    setMarksInput(sum);
  };
  
  // Sheet Preview Transformations
  const [zoomScale, setZoomScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const rotatePreview = () => setRotation(r => (r + 90) % 360);

  // Mentor Tabs
  const [activeTab, setActiveTab] = useState<'dashboard' | 'bank'>('dashboard');

  // Assign Test Modal State
  const [showAssignModal, setShowAssignModal] = useState<number | null>(null);
  const [assignStartDate, setAssignStartDate] = useState('');
  const [assignEndDate, setAssignEndDate] = useState('');
  const [assignTarget, setAssignTarget] = useState<'all' | 'class' | 'students'>('all');
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);

  // Selected schedule date for calendar view
  const [selectedScheduleDate, setSelectedScheduleDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });


  // Form states for test creation
  const [testName, setTestName] = useState('');
  const [subject, setSubject] = useState('Physics');
  const [testType, setTestType] = useState<WrittenTest['testType']>('Unit Test');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [duration, setDuration] = useState(60);
  const [totalMarks, setTotalMarks] = useState(100);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date(Date.now() + 86400000 * 2);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  });
  const [questionPaperFile, setQuestionPaperFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isBank, setIsBank] = useState(true);

  // Student uploader state
  const [uploadingTestId, setUploadingTestId] = useState<number | null>(null);
  const [studentAnswerFile, setStudentAnswerFile] = useState<File | null>(null);
  const [uploadSuccessToast, setUploadSuccessToast] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Question Paper Preview state
  const [previewPaperUrl, setPreviewPaperUrl] = useState<string | null>(null);

  const uniqueClasses = Array.from(new Set((myStudents || []).map(s => s.className || '').filter(Boolean)));


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
      const hasTest = writtenTests.some(t => !t.is_bank && t.startDate && t.startDate.split('T')[0] === dateStr);
      
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
          {hasTest && (
            <span className={`w-1.5 h-1.5 rounded-full absolute bottom-1 ${isSelected ? 'bg-white' : 'bg-primary-500'}`} />
          )}
        </button>
      );
    }
    return days;
  };

  // Submit test creator form
  const handleCreateTestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testName) return;
    if (!questionPaperFile) {
      alert("Please upload a question paper.");
      return;
    }

    try {
      setIsUploading(true);
      let paperUrl = '';
      let paperName = '';

      if (questionPaperFile) {
        setUploadProgress(0);
        paperUrl = await uploadToCloudinary(questionPaperFile, setUploadProgress);
        paperName = questionPaperFile.name;
      }

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

      await addWrittenTest({
        testName,
        subject,
        testType,
        description,
        instructions,
        duration,
        totalMarks,
        startDate: !isBank ? new Date(startDate).toISOString() : undefined,
        endDate: !isBank ? new Date(endDate).toISOString() : undefined,
        questionPaperUrl: paperUrl,
        questionPaperName: paperName,
        is_bank: isBank,
        student_ids: studentIds
      });

      // Reset Form
      setTestName('');
      setQuestionPaperFile(null);
      setDescription('');
      setInstructions('');
      setIsBank(true);
      setShowCreateModal(false);
      setAssignTarget('all');
      setSelectedClasses([]);
      setSelectedStudentIds([]);
    } catch (err: any) {
      console.error("Failed to schedule test:", err);
      alert(`Failed to schedule test: ${err.message || err}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleAssignSubmit = async (id: number) => {
    if (!assignStartDate || !assignEndDate) {
      alert("Please select start and end date/times.");
      return;
    }

    let studentIds: number[] | undefined = undefined;
    if (assignTarget === 'class') {
      studentIds = (myStudents || [])
        .filter(s => s.className && selectedClasses.includes(s.className))
        .map(s => s.id);
    } else if (assignTarget === 'students') {
      studentIds = selectedStudentIds;
    }

    try {
      await assignWrittenTest(id, new Date(assignStartDate).toISOString(), new Date(assignEndDate).toISOString(), studentIds);
      setShowAssignModal(null);
      setAssignStartDate('');
      setAssignEndDate('');
      setAssignTarget('all');
      setSelectedClasses([]);
      setSelectedStudentIds([]);
    } catch (err: any) {
      console.error(err);
      alert(`Failed to assign test: ${err.message || err}`);
    }
  };

  // Student upload submit action
  const handleStudentUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadingTestId || !studentAnswerFile) return;

    try {
      setIsUploading(true);
      setUploadProgress(0);
      const answerSheetUrl = await uploadToCloudinary(studentAnswerFile, setUploadProgress);
      
      await submitWrittenTest(uploadingTestId, answerSheetUrl, studentAnswerFile.name);
      
      setUploadSuccessToast(true);
      setTimeout(() => setUploadSuccessToast(false), 3000);

      setStudentAnswerFile(null);
      setUploadingTestId(null);
    } catch (err: any) {
      console.error("Failed to submit test:", err);
      alert(`Failed to upload answer sheet: ${err.message || err}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Grade action
  const handleGradePublish = () => {
    if (!evaluatingSub) return;
    gradeWrittenSubmission(evaluatingSub.id, marksInput, remarksInput);
    setEvaluatingSub(null);
    setMarksInput(0);
    setRemarksInput('');
  };

  // Zoom / Rotation actions
  const adjustZoom = (amount: number) => {
    setZoomScale(prev => Math.max(0.5, Math.min(2, prev + amount)));
  };

  const groupedActiveTests = React.useMemo(() => {
    // Filter active tests for the selected date
    const dayTests = writtenTests.filter(t => 
      !t.is_bank && t.startDate && t.startDate.split('T')[0] === selectedScheduleDate
    );

    // Group them by testName + questionPaperUrl
    const groups: Record<string, {
      testName: string;
      subject: string;
      testType: string;
      duration: number;
      totalMarks: number;
      questionPaperUrl: string;
      questionPaperName: string;
      startDate: string;
      endDate: string;
      clones: WrittenTest[];
    }> = {};

    dayTests.forEach(test => {
      const key = `${test.testName}_${test.questionPaperUrl}`;
      if (!groups[key]) {
        groups[key] = {
          testName: test.testName,
          subject: test.subject,
          testType: test.testType,
          duration: test.duration,
          totalMarks: test.totalMarks,
          questionPaperUrl: test.questionPaperUrl || '',
          questionPaperName: test.questionPaperName || 'paper.pdf',
          startDate: test.startDate || '',
          endDate: test.endDate || '',
          clones: []
        };
      }
      groups[key].clones.push(test);
    });

    return Object.values(groups);
  }, [writtenTests, selectedScheduleDate]);

  return (
    <div className="space-y-6">
      {/* ---------------- TEACHER VIEW ---------------- */}
      {role === 'mentor' && !evaluatingSub && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold font-outfit text-slate-800 dark:text-white">Written Exams</h2>
              <p className="text-xs text-slate-400 font-medium">Design school exams, collect student answer sheets, and grade online</p>
            </div>
            
            <button 
              onClick={() => setShowCreateModal(true)}
              className="flex items-center px-3.5 py-2 text-xs font-bold rounded-xl text-white bg-primary-600 hover:bg-primary-700 transition-all shadow-sm active:scale-95 self-start sm:self-auto"
            >
              <Plus className="w-4.5 h-4.5 mr-1" />
              Schedule Written Test
            </button>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-5 py-2.5 text-xs font-extrabold rounded-xl transition-all shadow-sm border ${
                activeTab === 'dashboard' 
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-blue-500 shadow-md shadow-blue-500/20' 
                  : 'bg-white dark:bg-slate-800 text-blue-650 dark:text-blue-400 border-blue-200/50 dark:border-slate-700 hover:bg-blue-50/50 dark:hover:bg-blue-950/10'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Active Assignments
            </button>
            <button 
              onClick={() => setActiveTab('bank')}
              className={`flex items-center gap-2 px-5 py-2.5 text-xs font-extrabold rounded-xl transition-all shadow-sm border ${
                activeTab === 'bank' 
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-amber-500 shadow-md shadow-amber-500/20' 
                  : 'bg-white dark:bg-slate-800 text-amber-655 dark:text-amber-450 border-amber-200/50 dark:border-slate-700 hover:bg-amber-50/50 dark:hover:bg-amber-950/10'
              }`}
            >
              <FileText className="w-4 h-4" />
              Test Bank
            </button>
          </div>

          {activeTab === 'dashboard' ? (
            <div className="space-y-6">
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
                    <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 text-[10px] text-slate-555 dark:text-slate-400 font-semibold space-y-1.5">
                      <p className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
                        Dots indicate dates with assigned tests.
                      </p>
                      <p>Selected Date: <strong className="text-primary-500">{selectedScheduleDate}</strong></p>
                    </div>
                </div>
              </div>

                {/* Day's Assignments list */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-slate-455 uppercase tracking-wider font-outfit">Scheduled Tests for {selectedScheduleDate}</h3>
                    <span className="text-xs font-bold text-primary-500 bg-primary-50 dark:bg-primary-950/20 px-2.5 py-0.5 rounded-full">{groupedActiveTests.length} Tests</span>
                  </div>

                  {groupedActiveTests.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {groupedActiveTests.map((grouped, index) => {
                        const theme = getCardTheme(index);
                        const totalAssigned = grouped.clones.length;
                        const completedClones = grouped.clones.filter(clone => 
                          writtenTestSubmissions.some(sub => sub.testId === clone.id)
                        );
                        const completedCount = completedClones.length;
                        const completionPercentage = totalAssigned > 0 ? Math.round((completedCount / totalAssigned) * 100) : 0;
                        
                        return (
                          <div key={grouped.testName} className="premium-outline-card flex flex-col justify-between border border-slate-200 dark:border-slate-800 relative">
                            <div className={`h-1.5 w-full bg-gradient-to-r ${theme.gradient}`} />
                            <div className="p-5 flex-1 flex flex-col justify-between">
                              <div>
                                <div className="flex items-center justify-between">
                                  <span className={`bg-gradient-to-r ${theme.gradient} text-white px-2.5 py-1 text-[10px] font-bold uppercase rounded-lg tracking-wider`}>
                                    {grouped.testType}
                                  </span>
                                  
                                  <div className="flex items-center space-x-2">
                                    <button
                                      onClick={() => {
                                        grouped.clones.forEach(clone => deleteWrittenTest(clone.id));
                                      }}
                                      className="p-1.5 rounded-lg text-slate-400 hover:text-danger-650 hover:bg-danger-50 dark:hover:bg-danger-950/20 transition-colors"
                                      title="Delete Test Group"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>

                                <h3 className="font-extrabold text-base text-slate-805 dark:text-white mt-4 font-outfit uppercase tracking-wide leading-tight">{grouped.testName}</h3>
                                <p className="text-xs text-slate-450 mt-1 font-semibold">Subject: {grouped.subject} • {grouped.totalMarks} Marks</p>
                                
                                <div className="mt-4 p-2.5 bg-slate-50 dark:bg-slate-800/85 rounded-xl border border-slate-100 dark:border-slate-800/40 flex flex-col gap-2">
                                  <div className="flex items-center justify-between text-xs">
                                    <div className="flex items-center space-x-1.5 text-slate-500 min-w-0">
                                      <FileText className="w-4 h-4 text-slate-455 shrink-0" />
                                      <span className="truncate text-slate-655 dark:text-slate-350">{grouped.questionPaperName}</span>
                                    </div>
                                    <button 
                                      onClick={() => setPreviewPaperUrl(grouped.questionPaperUrl)}
                                      className="text-[10px] font-bold text-primary-500 hover:underline shrink-0"
                                    >
                                      Preview Paper
                                    </button>
                                  </div>
                                </div>

                                {/* Scheduling timings */}
                                {(grouped.startDate || grouped.endDate) && (
                                  <div className="mt-3.5 p-2 bg-slate-100/60 dark:bg-slate-800/40 rounded-xl text-[9px] text-slate-555 font-bold space-y-0.5">
                                    {grouped.startDate && (
                                      <p>Starts: <span className="text-slate-700 dark:text-slate-300">{new Date(grouped.startDate).toLocaleString()}</span></p>
                                    )}
                                    {grouped.endDate && (
                                      <p>Ends: <span className="text-slate-700 dark:text-slate-300">{new Date(grouped.endDate).toLocaleString()}</span></p>
                                    )}
                                  </div>
                                )}

                                {/* Progress bar */}
                                <div className="mt-4">
                                  <div className="flex justify-between items-center text-[10px] mb-1 font-bold text-slate-455 uppercase">
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
                                      const isDone = writtenTestSubmissions.some(sub => sub.testId === clone.id);
                                      const studentSub = writtenTestSubmissions.find(sub => sub.testId === clone.id);
                                      return (
                                        <div key={clone.id} className="flex items-center justify-between p-1 bg-slate-50/50 dark:bg-slate-850/50 rounded-lg text-[10px]">
                                          <span className="font-extrabold text-slate-700 dark:text-slate-300 truncate max-w-[120px]">{clone.student_name}</span>
                                          <span className={`font-bold px-1.5 py-0.5 rounded-full ${
                                            isDone 
                                              ? 'bg-success-50 text-success-700 dark:bg-success-950/20 dark:text-success-400' 
                                              : 'bg-slate-100 text-slate-505 dark:bg-slate-800'
                                          }`}>
                                            {isDone ? `✓ ${studentSub?.marksObtained}/${clone.totalMarks}` : 'Pending'}
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
                      <h3 className="font-bold text-slate-700 dark:text-slate-350 font-outfit text-base">No Tests Scheduled</h3>
                      <p className="text-xs text-slate-400 dark:text-slate-455 mt-1 max-w-xs leading-relaxed">There are no written tests assigned for {selectedScheduleDate}. Schedule from Test Bank or create a template!</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Answer sheet submissions list to grade */}
              <div className="glass-panel p-5 rounded-2xl">
                <h3 className="font-bold text-base text-slate-805 dark:text-white mb-4 font-outfit">Student Test Submissions</h3>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-400 text-[10px] uppercase font-bold border-b border-slate-100 dark:border-slate-800">
                        <th className="px-4 py-3">Student Name</th>
                        <th className="px-4 py-3">Test Name</th>
                        <th className="px-4 py-3">Subject</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Marks Awarded</th>
                        <th className="px-4 py-3">Submission Date</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                      {writtenTestSubmissions.length > 0 ? (
                        writtenTestSubmissions.map((sub) => (
                          <tr key={sub.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                            <td className="px-4 py-3 font-bold text-slate-800 dark:text-white font-outfit">{sub.studentName || 'Alex Mercer'}</td>
                            <td className="px-4 py-3 font-semibold text-xs text-slate-600 dark:text-slate-300">{sub.testName}</td>
                            <td className="px-4 py-3 font-semibold text-xs text-primary-600">{sub.subject}</td>
                            <td className="px-4 py-3">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                sub.status === 'Graded' 
                                  ? 'bg-success-50 text-success-600 dark:bg-success-950/20' 
                                  : 'bg-amber-50 text-amber-600 dark:bg-amber-950/20'
                              }`}>
                                {sub.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-bold">{sub.marksObtained !== undefined ? `${sub.marksObtained}/${sub.totalMarks}` : 'N/A'}</td>
                            <td className="px-4 py-3 text-xs text-slate-400">{new Date(sub.submissionDate).toLocaleDateString()}</td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => {
                                  setEvaluatingSub(sub);
                                  setMarksInput(sub.marksObtained || 0);
                                  setRemarksInput(sub.remarks || '');
                                }}
                                className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-bold text-xs shadow-sm transition-all"
                              >
                                {sub.status === 'Graded' ? 'Re-Evaluate' : 'Grade Submission'}
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="text-center py-8 text-slate-400">No submissions uploaded by student yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* TEST BANK */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {writtenTestBank.map((test, index) => {
                  const theme = getCardTheme(index);
                  return (
                    <div key={test.id} className="glass-panel p-5 rounded-2xl flex flex-col justify-between hover:shadow-md transition-shadow relative border border-slate-200 dark:border-slate-800 overflow-hidden">
                      <div className={`h-1.5 w-full absolute top-0 left-0 bg-gradient-to-r ${theme.gradient}`} />
                      <div className="pt-2">
                        <div className="flex items-center justify-between">
                          <span className={`bg-gradient-to-r ${theme.gradient} text-white px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-md tracking-wider`}>
                            {test.subject}
                          </span>
                          
                          <div className="flex space-x-2">
                             <button
                              onClick={() => setShowAssignModal(test.id)}
                              className="p-1.5 rounded-lg text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950/20 transition-colors flex items-center text-xs font-bold"
                              title="Assign Test"
                            >
                              <Calendar className="w-4 h-4 mr-1" />
                              Assign
                            </button>
                            
                            <button
                              onClick={() => deleteWrittenTest(test.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-danger-605 hover:bg-danger-50 dark:hover:bg-danger-950/20 transition-colors"
                              title="Delete Template"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <h3 className="font-bold text-base text-slate-800 dark:text-white mt-3 font-outfit leading-tight">{test.testName}</h3>
                        <p className="text-xs text-slate-400 mt-1">Template • {test.testType}</p>
                        
                        <div className="mt-3.5 p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl flex flex-col gap-2.5">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center space-x-1 text-slate-500 min-w-0">
                              <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                              <span className="truncate" title={test.questionPaperName}>{test.questionPaperName}</span>
                            </div>
                            <button 
                              onClick={() => setPreviewPaperUrl(test.questionPaperUrl)}
                              className="text-[10px] font-bold text-primary-500 hover:underline shrink-0"
                            >
                              Preview
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                        <span className="flex items-center"><Clock className="w-3.5 h-3.5 mr-1" />{test.duration} mins</span>
                        <span>Total Marks: {test.totalMarks}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Assign Written Test Modal */}
          {showAssignModal && (
             <ModalPortal onClose={() => {
               setShowAssignModal(null);
               setAssignStartDate('');
               setAssignEndDate('');
               setAssignTarget('all');
               setSelectedClasses([]);
               setSelectedStudentIds([]);
             }}>
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-md border border-slate-100 dark:border-slate-800 shadow-2xl overflow-y-auto max-h-[85vh] animate-scaleIn">
                <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-4 font-outfit">Assign Written Test & Schedule</h3>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Start Date & Time</label>
                      <input 
                        type="datetime-local" 
                        value={assignStartDate}
                        onChange={(e) => setAssignStartDate(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2.5 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">End Date & Time</label>
                      <input 
                        type="datetime-local" 
                        value={assignEndDate}
                        onChange={(e) => setAssignEndDate(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2.5 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-100 dark:border-slate-800/40">
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 font-outfit tracking-wide">Target Students</label>
                    <div className="flex flex-col gap-2">
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-750 dark:text-slate-300 cursor-pointer">
                        <input 
                          type="radio" 
                          name="testAssignTarget" 
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
                          name="testAssignTarget" 
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
                          name="testAssignTarget" 
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
                      setAssignStartDate('');
                      setAssignEndDate('');
                      setAssignTarget('all');
                      setSelectedClasses([]);
                      setSelectedStudentIds([]);
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

      {/* ---------------- TEACHER EVALUATION EDITOR PANE ---------------- */}
      {role === 'mentor' && evaluatingSub && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Document Preview Canvas Viewer (2 cols) */}
          <div className="lg:col-span-2 glass-panel p-5 rounded-2xl flex flex-col justify-between min-h-[60vh]">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <div>
                <h3 className="font-bold text-base text-slate-800 dark:text-white font-outfit">Evaluation Canvas</h3>
                <p className="text-xs text-slate-400 mt-0.5">File: {evaluatingSub.answerSheetName}</p>
              </div>
              
              <div className="flex items-center space-x-2">
                {evaluatingSub.answerSheetUrl && (
                  <>
                    <a 
                      href={getCloudinaryDownloadUrl(evaluatingSub.answerSheetUrl)} 
                      download 
                      className="text-[10px] font-bold text-white bg-primary-600 hover:bg-primary-700 px-2.5 py-1.5 rounded-lg flex items-center shadow-sm"
                      title="Download Answer Sheet"
                    >
                      <Download className="w-3.5 h-3.5 mr-1" />
                      Download
                    </a>
                    <a 
                      href={evaluatingSub.answerSheetUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-[10px] font-bold text-slate-700 bg-slate-100 border border-slate-200 hover:bg-slate-200 dark:text-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-700 px-2.5 py-1.5 rounded-lg flex items-center shadow-sm"
                      title="Open Answer Sheet in New Tab"
                    >
                      New Tab
                    </a>
                  </>
                )}
                <button onClick={() => adjustZoom(0.1)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500" title="Zoom In">
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button onClick={() => adjustZoom(-0.1)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500" title="Zoom Out">
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button onClick={rotatePreview} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500" title="Rotate Document">
                  <RotateCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Answer sheet mock presentation */}
            <div className="flex-1 bg-slate-100 dark:bg-slate-950 p-6 rounded-xl overflow-auto flex justify-center items-center relative">
              <div 
                className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 shadow-md transition-all duration-200 w-full max-w-2xl min-h-[50vh] flex flex-col justify-center items-center overflow-hidden"
                style={{ 
                  transform: `scale(${zoomScale}) rotate(${rotation}deg)`,
                  transformOrigin: 'center center'
                }}
              >
                {evaluatingSub.answerSheetUrl ? (
                  evaluatingSub.answerSheetUrl.match(/\.(jpeg|jpg|gif|png)$/i) || evaluatingSub.answerSheetUrl.includes('image/upload') ? (
                    <img 
                      src={evaluatingSub.answerSheetUrl} 
                      alt="Student Answer Sheet" 
                      className="max-w-full h-auto object-contain"
                    />
                  ) : (
                    <iframe 
                      src={evaluatingSub.answerSheetUrl} 
                      className="w-full h-[60vh] border-0"
                      title="Student Answer Sheet PDF"
                    ></iframe>
                  )
                ) : (
                  <div className="p-8 text-center">
                    <p className="text-sm text-slate-400">No file preview available.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Grading Console (1 col) */}
          <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between shadow-md">
            <div>
              <h3 className="font-bold text-base text-slate-800 dark:text-white font-outfit border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                Grading Panel
              </h3>

              <div className="space-y-4">
                <div>
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                  <label className="block text-xs font-bold text-slate-400 uppercase">Grading Mode</label>
                  <button
                    type="button"
                    onClick={() => setUseRubric(!useRubric)}
                    className="text-[10px] font-bold bg-primary-50 dark:bg-primary-950/20 text-primary-600 dark:text-primary-400 px-2 py-1 rounded-lg border border-primary-200/50"
                  >
                    {useRubric ? "Switch to Simple" : "Switch to Rubric"}
                  </button>
                </div>

                {useRubric ? (
                  <div className="space-y-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/40">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rubric Breakdown</span>
                    {rubricRows.map((row) => (
                      <div key={row.id} className="flex items-center justify-between gap-2 text-xs">
                        <span className="font-semibold text-slate-650 dark:text-slate-300">{row.label} (Max {row.maxMarks})</span>
                        <input
                          type="number"
                          value={row.score}
                          onChange={(e) => handleRubricScoreChange(row.id, Number(e.target.value))}
                          className="w-16 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-lg text-right font-extrabold focus:outline-none focus:border-primary-500"
                          max={row.maxMarks}
                          min="0"
                        />
                      </div>
                    ))}
                    <div className="pt-2.5 border-t border-slate-200/50 flex justify-between items-center text-xs font-bold">
                      <span className="text-slate-550">Auto Summed:</span>
                      <span className="text-primary-650 dark:text-primary-400 text-sm font-extrabold">{marksInput} / {evaluatingSub.totalMarks} Marks</span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Marks Obtained</label>
                    <div className="flex items-center space-x-2">
                      <input 
                        type="number" 
                        value={marksInput}
                        onChange={(e) => setMarksInput(Number(e.target.value))}
                        className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg text-base font-extrabold text-slate-800 dark:text-white w-24 focus:outline-none"
                        max={evaluatingSub.totalMarks}
                        min="0"
                      />
                      <span className="text-slate-400 font-bold text-base">/ {evaluatingSub.totalMarks} Marks</span>
                    </div>
                  </div>
                )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Evaluation Remarks</label>
                  <textarea 
                    value={remarksInput}
                    onChange={(e) => setRemarksInput(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg text-xs text-slate-800 dark:text-white focus:outline-none focus:border-primary-500 h-28"
                    placeholder="Provide specific feedback, identify mistakes, and offer constructive mentoring comments..."
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-6 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={handleGradePublish}
                className="w-full py-2.5 bg-success hover:bg-success-600 text-white rounded-xl text-xs font-bold shadow-lg transition-all"
              >
                Publish Result
              </button>
              
              <button
                onClick={() => setEvaluatingSub(null)}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 rounded-xl text-xs font-bold transition-all"
              >
                Cancel / Return
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- STUDENT TESTS VIEW ---------------- */}
      {role === 'student' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold font-outfit text-slate-800 dark:text-white">Written Exams</h2>
            <p className="text-xs text-slate-400 font-medium">Download question sheets and submit answer files</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {writtenTests.length > 0 ? (
              writtenTests.map((test, index) => {
                const theme = getCardTheme(index);
                const submission = writtenTestSubmissions.find(s => s.testId === test.id);
                const isSubmitted = !!submission;
                const isGraded = submission?.status === 'Graded';
                const percentage = isGraded && test.totalMarks > 0 ? Math.round((submission.marksObtained! / test.totalMarks) * 100) : 0;
                
                const startTimeMs = test.startDate ? new Date(test.startDate).getTime() : 0;
                const endTimeMs = test.endDate ? new Date(test.endDate).getTime() : Infinity;

                const isLocked = test.startDate ? currentTime < startTimeMs : false;
                const isExpired = test.endDate ? currentTime > endTimeMs : false;
                const isButtonDisabled = isSubmitted || isLocked || isExpired;

                return (
                  <div 
                    key={test.id} 
                    className={`premium-outline-card flex flex-col justify-between relative border ${
                      isGraded 
                        ? 'border-success-500/80' 
                        : (isSubmitted ? 'border-primary-500/80' : 'border-slate-200 dark:border-slate-800')
                    }`}
                  >
                    <div className={`h-1.5 w-full ${isGraded ? 'bg-success-500' : (isSubmitted ? 'bg-primary-500' : `bg-gradient-to-r ${theme.gradient}`)}`} />
                    
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className={`bg-gradient-to-r ${theme.gradient} text-white px-2.5 py-1 text-[10px] font-bold uppercase rounded-lg tracking-wider`}>
                            {test.testType}
                          </span>
                          
                          {isGraded ? (
                            <span className="bg-success-50 text-success-655 dark:bg-success-950/20 dark:text-success-400 text-[10px] px-2.5 py-1 rounded-full font-bold flex items-center gap-1 border border-success-200/20">
                              ✓ Evaluated
                            </span>
                          ) : isSubmitted ? (
                            <span className="bg-primary-50 text-primary-655 dark:bg-primary-950/20 dark:text-primary-400 text-[10px] px-2.5 py-1 rounded-full font-bold flex items-center gap-1 border border-primary-200/20">
                              ✓ Submitted
                            </span>
                          ) : (
                            <LiveCountdown startTime={test.startDate} endTime={test.endDate} />
                          )}
                        </div>

                        <h3 className="font-extrabold text-base text-slate-800 dark:text-white mt-4 font-outfit uppercase tracking-wide leading-tight">{test.testName}</h3>
                        
                        <div className="flex items-center space-x-2 mt-2">
                          <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] px-2 py-0.5 rounded font-bold">
                            <Clock className="w-3 h-3" /> {test.duration} mins
                          </span>
                          <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] px-2 py-0.5 rounded font-bold">
                            <Award className="w-3 h-3" /> {test.totalMarks} Marks
                          </span>
                        </div>

                        {/* If Graded, show nice Score Progress Bar */}
                        {isGraded ? (
                          <div className="mt-4 p-3.5 bg-success-50/35 dark:bg-success-950/10 border border-success-100/20 rounded-xl">
                            <div className="flex justify-between items-center text-xs mb-1">
                              <span className="text-success-700 dark:text-success-400 font-bold uppercase text-[9px] tracking-wider">Marks Obtained</span>
                              <span className="font-extrabold text-success-700 dark:text-success-350">{submission.marksObtained} / {test.totalMarks} ({percentage}%)</span>
                            </div>
                            <div className="w-full bg-slate-150 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                              <div 
                                className="bg-success-500 h-full rounded-full transition-all duration-500" 
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            {submission.remarks && (
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 italic">"Feedback: {submission.remarks}"</p>
                            )}
                          </div>
                        ) : (
                          <div className="mt-4">
                            <div className="w-full bg-slate-150 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-slate-300 dark:bg-slate-700 h-full rounded-full w-0" />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="mt-6 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                        <div className="flex flex-wrap items-center gap-3">
                          <button
                            onClick={() => setPreviewPaperUrl(test.questionPaperUrl)}
                            className="flex items-center text-xs text-primary-655 hover:underline font-bold"
                          >
                            Preview
                          </button>
                          {test.questionPaperUrl && (
                            <a
                              href={getCloudinaryDownloadUrl(test.questionPaperUrl)}
                              download
                              className="flex items-center text-xs text-slate-400 hover:text-slate-650 dark:text-slate-405 dark:hover:text-slate-200 font-semibold"
                            >
                              <Download className="w-3.5 h-3.5 mr-1" /> Download
                            </a>
                          )}
                        </div>
                        
                        {!isSubmitted && (
                          <button
                            onClick={() => {
                              setUploadingTestId(test.id);
                              setStudentAnswerFile(null);
                            }}
                            disabled={isButtonDisabled}
                            className={`px-4 py-2 text-xs font-bold rounded-xl shadow-sm transition-all ${
                              isButtonDisabled
                                ? 'bg-slate-50 dark:bg-slate-805 text-slate-400 cursor-not-allowed border border-slate-200/10'
                                : 'bg-primary-600 hover:bg-primary-700 text-white shadow-md active:scale-95'
                            }`}
                          >
                            {isLocked ? 'Locked' : isExpired ? 'Closed' : 'Upload Answer'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full py-16 flex flex-col items-center justify-center text-center glass-panel p-8 rounded-3xl bg-white dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60 shadow-sm animate-fadeIn">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-3 shadow-inner">
                  <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="font-bold text-slate-700 dark:text-slate-350 font-outfit text-base">No Written Exams Scheduled</h3>
                <p className="text-xs text-slate-400 dark:text-slate-455 mt-1 max-w-xs leading-relaxed">There are no upcoming written tests or exams assigned to you at the moment. Keep reviewing! 📚</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------------- STUDENT ANSWER SHEET UPLOADER DIALOG ---------------- */}
      {role === 'student' && uploadingTestId && (
        <ModalPortal onClose={() => setUploadingTestId(null)}>
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-800 animate-scaleIn">
            <div className="px-6 py-4.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-800 dark:text-white font-outfit">Submit Answer Sheet</h3>
              <button onClick={() => setUploadingTestId(null)} className="text-slate-400 hover:text-slate-500">✕</button>
            </div>

            <form onSubmit={handleStudentUpload} className="p-6 space-y-4">
              <div 
                className="p-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-950/20 transition-all"
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadCloud className="w-10 h-10 text-slate-400 mx-auto mb-2 animate-bounce" />
                {studentAnswerFile ? (
                  <p className="text-xs font-bold text-slate-800 dark:text-white truncate">{studentAnswerFile.name}</p>
                ) : (
                  <>
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-300">Click to Select Scanned Answer Sheet</p>
                    <p className="text-[10px] text-slate-400 mt-1">Supports PDF, JPG, PNG formats</p>
                  </>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef}
                  className="hidden" 
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setStudentAnswerFile(e.target.files[0]);
                    }
                  }}
                  accept=".pdf,image/*"
                />
              </div>

              {isUploading && (
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mb-4">
                  <div className="bg-primary-600 h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end space-x-2">
                <button type="button" onClick={() => setUploadingTestId(null)} className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-xl text-slate-500 bg-white dark:bg-slate-800 hover:bg-slate-50 focus:outline-none" disabled={isUploading}>Cancel</button>
                <button type="submit" className="px-4 py-2 text-xs font-bold rounded-xl text-white bg-primary-600 hover:bg-primary-700 focus:outline-none flex items-center" disabled={isUploading || !studentAnswerFile}>
                  {isUploading ? 'Uploading...' : 'Submit Exam'}
                </button>
              </div>
            </form>
          </div>
        </ModalPortal>
      )}

      {/* ---------------- FORM MODAL (CREATE TEST - TEACHER) ---------------- */}
      {showCreateModal && role === 'mentor' && (
        <ModalPortal onClose={() => setShowCreateModal(false)}>
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-800 animate-scaleIn">
            <div className="px-6 py-4.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-800 dark:text-white font-outfit">Schedule Written Test</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-500">✕</button>
            </div>

            <form onSubmit={handleCreateTestSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Exam Name</label>
                <input 
                  type="text" 
                  value={testName}
                  onChange={(e) => setTestName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg text-sm text-slate-800 dark:text-white focus:outline-none"
                  placeholder="e.g. Physics Mid-Term Exam"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Subject</label>
                  <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg text-xs text-slate-800 dark:text-white" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Test Type</label>
                  <select 
                    value={testType}
                    onChange={(e) => setTestType(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg text-xs text-slate-800 dark:text-white focus:outline-none"
                  >
                    {TEST_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Duration (mins)</label>
                  <input type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg text-xs text-slate-800 dark:text-white" min="10" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Total Marks</label>
                  <input type="number" value={totalMarks} onChange={(e) => setTotalMarks(Number(e.target.value))} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg text-xs text-slate-800 dark:text-white" min="10" required />
                </div>
              </div>
               {!isBank && (
                <>
                  <div className="grid grid-cols-2 gap-4 animate-fadeIn">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Start Date & Time</label>
                      <input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg text-xs text-slate-800 dark:text-white" required />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">End Date & Time</label>
                      <input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg text-xs text-slate-800 dark:text-white" required />
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-100 dark:border-slate-800/40">
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 font-outfit tracking-wide">Target Students</label>
                    <div className="flex flex-col gap-2">
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-750 dark:text-slate-300 cursor-pointer">
                        <input 
                          type="radio" 
                          name="testCreateTarget" 
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
                          name="testCreateTarget" 
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
                          name="testCreateTarget" 
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
                </>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Question Paper File (PDF/Image)</label>
                <input 
                  type="file" 
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setQuestionPaperFile(e.target.files[0]);
                    }
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg text-xs text-slate-800 dark:text-slate-300"
                  accept=".pdf,image/*"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Instructions</label>
                <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg text-xs text-slate-800 dark:text-white h-12" />
              </div>

              {isUploading && (
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mb-4 mt-2">
                  <div className="bg-primary-600 h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <label className="flex items-center text-xs font-bold text-slate-600 dark:text-slate-300">
                  <input 
                    type="checkbox" 
                    checked={isBank} 
                    onChange={(e) => setIsBank(e.target.checked)}
                    className="mr-2"
                  />
                  Save to Test Bank (Template)
                </label>
                <div className="flex space-x-2">
                  <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-xl text-slate-500 bg-white dark:bg-slate-800 hover:bg-slate-50 focus:outline-none" disabled={isUploading}>Cancel</button>
                  <button type="submit" className="px-4 py-2 text-xs font-bold rounded-xl text-white bg-primary-600 hover:bg-primary-700 focus:outline-none flex items-center" disabled={isUploading || !questionPaperFile}>
                    {isUploading ? (isBank ? 'Saving...' : 'Scheduling...') : (isBank ? 'Save Test' : 'Schedule')}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </ModalPortal>
      )}

      {/* ---------------- QUESTION PAPER PREVIEW MODAL ---------------- */}
      {previewPaperUrl && (
        <ModalPortal onClose={() => setPreviewPaperUrl(null)}>
          <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-800 animate-scaleIn flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-base text-slate-800 dark:text-white font-outfit">Question Paper Preview</h3>
              <div className="flex items-center space-x-3">
                <a 
                  href={getCloudinaryDownloadUrl(previewPaperUrl)} 
                  download 
                  className="text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 px-3 py-1.5 rounded-lg flex items-center shadow-sm"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Download
                </a>
                <a 
                  href={previewPaperUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 hover:bg-slate-200 dark:text-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-700 px-3 py-1.5 rounded-lg flex items-center shadow-sm"
                >
                  New Tab
                </a>
                <button onClick={() => setPreviewPaperUrl(null)} className="text-slate-400 hover:text-slate-500 font-bold text-base ml-2">✕</button>
              </div>
            </div>

            <div className="flex-1 bg-slate-100 dark:bg-slate-950 p-6 overflow-auto flex justify-center items-center">
              {previewPaperUrl.match(/\.(jpeg|jpg|gif|png)$/i) || previewPaperUrl.includes('image/upload') ? (
                <img 
                  src={previewPaperUrl} 
                  alt="Question Paper" 
                  className="max-w-full max-h-[70vh] object-contain"
                />
              ) : (
                <iframe 
                  src={previewPaperUrl} 
                  className="w-full h-[70vh] border-0 rounded-xl"
                  title="Question Paper PDF"
                ></iframe>
              )}
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Toast Feedback */}
      {uploadSuccessToast && (
        <div className="fixed bottom-24 right-8 bg-success-600 text-white font-bold text-xs py-2 px-4 rounded-xl shadow-lg flex items-center z-50 animate-fadeIn">
          <CheckCircle className="w-4.5 h-4.5 mr-1.5" />
          Exam sheet uploaded successfully!
        </div>
      )}
    </div>
  );
};
