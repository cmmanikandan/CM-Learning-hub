import re

def update_homework_manager():
    with open('frontend/src/pages/HomeworkManager.tsx', 'r', encoding='utf-8') as f:
        code = f.read()

    # Add imports
    code = code.replace("import type { Homework } from '../context/AppContext';", "import type { Homework } from '../context/AppContext';\nimport { uploadToCloudinary } from '../utils/cloudinary';")

    # Add uploading state
    code = code.replace("const [homeworkItems, setHomeworkItems] = useState([{ id: Date.now(), subject: '', description: '' }]);", "const [homeworkItems, setHomeworkItems] = useState([{ id: Date.now(), subject: '', description: '' }]);\n  const [isUploading, setIsUploading] = useState(false);")

    # Add attachmentUrl to formData
    code = code.replace("attachmentName: ''", "attachmentName: '',\n    attachmentUrl: ''")

    # Add file upload handler
    file_upload_handler = """  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const url = await uploadToCloudinary(file);
      setFormData(prev => ({ 
        ...prev, 
        attachmentName: file.name,
        attachmentUrl: url
      }));
    } catch (error) {
      console.error('Upload failed', error);
      alert('Failed to upload file. Please check Cloudinary configuration.');
    } finally {
      setIsUploading(false);
    }
  };"""

    code = code.replace("  // Handle template selection", file_upload_handler + "\n\n  // Handle template selection")

    # Replace file input onChange
    old_input = """onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setFormData({ ...formData, attachmentName: e.target.files[0].name });
                    }
                  }}"""
    new_input = """onChange={handleFileUpload}
                  disabled={isUploading}"""
    code = code.replace(old_input, new_input)
    
    # Update button text to show uploading state
    code = code.replace("{editingHw ? 'Save Changes' : 'Assign'}", "{isUploading ? 'Uploading...' : editingHw ? 'Save Changes' : 'Assign'}")
    code = code.replace("className=\"px-4 py-2 text-xs font-bold rounded-xl text-white bg-primary-600 hover:bg-primary-700 transition-colors focus:outline-none\"", "className={`px-4 py-2 text-xs font-bold rounded-xl text-white transition-colors focus:outline-none ${isUploading ? 'bg-primary-400 cursor-not-allowed' : 'bg-primary-600 hover:bg-primary-700'}`} disabled={isUploading}")

    # Update payload when submitting
    code = code.replace("attachmentName: formData.attachmentName,", "attachmentName: formData.attachmentName,\n        attachmentUrl: formData.attachmentUrl,")

    # Edit mode startEdit
    code = code.replace("attachmentName: hw.attachmentName || ''", "attachmentName: hw.attachmentName || '',\n      attachmentUrl: hw.attachmentUrl || ''")

    # Student attachment download link
    old_student_link = """<span className="text-[10px] font-semibold text-primary-500 hover:underline cursor-pointer">Download</span>"""
    new_student_link = """{hw.attachmentUrl ? (
                <a href={hw.attachmentUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] font-semibold text-primary-500 hover:underline cursor-pointer">View / Download</a>
              ) : (
                <span className="text-[10px] font-semibold text-primary-500 hover:underline cursor-pointer">Download</span>
              )}"""
    code = code.replace(old_student_link, new_student_link)

    with open('frontend/src/pages/HomeworkManager.tsx', 'w', encoding='utf-8') as f:
        f.write(code)


