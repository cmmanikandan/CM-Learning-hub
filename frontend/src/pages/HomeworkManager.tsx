import React, { useState, useRef } from 'react';
import { ModalPortal } from '../components/Modal';
import { useApp } from '../context/AppContext';
import type { Homework } from '../context/AppContext';
import { uploadToCloudinary, getCloudinaryDownloadUrl } from '../utils/cloudinary';
import { 
  Plus, 
  Trash2, 
  Copy, 
  Edit3, 
  Calendar as CalendarIcon, 
  Printer, 
  FileText, 
  Search, 
  ChevronLeft,
  ChevronRight,
  Check,
  Sparkles,
  Download,
  ExternalLink,
  RotateCcw
} from 'lucide-react';

interface HomeworkManagerProps {
  showCreateModal: boolean;
  setShowCreateModal: (show: boolean) => void;
}

export const HomeworkManager: React.FC<HomeworkManagerProps> = ({ 
  showCreateModal, 
  setShowCreateModal 
}) => {
  const { 
    role, 
    homeworkList, 
    addHomework, 
    updateHomework, 
    deleteHomework, 
    duplicateHomework,
    myStudents,
    refreshData
  } = useApp();

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

  // Filter/Search states (Teacher)
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  // Page tabs and Calendar scheduling (Teacher)
  const [activePageTab, setActivePageTab] = useState<'today' | 'history'>('today');
  const [selectedScheduleDate, setSelectedScheduleDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [isCalendarVisible, setIsCalendarVisible] = useState(true);
  const assignDateRef = useRef<HTMLInputElement>(null);


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
      const hasHomework = homeworkList.some(hw => hw.date === dateStr);
      
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
          {hasHomework && (
            <span className={`w-1.5 h-1.5 rounded-full absolute bottom-1 ${isSelected ? 'bg-white' : 'bg-primary-500'}`} />
          )}
        </button>
      );
    }
    return days;
  };

  // Target assignment states
  const [assignTarget, setAssignTarget] = useState<'all' | 'class' | 'students'>('all');
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);

  // Auto-reset target assignment when modal closes
  React.useEffect(() => {
    if (!showCreateModal) {
      setAssignTarget('all');
      setSelectedClasses([]);
      setSelectedStudentIds([]);
    }
  }, [showCreateModal]);

  const uniqueClasses = Array.from(new Set(myStudents.map(s => s.className || '').filter(Boolean)));

  // Form states
  const [editingHw, setEditingHw] = useState<Homework | null>(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    homeworkType: 'School Homework' as Homework['homeworkType'],
    priority: 'Medium' as Homework['priority'],
    estimatedTime: 30,
    remarks: '',
    attachmentName: '',
    attachmentUrl: ''
  });

  const [homeworkItems, setHomeworkItems] = useState([{ id: Date.now(), subject: '', description: '' }]);
  const [isUploading, setIsUploading] = useState(false);

  // Student scroll state: active date view
  const [studentActiveDate, setStudentActiveDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Auto-carry forward logic is handled dynamically by the backend API on GET request.


  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const url = await uploadToCloudinary(file, () => {});
      setFormData(prev => ({ 
        ...prev, 
        attachmentName: file.name,
        attachmentUrl: url
      }));
    } catch (error) {
      console.error('Upload failed', error);
      const err = error as any;
      alert('Failed to upload file. Error: ' + (err.message || err));
    } finally {
      setIsUploading(false);
    }
  };

  // Handle template selection
  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const template = e.target.value;
    if (template === 'math') {
      setFormData(prev => ({
        ...prev,
        homeworkType: 'School Homework',
        estimatedTime: 40,
        attachmentName: 'Math_Revision_Week_Sheet.pdf'
      }));
      setHomeworkItems([{ id: Date.now(), subject: 'Mathematics', description: 'Complete the revision worksheet questions matching algebraic equations and functions. Show all rough workings.' }]);
    } else if (template === 'science') {
      setFormData(prev => ({
        ...prev,
        homeworkType: 'Extra Practice Homework',
        estimatedTime: 30,
        attachmentName: 'Physics_Refraction_Notes.pdf'
      }));
      setHomeworkItems([{ id: Date.now(), subject: 'Physics', description: 'Complete the refractive index calculation problems 1-10 on page 45 of textbook.' }]);
    }
  };

  // Submit Homework Form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (homeworkItems.some(item => !item.subject || !item.description)) return;

    if (editingHw) {
      updateHomework(editingHw.id, {
        date: formData.date,
        dueDate: formData.date, // Same day
        homeworkType: formData.homeworkType,
        subject: homeworkItems[0].subject,
        title: `${formData.homeworkType} - ${homeworkItems[0].subject}`,
        description: homeworkItems[0].description,
        priority: formData.priority,
        estimatedTime: formData.estimatedTime,
        attachmentName: formData.attachmentName,
        attachmentUrl: formData.attachmentUrl,
        remarks: formData.remarks
      });
      setEditingHw(null);
    } else {
      let student_ids: number[] | undefined = undefined;
      if (assignTarget === 'class') {
        student_ids = myStudents.filter(s => selectedClasses.includes(s.className || '')).map(s => s.id);
        if (student_ids.length === 0) {
          alert("Please select at least one standard/class.");
          return;
        }
      } else if (assignTarget === 'students') {
        student_ids = selectedStudentIds;
        if (student_ids.length === 0) {
          alert("Please select at least one student.");
          return;
        }
      }

      homeworkItems.forEach(item => {
        addHomework({
          date: formData.date,
          dueDate: formData.date,
          homeworkType: formData.homeworkType,
          subject: item.subject,
          title: `${formData.homeworkType} - ${item.subject}`,
          description: item.description,
          priority: formData.priority,
          estimatedTime: formData.estimatedTime,
          attachmentName: formData.attachmentName,
          attachmentUrl: formData.attachmentUrl,
          student_ids
        });
      });
    }
    
    // Reset Form
    setFormData({
      date: new Date().toISOString().split('T')[0],
      homeworkType: 'School Homework',
      priority: 'Medium',
      estimatedTime: 30,
      remarks: '',
      attachmentName: '',
      attachmentUrl: ''
    });
    setHomeworkItems([{ id: Date.now(), subject: '', description: '' }]);
    setAssignTarget('all');
    setSelectedClasses([]);
    setSelectedStudentIds([]);
    setShowCreateModal(false);
  };

  // Trigger editing mode
  const startEdit = (hw: Homework) => {
    setEditingHw(hw);
    setFormData({
      date: hw.date,
      homeworkType: hw.homeworkType,
      priority: hw.priority,
      estimatedTime: hw.estimatedTime,
      remarks: hw.remarks || '',
      attachmentName: hw.attachmentName || '',
      attachmentUrl: hw.attachmentUrl || ''
    });
    setHomeworkItems([{ id: Date.now(), subject: hw.subject, description: hw.description }]);
    setAssignTarget('all');
    setSelectedClasses([]);
    setSelectedStudentIds([]);
    setShowCreateModal(true);
  };

  // PDF Export simulation
  const exportPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const content = homeworkList.map(hw => `
      <div style="border-bottom: 1px solid #ddd; padding: 15px 0;">
        <h3>[${hw.subject}] ${hw.title}</h3>
        <p><strong>Type:</strong> ${hw.homeworkType} | <strong>Due:</strong> ${hw.dueDate} | <strong>Priority:</strong> ${hw.priority}</p>
        <p>${hw.description}</p>
        ${hw.remarks ? `<p><em>Remarks: ${hw.remarks}</em></p>` : ''}
      </div>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Homework Export</title>
          <style>body { font-family: sans-serif; padding: 30px; }</style>
        </head>
        <body>
          <h1>CM Learning Hub - Homework List</h1>
          ${content}
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Student Navigation: Change current active day
  const adjustDate = (days: number) => {
    const current = new Date(studentActiveDate);
    current.setDate(current.getDate() + days);
    setStudentActiveDate(current.toISOString().split('T')[0]);
  };

  // Filter homework list (Teacher)
  const filteredHomeworkList = homeworkList.filter(hw => {
    const matchesSearch = hw.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          hw.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = subjectFilter ? hw.subject === subjectFilter : true;
    const matchesStatus = statusFilter ? hw.status === statusFilter : true;
    const matchesPriority = priorityFilter ? hw.priority === priorityFilter : true;

    return matchesSearch && matchesSubject && matchesStatus && matchesPriority;
  });

  // Student calculations for active day
  const studentDayHw = homeworkList.filter(hw => hw.dueDate === studentActiveDate);
  const studentDayTotal = studentDayHw.length;
  const studentDayCompleted = studentDayHw.filter(hw => hw.status === 'Completed').length;
  const studentDayPercent = studentDayTotal > 0 ? Math.round((studentDayCompleted / studentDayTotal) * 100) : 0;
  const studentDayAllCompleted = studentDayTotal > 0 && studentDayCompleted === studentDayTotal;
  
  const schoolHomework = studentDayHw.filter(hw => hw.homeworkType === 'School Homework');
  const extraPractice = studentDayHw.filter(hw => hw.homeworkType === 'Extra Practice Homework');

  // Subjects for filters
  const subjects = Array.from(new Set(homeworkList.map(hw => hw.subject)));

  const renderHomeworkCard = (hw: Homework) => {
    const isComplete = hw.status === 'Completed';
    const todayDate = new Date().toISOString().split('T')[0];
    const isDueToday = hw.dueDate === todayDate && !isComplete;
    return (
      <div 
        key={hw.id}
        className={`glass-panel p-5 rounded-2xl flex flex-col justify-between transition-all border relative ${
          isDueToday
            ? 'border-red-300 dark:border-red-800/60 ring-1 ring-red-200 dark:ring-red-900/40'
            : isComplete 
            ? 'border-success-200/50 bg-success-50/5 dark:bg-success-950/5' 
            : 'border-slate-200/50 dark:border-slate-800/50'
        }`}
      >
        {/* Due Today Badge */}
        {isDueToday && (
          <div className="absolute -top-2.5 left-4 bg-red-500 text-white text-[9px] font-black px-2.5 py-0.5 rounded-full shadow-sm flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            DUE TODAY!
          </div>
        )}
        <div>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center space-x-3">
              {/* Checkbox */}
              <button
                onClick={() => updateHomework(hw.id, { status: isComplete ? 'Pending' : 'Completed' })}
                className={`w-6 h-6 shrink-0 rounded-md border-2 flex items-center justify-center transition-all ${
                  isComplete 
                    ? 'bg-success-500 border-success-500 text-white' 
                    : 'border-slate-300 dark:border-slate-600 hover:border-primary-500'
                }`}
              >
                {isComplete && <Check className="w-4 h-4 stroke-[3]" />}
              </button>
              
              <div>
                <div className="flex flex-wrap gap-1.5 items-center">
                  <span className="text-[10px] font-bold bg-primary-50 text-primary-600 dark:bg-primary-950/20 dark:text-primary-400 px-2 py-0.5 rounded-md">
                    {hw.subject}
                  </span>
                  {hw.carriedFromId && (
                    <span className="text-[10px] font-bold bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400 px-2 py-0.5 rounded-md flex items-center gap-1">
                      🔄 Carried Forward
                    </span>
                  )}
                </div>
                <h4 className={`text-base font-bold font-outfit mt-1.5 ${isComplete ? 'text-slate-500 dark:text-slate-400 line-through decoration-2 decoration-success-500/50' : 'text-slate-800 dark:text-white'}`}>
                  {hw.title}
                </h4>
              </div>
            </div>
            
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
              hw.priority === 'High' ? 'bg-danger-50 text-danger-600 dark:bg-danger-950/20 dark:text-danger-400' :
              hw.priority === 'Medium' ? 'bg-warning-50 text-warning-600 dark:bg-warning-950/20 dark:text-warning-400' :
              'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
            }`}>
              {hw.priority} Priority
            </span>
          </div>

          <div className="ml-9">
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              {hw.description}
            </p>

            {/* Display attachment info */}
            {hw.attachmentName && (
              <div className="mt-3.5 p-2 bg-slate-100/60 dark:bg-slate-800/80 rounded-xl flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-center space-x-1.5 min-w-0">
                  <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span className="truncate">{hw.attachmentName}</span>
                </div>
                {hw.attachmentUrl && (
                  <div className="flex space-x-3 mt-2">
                    <a href={getCloudinaryDownloadUrl(hw.attachmentUrl)} download className="text-[10px] font-semibold text-white bg-primary-600 hover:bg-primary-700 px-2.5 py-1 rounded-md flex items-center shadow-sm">
                      <Download className="w-3 h-3 mr-1" />
                      Download
                    </a>
                    <a href={hw.attachmentUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] font-semibold text-slate-700 bg-slate-100 border border-slate-200 hover:bg-slate-200 dark:text-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-700 px-2.5 py-1 rounded-md flex items-center shadow-sm">
                      <ExternalLink className="w-3 h-3 mr-1" />
                      New Tab
                    </a>
                  </div>
                )}
              </div>
            )}

            {hw.remarks && (
              <div className="mt-3.5 p-2.5 bg-yellow-50/50 dark:bg-yellow-950/10 border border-yellow-100/30 rounded-xl text-xs text-slate-600 dark:text-slate-300">
                <strong className="text-yellow-700 dark:text-yellow-500 font-bold block mb-0.5">Teacher remarks:</strong>
                {hw.remarks}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };


  return (
    <div className="space-y-6">
      {/* ---------------- TEACHER LAYOUT ---------------- */}
      {role === 'mentor' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold font-outfit text-slate-800 dark:text-white flex items-center gap-2">
                Homework Hub
                <button 
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800 text-slate-450 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-300 transition-all active:scale-95 disabled:opacity-50"
                  title="Refresh Data"
                >
                  <RotateCcw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>
              </h2>
              <p className="text-xs text-slate-400 font-medium">Assign, clone, review and customize study plans</p>
            </div>
            
            <div className="flex items-center space-x-3">
              <button 
                onClick={exportPDF}
                className="flex items-center px-3.5 py-2 border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm active:scale-95"
              >
                <Printer className="w-4 h-4 mr-1.5" />
                Export / Print
              </button>
              
              <button 
                onClick={() => {
                  setEditingHw(null);
                  setFormData(prev => ({ ...prev, date: selectedScheduleDate }));
                  setShowCreateModal(true);
                }}
                className="flex items-center px-3.5 py-2 text-xs font-bold rounded-xl text-white bg-primary-600 hover:bg-primary-700 transition-all shadow-sm active:scale-95"
              >
                <Plus className="w-4.5 h-4.5 mr-1" />
                Assign Homework
              </button>
            </div>
          </div>

          {/* Page Tabs and Toggle Calendar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-transparent p-0 border-none shadow-none">
            <div className="flex flex-wrap gap-2.5">
              <button
                onClick={() => setActivePageTab('today')}
                className={`flex items-center gap-2 px-5 py-2.5 text-xs font-extrabold rounded-full transition-all border shadow-sm ${
                  activePageTab === 'today'
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : 'bg-blue-50/30 dark:bg-blue-950/20 border-blue-200/60 dark:border-blue-900/40 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30'
                }`}
              >
                <CalendarIcon className="w-4 h-4" />
                Today's Schedule & Calendar
              </button>
              <button
                onClick={() => setActivePageTab('history')}
                className={`flex items-center gap-2 px-5 py-2.5 text-xs font-extrabold rounded-full transition-all border shadow-sm ${
                  activePageTab === 'history'
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : 'bg-blue-50/30 dark:bg-blue-950/20 border-blue-200/60 dark:border-blue-900/40 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30'
                }`}
              >
                <FileText className="w-4 h-4" />
                Homework History
              </button>
            </div>
            
            {activePageTab === 'today' && (
              <button
                onClick={() => setIsCalendarVisible(!isCalendarVisible)}
                className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 dark:border-slate-700 text-xs font-bold rounded-xl text-slate-750 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 transition-all shadow-sm active:scale-95"
              >
                <CalendarIcon className="w-4 h-4 text-emerald-555" />
                {isCalendarVisible ? 'Hide Calendar' : 'Show Calendar'}
              </button>
            )}
          </div>

          {activePageTab === 'today' ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Calendar Column */}
              {isCalendarVisible && (
                <div className="glass-panel p-5 rounded-2xl flex flex-col transition-all duration-300">
                  <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <CalendarIcon className="w-4.5 h-4.5 text-primary-500" />
                    <h3 className="font-extrabold text-sm text-slate-855 dark:text-white font-outfit">
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
                      Dots indicate dates with assigned homework.
                    </p>
                    <p>Selected Date: <strong className="text-primary-500">{selectedScheduleDate}</strong></p>
                  </div>
                </div>
              )}

              {/* Day Assignments Column */}
              <div className={`${isCalendarVisible ? 'lg:col-span-2' : 'lg:col-span-3'} space-y-6 transition-all duration-300`}>
                <div className="glass-panel p-5 rounded-2xl flex flex-col">
                  <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <h3 className="font-bold text-base text-slate-800 dark:text-white font-outfit">
                      Assignments on {selectedScheduleDate}
                    </h3>
                    <span className="text-xs text-slate-405 dark:text-slate-400 font-extrabold bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded-full">
                      {homeworkList.filter(hw => hw.date === selectedScheduleDate).length} Tasks
                    </span>
                  </div>

                  {homeworkList.filter(hw => hw.date === selectedScheduleDate).length > 0 ? (
                    <div className="space-y-4">
                      {homeworkList.filter(hw => hw.date === selectedScheduleDate).map((hw) => (
                        <div key={hw.id} className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-150 dark:border-slate-800/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="text-[10px] font-black bg-primary-50 text-primary-600 dark:bg-primary-950/20 dark:text-primary-450 px-2 py-0.5 rounded">
                                {hw.subject}
                              </span>
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded ${
                                hw.priority === 'High' ? 'bg-danger-50 text-danger-600 dark:bg-danger-955/20' :
                                hw.priority === 'Medium' ? 'bg-warning-50 text-warning-600 dark:bg-warning-955/20' :
                                'bg-slate-100 text-slate-600 dark:bg-slate-800'
                              }`}>
                                {hw.priority} Priority
                              </span>
                            </div>
                            <h4 className="font-extrabold text-sm text-slate-800 dark:text-white font-outfit">{hw.title}</h4>
                            <p className="text-xs text-slate-555 dark:text-slate-400 mt-1 leading-relaxed line-clamp-2">{hw.description}</p>
                            
                            {/* Student Progress and Completion Rate */}
                            <div className="mt-3 flex flex-wrap items-center gap-4 bg-slate-100/40 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-200/5">
                              <div className="flex flex-col gap-1 min-w-[120px]">
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Student Completion</span>
                                <div className="flex flex-wrap gap-1.5">
                                  {hw.students && hw.students.length > 0 ? (
                                    hw.students.map((s, idx) => (
                                      <div key={idx} className="flex items-center space-x-1 bg-white dark:bg-slate-900 border border-slate-200/10 px-2 py-0.5 rounded text-[10px]">
                                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.status === 'Completed' ? 'bg-success-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                                        <span className="font-bold text-slate-700 dark:text-slate-300 truncate max-w-[90px]">{s.student_name}</span>
                                      </div>
                                    ))
                                  ) : (
                                    <span className="text-[10px] text-slate-400 font-bold">General Assignment</span>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-col gap-1 min-w-[100px]">
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Progress</span>
                                <div className="flex items-center gap-2">
                                  <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${
                                    hw.completion_percentage === 100 
                                      ? 'bg-success-50 text-success-600 dark:bg-success-950/20 dark:text-success-400' 
                                      : 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400'
                                  }`}>
                                    {hw.completion_percentage}%
                                  </span>
                                  <div className="w-16 bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full rounded-full transition-all duration-300 ${hw.completion_percentage === 100 ? 'bg-success-500' : 'bg-amber-500'}`}
                                      style={{ width: `${hw.completion_percentage}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                            <button
                              onClick={() => startEdit(hw)}
                              className="p-2 text-slate-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950/20 rounded-lg transition-all"
                              title="Edit"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => duplicateHomework(hw.id)}
                              className="p-2 text-slate-500 hover:text-success-600 hover:bg-success-50 dark:hover:bg-success-950/20 rounded-lg transition-all"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteHomework(hw.id)}
                              className="p-2 text-slate-500 hover:text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-950/20 rounded-lg transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/20 flex items-center justify-center text-xl mb-3 animate-pulse">
                        💡
                      </div>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300 font-outfit">No homework assigned for this day!</p>
                      <p className="text-xs text-slate-400 mt-1">Use the "Assign Homework" button above to add new assignments.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Filtering Controls */}
              <div className="glass-panel p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search homework..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-white focus:outline-none focus:border-primary-500"
                  />
                </div>
                
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={subjectFilter}
                    onChange={(e) => setSubjectFilter(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg text-xs text-slate-600 dark:text-slate-300 font-semibold focus:outline-none"
                  >
                    <option value="">All Subjects</option>
                    {subjects.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                  </select>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg text-xs text-slate-600 dark:text-slate-300 font-semibold focus:outline-none"
                  >
                    <option value="">All Status</option>
                    <option value="Pending">Pending</option>
                    <option value="Completed">Completed</option>
                  </select>

                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg text-xs text-slate-600 dark:text-slate-300 font-semibold focus:outline-none"
                  >
                    <option value="">All Priorities</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              {/* Homework Table */}
              <div className="glass-panel rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-400 text-[11px] uppercase tracking-wider font-bold border-b border-slate-100 dark:border-slate-800">
                        <th className="px-5 py-3.5">Assign Date</th>
                        <th className="px-5 py-3.5">Subject</th>
                        <th className="px-5 py-3.5">Type</th>
                        <th className="px-5 py-3.5">Homework Title</th>
                        <th className="px-5 py-3.5">Priority</th>
                        <th className="px-5 py-3.5">Student Completion</th>
                        <th className="px-5 py-3.5">Progress</th>
                        <th className="px-5 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm text-slate-700 dark:text-slate-300">
                      {filteredHomeworkList.length > 0 ? (
                        filteredHomeworkList.map((hw) => (
                          <tr key={hw.id} className="hover:bg-slate-50/55 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="px-5 py-4 font-semibold text-xs whitespace-nowrap">{hw.date}</td>
                            <td className="px-5 py-4 font-bold font-outfit text-xs text-primary-600 dark:text-primary-400">{hw.subject}</td>
                            <td className="px-5 py-4 text-xs whitespace-nowrap text-slate-500">{hw.homeworkType}</td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-slate-800 dark:text-white font-outfit">{hw.title}</p>
                              </div>
                              <p className="text-xs text-slate-400 truncate max-w-[200px] mt-0.5">{hw.description}</p>
                            </td>
                            <td className="px-5 py-4">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                hw.priority === 'High' ? 'bg-danger-50 text-danger-600 dark:bg-danger-950/20 dark:text-danger-400' :
                                hw.priority === 'Medium' ? 'bg-warning-50 text-warning-600 dark:bg-warning-950/20 dark:text-warning-400' :
                                'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                              }`}>
                                {hw.priority}
                              </span>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex flex-col gap-1 max-w-[160px]">
                                {hw.students && hw.students.length > 0 ? (
                                  hw.students.map((s, idx) => (
                                    <div key={idx} className="flex items-center space-x-2 text-xs">
                                      <span className={`w-2 h-2 rounded-full shrink-0 ${s.status === 'Completed' ? 'bg-success-500 shadow-sm shadow-success-500/20' : 'bg-slate-350 dark:bg-slate-650'}`} />
                                      <span className="font-bold text-slate-700 dark:text-slate-300 truncate max-w-[130px]">{s.student_name}</span>
                                    </div>
                                  ))
                                ) : (
                                  <span className="text-xs text-slate-400 font-bold">General Assignment</span>
                                )}
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex flex-col gap-1.5 min-w-[100px]">
                                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full self-start ${
                                  hw.completion_percentage === 100 
                                    ? 'bg-success-50 text-success-600 dark:bg-success-950/20 dark:text-success-400' 
                                    : 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400'
                                }`}>
                                  {hw.completion_percentage}% Done
                                </span>
                                <div className="w-20 bg-slate-150 dark:bg-slate-850 h-1.5 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full transition-all duration-300 ${hw.completion_percentage === 100 ? 'bg-success-500' : 'bg-amber-500'}`}
                                    style={{ width: `${hw.completion_percentage}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end space-x-1.5">
                                <button 
                                  onClick={() => startEdit(hw)}
                                  className="p-1.5 text-slate-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950/20 rounded-lg transition-colors"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => duplicateHomework(hw.id)}
                                  className="p-1.5 text-slate-500 hover:text-success-600 hover:bg-success-50 dark:hover:bg-success-950/20 rounded-lg transition-colors"
                                >
                                  <Copy className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => deleteHomework(hw.id)}
                                  className="p-1.5 text-slate-500 hover:text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-950/20 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={8} className="px-5 py-8 text-center text-slate-400 font-medium">
                            No homework found. Click "Assign Homework" to create one.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ---------------- STUDENT LAYOUT ---------------- */}
      {role === 'student' && (
        <div className="space-y-6">
          {/* Scrollable Day Navigation */}
          <div className="glass-panel p-4 rounded-2xl flex items-center justify-between shadow-sm">
            <button 
              onClick={() => adjustDate(-1)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
            >
              <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </button>
            
            <div className="flex flex-col items-center">
              <span className="text-xs font-bold text-primary-500 uppercase tracking-widest">Homework Due Date</span>
              <div className="flex items-center space-x-1.5 mt-1">
                <CalendarIcon className="w-4.5 h-4.5 text-slate-400" />
                <span className="font-bold text-slate-800 dark:text-white font-outfit text-base">
                  {studentActiveDate === new Date().toISOString().split('T')[0] ? 'Today' : studentActiveDate}
                </span>
              </div>
            </div>

            <button 
              onClick={() => adjustDate(1)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
            >
              <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </button>

            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-450 hover:text-slate-600 dark:text-slate-400 transition-all active:scale-95 disabled:opacity-50"
              title="Refresh Data"
            >
              <RotateCcw className={`w-4.5 h-4.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Daily Completion Celebration Box */}
          {studentDayAllCompleted && (
            <div className="p-5 bg-gradient-to-r from-success-500 to-emerald-600 rounded-2xl text-white shadow-md shadow-success-500/10 flex items-center justify-between animate-fadeIn">
              <div className="flex items-center space-x-3.5">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-xl">
                  🎉
                </div>
                <div>
                  <h3 className="font-bold text-base font-outfit">Congratulations!</h3>
                  <p className="text-xs text-white/85 mt-0.5">All homework completed for this day. Superb work!</p>
                </div>
              </div>
              <Sparkles className="w-8 h-8 text-yellow-300 animate-pulse hidden sm:block" />
            </div>
          )}

          {/* Daily Progress Tracker */}
          {studentDayTotal > 0 && !studentDayAllCompleted && (
            <div className="glass-panel p-4.5 rounded-2xl flex items-center justify-between shadow-sm">
              <div>
                <h3 className="font-bold text-sm text-slate-800 dark:text-white font-outfit">Progress</h3>
                <p className="text-xs text-slate-400 mt-0.5">{studentDayCompleted} of {studentDayTotal} tasks complete</p>
              </div>
              <div className="w-24 bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-primary-500 h-full rounded-full transition-all duration-300" 
                  style={{ width: `${studentDayPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Student Homework Cards Split by Type */}
          
          {studentDayHw.length === 0 ? (
            <div className="text-center py-12 glass-panel rounded-2xl text-slate-400 font-medium">
              No homework due on this date. Enjoy! 🎈
            </div>
          ) : (
            <div className="space-y-8">
              {/* School Homework Section */}
              {schoolHomework.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold font-outfit text-slate-800 dark:text-white mb-4 flex items-center">
                    <span className="w-2 h-6 bg-primary-500 rounded-full mr-2"></span>
                    School Homework
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {schoolHomework.map(renderHomeworkCard)}
                  </div>
                </div>
              )}

              {/* Extra Practice Homework Section */}
              {extraPractice.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold font-outfit text-slate-800 dark:text-white mb-4 flex items-center">
                    <span className="w-2 h-6 bg-purple-500 rounded-full mr-2"></span>
                    Extra Practice
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {extraPractice.map(renderHomeworkCard)}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ---------------- FORM MODAL (ASSIGN HOMEWORK) ---------------- */}
      {showCreateModal && (
        <ModalPortal onClose={() => { setEditingHw(null); setShowCreateModal(false); }}>
            <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 flex flex-col max-h-[88vh] animate-scaleIn relative">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
                <h3 className="font-bold text-base text-slate-800 dark:text-white font-outfit">
                  {editingHw ? 'Edit Homework Assignment' : 'Assign New Homework'}
                </h3>
                <button 
                  onClick={() => {
                    setEditingHw(null);
                    setShowCreateModal(false);
                  }}
                  className="text-slate-400 hover:text-slate-500 focus:outline-none"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto grow">
              {!editingHw && (
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Load Template</label>
                  <select 
                    onChange={handleTemplateChange}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg text-sm text-slate-700 dark:text-slate-300 focus:outline-none"
                  >
                    <option value="">Select Template...</option>
                    <option value="math">Mathematics Worksheet template</option>
                    <option value="science">Physics Refraction worksheet template</option>
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Date</label>
                  <div className="relative flex items-center">
                    <input 
                      type="date"
                      ref={assignDateRef}
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 pl-3 pr-10 py-2 rounded-lg text-sm text-slate-850 dark:text-white focus:outline-none focus:border-primary-500"
                      required
                    />
                    <CalendarIcon 
                      className="absolute right-3.5 text-slate-400 w-4.5 h-4.5 cursor-pointer hover:text-primary-500 transition-colors"
                      onClick={() => assignDateRef.current?.showPicker()}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Homework Type</label>
                  <select 
                    value={formData.homeworkType}
                    onChange={(e) => setFormData({ ...formData, homeworkType: e.target.value as Homework['homeworkType'] })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:border-primary-500"
                  >
                    <option value="School Homework">School Homework</option>
                    <option value="Extra Practice Homework">Extra Practice Homework</option>
                  </select>
                </div>
              </div>

              {/* Target Assignment Selection (only during creation, not edit) */}
              {!editingHw && (
                <div className="space-y-3 p-4 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 font-outfit tracking-wide">Assign To</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                        <input 
                          type="radio" 
                          name="assignTarget" 
                          value="all" 
                          checked={assignTarget === 'all'} 
                          onChange={() => setAssignTarget('all')} 
                          className="text-primary-600 focus:ring-primary-500" 
                        />
                        All Students
                      </label>
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                        <input 
                          type="radio" 
                          name="assignTarget" 
                          value="class" 
                          checked={assignTarget === 'class'} 
                          onChange={() => setAssignTarget('class')} 
                          className="text-primary-600 focus:ring-primary-500" 
                        />
                        By Standard/Class
                      </label>
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                        <input 
                          type="radio" 
                          name="assignTarget" 
                          value="students" 
                          checked={assignTarget === 'students'} 
                          onChange={() => setAssignTarget('students')} 
                          className="text-primary-600 focus:ring-primary-500" 
                        />
                        Specific Students
                      </label>
                    </div>
                  </div>

                  {/* By Standard/Class Checkboxes */}
                  {assignTarget === 'class' && (
                    <div className="space-y-2 pt-2 border-t border-slate-200/50 dark:border-slate-700/50 animate-fadeIn">
                      <label className="block text-xs font-bold text-slate-400 uppercase font-outfit tracking-wide">Select Classes/Standards</label>
                      {uniqueClasses.length > 0 ? (
                        <div className="flex flex-wrap gap-2 mt-1.5">
                          {uniqueClasses.map(cls => (
                            <label key={cls} className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg hover:border-primary-500 transition-colors">
                              <input 
                                type="checkbox" 
                                checked={selectedClasses.includes(cls)} 
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedClasses([...selectedClasses, cls]);
                                  } else {
                                    setSelectedClasses(selectedClasses.filter(c => c !== cls));
                                  }
                                }} 
                                className="rounded text-primary-600 focus:ring-primary-500" 
                              />
                              {cls}
                            </label>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 font-medium">No assigned students have configured classes.</p>
                      )}
                    </div>
                  )}

                  {/* Specific Students Checkboxes */}
                  {assignTarget === 'students' && (
                    <div className="space-y-2 pt-2 border-t border-slate-200/50 dark:border-slate-700/50 animate-fadeIn">
                      <label className="block text-xs font-bold text-slate-400 uppercase font-outfit tracking-wide">Select Students</label>
                      {myStudents.length > 0 ? (
                        <div className="grid grid-cols-2 gap-2 mt-1.5">
                          {myStudents.map(student => (
                            <label key={student.id} className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg hover:border-primary-500 transition-colors">
                              <input 
                                type="checkbox" 
                                checked={selectedStudentIds.includes(student.id)} 
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedStudentIds([...selectedStudentIds, student.id]);
                                  } else {
                                    setSelectedStudentIds(selectedStudentIds.filter(id => id !== student.id));
                                  }
                                }} 
                                className="rounded text-primary-600 focus:ring-primary-500" 
                              />
                              <div className="flex flex-col">
                                <span className="font-extrabold text-[11px] uppercase tracking-wide">{student.name}</span>
                                {student.className && <span className="text-[10px] text-slate-400 font-medium">{student.className}</span>}
                              </div>
                            </label>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 font-medium">No students assigned to you.</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Subjects & Descriptions</label>
                
                {formData.homeworkType === 'School Homework' ? (
                  <div className="space-y-2">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800 text-slate-400 text-[10px] uppercase font-bold">
                          <th className="px-3 py-2 rounded-tl-lg w-1/3">Subject</th>
                          <th className="px-3 py-2">Description</th>
                          <th className="px-3 py-2 rounded-tr-lg w-10"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {homeworkItems.map((item, index) => (
                          <tr key={item.id} className="border-b border-slate-100 dark:border-slate-800 align-top">
                            <td className="p-2">
                              <input 
                                type="text"
                                placeholder="Subject"
                                value={item.subject}
                                onChange={(e) => setHomeworkItems(prev => prev.map((it, i) => i === index ? { ...it, subject: e.target.value } : it))}
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg text-xs text-slate-800 dark:text-white focus:outline-none focus:border-primary-500"
                                required
                              />
                            </td>
                            <td className="p-2">
                              <textarea 
                                placeholder="Description"
                                value={item.description}
                                onChange={(e) => setHomeworkItems(prev => prev.map((it, i) => i === index ? { ...it, description: e.target.value } : it))}
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg text-xs text-slate-800 dark:text-white focus:outline-none focus:border-primary-500 h-16"
                                required
                              />
                            </td>
                            <td className="p-2 text-center pt-4">
                              {homeworkItems.length > 1 && !editingHw && (
                                <button type="button" onClick={() => setHomeworkItems(prev => prev.filter((_, i) => i !== index))} className="text-danger-500 hover:text-danger-600">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {!editingHw && (
                      <button 
                        type="button" 
                        onClick={() => setHomeworkItems(prev => [...prev, { id: Date.now(), subject: '', description: '' }])}
                        className="text-primary-500 text-xs font-bold flex items-center hover:text-primary-600 mt-2"
                      >
                        <Plus className="w-3 h-3 mr-1" /> Add Subject
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4 bg-slate-50/50 dark:bg-slate-800/30 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Extra Practice Subject</label>
                      <input 
                        type="text"
                        value={homeworkItems[0].subject}
                        onChange={(e) => setHomeworkItems(prev => prev.map((it, i) => i === 0 ? { ...it, subject: e.target.value } : it))}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg text-sm text-slate-800 dark:text-white focus:outline-none focus:border-primary-500"
                        placeholder="e.g. Mathematics"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Description</label>
                      <textarea 
                        value={homeworkItems[0].description}
                        onChange={(e) => setHomeworkItems(prev => prev.map((it, i) => i === 0 ? { ...it, description: e.target.value } : it))}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg text-sm text-slate-800 dark:text-white focus:outline-none focus:border-primary-500 h-20"
                        placeholder="Explain instructions and questions clearly..."
                        required
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Priority Level</label>
                <select 
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as Homework['priority'] })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg text-sm text-slate-750 dark:text-slate-300 focus:outline-none focus:border-primary-500"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Attachment (optional)</label>
                <input 
                  type="file"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg text-sm text-slate-800 dark:text-white focus:outline-none file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                />
              </div>

              {editingHw && (
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Teacher Evaluation / Feedback Remarks</label>
                  <textarea 
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg text-sm text-slate-800 dark:text-white focus:outline-none focus:border-primary-500 h-16"
                    placeholder="Provide grading feedback or comments for the student..."
                  />
                </div>
              )}

            </form>
            
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end space-x-2 shrink-0 bg-slate-50 dark:bg-slate-800/50">
              <button 
                type="button"
                onClick={() => {
                  setEditingHw(null);
                  setShowCreateModal(false);
                }}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-xl text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors focus:outline-none"
              >
                Cancel
              </button>
              <button 
                onClick={handleSubmit}
                className={`px-4 py-2 text-xs font-bold rounded-xl text-white transition-colors focus:outline-none ${isUploading ? 'bg-primary-400 cursor-not-allowed' : 'bg-primary-600 hover:bg-primary-700'}`} disabled={isUploading}
              >
                {isUploading ? 'Uploading...' : editingHw ? 'Save Changes' : 'Assign'}
              </button>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
};
