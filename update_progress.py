import re

def update_homework_manager():
    with open('frontend/src/pages/HomeworkManager.tsx', 'r', encoding='utf-8') as f:
        code = f.read()

    # Add uploadProgress state
    code = code.replace("const [isUploading, setIsUploading] = useState(false);", "const [isUploading, setIsUploading] = useState(false);\n  const [uploadProgress, setUploadProgress] = useState(0);")

    # Update file upload handler
    old_handler = """  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    new_handler = """  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setUploadProgress(0);
      const url = await uploadToCloudinary(file, (progress) => {
        setUploadProgress(progress);
      });
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
    code = code.replace(old_handler, new_handler)

    # Add progress bar to UI
    old_ui = """                <input 
                  type="file" 
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg text-sm text-slate-800 dark:text-white focus:outline-none file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                />"""
    
    new_ui = """                <input 
                  type="file" 
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg text-sm text-slate-800 dark:text-white focus:outline-none file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 disabled:opacity-50"
                />
                {isUploading && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs text-primary-600 dark:text-primary-400 font-bold mb-1">
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-primary-500 h-1.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                    </div>
                  </div>
                )}"""
    code = code.replace(old_ui, new_ui)

    with open('frontend/src/pages/HomeworkManager.tsx', 'w', encoding='utf-8') as f:
        f.write(code)

def update_library_manager():
    with open('frontend/src/pages/LibraryManager.tsx', 'r', encoding='utf-8') as f:
        code = f.read()

    # Add uploadProgress state
    code = code.replace("const [isUploading, setIsUploading] = useState(false);", "const [isUploading, setIsUploading] = useState(false);\n  const [uploadProgress, setUploadProgress] = useState(0);")

    # Update file upload handler
    old_handler = """  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    new_handler = """  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setUploadProgress(0);
      const url = await uploadToCloudinary(file, (progress) => {
        setUploadProgress(progress);
      });
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
    code = code.replace(old_handler, new_handler)

    # Add progress bar to UI
    old_ui = """                  <input 
                    type="file" 
                    onChange={handleFileUpload}
                    disabled={isUploading}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg text-sm text-slate-800 dark:text-white focus:outline-none file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                    required
                  />"""
    
    new_ui = """                  <input 
                    type="file" 
                    onChange={handleFileUpload}
                    disabled={isUploading}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg text-sm text-slate-800 dark:text-white focus:outline-none file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 disabled:opacity-50"
                    required
                  />
                  {isUploading && (
                    <div className="mt-2 absolute left-6 right-6 bottom-[88px]">
                      <div className="flex items-center justify-between text-xs text-primary-600 dark:text-primary-400 font-bold mb-1">
                        <span>Uploading...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-primary-500 h-1.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                      </div>
                    </div>
                  )}"""
                  
    # The absolute positioning above is to stick it right above the buttons in LibraryManager. Wait, LibraryManager form has a simpler flow. 
    # Let's put it inline under the file input instead of absolute positioning.
    new_ui_inline = """                  <input 
                    type="file" 
                    onChange={handleFileUpload}
                    disabled={isUploading}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg text-sm text-slate-800 dark:text-white focus:outline-none file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 disabled:opacity-50"
                    required
                  />
                  {isUploading && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-[10px] text-primary-600 dark:text-primary-400 font-bold mb-1">
                        <span>Uploading...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-primary-500 h-1.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                      </div>
                    </div>
                  )}"""

    code = code.replace(old_ui, new_ui_inline)

    with open('frontend/src/pages/LibraryManager.tsx', 'w', encoding='utf-8') as f:
        f.write(code)

if __name__ == '__main__':
    update_homework_manager()
    update_library_manager()
    print("Added progress bars")