def update_library_manager():
    with open('frontend/src/pages/LibraryManager.tsx', 'r', encoding='utf-8') as f:
        code = f.read()

    # Add imports
    code = code.replace("import type { LibraryMaterial } from '../context/AppContext';", "import type { LibraryMaterial } from '../context/AppContext';\nimport { uploadToCloudinary } from '../utils/cloudinary';")

    # Add uploading state
    code = code.replace("const [downloadSuccess, setDownloadSuccess] = useState(false);", "const [downloadSuccess, setDownloadSuccess] = useState(false);\n  const [isUploading, setIsUploading] = useState(false);")

    # Add fileUrl to formData
    code = code.replace("fileName: '',", "fileName: '',\n    fileUrl: '',")

    # Add file upload handler
    file_upload_handler = """  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const url = await uploadToCloudinary(file);
      setFormData(prev => ({ 
        ...prev, 
        fileName: file.name,
        fileUrl: url
      }));
    } catch (error) {
      console.error('Upload failed', error);
      alert('Failed to upload file. Please check Cloudinary configuration.');
    } finally {
      setIsUploading(false);
    }
  };"""
    code = code.replace("  // Handle upload submit", file_upload_handler + "\n\n  // Handle upload submit")

    # Replace file input onChange
    old_input = """onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setFormData({ ...formData, fileName: e.target.files[0].name });
                      }
                    }}"""
    new_input = """onChange={handleFileUpload}\n                    disabled={isUploading}"""
    code = code.replace(old_input, new_input)
    
    # Update submit handler to use formData.fileUrl
    code = code.replace("fileUrl: 'data:application/octet-stream;base64,mockContent...',", "fileUrl: formData.fileUrl || '',")

    # Reset form
    code = code.replace("fileName: '',\n      visibility: 'Public'", "fileName: '',\n      fileUrl: '',\n      visibility: 'Public'")

    # Update button text to show uploading state
    code = code.replace(">\\n                  Upload\\n                </button>", " disabled={isUploading}>\\n                  {isUploading ? 'Uploading...' : 'Upload'}\\n                </button>")
    code = code.replace("className=\"px-4 py-2 text-xs font-bold rounded-xl text-white bg-primary-600 hover:bg-primary-700 transition-colors focus:outline-none\"", "className={`px-4 py-2 text-xs font-bold rounded-xl text-white transition-colors focus:outline-none ${isUploading ? 'bg-primary-400 cursor-not-allowed' : 'bg-primary-600 hover:bg-primary-700'}`}")


    # Replace the preview logic
    old_download_btn = """<button
                  onClick={() => simulateDownload(previewingMaterial.fileName)}
                  className="flex items-center px-3 py-1.5 text-xs font-bold rounded-xl text-white bg-primary-600 hover:bg-primary-700 shadow-sm active:scale-95"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Download
                </button>"""
    new_download_btn = """<a
                  href={previewingMaterial.fileUrl || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="flex items-center px-3 py-1.5 text-xs font-bold rounded-xl text-white bg-primary-600 hover:bg-primary-700 shadow-sm active:scale-95"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Download
                </a>"""
    code = code.replace(old_download_btn, new_download_btn)

    old_canvas = """{/* Simulated Reading Canvas */}
            <div className="flex-1 bg-slate-100 dark:bg-slate-950/40 p-6 overflow-y-auto flex justify-center items-center">
              <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-800/80 p-8 min-h-[50vh] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <span className="text-xs text-slate-400 font-bold">Document Title: {previewingMaterial.fileName}</span>
                    <span className="text-xs text-slate-400 font-bold">Page 1 of 5</span>
                  </div>
                  
                  {/* File Mock Details */}
                  <div className="mt-6 space-y-4">
                    <h1 className="text-2xl font-extrabold font-outfit text-slate-800 dark:text-white">{previewingMaterial.title}</h1>
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">{previewingMaterial.subject} Revision Resource</p>
                    
                    <div className="border-l-4 border-primary-500 pl-4 py-1.5 my-4">
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        {previewingMaterial.description}
                      </p>
                    </div>

                    <div className="space-y-3 pt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                      <p>
                        This is a simulated preview viewport representing how files uploaded to Supabase Storage are rendered on the platform. It supports full reading and interactive zoom/rotation controls.
                      </p>
                      <p>
                        For notes and textbook categories, the student can use the search query field above to query specific paragraphs or definitions directly. Let's start the reading practice!
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 border-t border-slate-100 dark:border-slate-800/50 pt-4 text-center">
                  <span className="text-xs text-slate-400 font-semibold">End of Preview Pane • CM Learning Hub Reader</span>
                </div>
              </div>
            </div>"""

    new_canvas = """{/* Actual File Canvas */}
            <div className="flex-1 bg-slate-100 dark:bg-slate-950/40 p-4 overflow-hidden flex justify-center items-center">
              {previewingMaterial.fileUrl && previewingMaterial.fileUrl.match(/\\.(jpeg|jpg|gif|png)$/i) ? (
                <img src={previewingMaterial.fileUrl} alt={previewingMaterial.title} className="max-w-full max-h-full object-contain rounded-xl shadow-lg" />
              ) : previewingMaterial.fileUrl && previewingMaterial.fileUrl.match(/\\.(mp4|webm|ogg)$/i) ? (
                <video src={previewingMaterial.fileUrl} controls className="max-w-full max-h-full rounded-xl shadow-lg"></video>
              ) : previewingMaterial.fileUrl ? (
                <iframe src={previewingMaterial.fileUrl} className="w-full h-full rounded-xl shadow-lg border-0 bg-white" title={previewingMaterial.title}></iframe>
              ) : (
                <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-800/80 p-8 min-h-[50vh] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                      <span className="text-xs text-slate-400 font-bold">Document Title: {previewingMaterial.fileName}</span>
                    </div>
                    <div className="mt-6 space-y-4">
                      <h1 className="text-2xl font-extrabold font-outfit text-slate-800 dark:text-white">{previewingMaterial.title}</h1>
                      <div className="border-l-4 border-primary-500 pl-4 py-1.5 my-4">
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                          {previewingMaterial.description}
                        </p>
                      </div>
                      <div className="space-y-3 pt-4 text-sm leading-relaxed text-amber-600 dark:text-amber-400">
                        <p>No valid file URL found for this material. The file may not have been uploaded correctly.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>"""

    code = code.replace(old_canvas, new_canvas)

    with open('frontend/src/pages/LibraryManager.tsx', 'w', encoding='utf-8') as f:
        f.write(code)

if __name__ == '__main__':
    update_homework_manager()
    update_library_manager()
    print("Updates successful")
