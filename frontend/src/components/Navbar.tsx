import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShieldAlert, 
  PlusCircle, 
  Bell, 
  User as UserIcon, 
  LogOut, 
  Menu, 
  X, 
  Settings, 
  LayoutDashboard, 
  BarChart3,
  Award,
  Activity,
  Briefcase,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { Notification } from '../types';
import api from '../lib/api';
import { formatDistanceToNowStrict } from 'date-fns';

const Navbar = () => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const navigate = useNavigate();
  const profileRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    let isMounted = true;
    const fetchNotifications = async () => {
      try {
        const res = await api.get('/notifications');
        const items = Array.isArray(res.data) ? res.data : [];
        if (isMounted) {
          setNotifications(items);
        }
      } catch (err) {
        // Keep navbar stable even if notifications fail temporarily.
      }
    };

    fetchNotifications();
    const interval = window.setInterval(fetchNotifications, 10000);
    return () => {
      isMounted = false;
      window.clearInterval(interval);
    };
  }, [user]);

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((notification) => ({ ...notification, isRead: true })));
    } catch (err) {
      // Non-blocking UX: ignore transient failures.
    }
  };

  const handleOpenNotification = async (notification: Notification) => {
    setShowNotifications(false);
    setSelectedNotification(notification);

    if (!notification.isRead) {
      setNotifications((prev) => prev.map((item) => (
        item.id === notification.id ? { ...item, isRead: true } : item
      )));

      try {
        await api.patch(`/notifications/${notification.id}/read`);
      } catch (err) {
        // Keep the popup usable if persistence fails temporarily.
      }
    }
  };

  const handleCloseNotification = () => {
    setSelectedNotification(null);
  };

  const formatNotificationTime = (notification: Notification) => {
    const epochRaw = notification.createdAtEpochMs;
    const epochFromField = typeof epochRaw === 'number'
      ? epochRaw
      : typeof epochRaw === 'string'
        ? Number(epochRaw)
        : Number.NaN;

    const parsedFromCreatedAt = (() => {
      if (!notification.createdAt) return Number.NaN;
      const direct = Date.parse(notification.createdAt);
      if (!Number.isNaN(direct)) return direct;

      // If backend sends timezone-less ISO, treat it as UTC to avoid timezone drift.
      const normalized = /[zZ]|[+-]\d{2}:?\d{2}$/.test(notification.createdAt)
        ? notification.createdAt
        : `${notification.createdAt}Z`;
      return Date.parse(normalized);
    })();

    const timestamp = Number.isNaN(epochFromField) ? parsedFromCreatedAt : epochFromField;
    if (Number.isNaN(timestamp)) {
      return 'just now';
    }
    return formatDistanceToNowStrict(new Date(timestamp), { addSuffix: true });
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="bg-indigo-600 p-1.5 rounded-lg group-hover:rotate-12 transition-transform duration-300">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-linear-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              CivicWatch
            </span>
          </Link>

          <div className="hidden md:flex items-center space-x-6">
            <Link to="/dashboard" className="text-slate-600 hover:text-indigo-600 font-medium transition-colors flex items-center space-x-1">
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </Link>
            <Link to="/stats" className="text-slate-600 hover:text-indigo-600 font-medium transition-colors flex items-center space-x-1">
              <BarChart3 className="w-4 h-4" />
              <span>Stats</span>
            </Link>
            <Link to="/leaderboard" className="text-slate-600 hover:text-indigo-600 font-medium transition-colors flex items-center space-x-1">
              <Award className="w-4 h-4" />
              <span>Leaderboard</span>
            </Link>
            <Link to="/activity" className="text-slate-600 hover:text-indigo-600 font-medium transition-colors flex items-center space-x-1">
              <Activity className="w-4 h-4" />
              <span>Activity</span>
            </Link>
            
            {user ? (
              <div className="flex items-center space-x-4">
                {user.role === 'USER' && (
                  <Link to="/report" className="bg-indigo-600 text-white px-4 py-2 rounded-full font-medium hover:bg-indigo-700 transition-all flex items-center space-x-2 shadow-lg shadow-indigo-200">
                    <PlusCircle className="w-4 h-4" />
                    <span>Report</span>
                  </Link>
                )}

                <div className="h-8 w-px bg-slate-200 mx-2" />

                {/* Notifications */}
                <div className="relative" ref={notificationRef}>
                  <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors relative"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  <AnimatePresence>
                    {showNotifications && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden"
                      >
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                          <h3 className="font-bold text-slate-900">Notifications</h3>
                          <button onClick={handleMarkAllRead} className="text-xs text-indigo-600 font-bold hover:underline">Mark all as read</button>
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                          {notifications.map((n) => (
                            <button
                              key={n.id}
                              type="button"
                              onClick={() => void handleOpenNotification(n)}
                              className={`w-full text-left p-4 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 ${n.isRead ? 'opacity-75' : 'bg-indigo-50/40'}`}
                            >
                              <div className="flex space-x-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                                  n.type === 'STATUS_CHANGE' ? 'bg-green-100 text-green-600' : 'bg-indigo-100 text-indigo-600'
                                }`}>
                                  {n.type === 'STATUS_CHANGE' ? <ShieldAlert className="w-4 h-4" /> : <Award className="w-4 h-4" />}
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-slate-900">{n.title}</p>
                                  <p className="text-xs text-slate-500 line-clamp-2">{n.message}</p>
                                  <p className="text-[10px] text-slate-400 mt-1">{formatNotificationTime(n)}</p>
                                </div>
                              </div>
                            </button>
                          ))}
                          {notifications.length === 0 && (
                            <p className="p-4 text-xs text-slate-500">No notifications yet.</p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Profile Menu */}
                <div className="relative" ref={profileRef}>
                  <button 
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex items-center space-x-2 p-1 pr-3 rounded-full hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
                  >
                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                      {user.name[0]}
                    </div>
                    <div className="text-left hidden lg:block">
                      <p className="text-xs font-bold text-slate-900 leading-none">{user.name}</p>
                      <p className="text-[10px] font-medium text-indigo-600 leading-none mt-1 flex items-center">
                        <Award className="w-2.5 h-2.5 mr-0.5" />
                        {user.reputationPoints} pts
                      </p>
                    </div>
                  </button>

                  <AnimatePresence>
                    {showProfileMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden"
                      >
                        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                          <p className="text-sm font-bold text-slate-900">{user.name}</p>
                          <p className="text-xs text-slate-500 truncate">{user.email}</p>
                        </div>
                        <div className="p-2">
                          <Link to="/profile" className="flex items-center space-x-2 p-2 rounded-lg text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                            <UserIcon className="w-4 h-4" />
                            <span className="text-sm font-medium">My Profile</span>
                          </Link>
                          {user.role === 'USER' && (
                            <Link to="/my-issues" className="flex items-center space-x-2 p-2 rounded-lg text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                              <FileText className="w-4 h-4" />
                              <span className="text-sm font-medium">My Issues</span>
                            </Link>
                          )}
                          <Link to="/settings" className="flex items-center space-x-2 p-2 rounded-lg text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                            <Settings className="w-4 h-4" />
                            <span className="text-sm font-medium">Settings</span>
                          </Link>
                          {user.role === 'ADMIN' && (
                            <Link to="/admin" className="flex items-center space-x-2 p-2 rounded-lg text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                              <ShieldAlert className="w-4 h-4" />
                              <span className="text-sm font-medium">Admin Panel</span>
                            </Link>
                          )}
                          {user.role === 'WORKER' && (
                            <Link to="/worker" className="flex items-center space-x-2 p-2 rounded-lg text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                              <Briefcase className="w-4 h-4" />
                              <span className="text-sm font-medium">Worker Panel</span>
                            </Link>
                          )}
                          <div className="h-px bg-slate-100 my-2" />
                          <button 
                            onClick={handleLogout}
                            className="w-full flex items-center space-x-2 p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <LogOut className="w-4 h-4" />
                            <span className="text-sm font-medium">Logout</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              <Link to="/auth" className="bg-slate-900 text-white px-6 py-2 rounded-full font-medium hover:bg-slate-800 transition-all">
                Login
              </Link>
            )}
          </div>

          <button className="md:hidden p-2 text-slate-600" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {createPortal(
        <AnimatePresence>
          {selectedNotification && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-1000 flex items-start justify-center bg-black/65 px-4 pt-24 pb-8 sm:pt-28"
              onClick={handleCloseNotification}
            >
              <motion.div
                initial={{ opacity: 0, y: 24, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 24, scale: 0.95 }}
                onClick={(event) => event.stopPropagation()}
                className="w-full max-w-xl overflow-hidden rounded-[28px] border border-slate-100 bg-white shadow-[0_30px_100px_rgba(15,23,42,0.28)]"
              >
                <div className="flex items-start justify-between gap-4 bg-linear-to-r from-indigo-600 via-violet-600 to-fuchsia-600 px-6 py-5 text-white">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white ring-1 ring-white/20">
                      <Bell className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.25em] text-white/75">Notification</p>
                      <h3 className="mt-1 text-xl font-black leading-tight text-white">{selectedNotification.title}</h3>
                    </div>
                  </div>
                  <button onClick={handleCloseNotification} className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-black text-white/90 hover:bg-white/20">
                    Close
                  </button>
                </div>

                <div className="space-y-5 p-6 sm:p-7">
                  <div className="rounded-2xl bg-slate-50 px-5 py-4 ring-1 ring-slate-100">
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Message</p>
                    <p className="mt-2 text-sm leading-7 text-slate-700">{selectedNotification.message}</p>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[11px] font-semibold text-slate-400">{formatNotificationTime(selectedNotification)}</p>
                    <button
                      onClick={handleCloseNotification}
                      className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-black text-white hover:bg-slate-800"
                    >
                      Got it
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-b border-slate-200 overflow-hidden"
          >
            <div className="px-4 pt-2 pb-6 space-y-4">
              <Link to="/dashboard" className="flex items-center space-x-2 text-slate-600 font-medium" onClick={() => setIsOpen(false)}>
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </Link>
              <Link to="/stats" className="flex items-center space-x-2 text-slate-600 font-medium" onClick={() => setIsOpen(false)}>
                <BarChart3 className="w-4 h-4" />
                <span>Stats</span>
              </Link>
              <Link to="/leaderboard" className="flex items-center space-x-2 text-slate-600 font-medium" onClick={() => setIsOpen(false)}>
                <Award className="w-4 h-4" />
                <span>Leaderboard</span>
              </Link>
              <Link to="/activity" className="flex items-center space-x-2 text-slate-600 font-medium" onClick={() => setIsOpen(false)}>
                <Activity className="w-4 h-4" />
                <span>Activity</span>
              </Link>
              {user ? (
                <>
                  {user.role === 'USER' && (
                    <Link to="/report" className="flex items-center space-x-2 text-indigo-600 font-medium" onClick={() => setIsOpen(false)}>
                      <PlusCircle className="w-4 h-4" />
                      <span>Report Issue</span>
                    </Link>
                  )}
                  <Link to="/profile" className="flex items-center space-x-2 text-slate-600 font-medium" onClick={() => setIsOpen(false)}>
                    <UserIcon className="w-4 h-4" />
                    <span>My Profile</span>
                  </Link>
                  {user.role === 'ADMIN' && <Link to="/admin" className="block text-slate-600 font-medium" onClick={() => setIsOpen(false)}>Admin</Link>}
                  {user.role === 'WORKER' && <Link to="/worker" className="block text-slate-600 font-medium" onClick={() => setIsOpen(false)}>Worker Panel</Link>}
                  {user.role === 'USER' && <Link to="/my-issues" className="block text-slate-600 font-medium" onClick={() => setIsOpen(false)}>My Issues</Link>}
                  <button onClick={handleLogout} className="flex items-center space-x-2 text-red-600 font-medium">
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <Link to="/auth" className="block bg-slate-900 text-white px-4 py-2 rounded-lg text-center font-medium" onClick={() => setIsOpen(false)}>Login</Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
