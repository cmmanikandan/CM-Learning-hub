import React, { useState, useEffect, useRef } from 'react';
import { API_BASE } from '../config/api';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { ModalPortal } from '../components/Modal';
import { 
  User, 
  CheckCircle, 
  XCircle, 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Users, 
  Search, 
  Save, 
  Loader2,
  UserMinus
} from 'lucide-react';

interface StudentAttendance {
  student_id: number;
  student_name: string;
  student_email: string;
  sid: string;
  class_name: string;
  section: string;
  photo_url: string;
  status: 'Present' | 'Absent' | 'N/A';
}

export const StudentsManager: React.FC = () => {
  const { token } = useAuth();
  const { myStudents, updateMentorNotes, removeStudent } = useApp();
  const dateInputRef = useRef<HTMLInputElement>(null);
  
  // Tab and details states
  const [activeSubTab, setActiveSubTab] = useState<'attendance' | 'manage'>('attendance');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [studentNotes, setStudentNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  // Attendance states
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [attendanceList, setAttendanceList] = useState<StudentAttendance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const canEdit = selectedDate <= todayStr;

  const fetchAttendance = (date: string) => {
    setIsLoading(true);
    setError(null);
    fetch(`${API_BASE}/api/attendance?date=${date}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(async res => {
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || `HTTP error ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setAttendanceList(data);
        } else {
          throw new Error("Invalid response format from server");
        }
      })
      .catch(err => {
        console.error("Failed to fetch attendance:", err);
        setError(err.message || "Failed to fetch attendance list");
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    if (token && activeSubTab === 'attendance') {
      fetchAttendance(selectedDate);
    }
  }, [token, selectedDate, activeSubTab]);

  const toggleAttendance = (studentId: number, currentStatus: 'Present' | 'Absent' | 'N/A') => {
    if (!canEdit) return; // Prevent marking attendance for future dates
    const newStatus = currentStatus === 'Present' ? 'Absent' : 'Present';
    
    // Optimistic UI update
    setAttendanceList(prev => prev.map(item => {
      if (item.student_id === studentId) {
        return { ...item, status: newStatus };
      }
      return item;
    }));

    fetch(`${API_BASE}/api/attendance`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        date: selectedDate,
        student_id: studentId,
        status: newStatus
      })
    }).then(res => {
      if (!res.ok) {
        // Rollback
        fetchAttendance(selectedDate);
      }
    }).catch(err => {
      console.error("Failed to save attendance:", err);
      // Rollback
      fetchAttendance(selectedDate);
    });
  };

  const adjustDate = (days: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + days);
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  // Filter students based on search query
  const filteredStudents = (myStudents || []).filter(student => 
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (student.sid && student.sid.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Tab Navigation header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-outfit text-slate-850 dark:text-white">
            Students Center
          </h2>
          <p className="text-xs text-slate-400 font-medium mt-0.5">Manage your assigned students profiles and mark daily attendance</p>
        </div>
        
        {/* Toggle Buttons */}
        <div className="flex flex-wrap gap-2.5">
          <button 
            onClick={() => setActiveSubTab('attendance')}
            className={`flex items-center gap-1.5 px-5 py-2.5 text-xs font-extrabold rounded-full transition-all border shadow-sm ${
              activeSubTab === 'attendance' 
                ? 'bg-emerald-500 border-emerald-500 text-white' 
                : 'bg-blue-50/30 dark:bg-blue-950/20 border-blue-200/60 dark:border-blue-900/40 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Attendance Tracker
          </button>
          <button 
            onClick={() => setActiveSubTab('manage')}
            className={`flex items-center gap-1.5 px-5 py-2.5 text-xs font-extrabold rounded-full transition-all border shadow-sm ${
              activeSubTab === 'manage' 
                ? 'bg-emerald-500 border-emerald-500 text-white' 
                : 'bg-blue-50/30 dark:bg-blue-950/20 border-blue-200/60 dark:border-blue-900/40 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30'
            }`}
          >
            <Users className="w-4 h-4" />
            Manage Students
          </button>
        </div>
      </div>

      {activeSubTab === 'attendance' ? (
        <>
          {/* Date Navigation & Selector */}
          <div className="glass-panel p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm border border-slate-200/50 dark:border-slate-800/50 bg-white dark:bg-slate-900/60">
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => adjustDate(-1)}
                className="p-2 hover:bg-slate-105 dark:hover:bg-slate-800 rounded-xl transition-all"
                title="Previous Day"
              >
                <ChevronLeft className="w-5 h-5 text-slate-650 dark:text-slate-300" />
              </button>
              
              <div className="flex items-center space-x-2.5">
                <Calendar 
                  className="w-4.5 h-4.5 text-slate-400 cursor-pointer hover:text-primary-500 transition-colors" 
                  onClick={() => dateInputRef.current?.showPicker()}
                />
                <input 
                  type="date"
                  ref={dateInputRef}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3.5 py-1.5 rounded-xl text-sm font-bold text-slate-750 dark:text-slate-250 focus:outline-none focus:border-primary-500"
                />
              </div>

              <button 
                onClick={() => adjustDate(1)}
                className="p-2 hover:bg-slate-105 dark:hover:bg-slate-800 rounded-xl transition-all"
                title="Next Day"
              >
                <ChevronRight className="w-5 h-5 text-slate-650 dark:text-slate-300" />
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setSelectedDate(todayStr)}
                className="px-4 py-1.5 border border-slate-200 dark:border-slate-700 text-xs font-bold rounded-xl text-slate-650 dark:text-slate-350 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 transition-all shadow-sm active:scale-95"
              >
                Today
              </button>
            </div>
          </div>

          {selectedDate > todayStr && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-600 dark:text-amber-400 text-xs font-bold flex items-center gap-2 animate-fadeIn">
              <span>⚠️</span>
              <span>Viewing future date ({selectedDate}). Marking or updating attendance is not permitted for future dates.</span>
            </div>
          )}
          {selectedDate < todayStr && (
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-blue-650 dark:text-blue-400 text-xs font-bold flex items-center gap-2 animate-fadeIn">
              <span>📅</span>
              <span>Viewing historical date ({selectedDate}). You can view and update the attendance history.</span>
            </div>
          )}

          {/* Attendance Table Panel */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 bg-white dark:bg-slate-900/60">
            <h3 className="font-extrabold text-sm text-slate-850 dark:text-white font-outfit pb-4 mb-4 border-b border-slate-100 dark:border-slate-800 uppercase tracking-wider">
              Assigned Students Attendance
            </h3>

            {isLoading ? (
              <div className="text-slate-500 dark:text-slate-400 p-8 text-center font-medium">
                <div className="animate-spin w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-2" />
                Loading attendance records...
              </div>
            ) : error ? (
              <div className="text-slate-500 dark:text-slate-400 p-8 text-center font-medium">
                <p className="text-danger-600 dark:text-danger-400 mb-4 font-bold flex items-center justify-center gap-1.5">
                  <span>⚠️</span> Failed to load attendance records: {error}
                </p>
                <button 
                  onClick={() => fetchAttendance(selectedDate)}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
                >
                  Retry Connection
                </button>
              </div>
            ) : attendanceList.length === 0 ? (
              <p className="text-slate-505 dark:text-slate-400 text-center py-8">You don't have any assigned students yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-xs text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                      <th className="py-3.5 px-4 font-semibold">Student</th>
                      <th className="py-3.5 px-4 font-semibold">SID</th>
                      <th className="py-3.5 px-4 font-semibold">Class / Section</th>
                      <th className="py-3.5 px-4 font-semibold text-center">Attendance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                    {attendanceList.map(student => (
                      <tr key={student.student_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-550 overflow-hidden shrink-0">
                              {student.photo_url ? (
                                <img src={student.photo_url} alt={student.student_name} className="w-full h-full object-cover" />
                              ) : (
                                <User className="w-5 h-5" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-805 dark:text-white leading-tight">{student.student_name}</p>
                              <p className="text-xs text-slate-450 mt-0.5">{student.student_email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-xs font-bold font-mono bg-slate-100 dark:bg-slate-800/80 px-2 py-1 rounded-md text-slate-600 dark:text-slate-350 border border-slate-200/10">
                            {student.sid || 'N/A'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-sm font-semibold text-slate-655 dark:text-slate-350">
                          {student.class_name || 'N/A'} {student.section ? `(${student.section})` : ''}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex justify-center animate-fadeIn">
                            <button
                              disabled={!canEdit}
                              onClick={() => canEdit && toggleAttendance(student.student_id, student.status)}
                              className={`flex items-center px-4 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm border ${
                                !canEdit
                                  ? 'bg-slate-105 text-slate-400 border-slate-200 cursor-not-allowed dark:bg-slate-900 dark:text-slate-650 dark:border-slate-800'
                                  : student.status === 'Present' 
                                  ? 'bg-success-50 text-success-600 border-success-200 hover:bg-success-100 dark:bg-success-950/20 dark:text-success-400 dark:border-success-900/30'
                                  : student.status === 'Absent'
                                  ? 'bg-danger-50 text-danger-600 border-danger-200 hover:bg-danger-100 dark:bg-danger-950/20 dark:text-danger-400 dark:border-danger-900/30'
                                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-500 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700 dark:text-slate-300'
                              }`}
                              title={!canEdit ? "Attendance cannot be marked for future dates" : undefined}
                            >
                              {student.status === 'Present' ? (
                                <><CheckCircle className="w-4 h-4 mr-1.5 text-success-505 animate-scaleIn" /> Present</>
                              ) : student.status === 'Absent' ? (
                                <><XCircle className="w-4 h-4 mr-1.5 text-danger-505 animate-scaleIn" /> Absent</>
                              ) : (
                                <><User className="w-4 h-4 mr-1.5 text-slate-400" /> Mark Present</>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="space-y-6">
          {/* Manage Students Directory */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 bg-white dark:bg-slate-900/60 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="font-extrabold text-sm text-slate-850 dark:text-white uppercase tracking-wider font-outfit">Assigned Students Directory</h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Filter and review details for {myStudents?.length || 0} student profiles</p>
              </div>
              
              {/* Search input */}
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input 
                  type="text"
                  placeholder="Search student or SID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-primary-500 focus:bg-white dark:focus:bg-slate-900 transition-all font-bold placeholder-slate-400"
                />
              </div>
            </div>

            {filteredStudents.length === 0 ? (
              <div className="text-center py-12 text-slate-400 font-medium">
                No students found matching "{searchQuery}"
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 pt-2">
                {filteredStudents.map(student => (
                  <div key={student.id} className="premium-outline-card p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 rounded-2xl flex flex-col justify-between hover:shadow-md transition-shadow relative">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center space-x-3.5 min-w-0">
                        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 overflow-hidden shrink-0 border border-slate-200/10">
                          {student.photoUrl ? (
                            <img src={student.photoUrl} alt={student.name} className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-6 h-6" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-extrabold text-slate-805 dark:text-white truncate font-outfit">{student.name}</h4>
                          <p className="text-[10px] text-slate-405 truncate mt-0.5">{student.email}</p>
                        </div>
                      </div>
                      <span className="flex items-center gap-1 bg-amber-50 text-amber-655 dark:bg-amber-950/20 dark:text-amber-400 text-[10px] px-2.5 py-1 rounded-lg font-bold border border-amber-200/20 shrink-0">
                        🔥 {student.streak || 0} Streak
                      </span>
                    </div>

                    <div className="mt-4 p-3 bg-slate-50/50 dark:bg-slate-850/40 rounded-xl border border-slate-150/40 dark:border-slate-800/40 text-xs space-y-2 font-semibold text-slate-600 dark:text-slate-350">
                      <p className="flex justify-between">
                        <span className="text-slate-400">SID:</span>
                        <span className="font-mono font-bold text-slate-700 dark:text-slate-200">{student.sid || 'N/A'}</span>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-slate-400">Class & Sec:</span>
                        <span>{student.className || 'N/A'} {student.section ? `(${student.section})` : ''}</span>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-slate-400">School:</span>
                        <span className="truncate max-w-[150px] font-bold">{student.school || 'N/A'}</span>
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedStudent(student);
                        setStudentNotes(student.mentor_notes || '');
                      }}
                      className="mt-4 w-full py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center justify-center gap-1"
                    >
                      View Details & Notes
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Details & Notes Modal */}
      {selectedStudent && (
        <ModalPortal onClose={() => setSelectedStudent(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-lg border border-slate-200 dark:border-slate-800 shadow-2xl relative animate-scaleIn max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setSelectedStudent(null)} 
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-bold p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all focus:outline-none"
            >
              ✕
            </button>
            
            <h3 className="font-bold text-base text-slate-850 dark:text-white mb-4 font-outfit border-b border-slate-100 dark:border-slate-800 pb-3 uppercase tracking-wide">
              Student Profile Details
            </h3>
            
            <div className="flex items-center space-x-4 mb-5">
              <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 overflow-hidden border border-slate-200/10">
                {selectedStudent.photoUrl ? (
                  <img src={selectedStudent.photoUrl} alt={selectedStudent.name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-7 h-7" />
                )}
              </div>
              <div>
                <h4 className="font-extrabold text-base text-slate-805 dark:text-white font-outfit leading-tight">{selectedStudent.name}</h4>
                <p className="text-xs text-slate-400 font-medium mt-0.5">{selectedStudent.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-600 dark:text-slate-350 bg-slate-50/50 dark:bg-slate-850/40 p-4 rounded-xl border border-slate-150/40 dark:border-slate-800/40 mb-5">
              <div>
                <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wide">Student ID (SID)</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200 block mt-0.5">{selectedStudent.sid || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wide">Class & Section</span>
                <span className="text-slate-805 dark:text-slate-100 block mt-0.5">{selectedStudent.className || 'N/A'} {selectedStudent.section ? `(${selectedStudent.section})` : ''}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wide">School Name</span>
                <span className="text-slate-805 dark:text-slate-100 block mt-0.5">{selectedStudent.school || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wide">Parent Contact</span>
                <span className="text-slate-805 dark:text-slate-100 block mt-0.5">{selectedStudent.parentContact || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wide">Current Streak</span>
                <span className="text-amber-600 dark:text-amber-400 block mt-0.5 font-bold">🔥 {selectedStudent.streak || 0} Days</span>
              </div>
            </div>

            {/* Mentor Notes Area */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">Private Mentor Notes</label>
              <textarea
                value={studentNotes}
                onChange={(e) => setStudentNotes(e.target.value)}
                placeholder="Write private feedback notes, progress records, or study plans for this student..."
                className="w-full bg-slate-50/50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-primary-500 focus:bg-white dark:focus:bg-slate-900 transition-all h-28 resize-none font-medium"
              />
            </div>

            <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={async () => {
                  if (window.confirm(`Are you sure you want to remove ${selectedStudent.name} from your assigned students?`)) {
                    setIsSavingNotes(true);
                    const success = await removeStudent(selectedStudent.id);
                    setIsSavingNotes(false);
                    if (success) {
                      setSelectedStudent(null);
                    }
                  }
                }}
                disabled={isSavingNotes}
                className="px-4 py-2 text-xs font-bold text-danger-600 hover:text-white border border-danger-200 hover:bg-danger-600 disabled:opacity-50 rounded-xl active:scale-95 transition-all flex items-center gap-1.5 focus:outline-none"
              >
                <UserMinus className="w-3.5 h-3.5" />
                Remove Student
              </button>
              
              <div className="flex space-x-2">
                <button 
                  onClick={() => setSelectedStudent(null)} 
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-xl text-slate-550 dark:text-slate-400 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 focus:outline-none"
                >
                  Close
                </button>
                <button 
                  onClick={async () => {
                    setIsSavingNotes(true);
                    const success = await updateMentorNotes(selectedStudent.id, studentNotes);
                    setIsSavingNotes(false);
                    if (success) {
                      setSelectedStudent({ ...selectedStudent, mentor_notes: studentNotes });
                      alert("Notes saved successfully!");
                    } else {
                      alert("Failed to save notes.");
                    }
                  }} 
                  disabled={isSavingNotes}
                  className="px-5 py-2 text-xs font-bold text-white bg-success-600 hover:bg-success-700 disabled:opacity-50 rounded-xl active:scale-95 shadow-md transition-all flex items-center gap-1.5"
                >
                  {isSavingNotes ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      Save Notes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

    </div>
  );
};
