import React, { useState, useEffect } from 'react';
import { API_BASE } from '../config/api';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { 
  TrendingUp, 
  BookOpen, 
  Award, 
  Clock, 
  AlertCircle,
  ThumbsUp,
  BrainCircuit,
  CheckCircle,
  XCircle,
  Download,
  Printer,
  Clipboard,
  User
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';

export const Reports: React.FC = () => {
  const { token } = useAuth();
  const { 
    role, 
    homeworkList: rawHwList, 
    quizSubmissions: rawQuizSubs, 
    writtenTestSubmissions: rawTestSubs, 
    studentProfile,
    activeStudent,
    myStudents
  } = useApp();

  // Sub tab selection
  const [activeSubTab, setActiveSubTab] = useState<'analytics' | 'attendance' | 'homework' | 'performance'>('analytics');

  // Report filters state
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [reportStudentId, setReportStudentId] = useState<number | 'all'>('all');

  // Advanced Filters
  const [attendanceStatusFilter, setAttendanceStatusFilter] = useState<'All' | 'Present' | 'Absent'>('All');
  const [homeworkTypeFilter, setHomeworkTypeFilter] = useState<'All' | 'School Homework' | 'Extra Practice Homework'>('All');
  const [homeworkPriorityFilter, setHomeworkPriorityFilter] = useState<'All' | 'High' | 'Medium' | 'Low'>('All');

  // Async report state
  const [attendanceReport, setAttendanceReport] = useState<any | null>(null);
  const [isGeneratingAttendance, setIsGeneratingAttendance] = useState(false);
  const [homeworkReport, setHomeworkReport] = useState<any | null>(null);
  const [isGeneratingHomework, setIsGeneratingHomework] = useState(false);
  const [performanceReport, setPerformanceReport] = useState<any | null>(null);
  const [isGeneratingPerformance, setIsGeneratingPerformance] = useState(false);

  // Sync default student id for role student
  useEffect(() => {
    if (role === 'student' && studentProfile?.id) {
      setReportStudentId(studentProfile.id);
    }
  }, [role, studentProfile]);

  // Filter lists if mentor is viewing a selected student
  const homeworkList = role === 'mentor' && activeStudent
    ? rawHwList.filter(h => h.studentId === activeStudent.id)
    : rawHwList;
  const quizSubmissions = role === 'mentor' && activeStudent
    ? rawQuizSubs.filter(q => q.studentId === activeStudent.id)
    : rawQuizSubs;
  const writtenTestSubmissions = role === 'mentor' && activeStudent
    ? rawTestSubs.filter(t => t.studentId === activeStudent.id)
    : rawTestSubs;

  // Homework stats
  const totalHw = homeworkList.length;
  const completedHw = homeworkList.filter(h => h.status === 'Completed').length;
  const completionRate = totalHw > 0 ? Math.round((completedHw / totalHw) * 100) : 0;

  // Quiz stats
  const totalQuizzes = quizSubmissions.length;
  const avgQuizAccuracy = totalQuizzes > 0 
    ? Math.round(quizSubmissions.reduce((sum, s) => sum + s.accuracy, 0) / totalQuizzes) 
    : 0;

  // Test stats
  const gradedTests = writtenTestSubmissions.filter(t => t.status === 'Graded');
  const totalTests = gradedTests.length;
  const avgTestScore = totalTests > 0
    ? Math.round(gradedTests.reduce((sum, s) => sum + ((s.marksObtained || 0) / s.totalMarks * 100), 0) / totalTests)
    : 0;

  // Recharts Data: Subject strength allocation (dynamically calculated)
  const allSubjects = Array.from(new Set([
    ...homeworkList.map(h => h.subject),
    ...quizSubmissions.map(q => q.subject),
    ...writtenTestSubmissions.map(w => w.subject)
  ])).filter(Boolean);

  const subjectStrengthData = allSubjects.map((sub, idx) => {
    const subsForSub = quizSubmissions.filter(q => q.subject.toLowerCase() === sub.toLowerCase());
    const avgQuizAcc = subsForSub.length > 0
      ? subsForSub.reduce((sum, s) => sum + s.accuracy, 0) / subsForSub.length
      : 0;
      
    const testsForSub = writtenTestSubmissions.filter(t => t.subject.toLowerCase() === sub.toLowerCase() && t.status === 'Graded');
    const avgTestAcc = testsForSub.length > 0
      ? testsForSub.reduce((sum, s) => sum + ((s.marksObtained || 0) / s.totalMarks * 100), 0) / testsForSub.length
      : 0;
      
    let value = 75; // default fallback
    if (avgQuizAcc > 0 && avgTestAcc > 0) {
      value = Math.round((avgQuizAcc + avgTestAcc) / 2);
    } else if (avgQuizAcc > 0) {
      value = Math.round(avgQuizAcc);
    } else if (avgTestAcc > 0) {
      value = Math.round(avgTestAcc);
    }
    
    const colors = ['#2563EB', '#0EA5E9', '#F59E0B', '#22C55E', '#8B5CF6', '#EC4899'];
    return {
      name: sub,
      value: value === 0 ? 50 : value,
      color: colors[idx % colors.length]
    };
  });

  // Default fallback if no data
  if (subjectStrengthData.length === 0) {
    subjectStrengthData.push(
      { name: 'Mathematics', value: 85, color: '#2563EB' },
      { name: 'Physics', value: 78, color: '#0EA5E9' },
      { name: 'Chemistry', value: 65, color: '#F59E0B' },
      { name: 'Biology', value: 72, color: '#22C55E' }
    );
  }

  // Recharts Data: Study Time analysis
  const studyTimeData = [
    { day: 'Mon', hours: 2.5 },
    { day: 'Tue', hours: 3.0 },
    { day: 'Wed', hours: 1.5 },
    { day: 'Thu', hours: 4.0 },
    { day: 'Fri', hours: 2.0 },
    { day: 'Sat', hours: 4.5 },
    { day: 'Sun', hours: 1.0 },
  ];

  // Recharts Data: Monthly Growth
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyGrowthData = months.map((month, idx) => {
    const quizInMonth = quizSubmissions.filter(s => new Date(s.submittedAt).getMonth() === idx);
    const testInMonth = writtenTestSubmissions.filter(s => new Date(s.submissionDate).getMonth() === idx && s.status === 'Graded');
    
    const avgQuiz = quizInMonth.length > 0 
      ? Math.round(quizInMonth.reduce((sum, s) => sum + s.accuracy, 0) / quizInMonth.length)
      : 60 + (idx * 4) % 25;
      
    const avgTest = testInMonth.length > 0
      ? Math.round(testInMonth.reduce((sum, s) => sum + ((s.marksObtained || 0) / s.totalMarks * 100), 0) / testInMonth.length)
      : 65 + (idx * 3) % 20;
      
    return {
      month,
      Quiz: avgQuiz,
      Test: avgTest
    };
  }).slice(new Date().getMonth() - 5, new Date().getMonth() + 1);

  // Sorting for diagnostics
  const sortedStrengths = [...subjectStrengthData].sort((a, b) => b.value - a.value);
  const strongestSub = sortedStrengths[0]?.name || 'Mathematics';
  const weakestSub = sortedStrengths[sortedStrengths.length - 1]?.name || 'Chemistry';
  const strongestVal = sortedStrengths[0]?.value || 85;
  const weakestVal = sortedStrengths[sortedStrengths.length - 1]?.value || 65;

  // Attendance range calculation
  const getFilteredAttendanceStats = (stats: any) => {
    if (!stats || !stats.history) return { present: 0, absent: 0, total: 0, percentage: 100, history: [] };
    let filteredHistory = stats.history.filter((h: any) => h.date >= startDate && h.date <= endDate);
    if (attendanceStatusFilter !== 'All') {
      filteredHistory = filteredHistory.filter((h: any) => h.status === attendanceStatusFilter);
    }
    const present = filteredHistory.filter((h: any) => h.status === 'Present').length;
    const absent = filteredHistory.filter((h: any) => h.status === 'Absent').length;
    const total = present + absent;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 100;
    return {
      present,
      absent,
      total,
      percentage,
      history: filteredHistory
    };
  };

  const handleGenerateAttendance = async () => {
    setIsGeneratingAttendance(true);
    const headers = { 'Authorization': `Bearer ${token}` };
    try {
      if (reportStudentId === 'all') {
        const results = await Promise.all(
          myStudents.map(async (student) => {
            const res = await fetch(`${API_BASE}/api/attendance/stats?student_id=${student.id}`, { headers });
            const stats = await res.json();
            return { student, stats };
          })
        );
        setAttendanceReport({ type: 'all', data: results });
      } else {
        const student = role === 'student' ? studentProfile : myStudents.find(s => s.id === reportStudentId);
        const res = await fetch(`${API_BASE}/api/attendance/stats?student_id=${reportStudentId}`, { headers });
        const stats = await res.json();
        setAttendanceReport({ type: 'single', student, stats });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsGeneratingAttendance(false);
    }
  };

  const handleGenerateHomework = () => {
    setIsGeneratingHomework(true);
    setTimeout(() => {
      if (reportStudentId === 'all') {
        const results = myStudents.map(student => {
          const filtered = rawHwList.filter(hw => {
            const dateMatch = hw.dueDate >= startDate && hw.dueDate <= endDate;
            const typeMatch = homeworkTypeFilter === 'All' || hw.homeworkType === homeworkTypeFilter;
            const priorityMatch = homeworkPriorityFilter === 'All' || hw.priority === homeworkPriorityFilter;
            const studentStatus = hw.students?.find(s => s.student_id === student.id);
            return dateMatch && typeMatch && priorityMatch && studentStatus;
          });
          
          const completed = filtered.filter(hw => {
            const studentStatus = hw.students?.find(s => s.student_id === student.id);
            return studentStatus?.status === 'Completed';
          }).length;
          
          const pending = filtered.length - completed;
          const rate = filtered.length > 0 ? Math.round((completed / filtered.length) * 100) : 100;
          
          return {
            student,
            total: filtered.length,
            completed,
            pending,
            rate
          };
        });
        setHomeworkReport({ type: 'all', data: results });
      } else {
        const student = role === 'student' ? studentProfile : myStudents.find(s => s.id === reportStudentId);
        const filtered = rawHwList.filter(hw => {
          const dateMatch = hw.dueDate >= startDate && hw.dueDate <= endDate;
          const typeMatch = homeworkTypeFilter === 'All' || hw.homeworkType === homeworkTypeFilter;
          const priorityMatch = homeworkPriorityFilter === 'All' || hw.priority === homeworkPriorityFilter;
          if (role === 'student') {
            return dateMatch && typeMatch && priorityMatch && (hw.studentId === student?.id || !hw.studentId);
          } else {
            const studentStatus = hw.students?.find(s => s.student_id === student?.id);
            return dateMatch && typeMatch && priorityMatch && studentStatus;
          }
        });
        
        const completed = filtered.filter(hw => {
          if (role === 'student') {
            return hw.status === 'Completed';
          } else {
            return hw.students?.find(s => s.student_id === student?.id)?.status === 'Completed';
          }
        }).length;
        
        const pending = filtered.length - completed;
        const rate = filtered.length > 0 ? Math.round((completed / filtered.length) * 100) : 100;
        
        setHomeworkReport({
          type: 'single',
          student,
          total: filtered.length,
          completed,
          pending,
          rate,
          history: filtered.map(hw => ({
            title: hw.title,
            subject: hw.subject,
            dueDate: hw.dueDate,
            priority: hw.priority,
            status: role === 'student' ? hw.status : (hw.students?.find(s => s.student_id === student?.id)?.status || 'Pending'),
            remarks: hw.remarks || 'No feedback remarks'
          }))
        });
      }
      setIsGeneratingHomework(false);
    }, 300);
  };

  const handleGeneratePerformance = () => {
    setIsGeneratingPerformance(true);
    setTimeout(() => {
      if (reportStudentId === 'all') {
        const results = myStudents.map(student => {
          const qSubs = rawQuizSubs.filter(q => {
            const dateMatch = q.submittedAt.split('T')[0] >= startDate && q.submittedAt.split('T')[0] <= endDate;
            return q.studentId === student.id && dateMatch;
          });
          const avgQuizAcc = qSubs.length > 0
            ? Math.round(qSubs.reduce((sum, s) => sum + s.accuracy, 0) / qSubs.length)
            : 0;

          const tSubs = rawTestSubs.filter(t => {
            const dateMatch = t.submissionDate.split('T')[0] >= startDate && t.submissionDate.split('T')[0] <= endDate;
            return t.studentId === student.id && dateMatch && t.status === 'Graded';
          });
          const avgTestScore = tSubs.length > 0
            ? Math.round(tSubs.reduce((sum, s) => sum + ((s.marksObtained || 0) / s.totalMarks * 100), 0) / tSubs.length)
            : 0;

          return {
            student,
            quizzesCount: qSubs.length,
            avgQuizAcc,
            testsCount: tSubs.length,
            avgTestScore
          };
        });
        setPerformanceReport({ type: 'all', data: results });
      } else {
        const student = role === 'student' ? studentProfile : myStudents.find(s => s.id === reportStudentId);
        const qSubs = rawQuizSubs.filter(q => {
          const dateMatch = q.submittedAt.split('T')[0] >= startDate && q.submittedAt.split('T')[0] <= endDate;
          return q.studentId === student?.id && dateMatch;
        });

        const tSubs = rawTestSubs.filter(t => {
          const dateMatch = t.submissionDate.split('T')[0] >= startDate && t.submissionDate.split('T')[0] <= endDate;
          return t.studentId === student?.id && dateMatch;
        });

        const avgQuizAcc = qSubs.length > 0
          ? Math.round(qSubs.reduce((sum, s) => sum + s.accuracy, 0) / qSubs.length)
          : 0;

        const gradedTSubs = tSubs.filter(t => t.status === 'Graded');
        const avgTestScore = gradedTSubs.length > 0
          ? Math.round(gradedTSubs.reduce((sum, s) => sum + ((s.marksObtained || 0) / s.totalMarks * 100), 0) / gradedTSubs.length)
          : 0;

        const history: any[] = [
          ...qSubs.map(q => ({
            type: 'Quiz',
            name: q.quizName,
            subject: q.subject,
            date: q.submittedAt.split('T')[0],
            score: `${q.score}/${q.totalMarks}`,
            accuracy: q.accuracy,
            status: 'Submitted'
          })),
          ...tSubs.map(t => ({
            type: 'Written Test',
            name: t.testName,
            subject: t.subject,
            date: t.submissionDate.split('T')[0],
            score: t.status === 'Graded' ? `${t.marksObtained}/${t.totalMarks}` : 'N/A',
            accuracy: t.status === 'Graded' ? Math.round((t.marksObtained || 0) / t.totalMarks * 100) : 0,
            status: t.status
          }))
        ].sort((a, b) => b.date.localeCompare(a.date));

        setPerformanceReport({
          type: 'single',
          student,
          quizzesCount: qSubs.length,
          avgQuizAcc,
          testsCount: tSubs.length,
          avgTestScore,
          history
        });
      }
      setIsGeneratingPerformance(false);
    }, 300);
  };

  const downloadAttendanceCSV = () => {
    if (!attendanceReport) return;
    let csvRows = [];
    
    if (attendanceReport.type === 'all') {
      csvRows.push(["Student Name", "Student ID", "Days Present", "Days Absent", "Attendance Rate (%)"]);
      attendanceReport.data.forEach((item: any) => {
        const stats = getFilteredAttendanceStats(item.stats);
        csvRows.push([
          item.student.name,
          item.student.sid || 'N/A',
          stats.present,
          stats.absent,
          `${stats.percentage}%`
        ]);
      });
    } else {
      csvRows.push(["Date", "Status"]);
      const stats = getFilteredAttendanceStats(attendanceReport.stats);
      stats.history.forEach((h: any) => {
        csvRows.push([h.date, h.status]);
      });
    }
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + csvRows.map(e => e.map(val => `"${val}"`).join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `attendance_report_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadHomeworkCSV = () => {
    if (!homeworkReport) return;
    let csvRows = [];
    
    if (homeworkReport.type === 'all') {
      csvRows.push(["Student Name", "Homework Tasks Assigned", "Completed Tasks", "Pending Tasks", "Completion Rate (%)"]);
      homeworkReport.data.forEach((item: any) => {
        csvRows.push([
          item.student.name,
          item.total,
          item.completed,
          item.pending,
          `${item.rate}%`
        ]);
      });
    } else {
      csvRows.push(["Subject", "Homework Title", "Due Date", "Priority", "Status", "Feedback Remarks"]);
      homeworkReport.history.forEach((h: any) => {
        csvRows.push([h.subject, h.title, h.dueDate, h.priority, h.status, h.remarks]);
      });
    }
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + csvRows.map(e => e.map(val => `"${val}"`).join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `homework_report_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadPerformanceCSV = () => {
    if (!performanceReport) return;
    let csvRows = [];
    
    if (performanceReport.type === 'all') {
      csvRows.push(["Student Name", "Student ID", "Quizzes Attempted", "Avg Quiz Accuracy (%)", "Tests Taken", "Avg Test Score (%)"]);
      performanceReport.data.forEach((item: any) => {
        csvRows.push([
          item.student.name,
          item.student.sid || 'N/A',
          item.quizzesCount,
          `${item.avgQuizAcc}%`,
          item.testsCount,
          `${item.avgTestScore}%`
        ]);
      });
    } else {
      csvRows.push(["Type", "Activity Name", "Subject", "Date", "Score", "Accuracy / Percentage (%)", "Status"]);
      performanceReport.history.forEach((h: any) => {
        csvRows.push([h.type, h.name, h.subject, h.date, h.score, `${h.accuracy}%`, h.status]);
      });
    }
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + csvRows.map(e => e.map(val => `"${val}"`).join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `performance_report_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header title */}
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-outfit text-slate-800 dark:text-white">
            {role === 'mentor' ? "Student Study Analytics & Reports" : "My Study Analytics & Reports"}
          </h2>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            {role === 'mentor' ? `Performance indicators and custom logs builder` : "Summary of grades, accuracies, and strengths"}
          </p>
        </div>

        {/* Sub tabs navigation - scrollable on mobile */}
        <div className="flex space-x-1 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl w-full overflow-x-auto border border-slate-200/50 dark:border-slate-700/50 scrollbar-hide">
          <button 
            onClick={() => setActiveSubTab('analytics')}
            className={`flex items-center px-3 py-2 text-xs font-bold rounded-lg transition-all gap-1.5 shrink-0 ${
              activeSubTab === 'analytics' 
                ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' 
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-350'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Study Insights</span>
            <span className="sm:hidden">Insights</span>
          </button>
          <button 
            onClick={() => setActiveSubTab('attendance')}
            className={`flex items-center px-3 py-2 text-xs font-bold rounded-lg transition-all gap-1.5 shrink-0 ${
              activeSubTab === 'attendance' 
                ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' 
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-350'
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Attendance Reports</span>
            <span className="sm:hidden">Attendance</span>
          </button>
          <button 
            onClick={() => setActiveSubTab('homework')}
            className={`flex items-center px-3 py-2 text-xs font-bold rounded-lg transition-all gap-1.5 shrink-0 ${
              activeSubTab === 'homework' 
                ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' 
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-355'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Homework Activity</span>
            <span className="sm:hidden">Homework</span>
          </button>
          <button 
            onClick={() => setActiveSubTab('performance')}
            className={`flex items-center px-3 py-2 text-xs font-bold rounded-lg transition-all gap-1.5 shrink-0 ${
              activeSubTab === 'performance' 
                ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' 
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-355'
            }`}
          >
            <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Test & Quiz Performance</span>
            <span className="sm:hidden">Performance</span>
          </button>
        </div>
      </div>

      {activeSubTab === 'analytics' && (
        <>
          {/* Numerical Quick Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-panel p-4 rounded-xl shadow-sm flex items-center space-x-3">
              <div className="p-2.5 bg-blue-50 dark:bg-blue-950/20 text-primary-500 rounded-xl">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-450 uppercase">Homework Done</p>
                <p className="text-lg font-extrabold text-slate-800 dark:text-white font-outfit">{completionRate}%</p>
              </div>
            </div>

            <div className="glass-panel p-4 rounded-xl shadow-sm flex items-center space-x-3">
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/20 text-success rounded-xl">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-455 uppercase">Quiz Accuracy</p>
                <p className="text-lg font-extrabold text-slate-800 dark:text-white font-outfit">{avgQuizAccuracy}%</p>
              </div>
            </div>

            <div className="glass-panel p-4 rounded-xl shadow-sm flex items-center space-x-3">
              <div className="p-2.5 bg-sky-50 dark:bg-sky-950/20 text-sky-500 rounded-xl">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-460 uppercase">Test Average</p>
                <p className="text-lg font-extrabold text-slate-800 dark:text-white font-outfit">{avgTestScore}%</p>
              </div>
            </div>

            <div className="glass-panel p-4 rounded-xl shadow-sm flex items-center space-x-3">
              <div className="p-2.5 bg-amber-50 dark:bg-amber-950/20 text-amber-500 rounded-xl">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-465 uppercase">Avg Study Time</p>
                <p className="text-lg font-extrabold text-slate-800 dark:text-white font-outfit">2.6 hrs/day</p>
              </div>
            </div>
          </div>

          {/* Recharts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-panel p-5 rounded-2xl">
              <h3 className="font-bold text-sm text-slate-800 dark:text-white mb-4 font-outfit">Monthly Growth Trends</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyGrowthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" className="dark:stroke-slate-800" vertical={false} />
                    <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} tickLine={false} />
                    <YAxis domain={[0, 100]} stroke="#94A3B8" fontSize={11} tickLine={false} />
                    <Tooltip />
                    <Legend verticalAlign="top" height={36} iconType="circle" />
                    <Line type="monotone" dataKey="Quiz" stroke="#2563EB" strokeWidth={2.5} name="Quizzes (%)" dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="Test" stroke="#0EA5E9" strokeWidth={2.5} name="Written Tests (%)" dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-panel p-5 rounded-2xl">
              <h3 className="font-bold text-sm text-slate-800 dark:text-white mb-4 font-outfit">Weekly Study Time (Hours)</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={studyTimeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" className="dark:stroke-slate-800" vertical={false} />
                    <XAxis dataKey="day" stroke="#94A3B8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                    <Tooltip cursor={{ fill: 'rgba(148, 163, 184, 0.05)' }} />
                    <Bar dataKey="hours" fill="#0EA5E9" radius={[6, 6, 0, 0]} name="Study Hours" maxBarSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between">
              <h3 className="font-bold text-sm text-slate-800 dark:text-white mb-4 font-outfit">Subject Strength Diagnostics</h3>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 flex-1">
                <div className="h-48 w-48 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={subjectStrengthData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {subjectStrengthData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-bold font-outfit text-slate-800 dark:text-white">82%</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Average</span>
                  </div>
                </div>
                
                <div className="space-y-3 flex-1">
                  {subjectStrengthData.map((sub) => (
                    <div key={sub.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: sub.color }} />
                        <span className="font-bold text-slate-650">{sub.name}</span>
                      </div>
                      <span className="font-extrabold text-slate-800 dark:text-slate-100">{sub.value}% Accuracy</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="glass-panel p-5 rounded-2xl bg-gradient-to-br from-indigo-500/5 to-transparent border-indigo-500/20 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-800 dark:text-white mb-3 font-outfit flex items-center">
                  <BrainCircuit className="w-4 h-4 text-indigo-500 mr-1.5" />
                  Automated Mentoring Diagnostics
                </h3>
                
                <div className="space-y-3.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed pt-1.5">
                  <div className="flex items-start space-x-2">
                    <ThumbsUp className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <p>
                      <strong>{strongestSub}:</strong> The student demonstrates outstanding conceptual understanding in {strongestSub}. Correct assessment scores are high, averaging {strongestVal}% accuracy.
                    </p>
                  </div>

                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    <p>
                      <strong>{weakestSub}:</strong> Performance reports display a minor dip in {weakestSub}. Encourage the student to review worksheets in the Library or attempt further practice. Current average is {weakestVal}%.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800/50 text-right">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Mentoring Hub Diagnostics Engine v1.0</span>
              </div>
            </div>
          </div>
        </>
      )}

      {activeSubTab === 'attendance' && (
        <div className="space-y-6">
          {/* Controls Panel */}
          <div className="glass-panel p-4 sm:p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mb-4">
              {role === 'mentor' && (
                <div>
                  <label className="block text-xs font-bold text-slate-450 uppercase mb-2">Select Student</label>
                  <select 
                    value={reportStudentId}
                    onChange={(e) => {
                      const val = e.target.value;
                      setReportStudentId(val === 'all' ? 'all' : Number(val));
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-sm text-slate-800 dark:text-white font-medium focus:outline-none"
                  >
                    <option value="all">All Assigned Students</option>
                    {myStudents.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.sid})</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-450 uppercase mb-2">From Date</label>
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-sm text-slate-850 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-450 uppercase mb-2">To Date</label>
                <input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-sm text-slate-850 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-450 uppercase mb-2">Status Filter</label>
                <select 
                  value={attendanceStatusFilter}
                  onChange={(e) => setAttendanceStatusFilter(e.target.value as 'All' | 'Present' | 'Absent')}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-sm text-slate-800 dark:text-white font-medium focus:outline-none"
                >
                  <option value="All">All Statuses</option>
                  <option value="Present">Present Only</option>
                  <option value="Absent">Absent Only</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleGenerateAttendance}
              disabled={isGeneratingAttendance}
              className="w-full sm:w-auto px-6 py-2.5 text-xs font-bold rounded-xl text-white bg-primary-600 hover:bg-primary-700 transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              {isGeneratingAttendance ? "Generating..." : "Generate Attendance Report"}
            </button>
          </div>

          {/* Generated Report Summary */}
          {attendanceReport && (
            <div className="space-y-6 animate-fadeIn printable-report">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                <h3 className="font-bold text-sm sm:text-base text-slate-800 dark:text-white font-outfit">
                  Attendance Report ({startDate} to {endDate})
                </h3>
                
                <div className="flex items-center space-x-2 non-printable">
                  <button
                    onClick={downloadAttendanceCSV}
                    className="flex items-center px-3 py-2 border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-xl text-slate-650 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 transition-all active:scale-95"
                  >
                    <Download className="w-4 h-4 mr-1.5" />
                    CSV
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="flex items-center px-3 py-2 text-xs font-bold rounded-xl text-white bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 transition-all active:scale-95"
                  >
                    <Printer className="w-4 h-4 mr-1.5" />
                    Print
                  </button>
                </div>
              </div>

              {attendanceReport.type === 'single' ? (
                <>
                  {/* Single Student stats */}
                  {(() => {
                    const stats = getFilteredAttendanceStats(attendanceReport.stats);
                    return (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="glass-panel p-4 rounded-xl flex items-center space-x-3 bg-white dark:bg-slate-900 border">
                            <div className="p-2 bg-success-50 dark:bg-success-950/20 text-success rounded-lg">
                              <CheckCircle className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-slate-450 uppercase">Days Present</p>
                              <p className="text-lg font-extrabold text-slate-800 dark:text-white font-outfit">{stats.present}</p>
                            </div>
                          </div>

                          <div className="glass-panel p-4 rounded-xl flex items-center space-x-3 bg-white dark:bg-slate-900 border">
                            <div className="p-2 bg-danger-50 dark:bg-danger-950/20 text-danger rounded-lg">
                              <XCircle className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-slate-455 uppercase">Days Absent</p>
                              <p className="text-lg font-extrabold text-slate-800 dark:text-white font-outfit">{stats.absent}</p>
                            </div>
                          </div>

                          <div className="glass-panel p-4 rounded-xl flex items-center space-x-3 bg-white dark:bg-slate-900 border">
                            <div className="p-2 bg-blue-50 dark:bg-blue-950/20 text-primary-500 rounded-lg">
                              <TrendingUp className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-slate-460 uppercase">Attendance Rate</p>
                              <p className="text-lg font-extrabold text-slate-800 dark:text-white font-outfit">{stats.percentage}%</p>
                            </div>
                          </div>
                        </div>

                        {/* Detail logs table */}
                        <div className="glass-panel p-5 rounded-2xl border bg-white dark:bg-slate-900">
                          <h4 className="font-bold text-sm text-slate-800 dark:text-white mb-4 font-outfit">Detailed Log: {attendanceReport.student?.name}</h4>
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-sm">
                              <thead>
                                <tr className="text-slate-400 text-xs uppercase font-bold border-b pb-2">
                                  <th className="py-2.5 px-3">Date</th>
                                  <th className="py-2.5 px-3 text-right">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-350">
                                {stats.history.length > 0 ? (
                                  stats.history.map((h: any) => (
                                    <tr key={h.date} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                                      <td className="py-3 px-3 font-semibold">{h.date}</td>
                                      <td className="py-3 px-3 text-right">
                                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                          h.status === 'Present' 
                                            ? 'bg-success-50 text-success-650 dark:bg-success-950/20 dark:text-success-400' 
                                            : h.status === 'Absent'
                                            ? 'bg-danger-50 text-danger-650 dark:bg-danger-950/20 dark:text-danger-400'
                                            : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                                        }`}>
                                          {h.status}
                                        </span>
                                      </td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td colSpan={2} className="text-center py-6 text-slate-400">No attendance history in range.</td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </>
              ) : (
                /* All students grid report */
                <div className="glass-panel p-5 rounded-2xl border bg-white dark:bg-slate-900">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="text-slate-400 text-xs uppercase font-bold border-b pb-2">
                          <th className="py-2.5 px-3">Student</th>
                          <th className="py-2.5 px-3">SID</th>
                          <th className="py-2.5 px-3">Present Days</th>
                          <th className="py-2.5 px-3">Absent Days</th>
                          <th className="py-2.5 px-3 text-right">Attendance Rate</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-350">
                        {attendanceReport.data.map((item: any) => {
                          const stats = getFilteredAttendanceStats(item.stats);
                          return (
                            <tr key={item.student.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                              <td className="py-3 px-3">
                                <div className="flex items-center space-x-2.5">
                                  <div className="w-7 h-7 rounded-full bg-slate-150 dark:bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                                    <User className="w-4 h-4" />
                                  </div>
                                  <span className="font-bold text-slate-800 dark:text-white leading-none">{item.student.name}</span>
                                </div>
                              </td>
                              <td className="py-3 px-3 font-semibold text-xs text-slate-500 font-mono">{item.student.sid || 'N/A'}</td>
                              <td className="py-3 px-3 font-extrabold text-success-650">{stats.present}d</td>
                              <td className="py-3 px-3 font-extrabold text-danger-600">{stats.absent}d</td>
                              <td className="py-3 px-3 text-right">
                                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-extrabold ${
                                  stats.percentage >= 85
                                    ? 'bg-success-50 text-success-650 dark:bg-success-950/20' 
                                    : stats.percentage >= 75
                                    ? 'bg-warning-50 text-warning-650 dark:bg-warning-950/20'
                                    : 'bg-danger-50 text-danger-650 dark:bg-danger-950/20'
                                }`}>
                                  {stats.percentage}%
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'homework' && (
        <div className="space-y-6">
          {/* Controls Panel */}
          <div className="glass-panel p-4 sm:p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 mb-4">
              {role === 'mentor' && (
                <div className="sm:col-span-2 lg:col-span-1">
                  <label className="block text-xs font-bold text-slate-450 uppercase mb-2">Select Student</label>
                  <select 
                    value={reportStudentId}
                    onChange={(e) => {
                      const val = e.target.value;
                      setReportStudentId(val === 'all' ? 'all' : Number(val));
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-sm text-slate-800 dark:text-white font-medium focus:outline-none"
                  >
                    <option value="all">All Assigned Students</option>
                    {myStudents.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.sid})</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-450 uppercase mb-2">From Date</label>
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-sm text-slate-850 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-450 uppercase mb-2">To Date</label>
                <input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-sm text-slate-850 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-450 uppercase mb-2">Type</label>
                <select 
                  value={homeworkTypeFilter}
                  onChange={(e) => setHomeworkTypeFilter(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-sm text-slate-800 dark:text-white font-medium focus:outline-none"
                >
                  <option value="All">All Types</option>
                  <option value="School Homework">School Homework</option>
                  <option value="Extra Practice Homework">Extra Practice</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-450 uppercase mb-2">Priority</label>
                <select 
                  value={homeworkPriorityFilter}
                  onChange={(e) => setHomeworkPriorityFilter(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-sm text-slate-800 dark:text-white font-medium focus:outline-none"
                >
                  <option value="All">All Priorities</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleGenerateHomework}
              disabled={isGeneratingHomework}
              className="w-full sm:w-auto px-6 py-2.5 text-xs font-bold rounded-xl text-white bg-primary-600 hover:bg-primary-700 transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              {isGeneratingHomework ? "Generating..." : "Generate Homework Report"}
            </button>
          </div>

          {/* Generated Homework Report summary */}
          {homeworkReport && (
            <div className="space-y-6 animate-fadeIn printable-report">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                <h3 className="font-bold text-sm sm:text-base text-slate-800 dark:text-white font-outfit">
                  Homework Completion Report ({startDate} to {endDate})
                </h3>
                
                <div className="flex items-center space-x-2 non-printable">
                  <button
                    onClick={downloadHomeworkCSV}
                    className="flex items-center px-3 py-2 border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-xl text-slate-650 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 transition-all active:scale-95"
                  >
                    <Download className="w-4 h-4 mr-1.5" />
                    CSV
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="flex items-center px-3 py-2 text-xs font-bold rounded-xl text-white bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 transition-all active:scale-95"
                  >
                    <Printer className="w-4 h-4 mr-1.5" />
                    Print
                  </button>
                </div>
              </div>

              {homeworkReport.type === 'single' ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="glass-panel p-4 rounded-xl flex items-center space-x-3 bg-white dark:bg-slate-900 border">
                      <div className="p-2 bg-blue-50 dark:bg-blue-950/20 text-primary-500 rounded-lg">
                        <Clipboard className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-450 uppercase">Tasks Assigned</p>
                        <p className="text-lg font-extrabold text-slate-800 dark:text-white font-outfit">{homeworkReport.total}</p>
                      </div>
                    </div>

                    <div className="glass-panel p-4 rounded-xl flex items-center space-x-3 bg-white dark:bg-slate-900 border">
                      <div className="p-2 bg-success-50 dark:bg-success-950/20 text-success rounded-lg">
                        <CheckCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-455 uppercase">Completed Tasks</p>
                        <p className="text-lg font-extrabold text-slate-800 dark:text-white font-outfit">{homeworkReport.completed}</p>
                      </div>
                    </div>

                    <div className="glass-panel p-4 rounded-xl flex items-center space-x-3 bg-white dark:bg-slate-900 border">
                      <div className="p-2 bg-purple-50 dark:bg-purple-950/20 text-purple-650 rounded-lg">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-460 uppercase">Completion Rate</p>
                        <p className="text-lg font-extrabold text-slate-800 dark:text-white font-outfit">{homeworkReport.rate}%</p>
                      </div>
                    </div>
                  </div>

                  {/* Homework completion chart */}
                  {(() => {
                    const homeworkChartData = [
                      { name: 'Completed', value: homeworkReport.completed, color: '#16a34a' },
                      { name: 'Pending', value: homeworkReport.pending, color: '#f59e0b' }
                    ];
                    return (
                      <div className="glass-panel p-5 rounded-2xl border bg-white dark:bg-slate-900 flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div className="flex-1 w-full">
                          <h4 className="font-bold text-sm text-slate-800 dark:text-white mb-1.5 font-outfit">Task Completion Distribution</h4>
                          <p className="text-xs text-slate-400 font-semibold">Visual status of tasks assigned in date range</p>
                          <div className="mt-4 space-y-2">
                            <div className="flex items-center justify-between text-xs font-semibold">
                              <span className="flex items-center"><span className="w-2.5 h-2.5 bg-success rounded-full mr-2" />Completed</span>
                              <span className="text-slate-800 dark:text-slate-100">{homeworkReport.completed} tasks ({homeworkReport.rate}%)</span>
                            </div>
                            <div className="flex items-center justify-between text-xs font-semibold">
                              <span className="flex items-center"><span className="w-2.5 h-2.5 bg-warning rounded-full mr-2" />Pending</span>
                              <span className="text-slate-800 dark:text-slate-100">{homeworkReport.pending} tasks ({100 - homeworkReport.rate}%)</span>
                            </div>
                          </div>
                        </div>
                        <div className="h-40 w-40 relative flex-shrink-0">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={homeworkChartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={35}
                                outerRadius={55}
                                paddingAngle={4}
                                dataKey="value"
                              >
                                {homeworkChartData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-base font-extrabold text-slate-800 dark:text-white">{homeworkReport.rate}%</span>
                            <span className="text-[8px] text-slate-400 font-bold uppercase">Rate</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Detailed list table */}
                  <div className="glass-panel p-5 rounded-2xl border bg-white dark:bg-slate-900">
                    <h4 className="font-bold text-sm text-slate-800 dark:text-white mb-4 font-outfit">Detailed Log: {homeworkReport.student?.name}</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-sm">
                        <thead>
                          <tr className="text-slate-400 text-xs uppercase font-bold border-b pb-2">
                            <th className="py-2.5 px-3">Subject</th>
                            <th className="py-2.5 px-3">Homework Title</th>
                            <th className="py-2.5 px-3">Due Date</th>
                            <th className="py-2.5 px-3">Priority</th>
                            <th className="py-2.5 px-3 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-355">
                          {homeworkReport.history.length > 0 ? (
                            homeworkReport.history.map((h: any, idx: number) => (
                              <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                                <td className="py-3 px-3 font-bold text-primary-600 dark:text-primary-400">{h.subject}</td>
                                <td className="py-3 px-3">
                                  <p className="font-semibold text-slate-800 dark:text-white">{h.title}</p>
                                  <p className="text-[10px] text-slate-400 italic">Feedback: {h.remarks}</p>
                                </td>
                                <td className="py-3 px-3 font-semibold text-xs text-slate-500">{h.dueDate}</td>
                                <td className="py-3 px-3 text-xs">{h.priority}</td>
                                <td className="py-3 px-3 text-right">
                                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    h.status === 'Completed' 
                                      ? 'bg-success-50 text-success-650 dark:bg-success-950/20' 
                                      : 'bg-amber-50 text-amber-650 dark:bg-amber-950/20'
                                  }`}>
                                    {h.status}
                                  </span>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={5} className="text-center py-6 text-slate-400">No homework tasks found in range.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : (
                /* All students homework report table */
                <div className="glass-panel p-5 rounded-2xl border bg-white dark:bg-slate-900">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="text-slate-400 text-xs uppercase font-bold border-b pb-2">
                          <th className="py-2.5 px-3">Student</th>
                          <th className="py-2.5 px-3">Tasks Assigned</th>
                          <th className="py-2.5 px-3">Tasks Completed</th>
                          <th className="py-2.5 px-3">Tasks Pending</th>
                          <th className="py-2.5 px-3 text-right">Completion Rate</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-350">
                        {homeworkReport.data.map((item: any) => (
                          <tr key={item.student.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                            <td className="py-3 px-3">
                              <div className="flex items-center space-x-2.5">
                                <div className="w-7 h-7 rounded-full bg-slate-150 dark:bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                                  <User className="w-4 h-4" />
                                </div>
                                <span className="font-bold text-slate-800 dark:text-white leading-none">{item.student.name}</span>
                              </div>
                            </td>
                            <td className="py-3 px-3 font-semibold">{item.total} tasks</td>
                            <td className="py-3 px-3 font-semibold text-success-650">{item.completed} tasks</td>
                            <td className="py-3 px-3 font-semibold text-slate-400">{item.pending} tasks</td>
                            <td className="py-3 px-3 text-right">
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-extrabold ${
                                item.rate >= 80 
                                  ? 'bg-success-50 text-success-650 dark:bg-success-950/20' 
                                  : item.rate >= 50
                                  ? 'bg-warning-50 text-warning-650 dark:bg-warning-950/20'
                                  : 'bg-danger-50 text-danger-650 dark:bg-danger-950/20'
                              }`}>
                                {item.rate}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'performance' && (
        <div className="space-y-6">
          {/* Controls Panel */}
          <div className="glass-panel p-4 sm:p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
              {role === 'mentor' && (
                <div className="sm:col-span-2 lg:col-span-1">
                  <label className="block text-xs font-bold text-slate-450 uppercase mb-2">Select Student</label>
                  <select 
                    value={reportStudentId}
                    onChange={(e) => {
                      const val = e.target.value;
                      setReportStudentId(val === 'all' ? 'all' : Number(val));
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-sm text-slate-800 dark:text-white font-medium focus:outline-none"
                  >
                    <option value="all">All Assigned Students</option>
                    {myStudents.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.sid})</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-450 uppercase mb-2">From Date</label>
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-sm text-slate-850 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-450 uppercase mb-2">To Date</label>
                <input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-sm text-slate-850 dark:text-white focus:outline-none"
                />
              </div>
            </div>

            <button
              onClick={handleGeneratePerformance}
              disabled={isGeneratingPerformance}
              className="w-full sm:w-auto px-6 py-2.5 text-xs font-bold rounded-xl text-white bg-primary-600 hover:bg-primary-700 transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              {isGeneratingPerformance ? "Generating..." : "Generate Performance Report"}
            </button>
          </div>

          {/* Generated Performance Report summary */}
          {performanceReport && (
            <div className="space-y-6 animate-fadeIn printable-report">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                <h3 className="font-bold text-sm sm:text-base text-slate-800 dark:text-white font-outfit">
                  Test & Quiz Performance Report ({startDate} to {endDate})
                </h3>
                
                <div className="flex items-center space-x-2 non-printable">
                  <button
                    onClick={downloadPerformanceCSV}
                    className="flex items-center px-3 py-2 border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-xl text-slate-650 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 transition-all active:scale-95"
                  >
                    <Download className="w-4 h-4 mr-1.5" />
                    CSV
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="flex items-center px-3 py-2 text-xs font-bold rounded-xl text-white bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 transition-all active:scale-95"
                  >
                    <Printer className="w-4 h-4 mr-1.5" />
                    Print
                  </button>
                </div>
              </div>

              {performanceReport.type === 'single' ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="glass-panel p-4 rounded-xl flex items-center space-x-3 bg-white dark:bg-slate-900 border">
                      <div className="p-2 bg-blue-50 dark:bg-blue-950/20 text-primary-500 rounded-lg">
                        <Award className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-450 uppercase">Quizzes Completed</p>
                        <p className="text-lg font-extrabold text-slate-800 dark:text-white font-outfit">
                          {performanceReport.quizzesCount} <span className="text-xs text-slate-450 font-normal">({performanceReport.avgQuizAcc}% avg)</span>
                        </p>
                      </div>
                    </div>

                    <div className="glass-panel p-4 rounded-xl flex items-center space-x-3 bg-white dark:bg-slate-900 border">
                      <div className="p-2 bg-purple-50 dark:bg-purple-950/20 text-purple-650 rounded-lg">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-455 uppercase">Written Tests Taken</p>
                        <p className="text-lg font-extrabold text-slate-800 dark:text-white font-outfit">
                          {performanceReport.testsCount} <span className="text-xs text-slate-450 font-normal">({performanceReport.avgTestScore}% avg)</span>
                        </p>
                      </div>
                    </div>

                    <div className="glass-panel p-4 rounded-xl flex items-center space-x-3 bg-white dark:bg-slate-900 border">
                      <div className="p-2 bg-success-50 dark:bg-success-950/20 text-success rounded-lg">
                        <CheckCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-460 uppercase">Overall Performance</p>
                        <p className="text-lg font-extrabold text-slate-800 dark:text-white font-outfit">
                          {performanceReport.quizzesCount + performanceReport.testsCount > 0 
                            ? Math.round((performanceReport.avgQuizAcc + performanceReport.avgTestScore) / 2) 
                            : 100}%
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Performance Charts */}
                  {(() => {
                    const quizzesData = performanceReport.history
                      .filter((h: any) => h.type === 'Quiz')
                      .map((q: any) => ({
                        name: q.name.length > 15 ? q.name.substring(0, 12) + '...' : q.name,
                        accuracy: q.accuracy
                      })).reverse();

                    const testsData = performanceReport.history
                      .filter((h: any) => h.type === 'Written Test' && h.status === 'Graded')
                      .map((t: any) => ({
                        name: t.name.length > 15 ? t.name.substring(0, 12) + '...' : t.name,
                        percentage: t.accuracy
                      })).reverse();

                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Quiz performance graph */}
                        <div className="glass-panel p-5 rounded-2xl border bg-white dark:bg-slate-900">
                          <h4 className="font-bold text-sm text-slate-800 dark:text-white mb-4 font-outfit">Quiz Performance Scores</h4>
                          {quizzesData.length > 0 ? (
                            <div className="h-56">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={quizzesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" className="dark:stroke-slate-800" vertical={false} />
                                  <XAxis dataKey="name" stroke="#94A3B8" fontSize={9} tickLine={false} />
                                  <YAxis domain={[0, 100]} stroke="#94A3B8" fontSize={9} tickLine={false} />
                                  <Tooltip />
                                  <Bar dataKey="accuracy" fill="#10B981" radius={[4, 4, 0, 0]} name="Accuracy (%)" maxBarSize={30} />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          ) : (
                            <div className="h-56 flex items-center justify-center">
                              <p className="text-slate-400 text-xs font-semibold">No quizzes found in this range.</p>
                            </div>
                          )}
                        </div>

                        {/* Test score trend */}
                        <div className="glass-panel p-5 rounded-2xl border bg-white dark:bg-slate-900">
                          <h4 className="font-bold text-sm text-slate-800 dark:text-white mb-4 font-outfit">Written Test Score Trend</h4>
                          {testsData.length > 0 ? (
                            <div className="h-56">
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={testsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" className="dark:stroke-slate-800" vertical={false} />
                                  <XAxis dataKey="name" stroke="#94A3B8" fontSize={9} tickLine={false} />
                                  <YAxis domain={[0, 100]} stroke="#94A3B8" fontSize={9} tickLine={false} />
                                  <Tooltip />
                                  <Line type="monotone" dataKey="percentage" stroke="#8B5CF6" strokeWidth={2.5} name="Score (%)" dot={{ r: 4 }} />
                                </LineChart>
                              </ResponsiveContainer>
                            </div>
                          ) : (
                            <div className="h-56 flex items-center justify-center">
                              <p className="text-slate-400 text-xs font-semibold">No graded written tests found in this range.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Detailed list table */}
                  <div className="glass-panel p-5 rounded-2xl border bg-white dark:bg-slate-900">
                    <h4 className="font-bold text-sm text-slate-800 dark:text-white mb-4 font-outfit">Detailed Log: {performanceReport.student?.name}</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-sm">
                        <thead>
                          <tr className="text-slate-400 text-xs uppercase font-bold border-b pb-2">
                            <th className="py-2.5 px-3">Type</th>
                            <th className="py-2.5 px-3">Activity Title</th>
                            <th className="py-2.5 px-3">Subject</th>
                            <th className="py-2.5 px-3">Submission Date</th>
                            <th className="py-2.5 px-3">Score</th>
                            <th className="py-2.5 px-3 text-right">Accuracy / Grade</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-355">
                          {performanceReport.history.length > 0 ? (
                            performanceReport.history.map((h: any, idx: number) => (
                              <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                                <td className="py-3 px-3">
                                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                    h.type === 'Quiz' 
                                      ? 'bg-blue-50 text-blue-650 dark:bg-blue-950/20' 
                                      : 'bg-purple-50 text-purple-650 dark:bg-purple-950/20'
                                  }`}>
                                    {h.type}
                                  </span>
                                </td>
                                <td className="py-3 px-3 font-semibold text-slate-800 dark:text-white">{h.name}</td>
                                <td className="py-3 px-3 font-medium text-slate-500">{h.subject}</td>
                                <td className="py-3 px-3 text-xs">{h.date}</td>
                                <td className="py-3 px-3 font-mono text-xs">{h.score}</td>
                                <td className="py-3 px-3 text-right font-extrabold text-slate-800 dark:text-slate-100">{h.accuracy}%</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={6} className="text-center py-6 text-slate-400">No test or quiz submissions found in range.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : (
                /* All students performance report table */
                <div className="glass-panel p-5 rounded-2xl border bg-white dark:bg-slate-900">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="text-slate-400 text-xs uppercase font-bold border-b pb-2">
                          <th className="py-2.5 px-3">Student</th>
                          <th className="py-2.5 px-3">Quizzes Attempted</th>
                          <th className="py-2.5 px-3">Avg Quiz Accuracy</th>
                          <th className="py-2.5 px-3">Tests Taken</th>
                          <th className="py-2.5 px-3">Avg Test Score</th>
                          <th className="py-2.5 px-3 text-right">Overall Rating</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-350">
                        {performanceReport.data.map((item: any) => {
                          const overall = item.quizzesCount + item.testsCount > 0 
                            ? Math.round((item.avgQuizAcc + item.avgTestScore) / 2) 
                            : 100;
                          return (
                            <tr key={item.student.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                              <td className="py-3 px-3">
                                <div className="flex items-center space-x-2.5">
                                  <div className="w-7 h-7 rounded-full bg-slate-150 dark:bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                                    <User className="w-4 h-4" />
                                  </div>
                                  <span className="font-bold text-slate-800 dark:text-white leading-none">{item.student.name}</span>
                                </div>
                              </td>
                              <td className="py-3 px-3 font-semibold text-xs">{item.quizzesCount} quizzes</td>
                              <td className="py-3 px-3 font-extrabold text-success-650">{item.avgQuizAcc}%</td>
                              <td className="py-3 px-3 font-semibold text-xs">{item.testsCount} tests</td>
                              <td className="py-3 px-3 font-extrabold text-purple-650">{item.avgTestScore}%</td>
                              <td className="py-3 px-3 text-right">
                                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-extrabold ${
                                  overall >= 80 
                                    ? 'bg-success-50 text-success-650 dark:bg-success-950/20' 
                                    : overall >= 55
                                    ? 'bg-warning-50 text-warning-650 dark:bg-warning-950/20'
                                    : 'bg-danger-50 text-danger-650 dark:bg-danger-950/20'
                                }`}>
                                  {overall}%
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
