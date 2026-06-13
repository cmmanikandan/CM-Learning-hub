import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, Activity, Award, Zap, Users, Shield, MessageSquare, Bell, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

export const FeaturesInfo: React.FC = () => {
  const allFeatures = [
    {
      icon: <BookOpen className="w-6 h-6 text-blue-500" />,
      title: 'Digital Library Manager',
      desc: 'Organize, tag, and publish textbooks, past exam papers, lecture notes, and media attachments. Supports full categorization and search parameters.'
    },
    {
      icon: <Zap className="w-6 h-6 text-purple-500" />,
      title: 'Quiz Constructor',
      desc: 'Build multiple-choice question sheets. Set deadlines and review individual performance ratios instantly on completion.'
    },
    {
      icon: <FileText className="w-6 h-6 text-indigo-500" />,
      title: 'Homework & Assignment Workflows',
      desc: 'Students submit PDFs, image scans, or notes directly. Mentors review files, score submissions, and write detailed revision suggestions.'
    },
    {
      icon: <Activity className="w-6 h-6 text-amber-500" />,
      title: 'Performance Grade Book',
      desc: 'Auto-aggregated analytics. Charts showcase historical scores, study timeline completion rates, and focus areas needing reinforcement.'
    },
    {
      icon: <Award className="w-6 h-6 text-emerald-500" />,
      title: 'Streak & Gamification Engine',
      desc: 'Daily study streak counts with fire badge modifiers. Keeps students active and pair-ranked via class leaderboards.'
    },
    {
      icon: <MessageSquare className="w-6 h-6 text-rose-500" />,
      title: 'Dedicated Chat Channels',
      desc: 'Real-time student-to-mentor instant messaging dashboard. Exchange explanations, ask queries, and stay aligned.'
    },
    {
      icon: <Bell className="w-6 h-6 text-teal-500" />,
      title: 'Notification System',
      desc: 'Receive live alerts for graded tests, assigned homework, upcoming exams, or mentor message posts.'
    },
    {
      icon: <Shield className="w-6 h-6 text-fuchsia-500" />,
      title: 'Admin User Administration',
      desc: 'Control pairings, create student rows, register new mentor accounts, and manage core LMS setup parameters seamlessly.'
    }
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
      <div className="relative pt-32 pb-12 lg:pt-40 lg:pb-16 text-center z-10">
        <div className="max-w-3xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight mb-4">
              A complete toolkit for <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 via-secondary-500 to-purple-500">
                educational success.
              </span>
            </h1>
            <p className="text-lg text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
              Explore how CM Learning Hub automates administrative load while boosting student focus and retention.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Grid List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 z-10 relative">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {allFeatures.map((feat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: idx * 0.05 }}
              whileHover={{ y: -5 }}
              className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-lg"
            >
              <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl flex items-center justify-center mb-5">
                {feat.icon}
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{feat.title}</h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm leading-relaxed font-medium">
                {feat.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
