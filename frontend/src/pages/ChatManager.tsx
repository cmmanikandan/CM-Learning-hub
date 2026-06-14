import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, Send, User, Users, ArrowLeft, Search, Circle, Paperclip, File, FileText, Image as ImageIcon, X, Loader2 } from 'lucide-react';
import { uploadToCloudinary, getCloudinaryDownloadUrl } from '../utils/cloudinary';

export const ChatManager: React.FC = () => {
  const { 
    role, 
    myStudents, 
    studentProfile,
    chatMessages, 
    fetchChatMessages, 
    sendChatMessage 
  } = useApp();
  const { user } = useAuth();

  const [selectedRecipient, setSelectedRecipient] = useState<any>(null);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  // Mobile: 'list' = contact list, 'chat' = open chat view
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // File upload states
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [attachedFile, setAttachedFile] = useState<{ url: string; name: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Poll chat messages every 4s
  useEffect(() => {
    const fetchCurrent = () => fetchChatMessages(selectedRecipient?.id);
    fetchCurrent();
    const interval = setInterval(fetchCurrent, 4000);
    return () => clearInterval(interval);
  }, [selectedRecipient]);

  // Mark as read
  useEffect(() => {
    const threadKey = selectedRecipient === null ? 'group' : String(selectedRecipient.id);
    localStorage.setItem(`cm_chat_last_read_${threadKey}`, new Date().toISOString());
  }, [selectedRecipient, chatMessages]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploading(true);
      setUploadProgress(0);
      const url = await uploadToCloudinary(file, (progress) => {
        setUploadProgress(progress);
      });
      setAttachedFile({ url, name: file.name });
    } catch (err: any) {
      console.error("Failed to upload file to Chat:", err);
      alert("Failed to upload file. Error: " + (err.message || err));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && !attachedFile) return;
    try {
      setIsSending(true);
      await sendChatMessage(
        selectedRecipient?.id ?? null, 
        inputText.trim(), 
        attachedFile?.url ?? undefined, 
        attachedFile?.name ?? undefined
      );
      setInputText('');
      setAttachedFile(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const mentorRecipient = {
    id: studentProfile?.mentor_id,
    name: 'Mentor Guidance',
    role: 'mentor',
    subtitle: 'Private discussion channel',
  };

  // Select a contact and open chat
  const openChat = (recipient: any) => {
    setSelectedRecipient(recipient);
    setMobileView('chat');
  };

  // Back to contact list on mobile
  const handleBack = () => {
    setMobileView('list');
  };

  const getThreadName = () => {
    if (selectedRecipient === null) return 'Group Discussion';
    return selectedRecipient.name;
  };

  const getThreadSubtitle = () => {
    if (selectedRecipient === null) return 'Announcements & collective Q&A';
    return selectedRecipient.role === 'mentor' ? 'Teacher · Direct Message' : 'Student · Direct Message';
  };

  // Format date for message groups
  const formatMsgDate = (ts: string) => {
    const d = new Date(ts);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Group messages by date
  const groupedMessages: { date: string; messages: any[] }[] = [];
  chatMessages.forEach(msg => {
    const dateLabel = formatMsgDate(msg.timestamp);
    const last = groupedMessages[groupedMessages.length - 1];
    if (last && last.date === dateLabel) {
      last.messages.push(msg);
    } else {
      groupedMessages.push({ date: dateLabel, messages: [msg] });
    }
  });

  // ─── Contact List ───────────────────────────────────────────
  const ContactList = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
        <h3 className="font-extrabold text-lg text-slate-800 dark:text-white font-outfit">Messages</h3>
        <p className="text-xs text-slate-400 font-medium mt-0.5">Chats &amp; group channels</p>
        {/* Search */}
        <div className="mt-3 flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-xl px-3 py-2">
          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search contacts..."
            className="flex-1 bg-transparent text-xs text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none"
          />
        </div>
      </div>

      {/* Contact items */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {/* Group discussion */}
        <button
          onClick={() => openChat(null)}
          className={`w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-all active:scale-[0.98] ${
            selectedRecipient === null
              ? 'bg-primary-50 dark:bg-primary-950/20'
              : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
          }`}
        >
          <div className="w-12 h-12 rounded-2xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-slate-800 dark:text-white truncate">Group Discussion</p>
              <Circle className="w-2 h-2 fill-primary-500 text-primary-500 shrink-0 ml-2" />
            </div>
            <p className="text-xs text-slate-400 mt-0.5 truncate">Class-wide board</p>
          </div>
        </button>

        {/* Mentor's students */}
        {role === 'mentor' && myStudents.length > 0 && (
          <div className="pt-3">
            <span className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">My Students</span>
            {myStudents
              .filter(s => !searchTerm || s.name.toLowerCase().includes(searchTerm.toLowerCase()))
              .map(student => (
                <button
                  key={student.id}
                  onClick={() => openChat(student)}
                  className={`w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-all active:scale-[0.98] ${
                    selectedRecipient?.id === student.id
                      ? 'bg-primary-50 dark:bg-primary-950/20'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <img
                    src={student.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=0D8ABC&color=fff`}
                    alt={student.name}
                    className="w-12 h-12 rounded-2xl object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{student.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5 truncate">{student.className || 'Student'} · {student.section || ''}</p>
                  </div>
                </button>
              ))}
          </div>
        )}

        {/* Student's mentor */}
        {role === 'student' && studentProfile?.mentor_id && (
          <div className="pt-3">
            <span className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">My Mentor</span>
            <button
              onClick={() => openChat(mentorRecipient)}
              className={`w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-all active:scale-[0.98] ${
                selectedRecipient?.id === mentorRecipient.id
                  ? 'bg-primary-50 dark:bg-primary-950/20'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/20 flex items-center justify-center shrink-0">
                <User className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800 dark:text-white">Mentor Guidance</p>
                <p className="text-xs text-slate-400 mt-0.5">Private discussion channel</p>
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // ─── Chat View ──────────────────────────────────────────────
  const ChatView = () => (
    <div className="flex flex-col h-full">
      {/* Thread Header */}
      <div className="flex items-center gap-3 px-3 sm:px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
        {/* Back button — mobile only */}
        <button
          onClick={handleBack}
          className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 active:scale-95"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        </button>

        {/* Avatar */}
        <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
          {selectedRecipient === null
            ? <Users className="w-4.5 h-4.5 text-primary-500" />
            : selectedRecipient.photoUrl
              ? <img src={selectedRecipient.photoUrl} alt="" className="w-full h-full object-cover rounded-xl" />
              : <User className="w-4.5 h-4.5 text-slate-500" />
          }
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-extrabold text-slate-800 dark:text-white font-outfit leading-tight truncate">{getThreadName()}</h4>
          <p className="text-[10px] text-slate-400 font-medium truncate">{getThreadSubtitle()}</p>
        </div>

        {/* Live badge */}
        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 px-2 py-1 rounded-full shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-5 py-4 space-y-5">
        {chatMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3 py-16">
            <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center">
              <MessageSquare className="w-7 h-7 text-slate-400" />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-slate-600 dark:text-slate-400">No messages yet</p>
              <p className="text-xs text-slate-400 mt-1">Be the first to say something!</p>
            </div>
          </div>
        ) : (
          groupedMessages.map(group => (
            <div key={group.date}>
              {/* Date separator */}
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700/60" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">{group.date}</span>
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700/60" />
              </div>

              <div className="space-y-3">
                {group.messages.map(msg => {
                  const isOwn = (role === 'mentor' && msg.sender_role === 'mentor') ||
                    (role === 'student' && msg.sender_role === 'student' && msg.sender_name === (user?.name || studentProfile?.name));

                  return (
                    <div key={msg.id} className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                      {/* Sender label */}
                      <div className={`flex items-center gap-1.5 mb-1.5 ${isOwn ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[9px] font-black text-white shrink-0 ${
                          isOwn ? 'bg-primary-600' : 'bg-slate-400 dark:bg-slate-600'
                        }`}>
                          {(isOwn ? (user?.name || 'Y') : msg.sender_name)?.[0]?.toUpperCase()}
                        </div>
                        <span className="text-[10px] text-slate-400 font-semibold">
                          {isOwn ? 'You' : msg.sender_name}
                        </span>
                      </div>

                      {/* Bubble */}
                      <div className={`max-w-[80%] sm:max-w-[65%] px-3.5 py-2 rounded-2xl text-sm leading-relaxed break-words flex flex-col justify-between ${
                        isOwn
                          ? 'bg-primary-600 text-white rounded-tr-sm shadow-sm shadow-primary-500/20'
                          : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-100 dark:border-slate-700 rounded-tl-sm shadow-sm'
                      }`}>
                        {msg.file_url && msg.file_url.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i) && (
                          <div className="mb-1.5 mt-0.5">
                            <img 
                              src={msg.file_url} 
                              alt={msg.file_name || "attachment"} 
                              className="max-w-full sm:max-w-sm max-h-48 object-cover rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => window.open(msg.file_url, '_blank')}
                            />
                          </div>
                        )}
                        {msg.file_url && !msg.file_url.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i) && (
                          <div className="mb-1.5 mt-0.5">
                            <a 
                              href={getCloudinaryDownloadUrl(msg.file_url)} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className={`flex items-center space-x-2 p-2 rounded-xl border text-xs font-bold transition-all ${
                                isOwn 
                                  ? 'bg-primary-750/40 hover:bg-primary-700/80 border-primary-500 text-white' 
                                  : 'bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                              }`}
                            >
                              {msg.file_name?.match(/\.pdf$/i) ? (
                                <FileText className="w-4 h-4 text-red-500 shrink-0" />
                              ) : (
                                <File className="w-4 h-4 text-indigo-500 shrink-0" />
                              )}
                              <span className="truncate flex-1 max-w-[150px] sm:max-w-[200px]" title={msg.file_name}>
                                {msg.file_name || "Attachment"}
                              </span>
                            </a>
                          </div>
                        )}
                        {msg.content && msg.content.trim() && (
                          <div className="font-medium text-xs sm:text-sm">{msg.content}</div>
                        )}
                        <div className={`text-[9px] mt-1 flex items-center justify-end gap-1 select-none leading-none ${isOwn ? 'text-white/70' : 'text-slate-400'}`}>
                          <span>
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {isOwn && msg.recipient_id && (
                            msg.is_read ? (
                              <span className="text-cyan-300 font-extrabold" title="Read">✓✓</span>
                            ) : (
                              <span className="text-white/50" title="Sent">✓</span>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box Wrapper */}
      <div className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
        {/* Upload Progress Bar */}
        {isUploading && (
          <div className="px-4 py-1.5 bg-primary-50/50 dark:bg-primary-950/10 border-b border-primary-100/30 flex items-center justify-between text-[10px] font-bold text-primary-600 dark:text-primary-400">
            <span className="flex items-center gap-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading file...
            </span>
            <span>{uploadProgress}%</span>
            <div className="absolute top-0 left-0 h-0.5 bg-primary-500 transition-all duration-200" style={{ width: `${uploadProgress}%` }} />
          </div>
        )}

        {/* Attached File Preview Card */}
        {attachedFile && (
          <div className="px-4 py-2 bg-slate-50 dark:bg-slate-950/20 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-2 max-w-[85%]">
              {attachedFile.name.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i) ? (
                <ImageIcon className="w-4 h-4 text-emerald-500 shrink-0" />
              ) : attachedFile.name.match(/\.pdf$/i) ? (
                <FileText className="w-4 h-4 text-red-500 shrink-0" />
              ) : (
                <File className="w-4 h-4 text-indigo-500 shrink-0" />
              )}
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate font-outfit">
                {attachedFile.name}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setAttachedFile(null)}
              className="p-1 rounded-lg text-slate-450 hover:text-danger-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              title="Remove file"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <form
          onSubmit={handleSendMessage}
          className="px-3 sm:px-4 py-3 flex items-end gap-2.5"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSending || isUploading}
            className="w-11 h-11 bg-slate-50 hover:bg-slate-105 dark:bg-slate-800 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 rounded-2xl flex items-center justify-center shrink-0 transition-colors active:scale-95 disabled:opacity-50"
            title="Attach file"
          >
            {isUploading ? (
              <Loader2 className="w-4.5 h-4.5 animate-spin" />
            ) : (
              <Paperclip className="w-4.5 h-4.5" />
            )}
          </button>
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder={attachedFile ? "Add a message or press send..." : `Message ${selectedRecipient === null ? 'group' : selectedRecipient.name}...`}
            className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-2xl text-sm text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-primary-500 transition-colors resize-none"
            disabled={isSending || isUploading}
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={isSending || isUploading || (!inputText.trim() && !attachedFile)}
            className="w-11 h-11 bg-primary-600 hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-2xl shadow-md shadow-primary-500/20 transition-all active:scale-95 flex items-center justify-center shrink-0"
          >
            <Send className="w-4.5 h-4.5" />
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      {/* ═══ DESKTOP LAYOUT (side by side) ════════════════════════════════ */}
      <div className="hidden lg:flex h-[calc(100vh-9rem)] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xl animate-fadeIn">
        {/* Contact sidebar */}
        <div className="w-72 xl:w-80 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50/50 dark:bg-slate-950/20 shrink-0">
          <ContactList />
        </div>

        {/* Chat panel or placeholder */}
        <div className="flex-1 flex flex-col min-w-0">
          {selectedRecipient !== undefined ? (
            <ChatView />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-4">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center">
                <MessageSquare className="w-8 h-8 text-slate-300" />
              </div>
              <div className="text-center">
                <p className="font-bold text-slate-600 dark:text-slate-400">Select a chat to start</p>
                <p className="text-xs text-slate-400 mt-1">Choose a contact or group from the left</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══ MOBILE LAYOUT (full-screen views) ════════════════════════════ */}
      <div className="lg:hidden flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-lg animate-fadeIn" style={{ height: 'calc(100svh - 10rem)' }}>
        {mobileView === 'list' ? (
          <ContactList />
        ) : (
          <ChatView />
        )}
      </div>
    </>
  );
};
