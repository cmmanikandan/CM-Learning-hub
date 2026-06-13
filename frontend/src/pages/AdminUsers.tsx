import React, { useState, useEffect, useCallback } from 'react';
import { ModalPortal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import {
  Search, Trash2, Edit2, UserX, Briefcase, GraduationCap,
  RefreshCw, Plus, X, Eye, EyeOff, Shield,
  KeyRound, UserCheck, Users, AlertCircle, Check
} from 'lucide-react';

interface User {
  id: number;
  name: string;
  email: string;
  username: string;
  role: 'mentor' | 'student' | 'admin';
  sid?: string;
  tid?: string;
  mentor_id?: number;
  mentor_name?: string;
  student_count?: number;
  school?: string;
  class_name?: string;
  section?: string;
  parent_contact?: string;
  streak?: number;
  photo_url?: string;
}

interface CreateFormData {
  role: 'mentor' | 'student' | 'admin';
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  school: string;
  class_name: string;
  section: string;
  parent_contact: string;
  mentor_id: string;
  sid: string;
  tid: string;
}

const INITIAL_FORM: CreateFormData = {
  role: 'student',
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  school: '',
  class_name: '',
  section: '',
  parent_contact: '',
  mentor_id: '',
  sid: '',
  tid: '',
};

// Allow external navigation to pre-select a role (from AdminDashboard quick actions)
// We detect the tab name passed to the parent and decode role from it.
interface AdminUsersProps {
  initialCreateRole?: 'mentor' | 'student' | 'admin' | null;
  onCreateRoleConsumed?: () => void;
}

export const AdminUsers: React.FC<AdminUsersProps> = ({ initialCreateRole, onCreateRoleConsumed }) => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<'mentors' | 'students' | 'admins'>('mentors');
  const [mentors, setMentors] = useState<User[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [admins, setAdmins] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Create modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState<CreateFormData>({ ...INITIAL_FORM });
  const [showPass, setShowPass] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Edit modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<Partial<User & { mentor_id_str: string }>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Reset password modal
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetUser, setResetUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showResetPass, setShowResetPass] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Reassign modal
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [newMentorId, setNewMentorId] = useState<number | ''>('');
  const [isReassigning, setIsReassigning] = useState(false);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };
  const showError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(''), 5000);
  };

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('http://127.0.0.1:5000/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMentors(data.mentors || []);
        setStudents(data.students || []);
        setAdmins(data.admins || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) fetchUsers();
  }, [token, fetchUsers]);

  const consumedRoleRef = React.useRef<'mentor' | 'student' | 'admin' | null>(null);

  // Open create modal pre-filled with role from dashboard quick action
  useEffect(() => {
    if (initialCreateRole) {
      if (consumedRoleRef.current !== initialCreateRole) {
        consumedRoleRef.current = initialCreateRole;
        setCreateForm({ ...INITIAL_FORM, role: initialCreateRole });
        setShowCreateModal(true);
        onCreateRoleConsumed?.();
      }
    } else {
      consumedRoleRef.current = null;
    }
  }, [initialCreateRole, onCreateRoleConsumed]);

  // ── CRUD Handlers ────────────────────────────────────────────────────────

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (createForm.password !== createForm.confirmPassword) {
      showError("Passwords don't match.");
      return;
    }
    if (createForm.password.length < 6) {
      showError('Password must be at least 6 characters.');
      return;
    }
    setIsCreating(true);
    try {
      const res = await fetch('http://127.0.0.1:5000/api/admin/users/create', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...createForm,
          mentor_id: createForm.mentor_id ? Number(createForm.mentor_id) : null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showSuccess(`✅ ${data.message}`);
        setShowCreateModal(false);
        setCreateForm({ ...INITIAL_FORM });
        fetchUsers();
        // Switch to the correct tab
        if (createForm.role === 'mentor') setActiveTab('mentors');
        else if (createForm.role === 'student') setActiveTab('students');
        else setActiveTab('admins');
      } else {
        showError(data.message || 'Failed to create user.');
      }
    } catch {
      showError('Network error. Is the backend running?');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (user: User) => {
    if (!window.confirm(`Delete "${user.name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/admin/users/${user.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        showSuccess(`✅ ${data.message}`);
        fetchUsers();
      } else {
        showError(data.message || 'Delete failed.');
      }
    } catch {
      showError('Network error.');
    }
  };

  const openEdit = (user: User) => {
    setEditingUser(user);
    setEditForm({
      ...user,
      mentor_id_str: user.mentor_id ? String(user.mentor_id) : '',
    });
    setShowEditModal(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsSaving(true);
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name,
          email: editForm.email,
          school: editForm.school,
          class_name: editForm.class_name,
          section: editForm.section,
          parent_contact: editForm.parent_contact,
          sid: editForm.sid,
          tid: editForm.tid,
          mentor_id: editForm.mentor_id_str ? Number(editForm.mentor_id_str) : null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showSuccess(`✅ ${data.message}`);
        setShowEditModal(false);
        fetchUsers();
      } else {
        showError(data.message || 'Update failed.');
      }
    } catch {
      showError('Network error.');
    } finally {
      setIsSaving(false);
    }
  };

  const openReset = (user: User) => {
    setResetUser(user);
    setNewPassword('');
    setShowResetModal(true);
  };

  const handleResetPassword = async () => {
    if (!resetUser) return;
    if (newPassword.length < 6) { showError('Password must be ≥ 6 characters.'); return; }
    setIsResetting(true);
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/admin/users/${resetUser.id}/reset-password`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_password: newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        showSuccess(`✅ ${data.message}`);
        setShowResetModal(false);
      } else {
        showError(data.message || 'Reset failed.');
      }
    } catch {
      showError('Network error.');
    } finally {
      setIsResetting(false);
    }
  };

  const openReassign = (student: User) => {
    setSelectedStudent(student);
    setNewMentorId(student.mentor_id || '');
    setShowReassignModal(true);
  };

  const handleReassign = async () => {
    if (!selectedStudent) return;
    setIsReassigning(true);
    try {
      const res = await fetch('http://127.0.0.1:5000/api/admin/reassign', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: selectedStudent.id, mentor_id: newMentorId || null }),
      });
      const data = await res.json();
      if (res.ok) {
        showSuccess(`✅ ${data.message}`);
        setShowReassignModal(false);
        fetchUsers();
      } else {
        showError(data.message || 'Reassign failed.');
      }
    } catch {
      showError('Network error.');
    } finally {
      setIsReassigning(false);
    }
  };

  // ── Filtered Lists ───────────────────────────────────────────────────────

  const filterList = (list: User[]) =>
    list.filter(u =>
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.sid?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.tid?.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const displayList = filterList(
    activeTab === 'mentors' ? mentors : activeTab === 'students' ? students : admins
  );

  const tabs: { id: 'mentors' | 'students' | 'admins'; label: string; icon: React.ComponentType<any>; count: number; color: string }[] = [
    { id: 'mentors', label: 'Mentors', icon: Briefcase, count: mentors.length, color: 'text-blue-600 border-blue-500 bg-blue-50/50 dark:bg-blue-900/10 dark:text-blue-400 dark:border-blue-400' },
    { id: 'students', label: 'Students', icon: GraduationCap, count: students.length, color: 'text-emerald-600 border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10 dark:text-emerald-400 dark:border-emerald-400' },
    { id: 'admins', label: 'Admins', icon: Shield, count: admins.length, color: 'text-violet-600 border-violet-500 bg-violet-50/50 dark:bg-violet-900/10 dark:text-violet-400 dark:border-violet-400' },
  ];

  // ── Shared modal backdrop (now via portal) ─────────────────────────────

  const inputClass = "w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-800 dark:text-white placeholder:text-slate-400 transition-all";
  const labelClass = "block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5";

  return (
    <div className="space-y-5 animate-fadeIn">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black font-outfit text-slate-800 dark:text-white">User Management</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Create, edit, and manage all platform accounts.</p>
        </div>
        <button
          onClick={() => { setCreateForm({ ...INITIAL_FORM }); setShowCreateModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-bold transition-all shadow-sm active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Create User
        </button>
      </div>

      {/* ── Toast / Alert ──────────────────────────────────── */}
      {successMsg && (
        <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 rounded-xl text-sm font-bold text-emerald-700 dark:text-emerald-300 animate-fadeIn">
          <Check className="w-4 h-4 shrink-0" />
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-xl text-sm font-bold text-red-700 dark:text-red-300 animate-fadeIn">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {errorMsg}
        </div>
      )}

      {/* ── Search ────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="flex-1 glass-panel flex items-center gap-2 px-3.5 py-2.5 rounded-xl">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search by name, email, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent border-none focus:outline-none text-slate-800 dark:text-white text-sm placeholder:text-slate-400"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <button
          onClick={fetchUsers}
          className="p-2.5 glass-panel rounded-xl text-slate-500 hover:text-primary-600 transition-colors"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* ── Tabs + Table ──────────────────────────────────── */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="flex border-b border-slate-200 dark:border-slate-800">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-bold transition-colors border-b-2 ${
                  isActive
                    ? tab.color + ' border-current'
                    : 'text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-black bg-slate-100 dark:bg-slate-800 text-slate-500">
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <RefreshCw className="w-8 h-8 animate-spin text-slate-300" />
            </div>
          ) : (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-[11px] font-black text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">User</th>
                  <th className="px-5 py-3.5">ID</th>
                  <th className="px-5 py-3.5 hidden md:table-cell">Email</th>
                  {activeTab === 'mentors' && <th className="px-5 py-3.5">Students</th>}
                  {activeTab === 'students' && <th className="px-5 py-3.5 hidden sm:table-cell">Mentor</th>}
                  {activeTab === 'students' && <th className="px-5 py-3.5 hidden lg:table-cell">Class</th>}
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {displayList.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors group">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <img
                          src={u.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=6366f1&color=fff&size=36`}
                          alt={u.name}
                          className="w-8 h-8 rounded-xl object-cover shrink-0 ring-1 ring-slate-200 dark:ring-slate-700"
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 dark:text-white truncate text-sm font-outfit">{u.name}</p>
                          <p className="text-xs text-slate-400 truncate">{u.username || u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-slate-500 dark:text-slate-400">
                      {u.tid || u.sid || `#${u.id}`}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 hidden md:table-cell text-xs max-w-[180px] truncate">
                      {u.email}
                    </td>
                    {activeTab === 'mentors' && (
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                          <Users className="w-3 h-3" />
                          {u.student_count ?? 0} students
                        </span>
                      </td>
                    )}
                    {activeTab === 'students' && (
                      <td className="px-5 py-3.5 hidden sm:table-cell">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black ${u.mentor_id ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'}`}>
                          <UserCheck className="w-3 h-3" />
                          {u.mentor_name || 'Unassigned'}
                        </span>
                      </td>
                    )}
                    {activeTab === 'students' && (
                      <td className="px-5 py-3.5 hidden lg:table-cell text-xs text-slate-500 dark:text-slate-400">
                        {u.class_name || '—'} {u.section || ''}
                      </td>
                    )}
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(u)}
                          className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950/20 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openReset(u)}
                          className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20 rounded-lg transition-colors"
                          title="Reset Password"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>
                        {activeTab === 'students' && (
                          <button
                            onClick={() => openReassign(u)}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 rounded-lg transition-colors"
                            title="Reassign Mentor"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {u.role !== 'admin' && (
                          <button
                            onClick={() => handleDelete(u)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {displayList.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center">
                      <UserX className="w-12 h-12 text-slate-200 dark:text-slate-700 mx-auto mb-3" />
                      <p className="text-slate-400 font-medium">No users found.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* CREATE USER MODAL */}
      {showCreateModal && (
        <ModalPortal onClose={() => setShowCreateModal(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-800 my-4">
            {/* Header */}
            <div className="px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black font-outfit text-slate-800 dark:text-white">Create New User</h3>
                <p className="text-xs text-slate-400 mt-0.5">Fill in the details below to add a new account.</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="px-6 py-5 space-y-4 max-h-[75vh] overflow-y-auto">

              {/* Role Selector */}
              <div>
                <label className={labelClass}>Role *</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'student', label: 'Student', icon: GraduationCap, color: 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-300' },
                    { value: 'mentor', label: 'Mentor', icon: Briefcase, color: 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-300' },
                    { value: 'admin', label: 'Admin', icon: Shield, color: 'border-violet-500 bg-violet-50 text-violet-700 dark:bg-violet-950/20 dark:text-violet-300' },
                  ].map((r) => {
                    const Ico = r.icon;
                    const isSelected = createForm.role === r.value;
                    return (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => setCreateForm(f => ({ ...f, role: r.value as any }))}
                        className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-xs font-bold transition-all ${isSelected ? r.color + ' border-current shadow-sm' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300'}`}
                      >
                        <Ico className="w-5 h-5" />
                        {r.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Name + Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Full Name *</label>
                  <input required value={createForm.name} onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))} className={inputClass} placeholder="John Doe" />
                </div>
                <div>
                  <label className={labelClass}>Email *</label>
                  <input required type="email" value={createForm.email} onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))} className={inputClass} placeholder="user@example.com" />
                </div>
              </div>

              {/* Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Password *</label>
                  <div className="relative">
                    <input required type={showPass ? 'text' : 'password'} value={createForm.password} onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))} className={inputClass + ' pr-10'} placeholder="Min. 6 characters" />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Confirm Password *</label>
                  <input required type={showPass ? 'text' : 'password'} value={createForm.confirmPassword} onChange={e => setCreateForm(f => ({ ...f, confirmPassword: e.target.value }))} className={inputClass} placeholder="Repeat password" />
                </div>
              </div>

              {/* Student-specific fields */}
              {createForm.role === 'student' && (
                <>
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">Student Details</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div>
                        <label className={labelClass}>School</label>
                        <input value={createForm.school} onChange={e => setCreateForm(f => ({ ...f, school: e.target.value }))} className={inputClass} placeholder="School name" />
                      </div>
                      <div>
                        <label className={labelClass}>Class</label>
                        <input value={createForm.class_name} onChange={e => setCreateForm(f => ({ ...f, class_name: e.target.value }))} className={inputClass} placeholder="e.g. 10" />
                      </div>
                      <div>
                        <label className={labelClass}>Section</label>
                        <input value={createForm.section} onChange={e => setCreateForm(f => ({ ...f, section: e.target.value }))} className={inputClass} placeholder="A / B / C" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                      <div>
                        <label className={labelClass}>Parent Contact</label>
                        <input type="tel" value={createForm.parent_contact} onChange={e => setCreateForm(f => ({ ...f, parent_contact: e.target.value }))} className={inputClass} placeholder="+91 9999999999" />
                      </div>
                      <div>
                        <label className={labelClass}>Assign Mentor</label>
                        <select value={createForm.mentor_id} onChange={e => setCreateForm(f => ({ ...f, mentor_id: e.target.value }))} className={inputClass}>
                          <option value="">-- No mentor --</option>
                          {mentors.map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="mt-3">
                      <label className={labelClass}>Student ID (auto-generated if blank)</label>
                      <input value={createForm.sid} onChange={e => setCreateForm(f => ({ ...f, sid: e.target.value }))} className={inputClass} placeholder="e.g. S1042" />
                    </div>
                  </div>
                </>
              )}

              {/* Mentor-specific fields */}
              {createForm.role === 'mentor' && (
                <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">Mentor Details</p>
                  <div>
                    <label className={labelClass}>Teacher ID (auto-generated if blank)</label>
                    <input value={createForm.tid} onChange={e => setCreateForm(f => ({ ...f, tid: e.target.value }))} className={inputClass} placeholder="e.g. T1001" />
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-bold rounded-xl transition-colors">Cancel</button>
                <button type="submit" disabled={isCreating} className="flex-1 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold rounded-xl disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
                  {isCreating ? <><RefreshCw className="w-4 h-4 animate-spin" /> Creating...</> : <><UserCheck className="w-4 h-4" /> Create User</>}
                </button>
              </div>
            </form>
          </div>
        </ModalPortal>
      )}

      {/* ════════════════════════════════════════════════════════════ */}
      {/* EDIT USER MODAL */}
      {showEditModal && editingUser && (
        <ModalPortal onClose={() => setShowEditModal(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-800 my-4">
            <div className="px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black font-outfit text-slate-800 dark:text-white">Edit User</h3>
                <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${editingUser.role === 'mentor' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : editingUser.role === 'admin' ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'}`}>
                    {editingUser.role}
                  </span>
                  {editingUser.email}
                </p>
              </div>
              <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEdit} className="px-6 py-5 space-y-3 max-h-[70vh] overflow-y-auto">
              <div>
                <label className={labelClass}>Full Name</label>
                <input value={editForm.name || ''} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Email</label>
                <input type="email" value={editForm.email || ''} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} className={inputClass} />
              </div>
              {editingUser.role === 'student' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>School</label>
                      <input value={editForm.school || ''} onChange={e => setEditForm(f => ({ ...f, school: e.target.value }))} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Class</label>
                      <input value={editForm.class_name || ''} onChange={e => setEditForm(f => ({ ...f, class_name: e.target.value }))} className={inputClass} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>Section</label>
                      <input value={editForm.section || ''} onChange={e => setEditForm(f => ({ ...f, section: e.target.value }))} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Parent Contact</label>
                      <input value={editForm.parent_contact || ''} onChange={e => setEditForm(f => ({ ...f, parent_contact: e.target.value }))} className={inputClass} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>Student ID</label>
                      <input value={editForm.sid || ''} onChange={e => setEditForm(f => ({ ...f, sid: e.target.value }))} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Assigned Mentor</label>
                      <select value={editForm.mentor_id_str || ''} onChange={e => setEditForm(f => ({ ...f, mentor_id_str: e.target.value }))} className={inputClass}>
                        <option value="">-- No mentor --</option>
                        {mentors.map(m => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              )}
              {editingUser.role === 'mentor' && (
                <div>
                  <label className={labelClass}>Teacher ID</label>
                  <input value={editForm.tid || ''} onChange={e => setEditForm(f => ({ ...f, tid: e.target.value }))} className={inputClass} />
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-bold rounded-xl transition-colors hover:bg-slate-200 dark:hover:bg-slate-700">Cancel</button>
                <button type="submit" disabled={isSaving} className="flex-1 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold rounded-xl disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
                  {isSaving ? <><RefreshCw className="w-4 h-4 animate-spin" /> Saving...</> : <><Check className="w-4 h-4" /> Save Changes</>}
                </button>
              </div>
            </form>
          </div>
        </ModalPortal>
      )}

      {/* ════════════════════════════════════════════════════════════ */}
      {/* RESET PASSWORD MODAL */}
      {showResetModal && resetUser && (
        <ModalPortal onClose={() => setShowResetModal(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-sm border border-slate-200 dark:border-slate-800">
            <div className="px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black font-outfit text-slate-800 dark:text-white">Reset Password</h3>
                <p className="text-xs text-slate-400 mt-0.5">For <strong>{resetUser.name}</strong></p>
              </div>
              <button onClick={() => setShowResetModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className={labelClass}>New Password</label>
                <div className="relative">
                  <input
                    type={showResetPass ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className={inputClass + ' pr-10'}
                    placeholder="Min. 6 characters"
                    autoFocus
                  />
                  <button type="button" onClick={() => setShowResetPass(!showResetPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showResetPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowResetModal(false)} className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Cancel</button>
                <button onClick={handleResetPassword} disabled={isResetting || newPassword.length < 6} className="flex-1 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-xl disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
                  {isResetting ? <><RefreshCw className="w-4 h-4 animate-spin" /> Resetting...</> : <><KeyRound className="w-4 h-4" /> Reset Password</>}
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* ════════════════════════════════════════════════════════════ */}
      {/* REASSIGN MENTOR MODAL */}
      {showReassignModal && selectedStudent && (
        <ModalPortal onClose={() => setShowReassignModal(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-sm border border-slate-200 dark:border-slate-800">
            <div className="px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black font-outfit text-slate-800 dark:text-white">Reassign Mentor</h3>
                <p className="text-xs text-slate-400 mt-0.5">For <strong>{selectedStudent.name}</strong></p>
              </div>
              <button onClick={() => setShowReassignModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className={labelClass}>Select Mentor</label>
                <select value={newMentorId} onChange={e => setNewMentorId(Number(e.target.value) || '')} className={inputClass}>
                  <option value="">-- Unassign (no mentor) --</option>
                  {mentors.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.student_count} students)</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowReassignModal(false)} className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Cancel</button>
                <button onClick={handleReassign} disabled={isReassigning} className="flex-1 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold rounded-xl disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
                  {isReassigning ? <><RefreshCw className="w-4 h-4 animate-spin" /> Saving...</> : <><Check className="w-4 h-4" /> Save</>}
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

    </div>
  );
};
