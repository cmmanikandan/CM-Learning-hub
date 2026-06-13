import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Award, Zap, CheckCircle2, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';

export const StudentsInfo: React.FC = () => {
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
            <span className="px-4 py-2 rounded-full bg-primary-100 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400 font-semibold text-xs uppercase tracking-wider">
              For Students
            </span>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight mt-6 mb-6 leading-tight">
              Learn faster. Stay motivated. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-secondary-500">
                Own your success.
              </span>
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-10">
              CM Learning Hub turns studying into an engaging, structured, and collaborative experience. Access all materials, complete assignments, and track your metrics in real time.
            </p>
            <div className="flex justify-center">
              <Link to="/register?role=student" className="px-8 py-4 font-bold text-white bg-primary-600 hover:bg-primary-700 hover:scale-105 rounded-full shadow-lg shadow-primary-500/25 transition-all">
                Create Free Student Account
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Features Detail */}
      <div className="py-16 bg-white/50 dark:bg-slate-900/50 backdrop-blur-lg border-y border-slate-200/50 dark:border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            
            {/* Cards Column */}
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-md">
                <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 rounded-xl flex items-center justify-center mb-4">
                  <Award className="w-6 h-6 text-amber-500" />
                </div>
                <h3 className="text-lg font-bold mb-2">🔥 Streak Rewards</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  Complete homework tasks on time and maintain a daily learning streak. Show off your rank on the leaderboard.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-md">
                <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/20 rounded-xl flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-purple-500" />
                </div>
                <h3 className="text-lg font-bold mb-2">⚡ Interactive Quizzes</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  Take tests and quizzes right inside the dashboard. Get instant grades and a full explanation for every answer.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-md">
                <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center mb-4">
                  <MessageSquare className="w-6 h-6 text-blue-500" />
                </div>
                <h3 className="text-lg font-bold mb-2">💬 Direct Mentor Support</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  Stuck on a question? Chat with your assigned mentor directly, review homework revisions, and receive detailed feedback.
                </p>
              </div>
            </div>

            {/* Content Column */}
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-6">
                Designed to make studying interactive
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                Traditional platforms feel disconnected. CM Learning Hub is structured to keep you accountable, driven, and in constant communication with your educator.
              </p>
              <div className="space-y-4">
                <div className="flex items-start">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 mr-3 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="font-bold">Offline Resource Storage</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Download syllabus guidelines and textbooks to access them when offline.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 mr-3 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="font-bold">Automated Weak-Spot Detection</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Our analytics dashboard automatically highlights themes where your quiz scores drop.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 mr-3 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="font-bold">Seamless Document Uploads</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Submit completed homework by dragging and dropping photos or PDFs directly.</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
