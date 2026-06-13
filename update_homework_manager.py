import re

def update_homework_manager():
    with open('frontend/src/pages/HomeworkManager.tsx', 'r', encoding='utf-8') as f:
        code = f.read()

    # 1. Import useEffect
    code = code.replace("import React, { useState } from 'react';", "import React, { useState, useEffect } from 'react';")

    # 2. Add the auto-carry forward logic inside the component, right after `studentActiveDate` state
    carry_forward_logic = """
  // Auto-carry forward logic
  useEffect(() => {
    if (role !== 'student' || homeworkList.length === 0) return;
    
    const today = new Date().toISOString().split('T')[0];
    const pastPending = homeworkList.filter(hw => 
      hw.status === 'Pending' && hw.dueDate < today
    );
    
    // Auto-update past incomplete homework to today
    if (pastPending.length > 0) {
      pastPending.forEach(hw => {
        updateHomework(hw.id, { date: today, dueDate: today });
      });
    }
  }, [role, homeworkList]);
"""
    code = code.replace("""  const [studentActiveDate, setStudentActiveDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });""", """  const [studentActiveDate, setStudentActiveDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
""" + carry_forward_logic)

    # 3. Update the student calculation
    old_calc = """  // Student calculations for active day
  const studentDayHw = homeworkList.filter(hw => hw.dueDate === studentActiveDate);
  const studentDayTotal = studentDayHw.length;
  const studentDayCompleted = studentDayHw.filter(hw => hw.status === 'Completed').length;
  const studentDayPercent = studentDayTotal > 0 ? Math.round((studentDayCompleted / studentDayTotal) * 100) : 0;
  const studentDayAllCompleted = studentDayTotal > 0 && studentDayCompleted === studentDayTotal;"""

    new_calc = """  // Student calculations for active day
  const studentDayHw = homeworkList.filter(hw => hw.dueDate === studentActiveDate);
  const studentDayTotal = studentDayHw.length;
  const studentDayCompleted = studentDayHw.filter(hw => hw.status === 'Completed').length;
  const studentDayPercent = studentDayTotal > 0 ? Math.round((studentDayCompleted / studentDayTotal) * 100) : 0;
  const studentDayAllCompleted = studentDayTotal > 0 && studentDayCompleted === studentDayTotal;
  
  const schoolHomework = studentDayHw.filter(hw => hw.homeworkType === 'School Homework');
  const extraPractice = studentDayHw.filter(hw => hw.homeworkType === 'Extra Practice Homework');"""
    code = code.replace(old_calc, new_calc)

    # 4. Replace the Student Homework Cards section
    old_cards = """          {/* Student Homework Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {studentDayHw.length > 0 ? (
              studentDayHw.map((hw) => {
                const isComplete = hw.status === 'Completed';
                return (
                  <div 
                    key={hw.id}
                    className={`glass-panel p-5 rounded-2xl flex flex-col justify-between transition-all border ${
                      isComplete 
                        ? 'border-success-200/50 bg-success-50/5 dark:bg-success-950/5' 
                        : 'border-slate-200/50 dark:border-slate-800/50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[10px] font-bold bg-primary-50 text-primary-600 dark:bg-primary-950/20 dark:text-primary-400 px-2 py-0.5 rounded-md">
                          {hw.subject}
                        </span>
                        
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          hw.priority === 'High' ? 'bg-danger-50 text-danger-600 dark:bg-danger-950/20 dark:text-danger-400' :
                          hw.priority === 'Medium' ? 'bg-warning-50 text-warning-600 dark:bg-warning-950/20 dark:text-warning-400' :
                          'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                          {hw.priority} Priority
                        </span>
                      </div>

                      <h4 className="text-base font-bold text-slate-800 dark:text-white mt-3 font-outfit">
                        {hw.title}
                      </h4>
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
                          <span className="text-[10px] font-semibold text-primary-500 hover:underline cursor-pointer">Download</span>
                        </div>
                      )}

                      {hw.remarks && (
                        <div className="mt-3.5 p-2.5 bg-yellow-50/50 dark:bg-yellow-950/10 border border-yellow-100/30 rounded-xl text-xs text-slate-600 dark:text-slate-300">
                          <strong className="text-yellow-700 dark:text-yellow-500 font-bold block mb-0.5">Teacher remarks:</strong>
                          {hw.remarks}
                        </div>
                      )}
                    </div>

                    <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/50 flex items-center justify-between">
                      <div className="flex items-center space-x-1 text-xs text-slate-400 font-semibold">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Est: {hw.estimatedTime} mins</span>
                      </div>

                      <button
                        onClick={() => updateHomework(hw.id, { status: isComplete ? 'Pending' : 'Completed' })}
                        className={`flex items-center space-x-1.5 px-4 py-2 text-xs font-bold rounded-xl shadow-sm transition-all active:scale-95 ${
                          isComplete 
                            ? 'bg-success-600 hover:bg-success-700 text-white' 
                            : 'bg-primary-600 hover:bg-primary-700 text-white'
                        }`}
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>{isComplete ? 'Completed' : 'Mark Complete'}</span>
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full text-center py-12 glass-panel rounded-2xl text-slate-400 font-medium">
                No homework due on this date. Enjoy! 🎈
              </div>
            )}
          </div>"""

    new_cards = """          {/* Student Homework Cards Split by Type */}
          
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
          )}"""
    
    code = code.replace(old_cards, new_cards)

    # 5. Define renderHomeworkCard
    render_func = """  // Subjects for filters
  const subjects = Array.from(new Set(homeworkList.map(hw => hw.subject)));

  const renderHomeworkCard = (hw: Homework) => {
    const isComplete = hw.status === 'Completed';
    return (
      <div 
        key={hw.id}
        className={`glass-panel p-5 rounded-2xl flex flex-col justify-between transition-all border ${
          isComplete 
            ? 'border-success-200/50 bg-success-50/5 dark:bg-success-950/5' 
            : 'border-slate-200/50 dark:border-slate-800/50'
        }`}
      >
        <div>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center space-x-3">
              {/* Checkbox */}
              <button
                onClick={() => updateHomework(hw.id, { status: isComplete ? 'Pending' : 'Completed' })}
                className={`w-6 h-6 shrink-0 rounded-full border-2 flex items-center justify-center transition-all ${
                  isComplete 
                    ? 'bg-success-500 border-success-500 text-white' 
                    : 'border-slate-300 dark:border-slate-600 hover:border-primary-500'
                }`}
              >
                {isComplete && <CheckCircle className="w-4 h-4" />}
              </button>
              
              <div>
                <span className="text-[10px] font-bold bg-primary-50 text-primary-600 dark:bg-primary-950/20 dark:text-primary-400 px-2 py-0.5 rounded-md">
                  {hw.subject}
                </span>
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
                <span className="text-[10px] font-semibold text-primary-500 hover:underline cursor-pointer">Download</span>
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

        <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/50 ml-9 flex items-center">
          <div className="flex items-center space-x-1 text-xs text-slate-400 font-semibold">
            <Clock className="w-3.5 h-3.5" />
            <span>Est: {hw.estimatedTime} mins</span>
          </div>
        </div>
      </div>
    );
  };
"""
    code = code.replace("""  // Subjects for filters
  const subjects = Array.from(new Set(homeworkList.map(hw => hw.subject)));""", render_func)

    with open('frontend/src/pages/HomeworkManager.tsx', 'w', encoding='utf-8') as f:
        f.write(code)

    print("Success")

if __name__ == '__main__':
    update_homework_manager()
