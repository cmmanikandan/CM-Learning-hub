import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FolderOpen, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';

export const LibraryInfo: React.FC = () => {
  const folders = [
    { name: 'Mathematics Core', count: '14 files', color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' },
    { name: 'Physics Past Papers', count: '28 files', color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' },
    { name: 'Chemistry Guides', count: '9 files', color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' },
    { name: 'Syllabus Templates', count: '5 files', color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-outfit text-slate-800 dark:text-slate-100 selection:bg-primary-500/30 overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-[72px]">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-secondary-500 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:scale-105 transition-transform">
              CM
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">Learning Hub</span>
          </Link>
          <Link to="/" className="flex items-center space-x-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
        </div>
      </nav>

      {/* Hero Header */}
      <div className="relative pt-32 pb-8 lg:pt-40 lg:pb-12 text-center z-10">
        <div className="max-w-3xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="px-4 py-2 rounded-full bg-primary-100 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400 font-semibold text-xs uppercase tracking-wider">
              Revision Resource Library
            </span>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight mt-6 mb-4 leading-tight">
              All study materials, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 via-secondary-500 to-purple-500">
                cataloged and ready.
              </span>
            </h1>
            <p className="text-lg text-slate-500 dark:text-slate-400 mb-8 max-w-xl mx-auto">
              Find textbooks, syllabus criteria sheets, and past question booklets. Accessible anytime with offline reading capabilities.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Folders Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 z-10 relative">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {folders.map((fold, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: idx * 0.05 }}
              whileHover={{ y: -4 }}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center space-x-4"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${fold.color}`}>
                <FolderOpen className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base leading-tight">{fold.name}</h4>
                <p className="text-slate-400 dark:text-slate-500 text-xs mt-1 font-semibold">{fold.count}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Detail Block */}
      <div className="max-w-4xl mx-auto px-4 pb-24 z-10 relative">
        <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-lg text-center flex flex-col items-center">
          <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center mb-4">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Member-Only Access</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mb-8 leading-relaxed">
            The full library is a protected environment. Students and Mentors can log in to upload files, add tag categories, and view attachments directly inside their workspace.
          </p>
          <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4">
            <Link to="/login" className="px-6 py-3 font-bold text-sm bg-primary-600 text-white hover:bg-primary-700 rounded-xl transition-all shadow-md">
              Sign In to Access Library
            </Link>
            <Link to="/register" className="px-6 py-3 font-bold text-sm bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-slate-800 dark:text-white transition-all">
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
