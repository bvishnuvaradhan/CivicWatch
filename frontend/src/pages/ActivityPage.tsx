import React, { useState, useEffect } from 'react';
import { Activity, MessageSquare, AlertCircle, CheckCircle2, Award, Clock, Filter, Search } from 'lucide-react';
import { motion } from 'motion/react';
import api from '../lib/api';
import { formatDistanceToNowStrict } from 'date-fns';

const ActivityPage = () => {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const res = await api.get('/activity');
        const sorted = [...(res.data ?? [])].sort((a, b) => {
          const left = Number(a?.createdAtEpochMs ?? 0);
          const right = Number(b?.createdAtEpochMs ?? 0);
          return right - left;
        });
        setActivities(sorted);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchActivity();
  }, []);

  const filteredActivities = activities.filter(act => 
    filter === 'ALL' || act.type === filter
  );

  const getActivityDate = (activity: any): Date | null => {
    const epochValue = activity?.createdAtEpochMs;
    if (typeof epochValue === 'number') {
      if (epochValue <= 0) return null;
      return new Date(epochValue);
    }
    if (typeof epochValue === 'string' && /^\d+$/.test(epochValue)) {
      const parsedEpoch = Number(epochValue);
      if (parsedEpoch <= 0) return null;
      return new Date(parsedEpoch);
    }

    const parsed = new Date(activity?.createdAt);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }

    return null;
  };

  if (loading) return <div className="flex justify-center py-40"><div className="animate-spin h-12 w-12 border-b-2 border-indigo-600 rounded-full" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-12 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Community Activity</h1>
            <p className="text-slate-500 mt-2 font-medium">Real-time feed of civic actions across the neighborhood.</p>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Actions</p>
              <p className="text-2xl font-black text-slate-900">{activities.length}</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-12">
          {['ALL', 'ISSUE', 'COMMENT', 'VOTE'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                filter === f 
                  ? 'bg-slate-900 text-white shadow-xl shadow-slate-200' 
                  : 'bg-white text-slate-400 border border-slate-100 hover:bg-slate-50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Activity Feed */}
        <div className="space-y-6">
          {filteredActivities.map((act, i) => (
            <motion.div
              key={act.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white p-8 rounded-[40px] shadow-xl shadow-slate-100 border border-slate-50 flex items-start space-x-6 relative overflow-hidden group"
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform ${
                act.type === 'ISSUE' ? 'bg-indigo-50 text-indigo-600' :
                act.type === 'COMMENT' ? 'bg-violet-50 text-violet-600' :
                'bg-amber-50 text-amber-600'
              }`}>
                {act.type === 'ISSUE' ? <AlertCircle className="w-6 h-6" /> :
                 act.type === 'COMMENT' ? <MessageSquare className="w-6 h-6" /> :
                 <CheckCircle2 className="w-6 h-6" />}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full">
                    {act.type}
                  </span>
                  <div className="flex items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <Clock className="w-3 h-3 mr-1" />
                    {(() => {
                      const activityDate = getActivityDate(act);
                      return activityDate ? formatDistanceToNowStrict(activityDate, { addSuffix: true }) : 'unknown time';
                    })()}
                  </div>
                </div>
                <p className="text-slate-900 font-medium text-lg leading-tight">
                  <span className="font-black text-slate-900">{act.userName}</span> {
                    act.type === 'ISSUE' ? `reported: "${act.action}"` :
                    act.type === 'COMMENT' ? `commented: "${act.action}"` :
                    `voted on an issue`
                  }
                </p>
              </div>
              
              <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50/50 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
            </motion.div>
          ))}

          {filteredActivities.length === 0 && (
            <div className="text-center py-20 bg-white rounded-[40px] border-2 border-dashed border-slate-100">
              <Activity className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-400 font-black uppercase tracking-widest text-sm">No activity found for this filter.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityPage;
