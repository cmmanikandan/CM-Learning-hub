import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Activity, Award, ArrowRight, CheckCircle, Users, Zap, Shield, ChevronRight, Star } from 'lucide-react';
import { motion } from 'framer-motion';

export const LandingPage: React.FC = () => {
  const features = [
    {
      icon: <BookOpen className="w-6 h-6 text-blue-500" />,
      title: 'Digital Library & Resources',
      description: 'Access textbooks, past papers, and premium study materials anytime, anywhere with offline capabilities.',
      color: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      icon: <Activity className="w-6 h-6 text-amber-500" />,
      title: 'Real-time Analytics',
      description: 'Track your performance visually. Identify weak areas with our AI-driven competency mapping.',
      color: 'bg-amber-50 dark:bg-amber-900/20'
    },
    {
      icon: <Award className="w-6 h-6 text-emerald-500" />,
      title: 'Gamified Experience',
      description: 'Earn badges, maintain study streaks, and unlock achievements to stay motivated daily.',
      color: 'bg-emerald-50 dark:bg-emerald-900/20'
    },
    {
      icon: <Zap className="w-6 h-6 text-purple-500" />,
      title: 'Live Quizzes & Tests',
      description: 'Take timed tests with instant grading and detailed feedback explanations for every question.',
      color: 'bg-purple-50 dark:bg-purple-900/20'
    },
    {
      icon: <Users className="w-6 h-6 text-rose-500" />,
      title: 'Dedicated Mentorship',
      description: 'Connect directly with certified mentors. Get 1-on-1 guidance, homework reviews, and personalized plans.',
      color: 'bg-rose-50 dark:bg-rose-900/20'
    },
    {
      icon: <Shield className="w-6 h-6 text-teal-500" />,
      title: 'Secure & Private',
      description: 'Enterprise-grade security ensures your data, grades, and personal information are always protected.',
      color: 'bg-teal-50 dark:bg-teal-900/20'
    }
  ];

  const steps = [
    { num: '01', title: 'Create an Account', desc: 'Sign up in seconds. Choose to join as a Student or apply as a verified Mentor.' },
    { num: '02', title: 'Connect & Setup', desc: 'Students select their mentor, while mentors set up their virtual classrooms.' },
    { num: '03', title: 'Start Learning', desc: 'Access resources, take quizzes, submit homework, and track your unstoppable progress.' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-outfit text-slate-800 dark:text-slate-100 overflow-x-hidden selection:bg-primary-500/30">
      
      {/* Decorative Background Blobs */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-primary-400/25 dark:bg-primary-600/10 rounded-full blur-[140px] mix-blend-multiply dark:mix-blend-screen animate-float" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[45vw] h-[45vw] bg-secondary-400/25 dark:bg-secondary-600/10 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-float-delayed" />
        <div className="absolute top-[35%] right-[20%] w-[35vw] h-[35vw] bg-purple-500/15 dark:bg-purple-600/10 rounded-full blur-[130px] mix-blend-multiply dark:mix-blend-screen animate-float" style={{ animationDuration: '14s' }} />
      </div>

      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-white/45 dark:bg-slate-950/40 backdrop-blur-2xl border-b border-slate-200/25 dark:border-slate-850/30 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-[72px]">
          <div className="flex items-center space-x-3 group cursor-pointer">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-secondary-500 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-primary-500/20 group-hover:scale-105 transition-transform">
              CM
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">Learning Hub</span>
          </div>
          <div className="hidden md:flex items-center space-x-8 text-sm font-semibold text-slate-600 dark:text-slate-300">
            <a href="#features" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">How it Works</a>
            <a href="#testimonials" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Reviews</a>
          </div>
          <div className="flex items-center space-x-4">
            <Link to="/login" className="text-sm font-bold text-slate-700 dark:text-slate-200 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Log In</Link>
            <Link to="/register" className="px-6 py-2.5 text-sm font-bold text-white bg-slate-900 dark:bg-white dark:text-slate-900 hover:scale-105 rounded-full transition-all shadow-xl shadow-slate-900/20 dark:shadow-white/10">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-semibold text-sm mb-8 border border-primary-100 dark:border-primary-800/50 shadow-sm">
              <SparklesIcon className="w-4 h-4" />
              <span>Version 2.0 is now live!</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight mb-6 leading-[1.1]">
              Master your studies. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 via-secondary-500 to-purple-500 drop-shadow-sm">
                Shape your future.
              </span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg md:text-xl text-slate-600 dark:text-slate-400 mx-auto mb-10 leading-relaxed">
              The all-in-one educational platform that bridges the gap between ambitious students and expert mentors with seamless assignments, live analytics, and interactive gamified learning.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Link to="/register" className="w-full sm:w-auto px-8 py-4 text-base font-bold text-white bg-primary-600 hover:bg-primary-700 hover:scale-105 rounded-full transition-all shadow-xl shadow-primary-500/30 flex items-center justify-center group">
                Join as Student <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/register?role=mentor" className="w-full sm:w-auto px-8 py-4 text-base font-bold text-slate-800 dark:text-slate-200 bg-white/40 dark:bg-slate-800/40 backdrop-blur border border-slate-200/50 dark:border-slate-700 hover:border-slate-350 dark:hover:border-slate-600 hover:scale-105 rounded-full transition-all flex items-center justify-center group shadow-md">
                Apply as Mentor <ChevronRight className="w-5 h-5 ml-1 text-slate-400 group-hover:text-slate-800 dark:group-hover:text-white transition-colors" />
              </Link>
            </div>
            
            <div className="mt-16 flex items-center justify-center space-x-8 text-sm font-medium text-slate-500 dark:text-slate-400">
              <div className="flex items-center"><CheckCircle className="w-4 h-4 text-success mr-2" /> 100% Free LMS Platform</div>
              <div className="flex items-center"><CheckCircle className="w-4 h-4 text-success mr-2" /> No Credit Card Required</div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Features Grid */}
      <div id="features" className="py-24 bg-white/30 dark:bg-slate-900/30 backdrop-blur-2xl relative z-10 border-y border-slate-250/20 dark:border-slate-800/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Everything you need to excel</h2>
            <p className="text-lg text-slate-500 dark:text-slate-400 leading-relaxed">We've built a comprehensive suite of tools designed specifically for modern education, removing friction so you can focus on learning.</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                whileHover={{ y: -6, scale: 1.02 }}
                className="glass-panel p-8 rounded-3xl border border-slate-250/20 dark:border-slate-800/40 bg-white/40 dark:bg-slate-900/30 backdrop-blur-xl transition-all duration-305 cursor-default relative overflow-hidden shadow-xl"
              >
                <div className={`w-14 h-14 rounded-2xl ${feature.color} flex items-center justify-center mb-6 shadow-sm`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-950 dark:text-white font-outfit">{feature.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium text-sm sm:text-base">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div id="how-it-works" className="py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="lg:w-1/2">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">Seamless onboarding, <br/>instant productivity.</h2>
              <p className="text-lg text-slate-500 dark:text-slate-400 mb-10">
                Say goodbye to complicated setups. Our platform gets out of your way so you can jump straight into the material.
              </p>
              
              <div className="space-y-8">
                {steps.map((step, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: idx * 0.2 }}
                    className="flex gap-4 p-4 rounded-2xl bg-white/30 dark:bg-slate-900/20 hover:bg-white/50 dark:hover:bg-slate-900/40 border border-transparent hover:border-slate-200/30 dark:hover:border-slate-800/30 backdrop-blur-sm transition-all duration-300 group cursor-default"
                  >
                    <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 via-secondary-500 to-purple-500 text-white flex items-center justify-center font-extrabold text-sm sm:text-base font-mono shadow-md shadow-primary-500/10 group-hover:scale-105 transition-transform">
                      {step.num}
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2 font-outfit">{step.title}</h4>
                      <p className="text-slate-650 dark:text-slate-400 leading-relaxed text-sm sm:text-base font-medium">{step.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
            
            <div className="lg:w-1/2 relative w-full aspect-square bg-[#0f172a] rounded-3xl overflow-hidden shadow-2xl border border-slate-800/80 flex items-center justify-center group animate-float3D shadow-primary-500/5">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary-500/10 to-secondary-500/10 mix-blend-overlay pointer-events-none" />
              <img src="/dashboard_preview.png" alt="CM Learning Hub Student Dashboard Preview" className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-700 rounded-3xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div id="testimonials" className="py-24 bg-slate-950 text-white relative z-10 overflow-hidden border-t border-slate-900">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary-600/15 rounded-full blur-[110px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Loved by learners & mentors</h2>
            <p className="text-lg text-slate-450 max-w-2xl mx-auto leading-relaxed">Join thousands of students and educators who have transformed their educational journey with CM Learning Hub.</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-slate-900/50 backdrop-blur-2xl border border-slate-800 p-8 rounded-3xl hover:border-slate-700 transition-all duration-300 shadow-xl">
              <div className="flex text-amber-400 mb-4">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-current" />)}
              </div>
              <p className="text-lg text-slate-200 mb-6 leading-relaxed font-medium">"The gamified quizzes actually make me want to study. I can see my progress visually, and having direct access to my mentor has improved my grades immensely."</p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center font-bold text-lg text-slate-200">AJ</div>
                <div>
                  <h4 className="font-bold text-white font-outfit">Alex Johnson</h4>
                  <p className="text-sm text-slate-500 font-semibold">High School Student</p>
                </div>
              </div>
            </div>
            
            <div className="bg-slate-900/50 backdrop-blur-2xl border border-slate-800 p-8 rounded-3xl hover:border-slate-700 transition-all duration-300 shadow-xl">
              <div className="flex text-amber-400 mb-4">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-current" />)}
              </div>
              <p className="text-lg text-slate-200 mb-6 leading-relaxed font-medium">"As a mentor, managing 30 students used to be a nightmare. Now, I assign tests, track attendance, and analyze results all from one beautiful dashboard."</p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary-600 flex items-center justify-center font-bold text-lg text-white shadow-md shadow-primary-500/10">SM</div>
                <div>
                  <h4 className="font-bold text-white font-outfit">Sarah Mitchell</h4>
                  <p className="text-sm text-slate-500 font-semibold">Certified Mentor</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 relative z-10 text-center px-4">
        <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">Ready to transform your learning?</h2>
        <p className="text-xl text-slate-500 dark:text-slate-400 mb-10 max-w-2xl mx-auto">Join today and get immediate access to our premium library, interactive quizzes, and dedicated mentorship programs.</p>
        <Link to="/register" className="inline-flex items-center px-8 py-4 text-lg font-bold text-white bg-slate-900 dark:bg-white dark:text-slate-900 hover:scale-105 rounded-full transition-all shadow-2xl">
          Create Your Free Account
        </Link>
      </div>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-12 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center space-x-2 mb-6">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">CM</div>
              <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">Learning Hub</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-6 font-medium">
              Empowering the next generation of leaders through accessible, high-quality, and interactive digital education.
            </p>
          </div>
          
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white mb-4">Platform</h4>
            <ul className="space-y-3 text-sm text-slate-500 dark:text-slate-400">
              <li><Link to="/students" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Students</Link></li>
              <li><Link to="/mentors" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Mentors</Link></li>
              <li><Link to="/features" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Features</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white mb-4">Resources</h4>
            <ul className="space-y-3 text-sm text-slate-500 dark:text-slate-400">
              <li><Link to="/help" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Help Center</Link></li>
              <li><Link to="/library-info" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Library</Link></li>
              <li><Link to="/blog" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Blog</Link></li>
              <li><Link to="/community" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Community</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 dark:text-white mb-4">Legal</h4>
            <ul className="space-y-3 text-sm text-slate-500 dark:text-slate-400">
              <li><Link to="/privacy" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Terms of Service</Link></li>
              <li><Link to="/cookies" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Cookie Policy</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between text-sm text-slate-500">
          <p>© {new Date().getFullYear()} CM Learning Hub. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Twitter</a>
            <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">LinkedIn</a>
            <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

const SparklesIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    <path d="M5 3v4" />
    <path d="M19 17v4" />
    <path d="M3 5h4" />
    <path d="M17 19h4" />
  </svg>
);
