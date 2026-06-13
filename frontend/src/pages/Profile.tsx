import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { User, School, Mail, Phone, ShieldCheck, CheckCircle, Briefcase, RefreshCw } from 'lucide-react';

export const Profile: React.FC = () => {
  const { token, fetchProfile } = useAuth();
  const { 
    role, 
    mentorProfile, 
    studentProfile 
  } = useApp();

  const profile = role === 'mentor' ? mentorProfile : studentProfile;

  // Form states
  const [name, setName] = useState(profile?.name || '');
  const [email, setEmail] = useState(profile?.email || '');
  const [school, setSchool] = useState(profile?.school || '');
  const [className, setClassName] = useState(profile?.className || '');
  const [section, setSection] = useState(profile?.section || '');
  const [parentContact, setParentContact] = useState(profile?.parentContact || '');
  
  // Mentor Management
  const [mentorsList, setMentorsList] = useState<any[]>([]);
  const [selectedMentor, setSelectedMentor] = useState<number | ''>((profile as any)?.mentor_id || '');
  const [isChangingMentor, setIsChangingMentor] = useState(false);

  useEffect(() => {
    if (profile && Object.keys(profile).length > 0) {
      setName(profile.name || '');
      setEmail(profile.email || '');
      setSchool(profile.school || '');
      setClassName(profile.className || '');
      setSection(profile.section || '');
      setParentContact(profile.parentContact || '');
      setSelectedMentor((profile as any).mentor_id || '');
    }
  }, [profile]);
  
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Fetch mentors list
  useEffect(() => {
    if (role === 'student') {
      fetch('http://127.0.0.1:5000/api/users/mentors')
        .then(res => res.json())
        .then(data => setMentorsList(data))
        .catch(err => console.error("Failed to fetch mentors", err));
    }
  }, [role]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('photo', file);
    try {
      const res = await fetch('http://127.0.0.1:5000/api/users/upload-photo', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      if (res.ok) {
        await fetchProfile();
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('http://127.0.0.1:5000/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          school,
          class_name: className,
          section,
          parent_contact: parentContact
        })
      });
      if (res.ok) {
        await fetchProfile();
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleChangeMentor = async () => {
    if (!selectedMentor) return;
    setIsChangingMentor(true);
    try {
      const res = await fetch('http://127.0.0.1:5000/api/users/change-mentor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ mentor_id: selectedMentor })
      });
      if (res.ok) {
        await fetchProfile(); // refresh auth context user
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsChangingMentor(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold font-outfit text-slate-800 dark:text-white">Profile Details</h2>
        <p className="text-xs text-slate-400 font-medium">Update account fields and mentoring information</p>
      </div>

      <div className="glass-panel p-6 rounded-2xl shadow-sm space-y-6">
        {/* Profile Header Avatar */}
        <div className="flex items-center space-x-4">
          <div className="relative group cursor-pointer">
            <img 
              src={profile.photoUrl || 'https://ui-avatars.com/api/?name=' + profile.name} 
              alt={profile.name} 
              referrerPolicy="no-referrer"
              className="w-16 h-16 rounded-2xl object-cover ring-4 ring-slate-100 dark:ring-slate-800"
            />
            <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={handlePhotoUpload} accept="image/*" title="Upload new photo" />
            <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-0">
              <RefreshCw className="w-5 h-5 text-white" />
            </div>
            <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 border-2 border-white dark:border-slate-900 rounded-full z-20 ${role === 'mentor' ? 'bg-blue-500' : 'bg-green-500'}`} />
          </div>
          <div>
            <h3 className="text-lg font-bold font-outfit text-slate-800 dark:text-white leading-tight">{profile.name}</h3>
            <p className="text-xs text-slate-400 font-semibold capitalize mt-1">{role} Workspace Account</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-450 uppercase mb-1.5">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 pl-9 pr-4 py-2 rounded-lg text-xs text-slate-800 dark:text-white focus:outline-none focus:border-primary-500 font-semibold"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-450 uppercase mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 pl-9 pr-4 py-2 rounded-lg text-xs text-slate-850 dark:text-white focus:outline-none focus:border-primary-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Student Specific Fields */}
          {role === 'student' && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-450 uppercase mb-1.5">School Name</label>
                <div className="relative">
                  <School className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text" 
                    value={school}
                    onChange={(e) => setSchool(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 pl-9 pr-4 py-2 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-primary-500"
                    placeholder="e.g. High School Academy"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-450 uppercase mb-1.5">Class / Grade</label>
                  <input 
                    type="text" 
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg text-xs text-slate-800"
                    placeholder="Grade 10"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-450 uppercase mb-1.5">Section</label>
                  <input 
                    type="text" 
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg text-xs text-slate-800"
                    placeholder="Section A"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-450 uppercase mb-1.5">Parent Contact Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text" 
                    value={parentContact}
                    onChange={(e) => setParentContact(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 pl-9 pr-4 py-2 rounded-lg text-xs text-slate-800"
                    placeholder="+1 (555) 012-3456"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <label className="block text-xs font-bold text-slate-450 uppercase mb-3">Assigned Mentor</label>
                <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-3">
                  <div className="relative flex-1 w-full">
                    <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <select
                      value={selectedMentor}
                      onChange={(e) => setSelectedMentor(Number(e.target.value) || '')}
                      className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 pl-9 pr-4 py-2 rounded-lg text-xs text-slate-800 dark:text-white focus:outline-none focus:border-primary-500"
                    >
                      <option value="">-- No Mentor Assigned --</option>
                      {mentorsList.map(m => (
                        <option key={m.id} value={m.id}>{m.name} ({m.tid})</option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={handleChangeMentor}
                    disabled={isChangingMentor || !selectedMentor || selectedMentor === (profile as any).mentor_id}
                    className="w-full sm:w-auto px-4 py-2 text-xs font-bold bg-secondary-600 hover:bg-secondary-700 disabled:opacity-50 text-white rounded-lg shadow-sm transition-all flex items-center justify-center whitespace-nowrap"
                  >
                    {isChangingMentor ? <RefreshCw className="w-4 h-4 animate-spin mr-1.5" /> : <RefreshCw className="w-4 h-4 mr-1.5" />}
                    Update Mentor
                  </button>
                </div>
              </div>
            </>
          )}

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="flex items-center text-[10px] text-slate-400 font-bold uppercase">
              <ShieldCheck className="w-4 h-4 text-success mr-1" />
              Role Authenticated
            </span>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold bg-primary-600 hover:bg-primary-700 text-white rounded-xl shadow-sm transition-all"
            >
              Save Profile Changes
            </button>
          </div>
        </form>
      </div>

      {/* Save Success Notification */}
      {saveSuccess && (
        <div className="fixed bottom-24 right-8 bg-success-600 text-white font-bold text-xs py-2 px-4 rounded-xl shadow-lg flex items-center z-50 animate-fadeIn">
          <CheckCircle className="w-4.5 h-4.5 mr-1.5" />
          Profile settings saved successfully!
        </div>
      )}
    </div>
  );
};
