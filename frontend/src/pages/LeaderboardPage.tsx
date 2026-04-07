import React, { useState, useEffect } from 'react';
import { Award, Search, Filter } from 'lucide-react';
import { motion } from 'motion/react';
import api from '../lib/api';
import { LeaderboardUser } from '../types';
import { useAuth } from '../context/AuthContext';

const LeaderboardPage = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { user: currentUser } = useAuth();

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await api.get('/leaderboard');
        setLeaderboard(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  const filteredLeaderboard = leaderboard.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const podiumEntries = [
    { user: leaderboard[1], rank: 2 },
    { user: leaderboard[0], rank: 1 },
    { user: leaderboard[2], rank: 3 }
  ].filter((entry): entry is { user: LeaderboardUser; rank: number } => Boolean(entry.user));

  if (loading) return <div className="flex justify-center py-40"><div className="animate-spin h-12 w-12 border-b-2 border-indigo-600 rounded-full" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-12 text-center">
          <motion.div 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-indigo-600 rounded-4xl text-white mb-6 shadow-xl shadow-indigo-200"
          >
            <Award className="w-10 h-10" />
          </motion.div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Community Leaderboard</h1>
          <p className="text-slate-500 mt-2 font-medium">Recognizing our most active and impactful citizens.</p>
        </div>

        {/* Top 3 Podium */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {podiumEntries.map((entry, i) => (
            (() => {
              const isCurrentUser = currentUser?.id === entry.user.id;
              return (
            <motion.div
              key={entry.user.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`relative bg-white p-8 rounded-[40px] border-2 text-center ${
                isCurrentUser
                  ? 'border-blue-500 shadow-[0_0_36px_rgba(59,130,246,0.45)] bg-blue-50/50'
                  : entry.rank === 1
                  ? 'border-amber-400 scale-110 z-10 shadow-[0_0_40px_rgba(251,191,36,0.45)]'
                  : entry.rank === 2
                    ? 'border-slate-300 shadow-[0_0_32px_rgba(148,163,184,0.45)]'
                    : 'border-orange-300 shadow-[0_0_32px_rgba(180,83,9,0.35)]'
              }`}
            >
              <div className={`absolute -top-4 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full flex items-center justify-center font-black text-sm border-4 border-white ${
                entry.rank === 1 ? 'bg-amber-400 text-amber-900' :
                entry.rank === 2 ? 'bg-slate-300 text-slate-900' :
                'bg-orange-700 text-orange-100'
              }`}>
                {entry.rank}
              </div>
              <div className="w-20 h-20 bg-slate-100 rounded-3xl mx-auto mb-4 flex items-center justify-center text-2xl font-black text-slate-400">
                {entry.user.name[0]}
              </div>
              <h3 className="text-lg font-black text-slate-900">
                {entry.user.name}
                {isCurrentUser && <span className="ml-2 text-[10px] align-middle px-2 py-1 rounded-full bg-blue-600 text-white uppercase tracking-widest">You</span>}
              </h3>
              <div className="mt-4 flex flex-col items-center">
                <span className={`text-2xl font-black ${isCurrentUser ? 'text-blue-700' : 'text-indigo-600'}`}>{entry.user.reputationPoints}</span>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Points</span>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-50 flex justify-around">
                <div>
                  <p className="text-xs font-black text-slate-900">{entry.user.reportsCount}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Reports</p>
                </div>
              </div>
            </motion.div>
              );
            })()
          ))}
        </div>

        {/* Search and List */}
        <div className="bg-white rounded-[40px] shadow-xl shadow-slate-100 border border-slate-50 overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search citizens..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-indigo-600 font-medium text-sm"
              />
            </div>
            <button className="flex items-center px-6 py-4 bg-slate-50 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-slate-100 transition-colors">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </button>
          </div>

          <div className="divide-y divide-slate-50">
            {filteredLeaderboard.map((user, i) => (
              (() => {
                const isCurrentUser = currentUser?.id === user.id;
                return (
              <motion.div 
                key={user.id}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                className={`p-6 flex items-center justify-between transition-colors ${
                  isCurrentUser
                    ? 'bg-blue-50 border-l-4 border-blue-600 hover:bg-blue-100/70'
                    : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center space-x-6">
                  <span className={`w-6 text-sm font-black ${isCurrentUser ? 'text-blue-600' : 'text-slate-300'}`}>#{i + 1}</span>
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black ${
                    isCurrentUser ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {user.name[0]}
                  </div>
                  <div>
                    <h4 className={`text-sm font-black ${isCurrentUser ? 'text-blue-900' : 'text-slate-900'}`}>
                      {user.name}
                      {isCurrentUser && <span className="ml-2 text-[10px] px-2 py-1 rounded-full bg-blue-600 text-white uppercase tracking-widest">You</span>}
                    </h4>
                    <p className={`text-[10px] font-bold uppercase tracking-widest ${isCurrentUser ? 'text-blue-700' : 'text-slate-400'}`}>{user.reportsCount} Reports Submitted</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-black ${isCurrentUser ? 'text-blue-700' : 'text-slate-900'}`}>{user.reputationPoints}</p>
                  <p className={`text-[10px] font-bold uppercase tracking-widest ${isCurrentUser ? 'text-blue-700' : 'text-slate-400'}`}>Points</p>
                </div>
              </motion.div>
                );
              })()
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage;
