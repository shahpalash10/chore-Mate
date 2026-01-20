import React, { useState, useEffect, useMemo } from 'react';
import {
    Plus, Check, Bell, User, Calendar, Clock, Trash2,
    Search, LogOut, Coffee, Briefcase, Zap, Shield,
    Users, ChevronRight, LayoutGrid, List, Lock, Eye, EyeOff, X, Mail
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

/* -------------------------------------------------------------------------- */
/* SUPABASE SETUP                               */
/* -------------------------------------------------------------------------- */

const supabaseUrl = window.__supabase_url || 'https://YOUR-PROJECT-ID.supabase.co';
const supabaseAnonKey = window.__supabase_anon_key || 'YOUR-ANON-KEY';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// App version for cache busting - increment this when making auth changes
const APP_VERSION = '1.1.0';
const VERSION_KEY = 'chore_mate_version';

/* -------------------------------------------------------------------------- */
/* HELPER FUNCTIONS                             */
/* -------------------------------------------------------------------------- */

const formatDate = (dateString) => {
    if (!dateString) return 'Today';
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Reset hours to compare just the day
    date.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    tomorrow.setHours(0, 0, 0, 0);

    if (date.getTime() === today.getTime()) return 'Today';
    if (date.getTime() === tomorrow.getTime()) return 'Tomorrow';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const getAvatarUrl = (seed) => {
    return `https://api.dicebear.com/9.x/avataaars/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
};

/* -------------------------------------------------------------------------- */
/* COMPONENTS                                  */
/* -------------------------------------------------------------------------- */

export default function OfficeChoresApp() {
    const [user, setUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    // App State
    const [tasks, setTasks] = useState([]);
    const [allUsers, setAllUsers] = useState([]);

    // UI State
    const [viewState, setViewState] = useState('login'); // 'login', 'signup', 'dashboard', 'forgot-password'
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedEmployeeForTask, setSelectedEmployeeForTask] = useState(null);
    const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
    const [taskCompletedToast, setTaskCompletedToast] = useState(false);

    // Auth Form State
    const [authEmail, setAuthEmail] = useState('');
    const [authPassword, setAuthPassword] = useState('');
    const [authName, setAuthName] = useState(''); // For signup only
    const [authError, setAuthError] = useState('');
    const [authSuccess, setAuthSuccess] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Change Password State
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');

    // Task Form State
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskCategory, setNewTaskCategory] = useState('General');
    const [newTaskDueTime, setNewTaskDueTime] = useState('');
    const [newTaskDueDate, setNewTaskDueDate] = useState('');

    const categories = [
        { name: 'Kitchen', icon: <Coffee size={16} />, color: 'bg-amber-100 text-amber-700' },
        { name: 'Desk', icon: <Briefcase size={16} />, color: 'bg-blue-100 text-blue-700' },
        { name: 'Urgent', icon: <Zap size={16} />, color: 'bg-rose-100 text-rose-700' },
        { name: 'General', icon: <Check size={16} />, color: 'bg-gray-100 text-gray-700' }
    ];

    // --- Cache Cleanup Helper ---
    const clearAuthCache = () => {
        try {
            // Clear any stale auth-related data from localStorage
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && (key.includes('supabase') || key.includes('auth'))) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(key => localStorage.removeItem(key));
            console.log('Auth cache cleared');
        } catch (err) {
            console.error('Error clearing auth cache:', err);
        }
    };

    // --- 1. Authentication & Profile Sync ---

    useEffect(() => {
        let isLoadingProfile = false; // Prevent race conditions
        let loadingTimeout = null;
        let mounted = true;

        const initAuth = async () => {
            try {
                // Check for manual cache clear parameter (from "Open in new tab" button)
                const urlParams = new URLSearchParams(window.location.search);
                const shouldClearCache = urlParams.get('clearCache');
                let cacheWasCleared = false;

                if (shouldClearCache === '1') {
                    console.log('Manual cache clear requested - clearing cache instantly');
                    clearAuthCache();
                    cacheWasCleared = true;
                    // Remove the parameter from URL to clean it up
                    urlParams.delete('clearCache');
                    const newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '');
                    window.history.replaceState({}, '', newUrl);
                }

                // Version check & cache invalidation
                const storedVersion = localStorage.getItem(VERSION_KEY);
                if (storedVersion !== APP_VERSION) {
                    console.log(`Version changed from ${storedVersion} to ${APP_VERSION} - clearing cache`);
                    clearAuthCache();
                    localStorage.setItem(VERSION_KEY, APP_VERSION);
                    cacheWasCleared = true;
                }

                // If we just cleared the cache, immediately sign out and show login
                if (cacheWasCleared) {
                    console.log('Cache cleared - signing out immediately');
                    await supabase.auth.signOut();
                    if (!mounted) return;
                    setUser(null);
                    setUserProfile(null);
                    setViewState('login');
                    setLoading(false);
                    // Do NOT set timeout since we're done here
                    return;
                }

                // Safety timeout: force loading to false after 1 second (ONLY for normal loads, not after cache clear)
                // This timeout is only set if we didn't clear cache above
                loadingTimeout = setTimeout(() => {
                    if (!mounted) return;
                    console.warn('Loading timeout - forcing loading to false');
                    setLoading(false);
                    setAuthError('Loading timeout. Please refresh the page or clear your cache.');
                    clearAuthCache();
                }, 1000);

                // Validate and refresh session
                const { data: { session }, error } = await supabase.auth.getSession();

                if (error) {
                    console.error('Session error:', error);
                    // Clear potentially corrupted session data
                    clearAuthCache();
                    await supabase.auth.signOut();
                    setLoading(false);
                    return;
                }

                if (session) {
                    // Verify session is not expired
                    const expiresAt = session.expires_at;
                    const now = Math.floor(Date.now() / 1000);

                    if (expiresAt && expiresAt < now) {
                        console.warn('Session expired, signing out');
                        clearAuthCache();
                        await supabase.auth.signOut();
                        setLoading(false);
                        return;
                    }

                    if (!mounted) return;
                    setUser(session.user);
                    isLoadingProfile = true;
                    await loadUserProfile(session.user.id);
                    isLoadingProfile = false;
                } else {
                    if (!mounted) return;
                    setLoading(false);
                }
            } catch (err) {
                console.error('Auth initialization error:', err);
                clearAuthCache();
                if (mounted) setLoading(false);
            } finally {
                if (loadingTimeout) clearTimeout(loadingTimeout);
            }
        };

        initAuth();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth state changed:', event, session?.user?.email);

            // Clear any existing timeout
            if (loadingTimeout) clearTimeout(loadingTimeout);

            if (session) {
                // Prevent multiple concurrent profile loads
                if (isLoadingProfile) {
                    console.log('Profile already loading, skipping...');
                    return;
                }

                setUser(session.user);
                isLoadingProfile = true;

                try {
                    await loadUserProfile(session.user.id);
                } catch (err) {
                    console.error('Error in onAuthStateChange:', err);
                    setLoading(false);
                } finally {
                    isLoadingProfile = false;
                }
            } else {
                setUser(null);
                setUserProfile(null);
                setViewState('login');
                setLoading(false);
                isLoadingProfile = false;
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
            if (loadingTimeout) clearTimeout(loadingTimeout);
        };
    }, []);

    const loadUserProfile = async (userId) => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                console.error('Error loading profile:', error);
                // Clear cache and sign out
                clearAuthCache();
                // Use a flag to prevent re-triggering onAuthStateChange immediately
                setTimeout(async () => {
                    await supabase.auth.signOut();
                    setAuthError('User profile not found. Please contact admin.');
                }, 100);
                setLoading(false);
                return;
            }

            setUserProfile(data);
            setViewState('dashboard');
            setLoading(false);
        } catch (err) {
            console.error('Error loading profile:', err);
            // Clear cache and sign out
            clearAuthCache();
            setTimeout(async () => {
                await supabase.auth.signOut();
                setAuthError('Failed to load user profile');
            }, 100);
            setLoading(false);
        }
    };

    // --- 2. Data Sync (Tasks & Users) ---

    useEffect(() => {
        if (!user || !userProfile) return;

        // Subscribe to tasks
        const tasksChannel = supabase
            .channel('tasks-channel')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'tasks' },
                () => {
                    loadTasks();
                }
            )
            .subscribe();

        // Subscribe to users (for admin)
        const usersChannel = supabase
            .channel('users-channel')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'users' },
                () => {
                    loadUsers();
                }
            )
            .subscribe();

        loadTasks();
        loadUsers();

        return () => {
            supabase.removeChannel(tasksChannel);
            supabase.removeChannel(usersChannel);
        };
    }, [user, userProfile]);

    const loadTasks = async () => {
        if (!userProfile) return;

        try {
            let query = supabase
                .from('tasks')
                .select(`
                    *,
                    assigned_to:users!tasks_assigned_to_id_fkey(id, name, email),
                    created_by:users!tasks_created_by_id_fkey(id, name, email)
                `)
                .order('is_completed', { ascending: true })
                .order('due_date', { ascending: true })
                .order('created_at', { ascending: false });

            // Employees only see their tasks (RLS handles this, but we can filter client-side too)
            if (userProfile.role === 'employee') {
                query = query.eq('assigned_to_id', user.id);
            }

            const { data, error } = await query;

            if (error) throw error;

            // Preserve temporary tasks (from optimistic updates) and merge with real data
            setTasks(prevTasks => {
                const tempTasks = prevTasks.filter(t => t.id.toString().startsWith('temp-'));
                const realTasks = data || [];

                // If we have temp tasks, keep them until real tasks arrive
                // The real-time subscription will clean them up naturally
                return [...tempTasks, ...realTasks];
            });
        } catch (err) {
            console.error('Error loading tasks:', err);
        }
    };

    const loadUsers = async () => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .order('name');

            if (error) throw error;

            setAllUsers(data || []);
        } catch (err) {
            console.error('Error loading users:', err);
        }
    };

    // --- Actions ---

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!authEmail.trim() || !authPassword.trim()) {
            setAuthError("Please enter both email and password.");
            return;
        }

        setAuthError('');
        setLoading(true);

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: authEmail,
                password: authPassword,
            });

            if (error) throw error;

            // User will be set via onAuthStateChange
        } catch (err) {
            console.error("Login error:", err);
            setAuthError(err.message || "Login failed. Please check your credentials.");
        } finally {
            setLoading(false);
        }
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        if (!authEmail.trim() || !authPassword.trim() || !authName.trim()) {
            setAuthError("Please fill in all fields.");
            return;
        }

        setAuthError('');
        setLoading(true);

        try {
            // Create auth user
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: authEmail,
                password: authPassword,
            });

            if (authError) throw authError;

            if (!authData.user) {
                throw new Error("Signup failed - no user created");
            }

            // Create user profile (always as employee)
            const { error: profileError } = await supabase
                .from('users')
                .insert({
                    id: authData.user.id,
                    email: authEmail,
                    name: authName,
                    role: 'employee'
                });

            if (profileError) throw profileError;

            // User will be set via onAuthStateChange
        } catch (err) {
            console.error("Signup error:", err);
            setAuthError(err.message || "Signup failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            // Sign out from Supabase
            await supabase.auth.signOut();

            // Explicitly clear all state
            setUser(null);
            setUserProfile(null);
            setViewState('login');

            // Clear auth form fields
            setAuthEmail('');
            setAuthPassword('');
            setAuthName('');
            setAuthError('');
            setShowPassword(false);

            // Clear any task state
            setTasks([]);
            setAllUsers([]);
            setIsAddModalOpen(false);
            setSelectedEmployeeForTask(null);
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        if (!authEmail.trim()) {
            setAuthError("Please enter your email address.");
            return;
        }

        setAuthError('');
        setAuthSuccess('');
        setLoading(true);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(authEmail, {
                redirectTo: `${window.location.origin}`,
            });

            if (error) throw error;

            setAuthSuccess('Password reset link sent! Check your email.');
            setAuthEmail('');
        } catch (err) {
            console.error("Password reset error:", err);
            setAuthError(err.message || "Failed to send reset email. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();

        if (!newPassword.trim() || !confirmPassword.trim()) {
            setPasswordError("Please fill in both password fields.");
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordError("Passwords do not match.");
            return;
        }

        if (newPassword.length < 6) {
            setPasswordError("Password must be at least 6 characters.");
            return;
        }

        setPasswordError('');
        setPasswordSuccess('');
        setLoading(true);

        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (error) throw error;

            setPasswordSuccess('Password updated successfully!');
            setNewPassword('');
            setConfirmPassword('');

            // Close modal after 2 seconds
            setTimeout(() => {
                setShowChangePasswordModal(false);
                setPasswordSuccess('');
            }, 2000);
        } catch (err) {
            console.error("Change password error:", err);
            setPasswordError(err.message || "Failed to change password. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleAddTask = async (e) => {
        e.preventDefault();
        if (!newTaskTitle.trim() || !user || !userProfile) return;

        if (userProfile.role !== 'admin') {
            setAuthError("Only admins can create tasks");
            return;
        }

        let assigneeId = selectedEmployeeForTask?.id || null;

        // Create temporary task for optimistic UI update
        const tempId = `temp-${Date.now()}`;
        const tempTask = {
            id: tempId,
            title: newTaskTitle,
            assigned_to_id: assigneeId,
            category: newTaskCategory,
            due_time: newTaskDueTime || null,
            due_date: newTaskDueDate || new Date().toISOString().split('T')[0],
            is_completed: false,
            created_by_id: user.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            assigned_to: assigneeId ? allUsers.find(u => u.id === assigneeId) : null,
            created_by: userProfile,
        };

        // Optimistic update: add to UI immediately
        setTasks(prevTasks => [tempTask, ...prevTasks]);

        // Clear form and close modal immediately for better UX
        const taskTitle = newTaskTitle;
        const taskCategory = newTaskCategory;
        const taskDueTime = newTaskDueTime;
        const taskDueDate = newTaskDueDate;

        setNewTaskTitle('');
        setNewTaskCategory('General');
        setNewTaskDueTime('');
        setNewTaskDueDate('');
        setIsAddModalOpen(false);
        setSelectedEmployeeForTask(null);

        try {
            const { error } = await supabase
                .from('tasks')
                .insert({
                    title: taskTitle,
                    assigned_to_id: assigneeId,
                    category: taskCategory,
                    due_time: taskDueTime || null,
                    due_date: taskDueDate || new Date().toISOString().split('T')[0],
                    is_completed: false,
                    created_by_id: user.id,
                });

            if (error) {
                // Remove temp task and restore form if insertion fails
                setTasks(prevTasks => prevTasks.filter(t => t.id !== tempId));
                setNewTaskTitle(taskTitle);
                setNewTaskCategory(taskCategory);
                setNewTaskDueTime(taskDueTime);
                setNewTaskDueDate(taskDueDate);
                setIsAddModalOpen(true);
                throw error;
            }

            // Real-time subscription will replace the temp task with the actual one
        } catch (err) {
            console.error("Error adding task", err);
            setAuthError(err.message || "Failed to create task");
        }
    };

    const toggleTaskStatus = async (taskId, currentStatus) => {
        // Optimistic update: toggle status in UI immediately
        setTasks(prevTasks =>
            prevTasks.map(task =>
                task.id === taskId
                    ? { ...task, is_completed: !currentStatus }
                    : task
            )
        );

        // Show toast notification for employees when completing a task
        if (!currentStatus && userProfile?.role === 'employee') {
            setTaskCompletedToast(true);
            setTimeout(() => setTaskCompletedToast(false), 3000);
        }

        try {
            const { error } = await supabase
                .from('tasks')
                .update({ is_completed: !currentStatus })
                .eq('id', taskId);

            if (error) {
                // If update fails, reload tasks to restore correct state
                loadTasks();
                throw error;
            }
        } catch (err) {
            console.error("Error updating task:", err);
        }
    };

    const deleteTask = async (taskId) => {
        if (!confirm("Delete this chore?")) return;

        // Optimistic update: remove from UI immediately
        setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));

        try {
            const { error } = await supabase
                .from('tasks')
                .delete()
                .eq('id', taskId);

            if (error) {
                // If deletion fails, reload tasks to restore the UI
                loadTasks();
                throw error;
            }
        } catch (err) {
            console.error("Error deleting task:", err);
        }
    };

    // --- Filtering ---

    const myTasks = tasks.filter(t => t.assigned_to_id === user?.id);
    const pendingTasksCount = myTasks.filter(t => !t.is_completed).length;

    // Employees only see incomplete tasks, admins see all tasks
    const visibleTasks = userProfile?.role === 'admin'
        ? tasks
        : myTasks.filter(t => !t.is_completed);

    const groupedTasks = useMemo(() => {
        const groups = {};
        visibleTasks.forEach(task => {
            const dateKey = task.due_date || 'No Date';
            if (!groups[dateKey]) groups[dateKey] = [];
            groups[dateKey].push(task);
        });
        return Object.keys(groups).sort().reduce((obj, key) => {
            obj[key] = groups[key];
            return obj;
        }, {});
    }, [visibleTasks]);

    // --- Renderers ---

    if (loading) {
        const handleOpenInNewTab = () => {
            // Open in new tab with clearCache parameter
            const url = new URL(window.location.href);
            url.searchParams.set('clearCache', '1');
            window.open(url.toString(), '_blank');
            // Close the current stuck tab
            window.close();
        };

        return (
            <div className="h-screen flex items-center justify-center bg-white text-rose-500">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mb-2">
                        <Lock size={24} />
                    </div>
                    <span className="font-bold mb-4">Loading...</span>

                    {/* Emergency retry button - appears after 2 seconds */}
                    <button
                        onClick={handleOpenInNewTab}
                        className="mt-4 text-xs text-gray-500 hover:text-rose-500 underline opacity-0 animate-[fadeIn_1s_ease-in-out_2s_forwards]"
                        style={{ animation: 'fadeIn 1s ease-in-out 2s forwards' }}
                    >
                        Stuck? Open in new tab
                    </button>
                </div>

                <style>{`
                    @keyframes fadeIn {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }
                `}</style>
            </div>
        );
    }

    // 1. LOGIN VIEW
    if (viewState === 'login') {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
                <div className="absolute -top-20 -left-20 w-64 h-64 bg-rose-100 rounded-full blur-3xl opacity-50"></div>
                <div className="absolute bottom-0 right-0 w-80 h-80 bg-orange-100 rounded-full blur-3xl opacity-50"></div>

                <div className="w-full max-w-md bg-white relative z-10">
                    <div className="mb-8 text-center">
                        <div className="w-16 h-16 bg-rose-500 rounded-2xl mx-auto flex items-center justify-center text-white shadow-xl shadow-rose-200 mb-4 transform -rotate-6">
                            <Check strokeWidth={4} size={32} />
                        </div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">Chore Mate</h1>
                        <p className="text-gray-500">Login to manage your tasks</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                        {authError && (
                            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-bold text-center animate-in slide-in-from-top-2">
                                {authError}
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="email"
                                    required
                                    placeholder="admin@company.com"
                                    className="w-full p-4 pl-12 bg-gray-50 rounded-2xl border-2 border-transparent focus:bg-white focus:border-rose-500 outline-none transition-all font-bold text-gray-800"
                                    value={authEmail}
                                    onChange={(e) => setAuthEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    placeholder="••••••"
                                    className="w-full p-4 pl-12 pr-12 bg-gray-50 rounded-2xl border-2 border-transparent focus:bg-white focus:border-rose-500 outline-none transition-all font-bold text-gray-800"
                                    value={authPassword}
                                    onChange={(e) => setAuthPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-rose-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-rose-200 active:scale-95 transition-transform text-lg hover:bg-rose-600 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Logging in...' : 'Login'}
                        </button>

                        <div className="text-center mt-4 space-y-2">
                            <button
                                type="button"
                                onClick={() => setViewState('forgot-password')}
                                className="text-sm text-rose-500 hover:text-rose-600 font-medium block w-full"
                            >
                                Forgot password?
                            </button>

                            <button
                                type="button"
                                onClick={() => setViewState('signup')}
                                className="text-sm text-gray-500 hover:text-rose-500 font-medium"
                            >
                                Don't have an account? <span className="font-bold">Sign up</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    // 2. SIGNUP VIEW
    if (viewState === 'signup') {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
                <div className="absolute -top-20 -left-20 w-64 h-64 bg-rose-100 rounded-full blur-3xl opacity-50"></div>
                <div className="absolute bottom-0 right-0 w-80 h-80 bg-orange-100 rounded-full blur-3xl opacity-50"></div>

                <div className="w-full max-w-md bg-white relative z-10">
                    <div className="mb-8 text-center">
                        <div className="w-16 h-16 bg-rose-500 rounded-2xl mx-auto flex items-center justify-center text-white shadow-xl shadow-rose-200 mb-4 transform -rotate-6">
                            <Check strokeWidth={4} size={32} />
                        </div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">Chore Mate</h1>
                        <p className="text-gray-500">Create your employee account</p>
                    </div>

                    <form onSubmit={handleSignup} className="space-y-4">
                        {authError && (
                            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-bold text-center animate-in slide-in-from-top-2">
                                {authError}
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    required
                                    placeholder="John Doe"
                                    className="w-full p-4 pl-12 bg-gray-50 rounded-2xl border-2 border-transparent focus:bg-white focus:border-rose-500 outline-none transition-all font-bold text-gray-800"
                                    value={authName}
                                    onChange={(e) => setAuthName(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="email"
                                    required
                                    placeholder="john@company.com"
                                    className="w-full p-4 pl-12 bg-gray-50 rounded-2xl border-2 border-transparent focus:bg-white focus:border-rose-500 outline-none transition-all font-bold text-gray-800"
                                    value={authEmail}
                                    onChange={(e) => setAuthEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    placeholder="••••••"
                                    className="w-full p-4 pl-12 pr-12 bg-gray-50 rounded-2xl border-2 border-transparent focus:bg-white focus:border-rose-500 outline-none transition-all font-bold text-gray-800"
                                    value={authPassword}
                                    onChange={(e) => setAuthPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-rose-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-rose-200 active:scale-95 transition-transform text-lg hover:bg-rose-600 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Creating account...' : 'Sign Up'}
                        </button>

                        <div className="text-center mt-4">
                            <button
                                type="button"
                                onClick={() => setViewState('login')}
                                className="text-sm text-gray-500 hover:text-rose-500 font-medium"
                            >
                                Already have an account? <span className="font-bold">Login</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    // 3. FORGOT PASSWORD VIEW
    if (viewState === 'forgot-password') {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
                <div className="absolute -top-20 -left-20 w-64 h-64 bg-rose-100 rounded-full blur-3xl opacity-50"></div>
                <div className="absolute bottom-0 right-0 w-80 h-80 bg-orange-100 rounded-full blur-3xl opacity-50"></div>

                <div className="w-full max-w-md bg-white relative z-10">
                    <div className="mb-8 text-center">
                        <div className="w-16 h-16 bg-rose-500 rounded-2xl mx-auto flex items-center justify-center text-white shadow-xl shadow-rose-200 mb-4 transform -rotate-6">
                            <Lock strokeWidth={4} size={32} />
                        </div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">Reset Password</h1>
                        <p className="text-gray-500">Enter your email to receive a reset link</p>
                    </div>

                    <form onSubmit={handleForgotPassword} className="space-y-4">
                        {authError && (
                            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-bold text-center animate-in slide-in-from-top-2">
                                {authError}
                            </div>
                        )}

                        {authSuccess && (
                            <div className="p-3 bg-green-50 border border-green-100 rounded-xl text-green-600 text-xs font-bold text-center animate-in slide-in-from-top-2">
                                {authSuccess}
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="email"
                                    required
                                    placeholder="your.email@company.com"
                                    className="w-full p-4 pl-12 bg-gray-50 rounded-2xl border-2 border-transparent focus:bg-white focus:border-rose-500 outline-none transition-all font-bold text-gray-800"
                                    value={authEmail}
                                    onChange={(e) => setAuthEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-rose-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-rose-200 active:scale-95 transition-transform text-lg hover:bg-rose-600 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Sending...' : 'Send Reset Link'}
                        </button>

                        <div className="text-center mt-4">
                            <button
                                type="button"
                                onClick={() => { setViewState('login'); setAuthError(''); setAuthSuccess(''); }}
                                className="text-sm text-gray-500 hover:text-rose-500 font-medium"
                            >
                                ← Back to login
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    // 4. DASHBOARD VIEW
    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-24">

            {/* Header */}
            <div className="bg-white sticky top-0 z-20 shadow-sm px-5 py-4 flex justify-between items-center">
                <div>
                    <h1 className="font-black text-xl leading-none tracking-tight flex items-center gap-2">
                        Chore Mate
                        {userProfile.role === 'admin' && <span className="bg-black text-white text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wide">Admin</span>}
                    </h1>
                    <p className="text-xs text-gray-400 font-medium mt-1">Hello, {userProfile.name}</p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowChangePasswordModal(true)}
                        className="p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-blue-100 hover:text-blue-500 transition-colors"
                        title="Change Password"
                    >
                        <Lock size={18} />
                    </button>
                    <button onClick={handleLogout} className="p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-rose-100 hover:text-rose-500 transition-colors">
                        <LogOut size={18} />
                    </button>
                    <div className="relative">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center relative overflow-hidden border border-gray-200">
                            {/* Avatar for Current User */}
                            <img
                                src={getAvatarUrl(user.id)}
                                alt="Me"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        {pendingTasksCount > 0 && userProfile.role === 'employee' && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 border-2 border-white rounded-full text-[10px] flex items-center justify-center text-white font-bold z-10">
                                {pendingTasksCount}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Toast Notification for Task Completion */}
            {taskCompletedToast && (
                <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-5 fade-in duration-300">
                    <div className="bg-green-500 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3">
                        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                            <Check size={20} strokeWidth={3} />
                        </div>
                        <span className="font-bold text-lg">Task Completed! 🎉</span>
                    </div>
                </div>
            )}

            {/* ADMIN ONLY SECTION: Team Carousel (Quick Select) */}
            {userProfile.role === 'admin' && (
                <div className="pt-6 pl-5 border-b border-gray-100 pb-6 bg-white/50">
                    <div className="flex items-center justify-between pr-5 mb-3">
                        <h2 className="text-sm font-black text-gray-800 uppercase tracking-wide">Quick Assign</h2>
                        <span className="text-xs text-rose-500 font-bold">{allUsers.filter(u => u.role === 'employee').length} members</span>
                    </div>

                    <div className="flex gap-4 overflow-x-auto pb-2 pr-5 no-scrollbar snap-x">
                        {/* Add Task Generic Button */}
                        <button
                            onClick={() => { setSelectedEmployeeForTask(null); setIsAddModalOpen(true); }}
                            className="flex-shrink-0 snap-start flex flex-col items-center gap-2 group"
                        >
                            <div className="w-16 h-16 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center bg-white group-hover:border-rose-400 group-hover:bg-rose-50 transition-all">
                                <Plus className="text-gray-400 group-hover:text-rose-500" />
                            </div>
                            <span className="text-xs font-medium text-gray-500">Anyone</span>
                        </button>

                        {/* User Avatars - Show all employees */}
                        {allUsers.filter(u => u.role === 'employee').map((u) => (
                            <button
                                key={u.id}
                                onClick={() => { setSelectedEmployeeForTask(u); setIsAddModalOpen(true); }}
                                className="flex-shrink-0 snap-start flex flex-col items-center gap-2 group min-w-[64px]"
                            >
                                <img
                                    src={getAvatarUrl(u.id)}
                                    alt={u.name}
                                    className="w-16 h-16 rounded-full bg-white border-2 border-white shadow-md group-hover:scale-110 transition-transform object-cover"
                                />
                                <span className="text-xs font-medium text-gray-600 truncate w-16 text-center">{u.name.split(' ')[0]}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Main Task Feed */}
            <div className="px-5 mt-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-black text-gray-800">
                        {userProfile.role === 'admin' ? 'All Tasks' : 'Your Tasks'}
                    </h2>
                </div>

                <div className="space-y-8">
                    {visibleTasks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-4 animate-bounce-slow">
                                <Coffee size={40} className="text-green-500" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-800">All clear for now!</h3>
                            {userProfile.role === 'employee' && (
                                <p className="text-sm text-gray-400 mt-2">No tasks assigned to you yet.</p>
                            )}
                        </div>
                    ) : (
                        Object.entries(groupedTasks).map(([date, tasksForDate]) => (
                            <div key={date}>
                                {/* Date Header */}
                                <div className="sticky top-[76px] z-10 bg-gray-50/95 backdrop-blur-sm py-2 mb-2 border-b border-gray-200 flex items-center gap-2">
                                    <Calendar size={14} className="text-rose-500" />
                                    <span className="text-sm font-black text-gray-600 uppercase tracking-wide">{formatDate(date)}</span>
                                    <span className="text-xs font-medium text-gray-400">({tasksForDate.length} tasks)</span>
                                </div>

                                <div className="space-y-3">
                                    {tasksForDate.map((task) => (
                                        <div
                                            key={task.id}
                                            className={`
                        group relative bg-white rounded-2xl p-4 shadow-sm border border-gray-100 transition-all duration-300 
                        ${task.is_completed ? 'opacity-50 bg-gray-50' : 'hover:shadow-md'}
                      `}
                                        >
                                            <div className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl ${task.is_completed ? 'bg-gray-300' : (task.category === 'Urgent' ? 'bg-red-500' : 'bg-rose-500')}`}></div>

                                            <div className="flex items-start justify-between pl-3">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1.5">
                                                        <span className={`
                              text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md flex items-center gap-1
                              ${categories.find(c => c.name === task.category)?.color || 'bg-gray-100 text-gray-600'}
                            `}>
                                                            {categories.find(c => c.name === task.category)?.icon}
                                                            {task.category}
                                                        </span>
                                                        {task.due_time && (
                                                            <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1 bg-gray-50 px-1.5 py-0.5 rounded">
                                                                <Clock size={10} /> {task.due_time}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* COMPLETED Banner for Admin */}
                                                    {task.is_completed && userProfile.role === 'admin' && (
                                                        <div className="mb-2">
                                                            <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-black px-2.5 py-1 rounded-md bg-green-500 text-white">
                                                                <Check size={12} strokeWidth={3} />
                                                                Completed
                                                            </span>
                                                        </div>
                                                    )}

                                                    <h3 className={`font-bold text-lg leading-snug mb-3 ${task.is_completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                                                        {task.title}
                                                    </h3>

                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            {/* Mini Avatar in Task Card */}
                                                            <div className="w-6 h-6 rounded-full bg-gray-200 overflow-hidden border border-white shadow-sm">
                                                                {task.assigned_to_id ? (
                                                                    <img src={getAvatarUrl(task.assigned_to_id)} alt="" className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <div className="w-full h-full bg-gray-300 flex items-center justify-center text-[10px] font-bold text-white">?</div>
                                                                )}
                                                            </div>
                                                            <span className="text-xs font-medium text-gray-500">
                                                                {task.assigned_to_id === user.id ? 'You' : (task.assigned_to ? task.assigned_to.name : 'Unassigned')}
                                                            </span>
                                                        </div>

                                                        {userProfile.role === 'admin' && (
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
                                                                className="text-gray-300 hover:text-red-500 p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => toggleTaskStatus(task.id, task.is_completed)}
                                                    className={`
                            w-12 h-12 ml-3 rounded-xl flex items-center justify-center transition-all duration-300 border-2
                            ${task.is_completed
                                                            ? 'bg-green-500 border-green-500 text-white'
                                                            : 'bg-white border-gray-100 text-gray-200 hover:border-rose-500 hover:text-rose-500 shadow-sm'}
                          `}
                                                >
                                                    <Check size={24} strokeWidth={3} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* FAB - ONLY FOR ADMINS NOW */}
            {userProfile.role === 'admin' && (
                <button
                    onClick={() => { setSelectedEmployeeForTask(null); setIsAddModalOpen(true); }}
                    className="fixed bottom-6 right-6 w-14 h-14 bg-gray-900 text-white rounded-full shadow-xl shadow-gray-400/40 flex items-center justify-center hover:scale-110 transition-transform duration-200 z-40 active:bg-black"
                >
                    <Plus size={28} strokeWidth={3} />
                </button>
            )}

            {/* MODAL: Change Password */}
            {showChangePasswordModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center animate-in fade-in duration-200">
                    <div className="bg-white w-full sm:w-[450px] sm:rounded-3xl rounded-t-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 duration-300">

                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h2 className="text-xl font-black text-gray-800">Change Password</h2>
                                <p className="text-sm text-gray-500 mt-1">Update your account password</p>
                            </div>
                            <button
                                onClick={() => {
                                    setShowChangePasswordModal(false);
                                    setPasswordError('');
                                    setPasswordSuccess('');
                                    setNewPassword('');
                                    setConfirmPassword('');
                                }}
                                className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                            >
                                <X size={20} className="text-gray-600" />
                            </button>
                        </div>

                        <form onSubmit={handleChangePassword} className="space-y-4">
                            {passwordError && (
                                <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-bold text-center">
                                    {passwordError}
                                </div>
                            )}

                            {passwordSuccess && (
                                <div className="p-3 bg-green-50 border border-green-100 rounded-xl text-green-600 text-xs font-bold text-center">
                                    {passwordSuccess}
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">New Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="password"
                                        required
                                        placeholder="Enter new password"
                                        className="w-full p-4 pl-12 bg-gray-50 rounded-2xl border-2 border-transparent focus:bg-white focus:border-rose-500 outline-none transition-all font-medium"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Confirm Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="password"
                                        required
                                        placeholder="Confirm new password"
                                        className="w-full p-4 pl-12 bg-gray-50 rounded-2xl border-2 border-transparent focus:bg-white focus:border-rose-500 outline-none transition-all font-medium"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-blue-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-200 active:scale-95 transition-transform hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed">
                                {loading ? 'Updating...' : 'Update Password'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: Add Task with Date */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center animate-in fade-in duration-200">
                    <div className="bg-white w-full sm:w-[450px] sm:rounded-3xl rounded-t-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 duration-300 flex flex-col max-h-[90vh]">

                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h2 className="text-xl font-black text-gray-800">Schedule Chore</h2>
                                {/* Selected User Display in Modal Title Area */}
                                <div className="flex items-center gap-2 mt-1">
                                    {selectedEmployeeForTask ? (
                                        <>
                                            <img src={getAvatarUrl(selectedEmployeeForTask.id)} className="w-5 h-5 rounded-full" alt="" />
                                            <p className="text-sm text-rose-500 font-bold">For: {selectedEmployeeForTask.name}</p>
                                        </>
                                    ) : (
                                        <p className="text-sm text-gray-400 font-bold">Unassigned</p>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={() => setIsAddModalOpen(false)}
                                className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                            >
                                <X size={20} className="text-gray-600" />
                            </button>
                        </div>

                        {/* ADMIN ONLY: IN-MODAL USER SELECTOR */}
                        {userProfile.role === 'admin' && (
                            <div className="mb-5">
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2 ml-1">Assign To</label>
                                <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                                    <button
                                        onClick={() => setSelectedEmployeeForTask(null)}
                                        className={`flex-shrink-0 flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all ${!selectedEmployeeForTask ? 'border-rose-500 bg-rose-50 ring-2 ring-rose-200' : 'border-gray-100 grayscale opacity-60'}`}
                                    >
                                        <div className="w-10 h-10 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center bg-white">
                                            <Plus size={16} className="text-gray-400" />
                                        </div>
                                        <span className="text-[10px] font-bold text-gray-600">Anyone</span>
                                    </button>

                                    {allUsers.filter(u => u.role === 'employee').map(u => (
                                        <button
                                            key={u.id}
                                            onClick={() => setSelectedEmployeeForTask(u)}
                                            className={`flex-shrink-0 flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all ${selectedEmployeeForTask?.id === u.id ? 'border-rose-500 bg-rose-50 ring-2 ring-rose-200' : 'border-transparent opacity-60 hover:opacity-100'}`}
                                        >
                                            <img src={getAvatarUrl(u.id)} className="w-10 h-10 rounded-full bg-white" alt={u.name} />
                                            <span className="text-[10px] font-bold text-gray-600 truncate w-12 text-center">{u.name.split(' ')[0]}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleAddTask} className="space-y-5 flex-1 overflow-y-auto pr-1">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">What needs doing?</label>
                                <input
                                    type="text"
                                    placeholder="e.g., Restock the fridge"
                                    className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:bg-white focus:border-rose-500 outline-none transition-all font-medium text-lg"
                                    value={newTaskTitle}
                                    onChange={(e) => setNewTaskTitle(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Schedule For</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <input
                                        type="date"
                                        className="w-full p-3 bg-gray-50 rounded-xl focus:bg-white focus:ring-2 focus:ring-rose-500 outline-none font-medium text-sm"
                                        value={newTaskDueDate}
                                        onChange={(e) => setNewTaskDueDate(e.target.value)}
                                    />
                                    <input
                                        type="time"
                                        className="w-full p-3 bg-gray-50 rounded-xl focus:bg-white focus:ring-2 focus:ring-rose-500 outline-none font-medium text-sm"
                                        value={newTaskDueTime}
                                        onChange={(e) => setNewTaskDueTime(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Category</label>
                                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                                    {categories.map(c => (
                                        <button
                                            key={c.name}
                                            type="button"
                                            onClick={() => setNewTaskCategory(c.name)}
                                            className={`
                         flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold border transition-all whitespace-nowrap
                         ${newTaskCategory === c.name
                                                    ? 'bg-gray-900 text-white border-gray-900'
                                                    : 'bg-white text-gray-600 border-gray-200'}
                       `}
                                        >
                                            {c.icon} {c.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-rose-500 text-white font-bold py-4 rounded-2xl mt-2 shadow-lg shadow-rose-200 active:scale-95 transition-transform hover:bg-rose-600 flex items-center justify-center gap-2"
                            >
                                <span>Assign Task</span>
                                <ChevronRight size={18} strokeWidth={3} />
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}