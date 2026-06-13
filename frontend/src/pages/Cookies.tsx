import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Cookie } from 'lucide-react';
import { motion } from 'framer-motion';

export const Cookies: React.FC = () => {
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
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400 rounded-2xl flex items-center justify-center mb-4 mx-auto">
              <Cookie className="w-6 h-6" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-4 text-slate-900 dark:text-white">
              Cookie Policy
            </h1>
            <p className="text-slate-450 dark:text-slate-400 text-sm font-semibold">
              Last updated: June 13, 2026
            </p>
          </motion.div>
        </div>
      </div>

      {/* Document Body */}
      <div className="max-w-3xl mx-auto px-4 pb-24 z-10 relative leading-relaxed text-slate-600 dark:text-slate-350 text-sm sm:text-base space-y-8 font-medium">
        <section className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
          <h2 className="text-xl font-bold text-slate-950 dark:text-white">1. What are Cookies?</h2>
          <p>
            Cookies are short text strings saved to your browser cache. They help us remember your layout preferences, such as light/dark mode choices, and maintain active login sessions.
          </p>
        </section>

        <section className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
          <h2 className="text-xl font-bold text-slate-950 dark:text-white">2. Essential Browser Cookies</h2>
          <p>
            We use local browser storage and session cookies to securely store JSON Web Tokens (JWT) for authentication. Disabling cookies will sign you out and block access to protected dashboards.
          </p>
        </section>
      </div>
    </div>
  );
};
