import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, CheckCircle, XCircle, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

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
    fetch(`http://127.0.0.1:5000/api/attendance?date=${date}`, {
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
    if (token) {
      fetchAttendance(selectedDate);
    }
  }, [token, selectedDate]);

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

    fetch('http://127.0.0.1:5000/api/attendance', {
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

  return (
    <div className="space-y-6">
      {/* Date Navigation & Selector */}
      <div className="glass-panel p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm border border-slate-200/50 dark:border-slate-800/50">
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => adjustDate(-1)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
            title="Previous Day"
          >
            <ChevronLeft className="w-5 h-5 text-slate-650 dark:text-slate-300" />
          </button>
          
          <div className="flex items-center space-x-2.5">
            <Calendar className="w-4.5 h-4.5 text-slate-400" />
            <input 
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-slate-55 dark:bg-slate-805 border border-slate-250 dark:border-slate-700 px-3.5 py-1.5 rounded-xl text-sm font-bold text-slate-750 dark:text-slate-200 focus:outline-none focus:border-primary-500"
            />
          </div>

          <button 
            onClick={() => adjustDate(1)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
            title="Next Day"
          >
            <ChevronRight className="w-5 h-5 text-slate-650 dark:text-slate-300" />
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setSelectedDate(todayStr)}
            className="px-4 py-1.5 border border-slate-250 dark:border-slate-700 text-xs font-bold rounded-xl text-slate-650 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 transition-all shadow-sm active:scale-95"
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
      <div className="glass-panel p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800/50">
        <h2 className="text-xl font-bold text-slate-850 dark:text-white font-outfit border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
          Assigned Students Attendance
        </h2>

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
                  <tr key={student.student_id} className="hover:bg-slate-55/30 dark:hover:bg-slate-850/20 transition-colors">
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
                      <span className="text-xs font-bold font-mono bg-slate-100 dark:bg-slate-800/80 px-2 py-1 rounded-md text-slate-600 dark:text-slate-300 border border-slate-200/20">
                        {student.sid || 'N/A'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-sm font-semibold text-slate-600 dark:text-slate-350">
                      {student.class_name || 'N/A'} {student.section ? `(${student.section})` : ''}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex justify-center animate-fadeIn">
                        <button
                          disabled={!canEdit}
                          onClick={() => canEdit && toggleAttendance(student.student_id, student.status)}
                          className={`flex items-center px-4 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm border ${
                            !canEdit
                              ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed dark:bg-slate-900 dark:text-slate-650 dark:border-slate-800'
                              : student.status === 'Present' 
                              ? 'bg-success-50 text-success-600 border-success-200 hover:bg-success-100 dark:bg-success-950/20 dark:text-success-400 dark:border-success-900/30'
                              : student.status === 'Absent'
                              ? 'bg-danger-50 text-danger-600 border-danger-200 hover:bg-danger-100 dark:bg-danger-950/20 dark:text-danger-400 dark:border-danger-900/30'
                              : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-500 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700 dark:text-slate-300'
                          }`}
                          title={!canEdit ? "Attendance cannot be marked for future dates" : undefined}
                        >
                          {student.status === 'Present' ? (
                            <><CheckCircle className="w-4 h-4 mr-1.5 text-success-500 animate-scaleIn" /> Present</>
                          ) : student.status === 'Absent' ? (
                            <><XCircle className="w-4 h-4 mr-1.5 text-danger-500 animate-scaleIn" /> Absent</>
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
    </div>
  );
};
