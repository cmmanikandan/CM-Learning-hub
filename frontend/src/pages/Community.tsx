import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Users, Calendar, HelpCircle, ArrowRight, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';

export const Community: React.FC = () => {
  const elements = [
    {
      icon: <Users className="w-6 h-6 text-blue-500" />,
      title: 'Peer Study Cohorts',
      desc: 'Collaborate with fellow students preparing for the same syllabus. Join focus blocks, share resource binders, and discuss tricky equations.'
    },
    {
      icon: <Calendar className="w-6 h-6 text-purple-500" />,
      title: 'Mentor Office Hours',
      desc: 'Join weekly live Q&A roundtables. Mentors walk through complex homework questions, clarify definitions, and outline testing methodologies.'
    },
    {
      icon: <HelpCircle className="w-6 h-6 text-emerald-500" />,
      title: 'Discussions & Forums',
      desc: 'Post math diagrams, essay outlines, or vocabulary cards. Crowdsource explanations from students and verified tutors instantly.'
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
              Student-Mentor Community
            </span>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight mt-6 mb-4 leading-tight">
              Study together. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 via-secondary-500 to-purple-500">
                Succeed together.
              </span>
            </h1>
            <p className="text-lg text-slate-500 dark:text-slate-400 mb-8 max-w-xl mx-auto">
              Join a network of motivated learners and expert educators collaborating to build a better digital learning campus.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Elements Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 z-10 relative">
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {elements.map((elem, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              whileHover={{ y: -5 }}
              className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-lg flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 bg-slate-55 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl flex items-center justify-center mb-6">
                  {elem.icon}
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{elem.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm leading-relaxed mb-6 font-medium">
                  {elem.desc}
                </p>
              </div>
              
              <Link to="/register" className="inline-flex items-center text-xs font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors">
                <span>Join community now</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
