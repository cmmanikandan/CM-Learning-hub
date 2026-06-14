import React, { useState } from 'react';
import { API_BASE } from '../config/api';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { 
  Moon, 
  Sun, 
  Bell, 
  ShieldAlert, 
  CheckCircle,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

export const Settings: React.FC = () => {
  const { token } = useAuth();
  const { role, theme, setTheme } = useApp();

  // Settings states
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassError, setShowPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState(false);

  // Toggle checks
  const [hwNotify, setHwNotify] = useState(true);
  const [quizNotify, setQuizNotify] = useState(true);
  const [testNotify, setTestNotify] = useState(true);
  const [resultsNotify, setResultsNotify] = useState(true);

  // Security checks
  const [twoFactor, setTwoFactor] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowPassError('');

    if (!oldPassword || !newPassword || !confirmPassword) {
      setShowPassError('All password fields are required.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setShowPassError('New passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setShowPassError('Password must be at least 6 characters long.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ old_password: oldPassword, new_password: newPassword })
      });
      const data = await res.json();
      
      if (res.ok) {
        setPassSuccess(true);
        setTimeout(() => {
          setPassSuccess(false);
          setOldPassword('');
          setNewPassword('');
          setConfirmPassword('');
        }, 2500);
      } else {
        setShowPassError(data.message || 'Failed to change password');
      }
    } catch (err) {
      console.error(err);
      setShowPassError('Network error occurred');
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold font-outfit text-slate-800 dark:text-white">Workspace Settings</h2>
        <p className="text-xs text-slate-400 font-medium">Configure preferences theme behaviors and account protections</p>
      </div>

      <div className="space-y-6">
        {/* Theme customization */}
        <div className="glass-panel p-5 rounded-2xl shadow-sm">
          <h3 className="font-bold text-sm text-slate-850 dark:text-white font-outfit flex items-center mb-3">
            {theme === 'light' ? <Sun className="w-5 h-5 text-amber-500 mr-2" /> : <Moon className="w-5 h-5 text-indigo-400 mr-2" />}
            Theme Appearance
          </h3>
          <p className="text-xs text-slate-400 mb-4 leading-normal">Switch between light, dark, or auto (follows your device's system setting)</p>
          
          <div className="flex gap-2 text-xs">
            <button
              onClick={() => setTheme('light')}
              className={`flex-1 flex items-center justify-center space-x-2 p-3 rounded-xl border font-bold transition-all ${
                theme === 'light' && localStorage.getItem('cm_theme') === 'light'
                  ? 'bg-amber-50 text-amber-700 border-amber-200' 
                  : 'bg-white dark:bg-slate-900 border-slate-200/50 dark:border-slate-800 text-slate-500'
              }`}
            >
              <Sun className="w-4.5 h-4.5" />
              <span>Light</span>
            </button>
            
            <button
              onClick={() => setTheme('dark')}
              className={`flex-1 flex items-center justify-center space-x-2 p-3 rounded-xl border font-bold transition-all ${
                theme === 'dark' && localStorage.getItem('cm_theme') === 'dark'
                  ? 'bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-950/20' 
                  : 'bg-white dark:bg-slate-900 border-slate-200/50 dark:border-slate-800 text-slate-500'
              }`}
            >
              <Moon className="w-4.5 h-4.5" />
              <span>Dark</span>
            </button>

            <button
              onClick={() => setTheme('system')}
              className={`flex-1 flex items-center justify-center space-x-2 p-3 rounded-xl border font-bold transition-all ${
                !localStorage.getItem('cm_theme')
                  ? 'bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-950/20' 
                  : 'bg-white dark:bg-slate-900 border-slate-200/50 dark:border-slate-800 text-slate-500'
              }`}
            >
              <span className="text-base">🖥️</span>
              <span>Auto</span>
            </button>
          </div>
        </div>

        {/* Notification settings */}
        <div className="glass-panel p-5 rounded-2xl shadow-sm">
          <h3 className="font-bold text-sm text-slate-850 dark:text-white font-outfit flex items-center mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">
            <Bell className="w-5 h-5 text-primary-500 mr-2" />
            Notification Toggles
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200 font-outfit">Homework Assigned Reminders</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Receive notifications when homework deadlines are set</p>
              </div>
              <button onClick={() => setHwNotify(!hwNotify)} className="text-slate-400 focus:outline-none">
                {hwNotify ? <ToggleRight className="w-8 h-8 text-primary-600" /> : <ToggleLeft className="w-8 h-8" />}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200 font-outfit">Quiz Alerts</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Receive notifications when quizzes are scheduled</p>
              </div>
              <button onClick={() => setQuizNotify(!quizNotify)} className="text-slate-400 focus:outline-none">
                {quizNotify ? <ToggleRight className="w-8 h-8 text-primary-600" /> : <ToggleLeft className="w-8 h-8" />}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200 font-outfit">Test Alerts</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Receive notifications when monthly exam papers are uploaded</p>
              </div>
              <button onClick={() => setTestNotify(!testNotify)} className="text-slate-400 focus:outline-none">
                {testNotify ? <ToggleRight className="w-8 h-8 text-primary-600" /> : <ToggleLeft className="w-8 h-8" />}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200 font-outfit">Result Published Alerts</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Receive notifications when grading evaluations are complete</p>
              </div>
              <button onClick={() => setResultsNotify(!resultsNotify)} className="text-slate-400 focus:outline-none">
                {resultsNotify ? <ToggleRight className="w-8 h-8 text-primary-600" /> : <ToggleLeft className="w-8 h-8" />}
              </button>
            </div>
          </div>
        </div>

        {/* Security configuration */}
        <div className="glass-panel p-5 rounded-2xl shadow-sm space-y-6">
          <h3 className="font-bold text-sm text-slate-850 dark:text-white font-outfit flex items-center border-b border-slate-100 dark:border-slate-800 pb-2">
            <ShieldAlert className="w-5 h-5 text-warning mr-2" />
            Security & Login Protection
          </h3>

          {/* Teacher Two Factor Authentication */}
          {role === 'mentor' && (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200 font-outfit">Two-Factor Authentication (2FA)</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Add an extra layer of login verification protection for teacher portal</p>
              </div>
              <button onClick={() => setTwoFactor(!twoFactor)} className="text-slate-400 focus:outline-none">
                {twoFactor ? <ToggleRight className="w-8 h-8 text-primary-600" /> : <ToggleLeft className="w-8 h-8" />}
              </button>
            </div>
          )}

          {/* Student Remember Me */}
          {role === 'student' && (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200 font-outfit">Remember Me</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Keep student login active on this browser without prompting credentials</p>
              </div>
              <button onClick={() => setRememberMe(!rememberMe)} className="text-slate-400 focus:outline-none">
                {rememberMe ? <ToggleRight className="w-8 h-8 text-primary-600" /> : <ToggleLeft className="w-8 h-8" />}
              </button>
            </div>
          )}

          {/* Password modifier */}
          <form onSubmit={handlePasswordChange} className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Change Account Password</h4>
            
            {showPassError && (
              <div className="p-3 bg-red-50 text-danger-600 dark:bg-red-950/20 text-xs rounded-xl font-bold">
                ⚠️ {showPassError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Current Password</label>
                <input 
                  type="password" 
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">New Password</label>
                <input 
                  type="password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Confirm Password</label>
                <input 
                  type="password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-all"
            >
              Update Password
            </button>
          </form>
        </div>
      </div>

      {/* Pass Success toast */}
      {passSuccess && (
        <div className="fixed bottom-24 right-8 bg-success-600 text-white font-bold text-xs py-2 px-4 rounded-xl shadow-lg flex items-center z-50 animate-fadeIn">
          <CheckCircle className="w-4.5 h-4.5 mr-1.5 animate-bounce" />
          Password changed successfully!
        </div>
      )}
    </div>
  );
};
