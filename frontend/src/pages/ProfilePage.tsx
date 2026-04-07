import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  User as UserIcon, 
  MapPin, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Briefcase,
  ClipboardList,
  ShieldAlert,
  Settings,
  ChevronRight
} from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { Issue } from '../types';
import { formatDistanceToNow } from 'date-fns';

const ProfilePage = () => {
  const { user } = useAuth();
  const [userIssues, setUserIssues] = useState<Issue[]>([]);
  const [workerTasks, setWorkerTasks] = useState<Issue[]>([]);
  const [adminActivity, setAdminActivity] = useState<any[]>([]);
  const [adminStats, setAdminStats] = useState<{ total: number; open: number; inProgress: number; resolved: number; workers: number }>({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
    workers: 0
  });
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    resolved: 0,
    reputation: 0
  });

  const sidebarCards = user?.role === 'WORKER'
    ? [
        { label: 'Assigned Tasks', value: stats.total, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        { label: 'Completed', value: stats.resolved, color: 'text-green-600', bg: 'bg-green-50' }
      ]
    : user?.role === 'ADMIN'
      ? [
          { label: 'Managed Issues', value: adminStats.total, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Workers', value: adminStats.workers, color: 'text-violet-600', bg: 'bg-violet-50' }
        ]
      : [
          { label: 'Reputation', value: stats.reputation, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Role', value: user?.role || '-', color: 'text-slate-900', bg: 'bg-slate-50' }
        ];

  const adminFallbackActivity = [
    { id: 'issues', action: 'Issue summary', details: `${adminStats.open} open, ${adminStats.inProgress} in progress, ${adminStats.resolved} resolved`, createdAt: new Date().toISOString() },
    { id: 'workers', action: 'Worker roster', details: `${adminStats.workers} active worker account(s) available`, createdAt: new Date().toISOString() },
    { id: 'panel', action: 'Admin panel', details: 'Open the admin panel to review assignments and notifications', createdAt: new Date().toISOString() }
  ];

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      if (user?.role === 'WORKER') {
        const res = await api.get('/worker/tasks');
        const tasks = Array.isArray(res.data) ? res.data : [];
        setWorkerTasks(tasks);
        setStats({
          total: tasks.length,
          resolved: tasks.filter((task: Issue) => task.status === 'RESOLVED').length,
          reputation: user?.reputationPoints || 0
        });
        return;
      }

      if (user?.role === 'ADMIN') {
        const [statsRes, workersRes, activityRes] = await Promise.allSettled([
          api.get('/issues/stats'),
          api.get('/admin/workers'),
          api.get('/admin/audit-logs')
        ]);

        const statsData = statsRes.status === 'fulfilled' ? statsRes.value.data : null;
        const workersData = workersRes.status === 'fulfilled' && Array.isArray(workersRes.value.data) ? workersRes.value.data : [];
        const activityData = activityRes.status === 'fulfilled' && Array.isArray(activityRes.value.data) ? activityRes.value.data : [];
        const byStatus = statsData?.byStatus || {};

        setAdminStats({
          total: Number(statsData?.total ?? 0),
          open: Number(byStatus.OPEN ?? 0),
          inProgress: Number(byStatus.IN_PROGRESS ?? 0),
          resolved: Number(byStatus.RESOLVED ?? 0),
          workers: workersData.length
        });
        setAdminActivity(activityData);
        setStats({
          total: Number(statsData?.total ?? 0),
          resolved: Number(byStatus.RESOLVED ?? 0),
          reputation: user?.reputationPoints || 0
        });
        return;
      }

      const res = await api.get('/issues/mine');
      const myIssues = Array.isArray(res.data) ? res.data : [];
      setUserIssues(myIssues);
      setStats({
        total: myIssues.length,
        resolved: myIssues.filter((i: Issue) => i.status === 'RESOLVED').length,
        reputation: user?.reputationPoints || 0
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <Navigate to="/auth" />;

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Profile Sidebar */}
          <div className="lg:col-span-1 space-y-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-[40px] p-10 shadow-xl shadow-slate-100 border border-slate-50 text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-32 bg-indigo-600 -z-10" />
              <div className="relative mt-12">
                <div className="w-32 h-32 rounded-[40px] bg-white p-2 shadow-2xl mx-auto">
                  <div className="w-full h-full rounded-4xl bg-indigo-600 flex items-center justify-center text-white text-4xl font-black">
                    {user.name[0]}
                  </div>
                </div>
                <div className="mt-6">
                  <h2 className="text-3xl font-black text-slate-900 leading-none">{user.name}</h2>
                  <p className="text-slate-500 font-bold mt-2">{user.email}</p>
                </div>
                <div className="mt-8 flex justify-center gap-4">
                  {sidebarCards.map((card, index) => (
                    <div key={index} className={`${card.bg} px-6 py-3 rounded-2xl border border-slate-100`}>
                      <p className={`text-2xl font-black leading-none ${card.color}`}>{card.value}</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">{card.label}</p>
                    </div>
                  ))}
                  <div className="bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100">
                    <p className="text-2xl font-black text-slate-900 leading-none">{user.role}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Role</p>
                  </div>
                </div>
              </div>
              <div className="mt-10 pt-10 border-t border-slate-100 space-y-4">
                <Link to="/settings" className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition-colors group">
                  <div className="flex items-center space-x-3">
                    <Settings className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                    <span className="font-bold text-slate-700">Account Settings</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </Link>
              </div>
            </motion.div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-12">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {(
                user?.role === 'WORKER' ? [
                  { label: 'Assigned Tasks', value: stats.total, icon: <Briefcase className="w-6 h-6" />, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                  { label: 'Completed', value: stats.resolved, icon: <CheckCircle2 className="w-6 h-6" />, color: 'text-green-600', bg: 'bg-green-50' },
                  { label: 'Completion Rate', value: `${stats.total ? Math.round((stats.resolved / stats.total) * 100) : 0}%`, icon: <TrendingUp className="w-6 h-6" />, color: 'text-violet-600', bg: 'bg-violet-50' }
                ] : user?.role === 'ADMIN' ? [
                  { label: 'Total Issues', value: adminStats.total, icon: <ClipboardList className="w-6 h-6" />, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                  { label: 'Open / Progress', value: `${adminStats.open} / ${adminStats.inProgress}`, icon: <AlertCircle className="w-6 h-6" />, color: 'text-amber-600', bg: 'bg-amber-50' },
                  { label: 'Resolved', value: adminStats.resolved, icon: <CheckCircle2 className="w-6 h-6" />, color: 'text-green-600', bg: 'bg-green-50' }
                ] : [
                  { label: 'Total Reports', value: stats.total, icon: <AlertCircle className="w-6 h-6" />, color: "text-indigo-600", bg: "bg-indigo-50" },
                  { label: "Resolved", value: stats.resolved, icon: <CheckCircle2 className="w-6 h-6" />, color: "text-green-600", bg: "bg-green-50" },
                  { label: "Resolution Rate", value: `${stats.total ? Math.round((stats.resolved / stats.total) * 100) : 0}%`, icon: <TrendingUp className="w-6 h-6" />, color: "text-violet-600", bg: "bg-violet-50" }
                ]
              ).map((stat, i) => (
                <div key={i} className="bg-white p-8 rounded-[40px] shadow-xl shadow-slate-100 border border-slate-50">
                  <div className={`${stat.bg} ${stat.color} w-12 h-12 rounded-2xl flex items-center justify-center mb-6`}>
                    {stat.icon}
                  </div>
                  <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">{stat.label}</p>
                  <h4 className="text-4xl font-black text-slate-900">{stat.value}</h4>
                </div>
              ))}
            </div>

            {/* Role Activity */}
            <div className="bg-white rounded-[40px] p-10 shadow-xl shadow-slate-100 border border-slate-50">
              <div className="flex items-center justify-between mb-10">
                <h3 className="text-2xl font-black text-slate-900 tracking-tighter">
                  {user?.role === 'WORKER' ? 'Assigned Tasks' : user?.role === 'ADMIN' ? 'Recent Admin Activity' : 'My Activity'}
                </h3>
                {user?.role === 'USER' && (
                  <Link to="/report" className="text-indigo-600 font-black text-sm uppercase tracking-widest hover:underline">New Report</Link>
                )}
                {user?.role === 'WORKER' && (
                  <Link to="/worker" className="text-indigo-600 font-black text-sm uppercase tracking-widest hover:underline">Open Worker Dashboard</Link>
                )}
                {user?.role === 'ADMIN' && (
                  <Link to="/admin/analysis" className="text-indigo-600 font-black text-sm uppercase tracking-widest hover:underline">Open Admin Panel</Link>
                )}
              </div>

              {loading ? (
                <div className="flex justify-center py-20">
                  <div className="animate-spin h-8 w-8 border-b-2 border-indigo-600 rounded-full" />
                </div>
              ) : user?.role === 'WORKER' ? (
                workerTasks.length === 0 ? (
                  <div className="text-center py-20">
                    <div className="bg-slate-50 w-16 h-16 rounded-3xl flex items-center justify-center text-slate-300 mx-auto mb-6">
                      <Briefcase className="w-8 h-8" />
                    </div>
                    <h4 className="text-xl font-black text-slate-900">No active tasks</h4>
                    <p className="text-slate-500 mt-2 font-medium">Assigned work will appear here when the admin assigns a task.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {workerTasks.map((task) => (
                      <Link
                        key={task.id}
                        to={`/issue/${task.id}`}
                        className="flex items-center p-6 rounded-3xl border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all group"
                      >
                        <div className="w-16 h-16 rounded-2xl bg-slate-100 shrink-0 overflow-hidden">
                          {task.imageUrl ? (
                            <img src={task.imageUrl} alt={task.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                              <MapPin className="w-6 h-6" />
                            </div>
                          )}
                        </div>
                        <div className="ml-6 flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-tighter border ${
                              task.status === 'RESOLVED' ? 'bg-green-50 text-green-700 border-green-200' :
                              task.status === 'REVIEW' ? 'bg-violet-50 text-violet-700 border-violet-200' :
                              task.status === 'IN_PROGRESS' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                              'bg-slate-50 text-slate-700 border-slate-200'
                            }`}>
                              {task.status.replace('_', ' ')}
                            </span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{task.category}</span>
                          </div>
                          <h4 className="text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{task.title}</h4>
                          <p className="text-xs text-slate-400 font-bold uppercase mt-1">
                            {formatDistanceToNow(new Date(task.createdAt))} ago
                          </p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                      </Link>
                    ))}
                  </div>
                )
              ) : user?.role === 'ADMIN' ? (
                adminActivity.length === 0 ? (
                  <div className="space-y-4">
                    {adminFallbackActivity.map((item) => (
                      <div key={item.id} className="flex items-start gap-4 rounded-3xl border border-slate-100 p-5 hover:bg-slate-50 transition-colors">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                          <ShieldAlert className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-black text-slate-900">{item.action}</p>
                            <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
                              system
                            </span>
                          </div>
                          <p className="mt-1 text-sm font-medium text-slate-500">{item.details}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {adminActivity.map((item) => (
                      <div key={item.id} className="flex items-start gap-4 rounded-3xl border border-slate-100 p-5 hover:bg-slate-50 transition-colors">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                          <ShieldAlert className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-black text-slate-900">{item.action}</p>
                            <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
                              {item.actor}
                            </span>
                          </div>
                          <p className="mt-1 text-sm font-medium text-slate-500">{item.details}</p>
                          <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                            {item.createdAt ? formatDistanceToNow(new Date(item.createdAt), { addSuffix: true }) : 'unknown time'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : userIssues.length === 0 ? (
                <div className="text-center py-20">
                  <div className="bg-slate-50 w-16 h-16 rounded-3xl flex items-center justify-center text-slate-300 mx-auto mb-6">
                    <Clock className="w-8 h-8" />
                  </div>
                  <h4 className="text-xl font-black text-slate-900">No reports yet</h4>
                  <p className="text-slate-500 mt-2 font-medium">Start making an impact by reporting local issues.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {userIssues.map((issue) => (
                    <Link 
                      key={issue.id} 
                      to={`/issue/${issue.id}`}
                      className="flex items-center p-6 rounded-3xl border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all group"
                    >
                      <div className="w-16 h-16 rounded-2xl bg-slate-100 shrink-0 overflow-hidden">
                        {issue.imageUrl ? (
                          <img src={issue.imageUrl} alt={issue.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <MapPin className="w-6 h-6" />
                          </div>
                        )}
                      </div>
                      <div className="ml-6 flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-tighter border ${
                            issue.status === 'RESOLVED' ? 'bg-green-50 text-green-700 border-green-200' :
                            issue.status === 'IN_PROGRESS' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            'bg-slate-50 text-slate-700 border-slate-200'
                          }`}>
                            {issue.status.replace('_', ' ')}
                          </span>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{issue.category}</span>
                        </div>
                        <h4 className="text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{issue.title}</h4>
                        <p className="text-xs text-slate-400 font-bold uppercase mt-1">
                          {formatDistanceToNow(new Date(issue.createdAt))} ago
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
