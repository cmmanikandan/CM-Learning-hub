import re

def fix_quiz_manager():
    with open('frontend/src/pages/QuizManager.tsx', 'r', encoding='utf-8') as f:
        code = f.read()

    old_modal = """      {/* ---------------- CREATOR MODAL PANEL (TEACHER) ---------------- */}
      {showCreateModal && role === 'mentor' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-800 flex flex-col justify-between max-h-[85vh] animate-scaleIn">
            <div className="px-6 py-4.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-800 dark:text-white font-outfit">Create Practice Quiz</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-500">✕</button>
            </div>

            <form onSubmit={saveCreatedQuiz} className="p-6 overflow-y-auto space-y-4 flex-1">"""

    new_modal = """      {/* ---------------- CREATOR MODAL PANEL (TEACHER) ---------------- */}
      {showCreateModal && role === 'mentor' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 flex flex-col max-h-[90vh] animate-scaleIn relative">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
                <h3 className="font-bold text-base text-slate-800 dark:text-white font-outfit">Create Practice Quiz</h3>
                <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-500 focus:outline-none">✕</button>
              </div>

              <form onSubmit={saveCreatedQuiz} className="p-6 overflow-y-auto space-y-4 grow">"""
              
    code = code.replace(old_modal, new_modal)

    old_buttons = """              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end space-x-2">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-xl text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 hover:bg-slate-50 focus:outline-none">Cancel</button>
                <button type="submit" className="px-4 py-2 text-xs font-bold rounded-xl text-white bg-primary-600 hover:bg-primary-700 focus:outline-none">Save Quiz</button>
              </div>
            </form>
          </div>
        </div>
      )}"""

    new_buttons = """              </form>
              
              <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end space-x-2 shrink-0 bg-slate-50 dark:bg-slate-800/50">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-xl text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 hover:bg-slate-50 focus:outline-none">Cancel</button>
                <button onClick={saveCreatedQuiz} className="px-4 py-2 text-xs font-bold rounded-xl text-white bg-primary-600 hover:bg-primary-700 focus:outline-none">Save Quiz</button>
              </div>
            </div>
          </div>
        </div>
      )}"""
      
    code = code.replace(old_buttons, new_buttons)

    with open('frontend/src/pages/QuizManager.tsx', 'w', encoding='utf-8') as f:
        f.write(code)

def fix_homework_manager():
    with open('frontend/src/pages/HomeworkManager.tsx', 'r', encoding='utf-8') as f:
        code = f.read()

    old_modal = """      {/* ---------------- FORM MODAL (ASSIGN HOMEWORK) ---------------- */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 animate-scaleIn my-8 flex flex-col max-h-[90vh]">
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

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto grow">"""

    new_modal = """      {/* ---------------- FORM MODAL (ASSIGN HOMEWORK) ---------------- */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 flex flex-col max-h-[90vh] animate-scaleIn relative">
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

              <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto grow">"""
              
    code = code.replace(old_modal, new_modal)

    old_buttons = """            </form>
            
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
                className="px-4 py-2 text-xs font-bold rounded-xl text-white bg-primary-600 hover:bg-primary-700 transition-colors focus:outline-none"
              >
                {editingHw ? 'Save Changes' : 'Assign'}
              </button>
            </div>
          </div>
        </div>
      )}"""

    new_buttons = """            </form>
            
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
                className="px-4 py-2 text-xs font-bold rounded-xl text-white bg-primary-600 hover:bg-primary-700 transition-colors focus:outline-none"
              >
                {editingHw ? 'Save Changes' : 'Assign'}
              </button>
            </div>
          </div>
        </div>
        </div>
      )}"""
      
    code = code.replace(old_buttons, new_buttons)

    with open('frontend/src/pages/HomeworkManager.tsx', 'w', encoding='utf-8') as f:
        f.write(code)

fix_quiz_manager()
fix_homework_manager()
print("Popups fixed")
