import React, { useState } from 'react';
import { ModalPortal } from '../components/Modal';
import { useApp } from '../context/AppContext';
import type { LibraryMaterial } from '../context/AppContext';
import { uploadToCloudinary, getCloudinaryDownloadUrl } from '../utils/cloudinary';
import { 
  Search, 
  UploadCloud, 
  Trash2, 
  Bookmark, 
  Eye, 
  Download, 
  FileText, 
  Video, 
  Image as ImageIcon, 
  ExternalLink,
  Filter,
  X,
  ChevronDown
} from 'lucide-react';

const CARD_THEMES = [
  {
    gradient: "from-blue-500 to-cyan-500",
    badge: "bg-blue-600",
    text: "text-blue-600 dark:text-blue-450",
    border: "border-blue-105/30",
    bg: "bg-blue-50/30 dark:bg-blue-950/10"
  },
  {
    gradient: "from-purple-500 to-indigo-500",
    badge: "bg-purple-600",
    text: "text-purple-600 dark:text-purple-450",
    border: "border-purple-105/30",
    bg: "bg-purple-50/30 dark:bg-purple-950/10"
  },
  {
    gradient: "from-emerald-500 to-teal-500",
    badge: "bg-emerald-600",
    text: "text-emerald-600 dark:text-emerald-450",
    border: "border-emerald-105/30",
    bg: "bg-emerald-50/30 dark:bg-emerald-950/10"
  },
  {
    gradient: "from-amber-500 to-orange-500",
    badge: "bg-amber-600",
    text: "text-amber-600 dark:text-amber-450",
    border: "border-amber-105/30",
    bg: "bg-amber-50/30 dark:bg-amber-950/10"
  },
  {
    gradient: "from-rose-500 to-pink-500",
    badge: "bg-rose-600",
    text: "text-rose-600 dark:text-rose-450",
    border: "border-rose-105/30",
    bg: "bg-rose-50/30 dark:bg-rose-950/10"
  },
  {
    gradient: "from-violet-500 to-fuchsia-500",
    badge: "bg-violet-600",
    text: "text-violet-600 dark:text-violet-450",
    border: "border-violet-105/30",
    bg: "bg-violet-50/30 dark:bg-violet-950/10"
  }
];

const getCardTheme = (index: number) => CARD_THEMES[index % CARD_THEMES.length];

interface LibraryManagerProps {
  showUploadModal: boolean;
  setShowUploadModal: (show: boolean) => void;
}

const CATEGORIES = [
  "Textbooks", "Notes", "Important Questions", "Question Banks", 
  "Previous Year Papers", "Assignments", "Worksheets", "Reference Books", 
  "Projects", "Lab Manuals", "Videos", "Images", "Presentations"
];

const FILE_FORMATS = [
  "PDF", "DOC", "DOCX", "PPT", "PPTX", "XLS", "XLSX", "JPG", "PNG", "MP4", "ZIP"
];

const CATEGORY_ICONS: Record<string, string> = {
  "Textbooks": "📚", "Notes": "📝", "Important Questions": "❓",
  "Question Banks": "🏦", "Previous Year Papers": "📄", "Assignments": "✏️",
  "Worksheets": "📋", "Reference Books": "📖", "Projects": "🔬",
  "Lab Manuals": "🧪", "Videos": "🎥", "Images": "🖼️", "Presentations": "📊"
};

