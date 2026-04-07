import React, { useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Clock, MapPin, ChevronRight, Filter } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { Issue } from '../types';
import { formatDistanceToNow } from 'date-fns';

const MyIssuesPage = () => {
  const { user } = useAuth();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    if (user) {
      void fetchIssues();
    }
  }, [user]);

  const fetchIssues = async () => {
    try {
      const res = await api.get('/issues/mine');
      setIssues(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setIssues([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredIssues = useMemo(() => {
    if (statusFilter === 'ALL') return issues;
    return issues.filter((issue) => issue.status === statusFilter);
  }, [issues, statusFilter]);

  if (!user) return <Navigate to="/auth" />;

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter">My Issues</h1>
            <p className="text-slate-500 mt-2">All issues reported by your account only.</p>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <select
              aria-label="Filter my issues by status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white"
            >
              <option value="ALL">All statuses</option>
              <option value="OPEN">OPEN</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="REVIEW">REVIEW</option>
              <option value="RESOLVED">RESOLVED</option>
              <option value="CLOSED">CLOSED</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin h-10 w-10 border-b-2 border-indigo-600 rounded-full" />
          </div>
        ) : filteredIssues.length === 0 ? (
          <div className="bg-white rounded-4xl border border-slate-100 p-14 text-center">
            <div className="bg-slate-50 w-16 h-16 rounded-3xl flex items-center justify-center text-slate-300 mx-auto mb-5">
              <Clock className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-black text-slate-900">No issues found</h2>
            <p className="text-slate-500 mt-2">You have no reported issues for this filter.</p>
            <Link to="/report" className="inline-flex mt-6 bg-indigo-600 text-white px-5 py-3 rounded-2xl text-sm font-black hover:bg-indigo-700">
              Report New Issue
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredIssues.map((issue) => (
              <Link
                key={issue.id}
                to={`/issue/${issue.id}`}
                className="bg-white rounded-3xl border border-slate-100 p-5 flex items-center gap-4 hover:border-indigo-200 hover:bg-indigo-50/20 transition-all"
              >
                <div className="w-14 h-14 rounded-2xl bg-slate-100 overflow-hidden shrink-0">
                  {issue.imageUrl ? (
                    <img src={issue.imageUrl} alt={issue.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <MapPin className="w-5 h-5" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-tighter border ${
                      issue.status === 'RESOLVED' ? 'bg-green-50 text-green-700 border-green-200' :
                      issue.status === 'IN_PROGRESS' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      issue.status === 'REVIEW' ? 'bg-violet-50 text-violet-700 border-violet-200' :
                      'bg-slate-50 text-slate-700 border-slate-200'
                    }`}>
                      {issue.status.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{issue.category}</span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 truncate">{issue.title}</h3>
                  <p className="text-xs text-slate-500 truncate mt-1">{issue.address || 'No location provided'}</p>
                  <p className="text-[11px] text-slate-400 mt-1">{formatDistanceToNow(new Date(issue.createdAt))} ago</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyIssuesPage;
