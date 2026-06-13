import React, { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Bell, 
  BookOpen, 
  FileQuestion, 
  FileText, 
  Award, 
  UploadCloud, 
  CheckCheck,
  Calendar,
  X,
  Trash2
} from 'lucide-react';

export const Notifications: React.FC = () => {
  const { notifications, markAllNotificationsRead, dismissNotification, clearAllNotifications } = useApp();

  // Mark all read on component mount
  useEffect(() => {
    markAllNotificationsRead();
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'homework':
        return <BookOpen className="w-5 h-5 text-blue-500" />;
      case 'quiz':
        return <FileQuestion className="w-5 h-5 text-emerald-500" />;
      case 'test':
        return <FileText className="w-5 h-5 text-amber-500" />;
      case 'result':
        return <Award className="w-5 h-5 text-success-600" />;
      case 'material':
        return <UploadCloud className="w-5 h-5 text-sky-500" />;
      case 'achievement':
        return <Award className="w-5 h-5 text-yellow-500 animate-bounce" />;
      default:
        return <Bell className="w-5 h-5 text-slate-400" />;
    }
  };

  const getNotificationColor = (type: string, isRead: boolean) => {
    if (isRead) return 'bg-white dark:bg-slate-900 border-slate-200/50 dark:border-slate-800/50';
    
    switch (type) {
      case 'homework':
        return 'bg-blue-50/20 border-blue-100 dark:bg-blue-950/5 dark:border-blue-900/30';
      case 'quiz':
        return 'bg-emerald-50/20 border-emerald-100 dark:bg-emerald-950/5 dark:border-emerald-900/30';
      case 'test':
        return 'bg-amber-50/20 border-amber-100 dark:bg-amber-950/5 dark:border-amber-900/30';
      case 'achievement':
        return 'bg-yellow-50/20 border-yellow-100 dark:bg-yellow-950/5 dark:border-yellow-900/30';
      default:
        return 'bg-slate-50/30 border-slate-200 dark:bg-slate-850/5 dark:border-slate-800/30';
    }
  };

  const handleClearAll = () => {
    if (!window.confirm('Clear all notifications? This cannot be undone.')) return;
    clearAllNotifications();
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-2xl font-bold font-outfit text-slate-800 dark:text-white">Notifications</h2>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
          </p>
        </div>
        
        {notifications.length > 0 && (
          <div className="flex items-center gap-2">
            <button 
              onClick={markAllNotificationsRead}
              className="flex items-center gap-1 text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline px-2 py-1.5 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-950/20 transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all read
            </button>

            <button 
              onClick={handleClearAll}
              className="flex items-center gap-1 text-xs font-bold text-red-500 dark:text-red-400 hover:underline px-2 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* List */}
      <div className="space-y-2.5">
        {notifications.length > 0 ? (
          notifications.map((notif) => (
            <div 
              key={notif.id}
              className={`group p-4 border rounded-xl flex items-start gap-3.5 transition-all shadow-sm relative ${getNotificationColor(notif.type, notif.isRead)}`}
            >
              {/* Icon */}
              <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg shrink-0">
                {getNotificationIcon(notif.type)}
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0 pr-7">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-white font-outfit leading-tight">
                    {notif.title}
                  </h4>
                  <span className="text-[10px] text-slate-400 whitespace-nowrap flex items-center shrink-0">
                    <Calendar className="w-3 h-3 mr-0.5" />
                    {new Date(notif.createdTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  {notif.content}
                </p>
              </div>

              {/* Unread dot */}
              {!notif.isRead && (
                <span className="absolute top-4 right-10 w-2 h-2 rounded-full bg-primary-600 shrink-0" />
              )}

              {/* ✕ Dismiss button — always visible on mobile, hover on desktop */}
              <button
                onClick={() => dismissNotification(notif.id)}
                className="absolute top-3 right-3 p-1 rounded-lg text-slate-300 dark:text-slate-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        ) : (
          <div className="text-center py-14 glass-panel rounded-2xl">
            <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Bell className="w-7 h-7 text-slate-300 dark:text-slate-600" />
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">All caught up!</p>
            <p className="text-xs text-slate-400 mt-1">No notifications yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};
