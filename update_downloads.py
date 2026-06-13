import re

def update_cloudinary_ts():
    with open('frontend/src/utils/cloudinary.ts', 'r', encoding='utf-8') as f:
        code = f.read()

    new_code = code + """

export const getCloudinaryDownloadUrl = (url: string): string => {
  if (!url || !url.includes('cloudinary.com')) return url;
  
  // Insert fl_attachment right after upload/
  // Example: .../upload/v12345/... -> .../upload/fl_attachment/v12345/...
  return url.replace('/upload/', '/upload/fl_attachment/');
};
"""
    with open('frontend/src/utils/cloudinary.ts', 'w', encoding='utf-8') as f:
        f.write(new_code)

def update_library_manager():
    with open('frontend/src/pages/LibraryManager.tsx', 'r', encoding='utf-8') as f:
        code = f.read()

    # Import getCloudinaryDownloadUrl
    code = code.replace("import { uploadToCloudinary } from '../utils/cloudinary';", "import { uploadToCloudinary, getCloudinaryDownloadUrl } from '../utils/cloudinary';")

    # Change download button
    old_download = """<a 
                      href={previewingMaterial.fileUrl} 
                      download={previewingMaterial.fileName}
                      className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center transition-colors"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </a>"""
    new_download = """<a 
                      href={getCloudinaryDownloadUrl(previewingMaterial.fileUrl)} 
                      download={previewingMaterial.fileName}
                      className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center transition-colors"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </a>
                    <a 
                      href={previewingMaterial.fileUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-xl text-sm font-bold flex items-center transition-colors border border-slate-200 dark:border-slate-700"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open in New Tab
                    </a>"""
    
    # Needs to import ExternalLink
    code = code.replace("import { Search, Filter, BookOpen, Clock, Upload, X, Check, FileText, Bookmark, PlayCircle, MoreVertical, Download } from 'lucide-react';", "import { Search, Filter, BookOpen, Clock, Upload, X, Check, FileText, Bookmark, PlayCircle, MoreVertical, Download, ExternalLink } from 'lucide-react';")

    code = code.replace(old_download, new_download)
    with open('frontend/src/pages/LibraryManager.tsx', 'w', encoding='utf-8') as f:
        f.write(code)

def update_homework_manager():
    with open('frontend/src/pages/HomeworkManager.tsx', 'r', encoding='utf-8') as f:
        code = f.read()

    # Import getCloudinaryDownloadUrl
    code = code.replace("import { uploadToCloudinary } from '../utils/cloudinary';", "import { uploadToCloudinary, getCloudinaryDownloadUrl } from '../utils/cloudinary';")
    code = code.replace("import { BookOpen, Calendar, Clock, Plus, Target, CheckCircle2, Circle, Flag, Search, Filter, PlayCircle, AlertCircle, Trash2, Edit2, Copy, Eye, MoreVertical, Paperclip } from 'lucide-react';", "import { BookOpen, Calendar, Clock, Plus, Target, CheckCircle2, Circle, Flag, Search, Filter, PlayCircle, AlertCircle, Trash2, Edit2, Copy, Eye, MoreVertical, Paperclip, Download, ExternalLink } from 'lucide-react';")

    # Update attachment links in homework card
    old_link = """                {hw.attachmentUrl && (
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                    <a 
                      href={hw.attachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 font-medium"
                    >
                      <Paperclip className="w-4 h-4 mr-2" />
                      View Attachment
                    </a>
                  </div>
                )}"""
    
    new_link = """                {hw.attachmentUrl && (
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 flex space-x-4">
                    <a 
                      href={getCloudinaryDownloadUrl(hw.attachmentUrl)}
                      download
                      className="inline-flex items-center text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 font-medium bg-primary-50 dark:bg-primary-900/30 px-3 py-1.5 rounded-lg"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download File
                    </a>
                    <a 
                      href={hw.attachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open in New Tab
                    </a>
                  </div>
                )}"""

    code = code.replace(old_link, new_link)
    with open('frontend/src/pages/HomeworkManager.tsx', 'w', encoding='utf-8') as f:
        f.write(code)

if __name__ == '__main__':
    update_cloudinary_ts()
    update_library_manager()
    update_homework_manager()
    print("Done")
