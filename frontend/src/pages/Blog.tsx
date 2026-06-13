import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Clock, Calendar, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export const Blog: React.FC = () => {
  const articles = [
    {
      title: 'How to Maintain a 30-Day Homework Streak',
      summary: 'Unlock the cognitive science behind consistency, and learn how daily habits can skyrocket test outcomes.',
      tag: 'Study Strategy',
      readTime: '5 min read',
      date: 'June 10, 2026',
      color: 'from-blue-500/10 to-indigo-500/10 text-blue-600 dark:text-blue-400'
    },
    {
      title: '5 Tips to Ace Multiple Choice Math Quizzes',
      summary: 'Master elimination strategies, review time budgets, and handle complex equation multiple choice sets efficiently.',
      tag: 'Quiz Guide',
      readTime: '4 min read',
      date: 'June 08, 2026',
      color: 'from-purple-500/10 to-pink-500/10 text-purple-600 dark:text-purple-400'
    },
    {
      title: 'Bridging the Gap: Effective Student-Mentor Chat Habits',
      summary: 'How to construct clean support requests, format equations, and get quick resolutions on tough homework sheets.',
      tag: 'Collaboration',
      readTime: '6 min read',
      date: 'June 05, 2026',
      color: 'from-emerald-500/10 to-teal-500/10 text-emerald-600 dark:text-emerald-400'
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
      <div className="relative pt-32 pb-8 lg:pt-40 lg:pb-12 text-center z-10">
        <div className="max-w-3xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="px-4 py-2 rounded-full bg-primary-100 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400 font-semibold text-xs uppercase tracking-wider">
              Educational Insights
            </span>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight mt-6 mb-4 leading-tight">
              Smarter study habits <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 via-secondary-500 to-purple-500">
                documented for you.
              </span>
            </h1>
            <p className="text-lg text-slate-500 dark:text-slate-400 mb-8 max-w-xl mx-auto">
              Read tips from experienced tutors, streak veterans, and LMS product designers.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Articles Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 z-10 relative">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {articles.map((art, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              whileHover={{ y: -6 }}
              className="flex flex-col justify-between p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-lg cursor-pointer group"
            >
              <div>
                <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full bg-gradient-to-r ${art.color} mb-4`}>
                  {art.tag}
                </span>
                
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors leading-tight">
                  {art.title}
                </h3>
                
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-6 font-medium">
                  {art.summary}
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4 text-xs font-semibold text-slate-400">
                <div className="flex items-center space-x-3">
                  <span className="flex items-center"><Calendar className="w-3.5 h-3.5 mr-1" /> {art.date}</span>
                  <span className="flex items-center"><Clock className="w-3.5 h-3.5 mr-1" /> {art.readTime}</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 group-hover:text-primary-500 transition-all" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