export const LibraryManager: React.FC<LibraryManagerProps> = ({ 
  showUploadModal, 
  setShowUploadModal 
}) => {
  const { 
    role, 
    libraryList, 
    addLibraryMaterial, 
    deleteLibraryMaterial, 
    toggleBookmarkMaterial 
  } = useApp();

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showBookmarkedOnly, setShowBookmarkedOnly] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  // Uploader form data
  const [formData, setFormData] = useState({
    title: '',
    subject: 'Chemistry',
    category: 'Notes',
    description: '',
    tagsString: '',
    fileName: '',
    fileUrl: '',
    visibility: 'Public' as LibraryMaterial['visibility']
  });

  // Preview viewer state
  const [previewingMaterial, setPreviewingMaterial] = useState<LibraryMaterial | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      const err = error as any;
      alert('Failed to upload file. Error: ' + (err.message || err));
    } finally {
      setIsUploading(false);
    }
  };

  // Handle upload submit
  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.fileName) return;

    const tags = formData.tagsString.split(',').map(tag => tag.trim()).filter(Boolean);

    addLibraryMaterial({
      title: formData.title,
      subject: formData.subject,
      category: formData.category,
      description: formData.description,
      tags,
      fileName: formData.fileName,
      fileUrl: formData.fileUrl || '',
      visibility: formData.visibility
    });

    // Reset Form
    setFormData({
      title: '',
      subject: 'Chemistry',
      category: 'Notes',
      description: '',
      tagsString: '',
      fileName: '',
      fileUrl: '',
      visibility: 'Public'
    });
    setShowUploadModal(false);
  };

  // Filter lists
  const filteredMaterials = libraryList.filter(mat => {
    const matchesSearch = mat.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          mat.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          mat.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory ? mat.category === selectedCategory : true;
    const matchesBookmarks = showBookmarkedOnly ? mat.isBookmarked : true;

    return matchesSearch && matchesCategory && matchesBookmarks;
  });

  // Select icons based on category
  const getCategoryIcon = (category: string) => {
    if (category === 'Videos') return <Video className="w-5 h-5 text-red-500" />;
    if (category === 'Images') return <ImageIcon className="w-5 h-5 text-emerald-500" />;
    return <FileText className="w-5 h-5 text-primary-500" />;
  };

  const bookmarkedCount = libraryList.filter(l => l.isBookmarked).length;
  const activeFiltersCount = (selectedCategory ? 1 : 0) + (showBookmarkedOnly ? 1 : 0);

  return (
    <div className="space-y-5">
      {/* ── Header bar ── */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-outfit text-slate-800 dark:text-white">Library</h2>
          <p className="text-xs text-slate-400 font-medium mt-0.5">Browse textbooks, worksheets &amp; study collections</p>
        </div>
        
        {role === 'mentor' && (
          <button 
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold rounded-xl text-white bg-primary-600 hover:bg-primary-700 transition-all shadow-sm active:scale-95 shrink-0"
          >
            <UploadCloud className="w-4 h-4" />
            <span className="hidden sm:inline">Upload Material</span>
            <span className="sm:hidden">Upload</span>
          </button>
        )}
      </div>

      {/* ── Search + Filter bar ── */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="flex-1 glass-panel flex items-center gap-2 px-3.5 py-2.5 rounded-xl">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input 
            type="text" 
            placeholder="Search documents, videos, tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent border-none focus:outline-none text-slate-800 dark:text-white text-sm placeholder:text-slate-400"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="text-slate-400 hover:text-slate-600 shrink-0">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter toggle button */}
        <button
          onClick={() => setShowFilterPanel(!showFilterPanel)}
          className={`relative flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all border shrink-0 ${
            showFilterPanel || activeFiltersCount > 0
              ? 'bg-primary-600 text-white border-primary-600 shadow-md shadow-primary-500/20'
              : 'glass-panel text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-primary-400'
          }`}
        >
          <Filter className="w-4 h-4" />
          <span className="hidden sm:inline">Filters</span>
          {activeFiltersCount > 0 && (
            <span className="w-4 h-4 bg-white text-primary-600 rounded-full text-[9px] font-black flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
          <ChevronDown className={`w-3 h-3 transition-transform ${showFilterPanel ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* ── Horizontal category chip scroller ── */}
      <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex items-center gap-2 pb-1" style={{ minWidth: 'max-content' }}>
          {/* "All" chip */}
          <button
            onClick={() => { setSelectedCategory(''); setShowBookmarkedOnly(false); }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border shrink-0 ${
              selectedCategory === '' && !showBookmarkedOnly
                ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-primary-400 hover:text-primary-600'
            }`}
          >
            <span>🗂️</span>
            All ({libraryList.length})
          </button>

          {/* Bookmarked chip */}
          <button
            onClick={() => { setShowBookmarkedOnly(!showBookmarkedOnly); setSelectedCategory(''); }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border shrink-0 ${
              showBookmarkedOnly
                ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-amber-400 hover:text-amber-600'
            }`}
          >
            <Bookmark className="w-3 h-3" />
            Bookmarked ({bookmarkedCount})
          </button>

          {/* Divider */}
          <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 shrink-0 mx-1" />

          {/* Category chips */}
          {CATEGORIES.map(cat => {
            const count = libraryList.filter(l => l.category === cat).length;
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => { setSelectedCategory(isActive ? '' : cat); setShowBookmarkedOnly(false); }}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border shrink-0 ${
                  isActive
                    ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-primary-400 hover:text-primary-600'
                }`}
              >
                <span>{CATEGORY_ICONS[cat] || '📁'}</span>
                {cat}
                <span className={`text-[9px] px-1 py-0.5 rounded-full font-black ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Expandable Filter Panel ── */}
      {showFilterPanel && (
        <div className="glass-panel rounded-2xl p-4 border border-slate-200/50 dark:border-slate-700/50 animate-fadeIn space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Advanced Filters</h4>
            {activeFiltersCount > 0 && (
              <button
                onClick={() => { setSelectedCategory(''); setShowBookmarkedOnly(false); }}
                className="text-[10px] font-bold text-danger-600 hover:underline"
              >
                Clear All
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            <button
              onClick={() => setShowBookmarkedOnly(!showBookmarkedOnly)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                showBookmarkedOnly
                  ? 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/20 dark:border-amber-800 dark:text-amber-400'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-amber-300'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              Bookmarked Only
            </button>
          </div>

          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Filter by Category</p>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(selectedCategory === cat ? '' : cat)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                    selectedCategory === cat
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-primary-400 hover:text-primary-600'
                  }`}
                >
                  {CATEGORY_ICONS[cat]} {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Active filter summary ── */}
      {(selectedCategory || showBookmarkedOnly || searchTerm) && (
        <div className="flex flex-wrap items-center gap-2 animate-fadeIn">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Active:</span>
          {searchTerm && (
            <span className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-[10px] font-bold text-slate-600 dark:text-slate-300">
              🔍 "{searchTerm}"
              <button onClick={() => setSearchTerm('')}><X className="w-2.5 h-2.5" /></button>
            </span>
          )}
          {selectedCategory && (
            <span className="flex items-center gap-1 px-2.5 py-1 bg-primary-50 dark:bg-primary-950/20 rounded-full text-[10px] font-bold text-primary-600 dark:text-primary-400">
              {CATEGORY_ICONS[selectedCategory]} {selectedCategory}
              <button onClick={() => setSelectedCategory('')}><X className="w-2.5 h-2.5" /></button>
            </span>
          )}
          {showBookmarkedOnly && (
            <span className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 dark:bg-amber-950/20 rounded-full text-[10px] font-bold text-amber-600 dark:text-amber-400">
              ⭐ Bookmarked
              <button onClick={() => setShowBookmarkedOnly(false)}><X className="w-2.5 h-2.5" /></button>
            </span>
          )}
          <span className="text-[10px] text-slate-400 font-medium ml-auto">{filteredMaterials.length} result{filteredMaterials.length !== 1 ? 's' : ''}</span>
        </div>
      )}

      {/* ── Cards Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMaterials.length > 0 ? (
          filteredMaterials.map((mat, index) => {
            const theme = getCardTheme(index);
            return (
              <div 
                key={mat.id}
                className="premium-outline-card flex flex-col justify-between relative border border-slate-200 dark:border-slate-800 hover:shadow-lg transition-all duration-200"
              >
                {/* Top color bar */}
                <div className={`h-1.5 w-full bg-gradient-to-r ${theme.gradient}`} />
                
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-100 dark:border-slate-800/50 shrink-0">
                          {getCategoryIcon(mat.category)}
                        </div>
                        <span className={`bg-gradient-to-r ${theme.gradient} text-white px-2.5 py-0.5 text-[9px] font-bold uppercase rounded-lg tracking-wider`}>
                          {mat.category}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-0.5">
                        <button
                          onClick={() => toggleBookmarkMaterial(mat.id)}
                          className={`p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
                            mat.isBookmarked ? 'text-amber-500' : 'text-slate-300 dark:text-slate-600'
                          }`}
                          title={mat.isBookmarked ? 'Remove bookmark' : 'Bookmark'}
                        >
                          <Bookmark className="w-4 h-4 fill-current" />
                        </button>
                        
                        {role === 'mentor' && (
                          <button
                            onClick={() => deleteLibraryMaterial(mat.id)}
                            className="p-1.5 rounded-lg text-slate-300 dark:text-slate-600 hover:text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-950/20 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="mt-3.5">
                      <h4 className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-white font-outfit uppercase tracking-wide leading-tight line-clamp-2">
                        {mat.title}
                      </h4>
                      {mat.description && (
                        <p className="text-xs text-slate-400 mt-1.5 leading-relaxed line-clamp-2">{mat.description}</p>
                      )}
                    </div>

                    {/* Tags */}
                    {mat.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {mat.tags.slice(0, 4).map(tag => (
                          <span key={tag} className="text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-500 px-2 py-0.5 rounded">
                            #{tag}
                          </span>
                        ))}
                        {mat.tags.length > 4 && (
                          <span className="text-[9px] font-bold text-slate-400 px-1 py-0.5">+{mat.tags.length - 4}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer */}
                <div className="px-4 sm:px-5 pb-4 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs text-slate-400 font-bold">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                    {mat.fileName.split('.').pop()?.toUpperCase() || 'PDF'}
                  </span>
                  
                  <div className="flex items-center gap-2">
                    {mat.fileUrl && (
                      <a
                        href={getCloudinaryDownloadUrl(mat.fileUrl)}
                        download
                        className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950/20 rounded-lg transition-colors"
                        title="Download"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <button
                      onClick={() => setPreviewingMaterial(mat)}
                      className="flex items-center gap-1 text-primary-600 dark:text-primary-400 hover:underline font-bold text-[11px]"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-16 text-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">
              📂
            </div>
            <p className="font-bold text-slate-600 dark:text-slate-400">No materials found</p>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your search or filters</p>
            {(selectedCategory || showBookmarkedOnly || searchTerm) && (
              <button
                onClick={() => { setSelectedCategory(''); setShowBookmarkedOnly(false); setSearchTerm(''); }}
                className="mt-3 text-xs font-bold text-primary-600 hover:underline"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── UPLOAD MODAL ── */}
      {showUploadModal && (
        <ModalPortal onClose={() => setShowUploadModal(false)}>
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-800 animate-scaleIn">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary-100 dark:bg-primary-950/20 rounded-lg flex items-center justify-center">
                  <UploadCloud className="w-4 h-4 text-primary-600" />
                </div>
                <h3 className="font-bold text-base text-slate-800 dark:text-white font-outfit">Upload Study Material</h3>
              </div>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Material Title *</label>
                <input 
                  type="text" 
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2.5 rounded-xl text-sm text-slate-800 dark:text-white focus:outline-none focus:border-primary-500 transition-colors"
                  placeholder="e.g. Chapter 3 Covalent Bonding Notes"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Subject *</label>
                  <input 
                    type="text" 
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2.5 rounded-xl text-sm text-slate-800 dark:text-white focus:outline-none focus:border-primary-500 transition-colors"
                    placeholder="e.g. Chemistry"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Category</label>
                  <select 
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2.5 rounded-xl text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:border-primary-500 transition-colors"
                  >
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{CATEGORY_ICONS[cat]} {cat}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Description</label>
                <textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2.5 rounded-xl text-sm text-slate-800 dark:text-white focus:outline-none focus:border-primary-500 h-16 resize-none transition-colors"
                  placeholder="Brief explanation of what this file contains..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Tags (comma separated)</label>
                <input 
                  type="text" 
                  value={formData.tagsString}
                  onChange={(e) => setFormData({ ...formData, tagsString: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2.5 rounded-xl text-sm text-slate-800 dark:text-white focus:outline-none focus:border-primary-500 transition-colors"
                  placeholder="bonding, chemistry, exams"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Upload File *</label>
                  <input 
                    type="file" 
                    onChange={handleFileUpload}
                    disabled={isUploading}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-sm text-slate-800 dark:text-white focus:outline-none file:mr-3 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 disabled:opacity-50 transition-colors"
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
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Visibility</label>
                  <select 
                    value={formData.visibility}
                    onChange={(e) => setFormData({ ...formData, visibility: e.target.value as LibraryMaterial['visibility'] })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2.5 rounded-xl text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:border-primary-500 transition-colors"
                  >
                    <option value="Public">🌐 Public</option>
                    <option value="Private">🔒 Private</option>
                  </select>
                </div>
              </div>

              {/* Supported formats */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Supported Formats:</span>
                <div className="flex flex-wrap gap-1">
                  {FILE_FORMATS.map(f => (
                    <span key={f} className="text-[9px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded">
                      {f}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button 
                  type="button" 
                  onClick={() => setShowUploadModal(false)} 
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-xl text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors focus:outline-none"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isUploading}
                  className={`px-5 py-2 text-xs font-bold rounded-xl text-white transition-colors focus:outline-none ${isUploading ? 'bg-primary-400 cursor-not-allowed' : 'bg-primary-600 hover:bg-primary-700'}`}
                >
                  {isUploading ? 'Uploading...' : 'Upload Material'}
                </button>
              </div>
            </form>
          </div>
        </ModalPortal>
      )}

      {/* ── FILE PREVIEW MODAL ── */}
      {previewingMaterial && (
        <ModalPortal onClose={() => setPreviewingMaterial(null)}>
          <div className="w-full max-w-4xl h-[85vh] bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-800 flex flex-col animate-scaleIn">
            
            {/* Viewer Header */}
            <div className="px-4 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/30 gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-bold bg-primary-50 text-primary-600 dark:bg-primary-950/20 px-2 py-0.5 rounded">
                    {previewingMaterial.subject}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">{previewingMaterial.category}</span>
                </div>
                <h3 className="font-bold text-slate-800 dark:text-white font-outfit text-sm sm:text-base leading-tight truncate mt-1">
                  {previewingMaterial.title}
                </h3>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={getCloudinaryDownloadUrl(previewingMaterial.fileUrl || '#')}
                  download={previewingMaterial.fileName || 'download'}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-xl text-white bg-primary-600 hover:bg-primary-700 shadow-sm active:scale-95 transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Download</span>
                </a>
                
                <a
                  href={previewingMaterial.fileUrl || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 dark:text-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 shadow-sm active:scale-95 border border-slate-200 dark:border-slate-700 transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">New Tab</span>
                </a>

                <button 
                  onClick={() => setPreviewingMaterial(null)} 
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* File Canvas */}
            <div className="flex-1 bg-slate-100 dark:bg-slate-950/40 p-4 overflow-hidden flex justify-center items-center">
              {previewingMaterial.fileUrl && previewingMaterial.fileUrl.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                <img src={previewingMaterial.fileUrl} alt={previewingMaterial.title} className="max-w-full max-h-full object-contain rounded-xl shadow-lg" />
              ) : previewingMaterial.fileUrl && previewingMaterial.fileUrl.match(/\.(mp4|webm|ogg)$/i) ? (
                <video src={previewingMaterial.fileUrl} controls className="max-w-full max-h-full rounded-xl shadow-lg"></video>
              ) : previewingMaterial.fileUrl && previewingMaterial.fileUrl.startsWith('http') ? (
                <iframe src={previewingMaterial.fileUrl} className="w-full h-full rounded-xl shadow-lg border-0 bg-white" title={previewingMaterial.title}></iframe>
              ) : (
                <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-800/80 p-8 min-h-[50vh] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                      <span className="text-xs text-slate-400 font-bold">Document: {previewingMaterial.fileName}</span>
                    </div>
                    <div className="mt-6 space-y-4">
                      <h1 className="text-2xl font-extrabold font-outfit text-slate-800 dark:text-white">{previewingMaterial.title}</h1>
                      <div className="border-l-4 border-primary-500 pl-4 py-1.5 my-4">
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                          {previewingMaterial.description}
                        </p>
                      </div>
                      <div className="space-y-3 pt-4 text-sm leading-relaxed text-amber-600 dark:text-amber-400">
                        <p>No live file found for this material. This was likely created before the Cloudinary integration.</p>
                        <p>Please delete this item and upload a new study material to view the live file.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
};
