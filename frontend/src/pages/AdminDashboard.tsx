import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  Bell,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  FileCheck2,
  HardHat,
  Megaphone,
  PieChart,
  ShieldAlert,
  Users,
  Wrench,
  UserCog,
  Trash2,
} from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../lib/api';
import { Issue, Worker } from '../types';
import { useAuth } from '../context/AuthContext';

type AdminSection = 'analysis' | 'issues' | 'assign' | 'review' | 'notifications' | 'workers';
type WorkerApi = Worker & { available?: boolean };

type ScheduledNotification = {
  id: string;
  title: string;
  message: string;
  link: string;
  audience: string;
  status: string;
  recipients: number;
  scheduleAt: string;
  createdAt: string;
  processedAt: string;
};

const isValidSection = (value?: string): value is AdminSection => {
  return ['analysis', 'issues', 'assign', 'review', 'notifications', 'workers'].includes(value || '');
};

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const params = useParams();
  const activeSection: AdminSection = isValidSection(params.section) ? params.section : 'analysis';

  const [issues, setIssues] = useState<Issue[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [pendingReviews, setPendingReviews] = useState<Issue[]>([]);
  const [scheduled, setScheduled] = useState<ScheduledNotification[]>([]);
  const [assigningIssueId, setAssigningIssueId] = useState<string | null>(null);
  const [assignMap, setAssignMap] = useState<Record<string, string>>({});
  const [removingWorkerId, setRemovingWorkerId] = useState<string | null>(null);
  const [removeWorkerTarget, setRemoveWorkerTarget] = useState<Worker | null>(null);
  const [rejectReviewTarget, setRejectReviewTarget] = useState<{ id: string; title: string; notes: string }>({ id: '', title: '', notes: '' });
  const [loading, setLoading] = useState(true);
  const [adminNotice, setAdminNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [broadcastData, setBroadcastData] = useState({ title: '', message: '', audience: 'ALL' });
  const [scheduleData, setScheduleData] = useState({ title: '', message: '', audience: 'ALL', scheduleAt: '' });
  const [newWorker, setNewWorker] = useState({ name: '', specialization: '', phone: '', email: '', password: '' });

  const [issueSearch, setIssueSearch] = useState('');
  const [issueStatusFilter, setIssueStatusFilter] = useState('ALL');
  const [issueCategoryFilter, setIssueCategoryFilter] = useState('ALL');

  useEffect(() => {
    if (!isValidSection(params.section)) {
      navigate('/admin/analysis', { replace: true });
    }
  }, [navigate, params.section]);

  useEffect(() => {
    void fetchDashboardData();
    void fetchReviewItems();
    void fetchSchedules();
  }, []);

  const normalizeWorker = (worker: WorkerApi): Worker => {
    const activeIssueCount = Number(worker.activeIssueCount ?? 0);
    const isAvailable = typeof worker.isAvailable === 'boolean'
      ? worker.isAvailable
      : Boolean(worker.available);

    return {
      ...worker,
      activeIssueCount,
      isAvailable: activeIssueCount >= 5 ? false : isAvailable,
    };
  };

  const fetchDashboardData = async () => {
    try {
      const [issuesRes, workersRes] = await Promise.allSettled([
        api.get('/issues/nearby?lat=0&lng=0&radius=10000000&limit=250'),
        api.get('/admin/workers'),
      ]);

      if (issuesRes.status === 'fulfilled') {
        setIssues(Array.isArray(issuesRes.value.data) ? issuesRes.value.data : []);
      } else {
        setIssues([]);
      }

      if (workersRes.status === 'fulfilled') {
        const rawWorkers = Array.isArray(workersRes.value.data) ? workersRes.value.data as WorkerApi[] : [];
        setWorkers(rawWorkers.map(normalizeWorker));
      } else {
        setWorkers([]);
      }
    } catch {
      setAdminNotice({ type: 'error', text: 'Failed to load dashboard data.' });
    } finally {
      setLoading(false);
    }
  };

  const fetchReviewItems = async () => {
    try {
      const res = await api.get('/review/pending');
      setPendingReviews(Array.isArray(res.data) ? res.data : []);
    } catch {
      setPendingReviews([]);
    }
  };

  const fetchSchedules = async () => {
    try {
      const res = await api.get('/admin/notifications/schedules');
      setScheduled(Array.isArray(res.data) ? res.data : []);
    } catch {
      setScheduled([]);
    }
  };

  const getAssignedCountForWorker = (workerId: string) => {
    return issues.filter(issue =>
      issue.assignedWorker?.id === workerId
      && issue.status !== 'RESOLVED'
      && issue.status !== 'CLOSED'
    ).length;
  };

  const openIssues = useMemo(() => issues.filter(i => i.status === 'OPEN'), [issues]);
  const inProgressIssues = useMemo(() => issues.filter(i => i.status === 'IN_PROGRESS'), [issues]);
  const reviewIssues = useMemo(() => issues.filter(i => i.status === 'REVIEW'), [issues]);
  const resolvedIssues = useMemo(() => issues.filter(i => i.status === 'RESOLVED'), [issues]);

  const recentIssues = useMemo(() => {
    return [...issues]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 4);
  }, [issues]);

  const categoryCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const issue of issues) {
      const key = issue.category || 'OTHER';
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [issues]);

  const categories = useMemo(() => {
    return Array.from(new Set(issues.map(i => i.category).filter(Boolean))).sort();
  }, [issues]);

  const filteredIssues = useMemo(() => {
    const q = issueSearch.trim().toLowerCase();
    return issues.filter(issue => {
      const statusOk = issueStatusFilter === 'ALL' || issue.status === issueStatusFilter;
      const categoryOk = issueCategoryFilter === 'ALL' || issue.category === issueCategoryFilter;
      const searchOk = q.length === 0
        || issue.title?.toLowerCase().includes(q)
        || issue.description?.toLowerCase().includes(q)
        || issue.address?.toLowerCase().includes(q)
        || issue.assignedWorker?.name?.toLowerCase().includes(q);
      return statusOk && categoryOk && searchOk;
    });
  }, [issues, issueCategoryFilter, issueSearch, issueStatusFilter]);

  const statusCounts = useMemo(() => {
    return [
      { name: 'Open', value: openIssues.length, color: 'bg-amber-500' },
      { name: 'In Progress', value: inProgressIssues.length, color: 'bg-indigo-500' },
      { name: 'Review', value: reviewIssues.length, color: 'bg-violet-500' },
      { name: 'Resolved', value: resolvedIssues.length, color: 'bg-green-500' },
    ];
  }, [openIssues.length, inProgressIssues.length, reviewIssues.length, resolvedIssues.length]);

  const recentScheduledNotifications = useMemo(() => {
    return [...scheduled]
      .sort((a, b) => {
        const aTime = new Date(a.createdAt || a.scheduleAt).getTime();
        const bTime = new Date(b.createdAt || b.scheduleAt).getTime();
        return bTime - aTime;
      })
      .slice(0, 5);
  }, [scheduled]);

  const maxStatus = Math.max(1, ...statusCounts.map(s => s.value));

  const getBarWidthClass = (value: number, max: number) => {
    const ratio = max <= 0 ? 0 : (value / max) * 100;
    if (ratio >= 100) return 'w-full';
    if (ratio >= 90) return 'w-11/12';
    if (ratio >= 80) return 'w-10/12';
    if (ratio >= 70) return 'w-9/12';
    if (ratio >= 60) return 'w-8/12';
    if (ratio >= 50) return 'w-6/12';
    if (ratio >= 40) return 'w-5/12';
    if (ratio >= 30) return 'w-4/12';
    if (ratio >= 20) return 'w-3/12';
    if (ratio >= 10) return 'w-2/12';
    if (ratio > 0) return 'w-1/12';
    return 'w-0';
  };

  const handleAssign = async (issueId: string) => {
    const workerId = assignMap[issueId];
    if (!workerId) {
      setAdminNotice({ type: 'error', text: 'Select a worker before assigning.' });
      return;
    }

    setAssigningIssueId(issueId);
    try {
      await api.post(`/admin/issues/${issueId}/assign`, { workerId });
      setAdminNotice({ type: 'success', text: 'Resource assigned successfully.' });
      await fetchDashboardData();
    } catch (err: any) {
      const message = err?.response?.data?.error || err?.response?.data?.message || 'Failed to assign worker.';
      setAdminNotice({ type: 'error', text: message });
    } finally {
      setAssigningIssueId(null);
    }
  };

  const handleApproveReview = async (issueId: string) => {
    try {
      await api.post(`/review/${issueId}/approve`);
      setAdminNotice({ type: 'success', text: 'Review approved and marked resolved.' });
      await Promise.all([fetchReviewItems(), fetchDashboardData()]);
    } catch {
      setAdminNotice({ type: 'error', text: 'Failed to approve review.' });
    }
  };

  const openRejectReviewModal = (issueId: string, title: string) => {
    setRejectReviewTarget({
      id: issueId,
      title,
      notes: 'Please update and resubmit with clearer evidence.'
    });
  };

  const handleRejectReview = async () => {
    if (!rejectReviewTarget.id) {
      return;
    }

    try {
      await api.post(`/review/${rejectReviewTarget.id}/reject`, { notes: rejectReviewTarget.notes });
      setAdminNotice({ type: 'success', text: 'Review rejected and moved to in-progress.' });
      setPendingReviews((prev) => prev.filter((issue) => issue.id !== rejectReviewTarget.id));
      await Promise.all([fetchReviewItems(), fetchDashboardData()]);
      setRejectReviewTarget({ id: '', title: '', notes: '' });
    } catch {
      setAdminNotice({ type: 'error', text: 'Failed to reject review.' });
    }
  };

  const handleSendNow = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/admin/notifications/broadcast', broadcastData);
      const audienceLabel = broadcastData.audience === 'WORKERS'
        ? 'workers'
        : broadcastData.audience === 'ALL'
          ? 'all users'
          : 'users';
      setAdminNotice({ type: 'success', text: `Broadcast sent to ${res.data?.recipients ?? 0} ${audienceLabel}.` });
      setBroadcastData({ title: '', message: '', audience: 'ALL' });
      await fetchSchedules();
    } catch {
      setAdminNotice({ type: 'error', text: 'Failed to send broadcast notification.' });
    }
  };

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/admin/notifications/schedule', scheduleData);
      setAdminNotice({ type: 'success', text: 'Notification scheduled successfully.' });
      setScheduleData({ title: '', message: '', audience: 'ALL', scheduleAt: '' });
      await fetchSchedules();
    } catch (err: any) {
      const message = err?.response?.data?.error || err?.response?.data?.message || 'Failed to schedule notification.';
      setAdminNotice({ type: 'error', text: message });
    }
  };

  const handleCreateWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/admin/workers', newWorker);
      const credentials = res?.data?.credentials;
      const text = credentials?.email && credentials?.password
        ? `Worker created. Email: ${credentials.email}, Password: ${credentials.password}`
        : 'Worker created successfully.';
      setAdminNotice({ type: 'success', text });
      setNewWorker({ name: '', specialization: '', phone: '', email: '', password: '' });
      await fetchDashboardData();
    } catch {
      setAdminNotice({ type: 'error', text: 'Failed to create worker.' });
    }
  };

  const handleRemoveWorker = async (workerId: string) => {
    setRemovingWorkerId(workerId);
    try {
      const res = await api.delete(`/admin/workers/${workerId}`);
      const reset = Number(res?.data?.issuesReset ?? 0);
      setAdminNotice({ type: 'success', text: `Worker removed. ${reset} issue(s) reset to OPEN.` });
      await fetchDashboardData();
      await fetchReviewItems();
      setRemoveWorkerTarget(null);
    } catch {
      setAdminNotice({ type: 'error', text: 'Failed to remove worker.' });
    } finally {
      setRemovingWorkerId(null);
    }
  };

  const sectionItems: Array<{ key: AdminSection; label: string; icon: React.ReactNode; badge?: number }> = [
    { key: 'analysis', label: 'Analysis', icon: <PieChart className="w-4 h-4" /> },
    { key: 'issues', label: 'Issues', icon: <ClipboardList className="w-4 h-4" /> },
    { key: 'assign', label: 'Assign Resources', icon: <Wrench className="w-4 h-4" />, badge: openIssues.length },
    { key: 'review', label: 'Review', icon: <FileCheck2 className="w-4 h-4" />, badge: pendingReviews.length },
    { key: 'workers', label: 'Manage Workers', icon: <UserCog className="w-4 h-4" /> },
    { key: 'notifications', label: 'Manage Notifications', icon: <Bell className="w-4 h-4" /> },
  ];

  if (loading) {
    return <div className="flex justify-center py-40"><div className="animate-spin h-12 w-12 border-b-2 border-indigo-600 rounded-full" /></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed left-0 top-16 bottom-0 w-72 bg-slate-900 text-white border-r border-slate-800 z-30 overflow-y-auto">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Control Room</p>
              <h2 className="text-lg font-black">Admin Panel</h2>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-2">
          {sectionItems.map((item) => (
            <button
              key={item.key}
              onClick={() => navigate(`/admin/${item.key}`)}
              className={`w-full flex items-center justify-between rounded-2xl px-4 py-3 text-left transition-all ${
                activeSection === item.key
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/30'
                  : 'bg-slate-800/50 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center gap-2 text-sm font-bold">
                {item.icon}
                {item.label}
              </span>
              {typeof item.badge === 'number' && item.badge > 0 && (
                <span className="text-[10px] font-black px-2 py-1 rounded-full bg-white/20">{item.badge}</span>
              )}
            </button>
          ))}
        </div>
      </aside>

      <main className="ml-72 pt-6 px-6 lg:px-10">
        {adminNotice && (
          <div className={`mb-6 rounded-2xl border px-4 py-3 text-sm font-bold ${
            adminNotice.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
          }`}>
            {adminNotice.text}
          </div>
        )}

        {activeSection === 'analysis' && (
          <section className="space-y-8">
            <div>
              <h1 className="text-3xl font-black text-slate-900">Analysis</h1>
              <p className="text-slate-500">City-wide reporting, resolution and participation insights.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              <StatCard icon={<ClipboardList className="w-5 h-5" />} label="All Reported" value={issues.length} />
              <StatCard icon={<Users className="w-5 h-5" />} label="Users Created" value={new Set(issues.map(i => i.createdBy?.id).filter(Boolean)).size} />
              <StatCard icon={<CheckCircle2 className="w-5 h-5" />} label="Resolved" value={resolvedIssues.length} />
              <StatCard icon={<HardHat className="w-5 h-5" />} label="Workers" value={workers.length} />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="bg-white rounded-3xl border border-slate-100 p-6">
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500 mb-5">Status Graph</h3>
                <div className="space-y-4">
                  {statusCounts.map((status) => (
                    <div key={status.name}>
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span>{status.name}</span>
                        <span>{status.value}</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div className={`${status.color} h-full ${getBarWidthClass(status.value, maxStatus)}`} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-slate-100 p-6">
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500 mb-5">Category Graph</h3>
                <div className="space-y-3">
                  {categoryCounts.slice(0, 8).map(([name, count]) => (
                    <div key={name} className="flex items-center justify-between text-sm">
                      <span className="font-bold text-slate-700">{name}</span>
                      <span className="text-slate-500">{count}</span>
                    </div>
                  ))}
                  {categoryCounts.length === 0 && <p className="text-sm text-slate-400">No category data yet.</p>}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 p-6">
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500 mb-5">Latest Reports (Top 4)</h3>
              <div className="space-y-3">
                {recentIssues.map((issue) => (
                  <div key={issue.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50">
                    <div>
                      <p className="text-sm font-black text-slate-900">{issue.title}</p>
                      <p className="text-xs text-slate-500">{issue.category} • {issue.status.replace('_', ' ')}</p>
                    </div>
                    <Link to={`/issue/${issue.id}`} className="text-indigo-600 hover:text-indigo-700">
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                ))}
                {recentIssues.length === 0 && <p className="text-sm text-slate-400">No reports available.</p>}
              </div>
            </div>
          </section>
        )}

        {activeSection === 'issues' && (
          <section className="space-y-6">
            <div>
              <h1 className="text-3xl font-black text-slate-900">Issue Page</h1>
              <p className="text-slate-500">All reported issues across the system.</p>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
              <input
                value={issueSearch}
                onChange={(e) => setIssueSearch(e.target.value)}
                placeholder="Search issue, address, worker"
                className="md:col-span-2 border border-slate-200 rounded-xl px-3 py-2 text-sm"
              />
              <select
                value={issueStatusFilter}
                onChange={(e) => setIssueStatusFilter(e.target.value)}
                className="border border-slate-200 rounded-xl px-3 py-2 text-sm"
                aria-label="Issue status filter"
              >
                <option value="ALL">All Statuses</option>
                <option value="OPEN">OPEN</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="REVIEW">REVIEW</option>
                <option value="RESOLVED">RESOLVED</option>
                <option value="CLOSED">CLOSED</option>
              </select>
              <select
                value={issueCategoryFilter}
                onChange={(e) => setIssueCategoryFilter(e.target.value)}
                className="border border-slate-200 rounded-xl px-3 py-2 text-sm"
                aria-label="Issue category filter"
              >
                <option value="ALL">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
              <div className="grid grid-cols-12 px-6 py-3 text-xs font-black uppercase tracking-[0.15em] text-slate-500 border-b border-slate-100">
                <span className="col-span-4">Issue</span>
                <span className="col-span-2">Category</span>
                <span className="col-span-2">Status</span>
                <span className="col-span-2">Worker</span>
                <span className="col-span-2 text-right">Action</span>
              </div>
              <div className="divide-y divide-slate-100">
                {filteredIssues.map((issue) => (
                  <div key={issue.id} className="grid grid-cols-12 px-6 py-4 text-sm items-center">
                    <div className="col-span-4">
                      <p className="font-bold text-slate-900">{issue.title}</p>
                      <p className="text-xs text-slate-500">{issue.address || 'No address'}</p>
                    </div>
                    <span className="col-span-2 text-slate-700">{issue.category}</span>
                    <span className="col-span-2">
                      <span className="px-2 py-1 rounded-full text-[10px] font-black bg-slate-100 text-slate-700">
                        {issue.status.replace('_', ' ')}
                      </span>
                    </span>
                    <span className="col-span-2 text-slate-700">{issue.assignedWorker?.name || 'Unassigned'}</span>
                    <span className="col-span-2 text-right">
                      <Link to={`/issue/${issue.id}`} className="text-indigo-600 font-bold hover:underline">Open</Link>
                    </span>
                  </div>
                ))}
                {filteredIssues.length === 0 && <p className="p-6 text-sm text-slate-400">No issues found for current filter.</p>}
              </div>
            </div>
          </section>
        )}

        {activeSection === 'assign' && (
          <section className="space-y-6">
            <div>
              <h1 className="text-3xl font-black text-slate-900">Assign Resources</h1>
              <p className="text-slate-500">Assign open issues to available workers.</p>
            </div>

            <div className="space-y-4">
              {openIssues.map((issue) => (
                <div key={issue.id} className="bg-white rounded-3xl border border-slate-100 p-5">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                      <p className="text-lg font-black text-slate-900">{issue.title}</p>
                      <p className="text-sm text-slate-500">{issue.address || 'No address'} • {issue.category}</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                      <select
                        aria-label={`Assign worker for ${issue.title}`}
                        title={`Assign worker for ${issue.title}`}
                        value={assignMap[issue.id] || ''}
                        onChange={(e) => setAssignMap((prev) => ({ ...prev, [issue.id]: e.target.value }))}
                        className="border border-slate-200 rounded-xl px-3 py-2 text-sm min-w-56"
                      >
                        <option value="">Select worker</option>
                        {workers.map((worker) => {
                          const assigned = getAssignedCountForWorker(worker.id);
                          const full = assigned >= 5;
                          return (
                            <option key={worker.id} value={worker.id} disabled={full}>
                              {worker.name} ({assigned}/5)
                            </option>
                          );
                        })}
                      </select>
                      <button
                        onClick={() => handleAssign(issue.id)}
                        disabled={assigningIssueId === issue.id}
                        className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-sm font-black hover:bg-indigo-700 disabled:opacity-50"
                      >
                        {assigningIssueId === issue.id ? 'Assigning...' : 'Assign'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {openIssues.length === 0 && <p className="text-sm text-slate-400">No open issues waiting for assignment.</p>}
            </div>
          </section>
        )}

        {activeSection === 'review' && (
          <section className="space-y-6">
            <div>
              <h1 className="text-3xl font-black text-slate-900">Review Page</h1>
              <p className="text-slate-500">Approve or reject worker submissions in review status.</p>
            </div>

            <div className="space-y-4">
              {pendingReviews.map((issue) => (
                <div key={issue.id} className="bg-white rounded-3xl border border-slate-100 p-6">
                  <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                    <div className="xl:col-span-1">
                      {issue.reviewPhotoUrl ? (
                        <img src={issue.reviewPhotoUrl} alt="Review evidence" className="w-full h-44 object-cover rounded-2xl border border-slate-100" />
                      ) : (
                        <div className="w-full h-44 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 text-sm">No photo uploaded</div>
                      )}
                    </div>
                    <div className="xl:col-span-2">
                      <p className="text-lg font-black text-slate-900">{issue.title}</p>
                      <p className="text-sm text-slate-600 mt-2">{issue.description}</p>
                      <p className="text-xs text-slate-500 mt-3">Worker: {issue.assignedWorker?.name || 'Unknown'}</p>
                      {issue.reviewNotes && (
                        <p className="text-xs text-slate-500 mt-1">Last note: {issue.reviewNotes}</p>
                      )}
                    </div>
                    <div className="xl:col-span-1 flex xl:flex-col gap-3 xl:justify-center">
                      <button
                        onClick={() => handleApproveReview(issue.id)}
                        className="flex-1 bg-green-600 text-white px-4 py-2 rounded-xl font-black text-xs uppercase tracking-[0.15em] hover:bg-green-700"
                      >
                        Approve (Solved)
                      </button>
                      <button
                        onClick={() => openRejectReviewModal(issue.id, issue.title)}
                        className="flex-1 bg-red-600 text-white px-4 py-2 rounded-xl font-black text-xs uppercase tracking-[0.15em] hover:bg-red-700"
                      >
                        Reject (In Progress)
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {pendingReviews.length === 0 && <p className="text-sm text-slate-400">No issues are pending review.</p>}
            </div>
          </section>
        )}

        {rejectReviewTarget.id && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
              onClick={() => setRejectReviewTarget({ id: '', title: '', notes: '' })}
            />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="relative w-full max-w-xl rounded-4xl bg-white p-8 shadow-2xl shadow-slate-900/20 border border-slate-100"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-red-600">
                  <ClipboardList className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-black text-slate-900 tracking-tighter">Add rejection notes</h3>
                  <p className="mt-2 text-sm font-medium text-slate-500 leading-relaxed">
                    {rejectReviewTarget.title} will be moved back to in-progress after you submit the notes.
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-xs font-black text-slate-500 uppercase tracking-[0.15em] mb-2">Rejection Notes</label>
                <textarea
                  rows={5}
                  value={rejectReviewTarget.notes}
                  onChange={(e) => setRejectReviewTarget((prev) => ({ ...prev, notes: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100"
                  placeholder="Explain what needs to be improved before resubmission"
                />
              </div>

              <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setRejectReviewTarget({ id: '', title: '', notes: '' })}
                  className="rounded-2xl border border-slate-200 px-6 py-3 text-xs font-black uppercase tracking-widest text-slate-600 transition-colors hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRejectReview}
                  className="rounded-2xl bg-red-600 px-6 py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-red-200 transition-colors hover:bg-red-700"
                >
                  Submit Notes
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {activeSection === 'workers' && (
          <section className="space-y-6">
            <div>
              <h1 className="text-3xl font-black text-slate-900">Manage Workers</h1>
              <p className="text-slate-500">Add new workers and remove existing workers.</p>
            </div>

            <form onSubmit={handleCreateWorker} className="bg-white rounded-3xl border border-slate-100 p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3 items-end">
              <div className="xl:col-span-1">
                <label htmlFor="worker-name" className="block text-xs font-black text-slate-500 mb-1">Name</label>
                <input
                  id="worker-name"
                  required
                  value={newWorker.name}
                  onChange={(e) => setNewWorker((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                />
              </div>
              <div className="xl:col-span-1">
                <label htmlFor="worker-specialization" className="block text-xs font-black text-slate-500 mb-1">Specialization</label>
                <input
                  id="worker-specialization"
                  value={newWorker.specialization}
                  onChange={(e) => setNewWorker((prev) => ({ ...prev, specialization: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                />
              </div>
              <div className="xl:col-span-1">
                <label htmlFor="worker-phone" className="block text-xs font-black text-slate-500 mb-1">Phone</label>
                <input
                  id="worker-phone"
                  value={newWorker.phone}
                  onChange={(e) => setNewWorker((prev) => ({ ...prev, phone: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                />
              </div>
              <div className="xl:col-span-1">
                <label htmlFor="worker-email" className="block text-xs font-black text-slate-500 mb-1">Email *</label>
                <input
                  id="worker-email"
                  type="email"
                  value={newWorker.email}
                  onChange={(e) => setNewWorker((prev) => ({ ...prev, email: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                />
              </div>
              <div className="xl:col-span-1">
                <label htmlFor="worker-password" className="block text-xs font-black text-slate-500 mb-1">Password *</label>
                <input
                  id="worker-password"
                  value={newWorker.password}
                  onChange={(e) => setNewWorker((prev) => ({ ...prev, password: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                />
              </div>
              <button className="xl:col-span-1 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-black hover:bg-indigo-700 h-10">Add Worker</button>
            </form>

            <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
              <div className="grid grid-cols-12 px-6 py-3 text-xs font-black uppercase tracking-[0.15em] text-slate-500 border-b border-slate-100">
                <span className="col-span-3">Worker</span>
                <span className="col-span-3">Specialization</span>
                <span className="col-span-2">Phone</span>
                <span className="col-span-2">Load</span>
                <span className="col-span-2 text-right">Action</span>
              </div>
              <div className="divide-y divide-slate-100">
                {workers.map((worker) => {
                  const assigned = getAssignedCountForWorker(worker.id);
                  return (
                    <div key={worker.id} className="grid grid-cols-12 px-6 py-4 text-sm items-center">
                      <span className="col-span-3 font-bold text-slate-900">{worker.name}</span>
                      <span className="col-span-3 text-slate-700">{worker.specialization || '-'}</span>
                      <span className="col-span-2 text-slate-700">{worker.phone || '-'}</span>
                      <span className="col-span-2 text-slate-700">{assigned}/5</span>
                      <span className="col-span-2 text-right">
                        <button
                          onClick={() => setRemoveWorkerTarget(worker)}
                          disabled={removingWorkerId === worker.id}
                          className="inline-flex items-center gap-1 text-red-600 font-black hover:text-red-700 disabled:opacity-50"
                        >
                          <Trash2 className="w-3 h-3" />
                          {removingWorkerId === worker.id ? 'Removing...' : 'Remove'}
                        </button>
                      </span>
                    </div>
                  );
                })}
                {workers.length === 0 && <p className="p-6 text-sm text-slate-400">No workers available.</p>}

              {removeWorkerTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                  <div
                    className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
                    onClick={() => !removingWorkerId && setRemoveWorkerTarget(null)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className="relative w-full max-w-lg rounded-4xl bg-white p-8 shadow-2xl shadow-slate-900/20 border border-slate-100"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-red-600">
                        <Trash2 className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-black text-slate-900 tracking-tighter">Remove worker?</h3>
                        <p className="mt-2 text-sm font-medium text-slate-500 leading-relaxed">
                          {removeWorkerTarget.name} will be removed and any active assignments will be reset to OPEN.
                        </p>
                      </div>
                    </div>

                    <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                      <button
                        type="button"
                        onClick={() => setRemoveWorkerTarget(null)}
                        disabled={!!removingWorkerId}
                        className="rounded-2xl border border-slate-200 px-6 py-3 text-xs font-black uppercase tracking-widest text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await handleRemoveWorker(removeWorkerTarget.id);
                        }}
                        disabled={!!removingWorkerId}
                        className="rounded-2xl bg-red-600 px-6 py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-red-200 transition-colors hover:bg-red-700 disabled:opacity-50"
                      >
                        {removingWorkerId === removeWorkerTarget.id ? 'Removing...' : 'Yes, remove worker'}
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
              </div>
            </div>
          </section>
        )}

        {activeSection === 'notifications' && (
          <section className="space-y-6">
            <div>
              <h1 className="text-3xl font-black text-slate-900">Manage Notifications</h1>
              <p className="text-slate-500">Send immediate broadcasts or schedule them for later.</p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <form onSubmit={handleSendNow} className="bg-white rounded-3xl border border-slate-100 p-6 space-y-4">
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                  <Megaphone className="w-4 h-4" /> Send Now
                </h3>
                <input
                  required
                  value={broadcastData.title}
                  onChange={(e) => setBroadcastData((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Notification title"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                />
                <select
                  aria-label="Broadcast audience"
                  value={broadcastData.audience}
                  onChange={(e) => setBroadcastData((prev) => ({ ...prev, audience: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                >
                  <option value="USERS">Users</option>
                  <option value="WORKERS">Workers</option>
                  <option value="ALL">All</option>
                </select>
                <textarea
                  required
                  rows={4}
                  value={broadcastData.message}
                  onChange={(e) => setBroadcastData((prev) => ({ ...prev, message: e.target.value }))}
                  placeholder="Notification message"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                />
                <button className="w-full bg-indigo-600 text-white py-3 rounded-xl text-sm font-black hover:bg-indigo-700">Send Broadcast</button>
              </form>

              <form onSubmit={handleSchedule} className="bg-white rounded-3xl border border-slate-100 p-6 space-y-4">
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                  <CalendarClock className="w-4 h-4" /> Schedule
                </h3>
                <input
                  required
                  value={scheduleData.title}
                  onChange={(e) => setScheduleData((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Scheduled title"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                />
                <select
                  aria-label="Scheduled notification audience"
                  value={scheduleData.audience}
                  onChange={(e) => setScheduleData((prev) => ({ ...prev, audience: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                >
                  <option value="USERS">Users</option>
                  <option value="WORKERS">Workers</option>
                  <option value="ALL">All</option>
                </select>
                <textarea
                  required
                  rows={4}
                  value={scheduleData.message}
                  onChange={(e) => setScheduleData((prev) => ({ ...prev, message: e.target.value }))}
                  placeholder="Scheduled message"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                />
                <input
                  required
                  type="datetime-local"
                  aria-label="Schedule date and time"
                  title="Schedule date and time"
                  value={scheduleData.scheduleAt}
                  onChange={(e) => setScheduleData((prev) => ({ ...prev, scheduleAt: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                />
                <button className="w-full bg-slate-900 text-white py-3 rounded-xl text-sm font-black hover:bg-slate-800">Schedule Notification</button>
              </form>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 p-6">
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500 mb-4">Scheduled Queue</h3>
              <div className="space-y-3">
                {recentScheduledNotifications.map((item) => (
                  <div key={item.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2">
                      <div>
                        <p className="text-sm font-black text-slate-900">{item.title}</p>
                        <p className="text-xs text-slate-500">{item.message.replace(/\s*Points:\s*0\b/gi, '').trim()}</p>
                        <p className="text-[11px] text-slate-400 mt-1">Scheduled: {item.scheduleAt}</p>
                        <p className="text-[11px] text-slate-400">Audience: {item.audience === 'WORKERS' ? 'Workers' : item.audience === 'ALL' || item.audience === 'ALL_EXCEPT_ADMIN' ? 'All' : 'Users'}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-xs font-black uppercase ${item.status === 'SENT' ? 'text-green-600' : 'text-amber-600'}`}>{item.status}</p>
                        <p className="text-[11px] text-slate-400">Recipients: {item.recipients ?? 0}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {recentScheduledNotifications.length === 0 && <p className="text-sm text-slate-400">No scheduled notifications yet.</p>}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

const StatCard = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) => (
  <div className="bg-white rounded-3xl border border-slate-100 p-6">
    <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
      {icon}
    </div>
    <p className="text-xs font-black uppercase tracking-[0.15em] text-slate-500">{label}</p>
    <p className="text-3xl font-black text-slate-900 mt-1">{value}</p>
  </div>
);

export default AdminDashboard;
