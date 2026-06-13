import re

# Fix CSS transforms in index.css
with open('frontend/src/index.css', 'r', encoding='utf-8') as f:
    css_code = f.read()

css_code = css_code.replace('transform: translateY(0);', 'transform: none;')
css_code = css_code.replace('transform: scale(1);', 'transform: none;')
css_code = css_code.replace('transform: translateX(0);', 'transform: none;')

with open('frontend/src/index.css', 'w', encoding='utf-8') as f:
    f.write(css_code)


# Fix LibraryManager.tsx
with open('frontend/src/pages/LibraryManager.tsx', 'r', encoding='utf-8') as f:
    lib_code = f.read()

old_lib_input = """                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">File Name</label>
                  <input 
                    type="text" 
                    value={formData.fileName}
                    onChange={(e) => setFormData({ ...formData, fileName: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg text-sm text-slate-800 dark:text-white focus:outline-none"
                    placeholder="bonding_notes.pdf"
                    required
                  />
                </div>"""

new_lib_input = """                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Upload File</label>
                  <input 
                    type="file" 
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setFormData({ ...formData, fileName: e.target.files[0].name });
                      }
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg text-sm text-slate-800 dark:text-white focus:outline-none file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                    required
                  />
                </div>"""

lib_code = lib_code.replace(old_lib_input, new_lib_input)

with open('frontend/src/pages/LibraryManager.tsx', 'w', encoding='utf-8') as f:
    f.write(lib_code)


# Fix HomeworkManager.tsx
with open('frontend/src/pages/HomeworkManager.tsx', 'r', encoding='utf-8') as f:
    hw_code = f.read()

old_hw_input = """              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Mock Attachment Name (optional)</label>
                <input 
                  type="text"
                  value={formData.attachmentName}
                  onChange={(e) => setFormData({ ...formData, attachmentName: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg text-sm text-slate-800 dark:text-white focus:outline-none focus:border-primary-500"
                  placeholder="e.g. assignment_optics.pdf"
                />
              </div>"""

new_hw_input = """              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Attachment (optional)</label>
                <input 
                  type="file"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setFormData({ ...formData, attachmentName: e.target.files[0].name });
                    }
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg text-sm text-slate-800 dark:text-white focus:outline-none file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                />
              </div>"""

hw_code = hw_code.replace(old_hw_input, new_hw_input)

with open('frontend/src/pages/HomeworkManager.tsx', 'w', encoding='utf-8') as f:
    f.write(hw_code)

print("Updates successful")
