import re

with open('frontend/src/pages/HomeworkManager.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Replace the modal layout up to the priority
old_jsx_start = """      {/* ---------------- FORM MODAL (ASSIGN HOMEWORK) ---------------- */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-800 animate-scaleIn">
            <div className="px-6 py-4.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
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

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">"""

new_jsx_start = """      {/* ---------------- FORM MODAL (ASSIGN HOMEWORK) ---------------- */}
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

code = code.replace(old_jsx_start, new_jsx_start)

# Replace the Date and Subject fields with the new ones
old_fields = """              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Date Assigned</label>
                  <input 
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg text-sm text-slate-800 dark:text-white focus:outline-none focus:border-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Due Date</label>
                  <input 
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg text-sm text-slate-800 dark:text-white focus:outline-none focus:border-primary-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Subject</label>
                  <input 
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg text-sm text-slate-800 dark:text-white focus:outline-none focus:border-primary-500"
                    placeholder="e.g. Mathematics"
                    required
                  />
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

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Homework Title</label>
                <input 
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg text-sm text-slate-800 dark:text-white focus:outline-none focus:border-primary-500"
                  placeholder="e.g. Chapter 4 Practice Sheet"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Description</label>
                <textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg text-sm text-slate-800 dark:text-white focus:outline-none focus:border-primary-500 h-20"
                  placeholder="Explain instructions and questions clearly..."
                />
              </div>"""

new_fields = """              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Date</label>
                  <input 
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg text-sm text-slate-800 dark:text-white focus:outline-none focus:border-primary-500"
                    required
                  />
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
              </div>"""

code = code.replace(old_fields, new_fields)

# Replace the buttons part to move them to a separate sticky div inside the modal, replacing the previous simple border-t layout
old_buttons = """              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end space-x-2">
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
                  type="submit"
                  className="px-4 py-2 text-xs font-bold rounded-xl text-white bg-primary-600 hover:bg-primary-700 transition-colors focus:outline-none"
                >
                  {editingHw ? 'Save Changes' : 'Assign'}
                </button>
              </div>
            </form>
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
      )}"""

code = code.replace(old_buttons, new_buttons)

with open('frontend/src/pages/HomeworkManager.tsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Phase 2 Script finished")
