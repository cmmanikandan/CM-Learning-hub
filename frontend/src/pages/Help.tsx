import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Search, HelpCircle, Mail, ChevronDown, ChevronUp } from 'lucide-react';
import { motion } from 'framer-motion';

export const Help: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: 'How do I join as a Student?',
      answer: 'Create an account on the register page, choose the "Student" role option, fill in your profile metadata, and wait to be linked to a mentor by your administrator.'
    },
    {
      question: 'How does the Streak Flame modifier calculate active stats?',
      answer: 'Your streak increases by 1 for every consecutive calendar day you submit or complete a designated homework task. If a full calendar day passes without a completion, your streak will reset to 0.'
    },
    {
      question: 'How do mentors deploy graded tests?',
      answer: 'Mentors can access the Test Manager from their sidebar dashboard, click "Create Test", construct question choices, configure timers, and deploy the assignment to their cohort list immediately.'
    },
    {
      question: 'Can I download files from the Library for offline reading?',
      answer: 'Yes! All materials uploaded to the library can be downloaded as PDF files or image scans to be read offline on any device.'
    },
    {
      question: 'Who manages student-mentor pairings?',
      answer: 'System Administrators manage pairings. Tutors/mentors or students can request to be paired through the admin panel support portal.'
    }
  ];

  const filteredFaqs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight mb-4">
              How can we <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 via-secondary-500 to-purple-500">
                help you today?
              </span>
            </h1>
            <p className="text-lg text-slate-500 dark:text-slate-400 mb-8 max-w-xl mx-auto">
              Search the knowledge base or review the frequently asked questions down below.
            </p>

            {/* Search Input */}
            <div className="max-w-md mx-auto relative group flex items-center mb-8">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary-500 transition-colors">
                <Search className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all font-medium shadow-md shadow-slate-100 dark:shadow-none"
                placeholder="Search tutorials, setup guides..."
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Accordions */}
      <div className="max-w-4xl mx-auto px-4 pb-24 z-10 relative">
        <div className="space-y-4">
          {filteredFaqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm transition-all"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full flex justify-between items-center text-left font-bold text-slate-900 dark:text-white font-outfit"
                >
                  <span className="text-base sm:text-lg">{faq.question}</span>
                  {isOpen ? (
                    <ChevronUp className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  )}
                </button>
                {isOpen && (
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-850 text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                    {faq.answer}
                  </div>
                )}
              </motion.div>
            );
          })}

          {filteredFaqs.length === 0 && (
            <div className="text-center py-12 text-slate-400 font-medium">
              No results found matching your search. Try another query.
            </div>
          )}
        </div>

        {/* Contact Block */}
        <div className="mt-16 p-8 rounded-3xl bg-slate-900 dark:bg-slate-900 border border-slate-800/80 text-white text-center flex flex-col items-center">
          <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-4">
            <Mail className="w-6 h-6 text-primary-400" />
          </div>
          <h3 className="text-xl font-bold mb-2">Still need help?</h3>
          <p className="text-slate-400 text-sm max-w-sm mb-6">Our system admins are ready to assist. Shoot us an email and we will revert back within 24 hours.</p>
          <a
            href="mailto:support@learninghub.com"
            className="px-6 py-3 font-bold text-sm bg-white text-slate-900 hover:bg-slate-100 rounded-xl transition-colors shadow-lg"
          >
            Email Support Team
          </a>
        </div>
      </div>
    </div>
  );
};
