import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, Users, BarChart3, ShieldCheck, Mail, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export const MentorsInfo: React.FC = () => {
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

      {/* Hero Section */}
      <div className="relative pt-32 pb-16 lg:pt-40 lg:pb-24 z-10">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="px-4 py-2 rounded-full bg-secondary-100 dark:bg-secondary-950/30 text-secondary-600 dark:text-secondary-400 font-semibold text-xs uppercase tracking-wider">
              For Mentors & Educators
            </span>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight mt-6 mb-6 leading-tight">
              Manage your cohort. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary-500 to-indigo-500">
                Teach without administrative friction.
              </span>
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-10">
              Simplify test deployment, assignment assessments, and study material curation. Monitor learning streaks and progress charts all from one admin-ready dashboard.
            </p>
            <div className="flex justify-center">
              <Link to="/register?role=mentor" className="px-8 py-4 font-bold text-white bg-secondary-600 hover:bg-secondary-700 hover:scale-105 rounded-full shadow-lg shadow-secondary-500/25 transition-all">
                Apply as Verified Mentor
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Features Detail */}
      <div className="py-16 bg-white/50 dark:bg-slate-900/50 backdrop-blur-lg border-y border-slate-200/50 dark:border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            
            {/* Content Column */}
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-6">
                Save hours on checking homework and tests
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                CM Learning Hub automates the repetitive parts of class management. Focus on teaching, providing high-quality feedback, and mentoring students directly.
              </p>
              <div className="space-y-4">
                <div className="flex items-start">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 mr-3 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="font-bold">Automated Test Scoring</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Multiple-choice quizzes are automatically graded and tabulated on student record sheets.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 mr-3 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="font-bold">Comprehensive Class Reports</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Export scores, tracking charts, streaks, and attendance records as beautiful PDFs in one click.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 mr-3 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="font-bold">Resource Library Management</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Upload past exam folders, revision summaries, and digital worksheets categorized by topic tags.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Cards Column */}
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-md">
                <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-indigo-500" />
                </div>
                <h3 className="text-lg font-bold mb-2">👥 Cohort Dashboard</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  View all assigned student rows, check their latest active logins, streak flame metrics, and pending homework logs in seconds.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-md">
                <div className="w-12 h-12 bg-rose-50 dark:bg-rose-900/20 rounded-xl flex items-center justify-center mb-4">
                  <BarChart3 className="w-6 h-6 text-rose-500" />
                </div>
                <h3 className="text-lg font-bold mb-2">📈 Competency Analytics</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  Evaluate class progress with aggregated charts. Immediately detect which formulas or learning chapters your students struggle with most.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-md">
                <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center mb-4">
                  <ShieldCheck className="w-6 h-6 text-emerald-500" />
                </div>
                <h3 className="text-lg font-bold mb-2">🔒 Secure Grade Book</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  Maintain private grade sheets and internal evaluations with database backup systems, completely protected and secure.
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
