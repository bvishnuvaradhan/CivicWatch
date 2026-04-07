import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line
} from 'recharts';
import { 
  BarChart3, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle, 
  Award, 
  Users, 
  Activity,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { LeaderboardUser } from '../types';

const COLORS = ['#4f46e5', '#7c3aed', '#2563eb', '#0891b2', '#0d9488'];
const COLOR_CLASSES = ['bg-indigo-600', 'bg-violet-600', 'bg-blue-600', 'bg-cyan-600', 'bg-teal-600'];

type StatsResponse = {
  total: number;
  activeUsers: number;
  byStatus: Record<string, number>;
  byCategory: Record<string, number>;
  weeklyActivity: Array<{
    name: string;
    reports: number;
  }>;
};

type ChartDatum = {
  name: string;
  value: number;
};

const StatsPage = () => {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, leaderboardRes] = await Promise.all([
          api.get('/issues/stats'),
          api.get('/leaderboard')
        ]);
        setStats(statsRes.data);
        setLeaderboard(leaderboardRes.data.slice(0, 5));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const categoryData: ChartDatum[] = stats?.byCategory
    ? Object.entries(stats.byCategory).map(([name, value]) => ({ name, value }))
    : [];
  const statusData: ChartDatum[] = stats?.byStatus
    ? Object.entries(stats.byStatus).map(([name, value]) => ({ name, value }))
    : [];
  const trendData = stats?.weeklyActivity ?? [];

  if (loading) return <div className="flex justify-center py-40"><div className="animate-spin h-12 w-12 border-b-2 border-indigo-600 rounded-full" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Community Impact</h1>
          <p className="text-slate-500 mt-2 font-medium">Real-time data on how we're improving our neighborhood together.</p>
        </div>

        {/* Top Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {[
            { label: "Total Reports", value: stats?.total || 0, icon: <AlertCircle className="w-6 h-6" />, color: "text-indigo-600", bg: "bg-indigo-50", trend: "+12%", up: true },
            { label: "Resolved", value: stats?.byStatus?.RESOLVED || 0, icon: <CheckCircle2 className="w-6 h-6" />, color: "text-green-600", bg: "bg-green-50", trend: "+8%", up: true },
            { label: "Resolution Rate", value: `${stats?.total ? Math.round((stats.byStatus?.RESOLVED / stats.total) * 100) : 0}%`, icon: <TrendingUp className="w-6 h-6" />, color: "text-violet-600", bg: "bg-violet-50", trend: "+5%", up: true },
            { label: "Active Citizens", value: stats?.activeUsers || 0, icon: <Users className="w-6 h-6" />, color: "text-amber-600", bg: "bg-amber-50", trend: "+15%", up: true }
          ].map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-8 rounded-[40px] shadow-xl shadow-slate-100 border border-slate-50"
            >
              <div className="flex justify-between items-start mb-6">
                <div className={`${stat.bg} ${stat.color} w-12 h-12 rounded-2xl flex items-center justify-center`}>
                  {stat.icon}
                </div>
                <div className={`flex items-center text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${stat.up ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                  {stat.up ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                  {stat.trend}
                </div>
              </div>
              <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">{stat.label}</p>
              <h4 className="text-4xl font-black text-slate-900">{stat.value}</h4>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Charts Section */}
          <div className="lg:col-span-2 space-y-12">
            
            {/* Weekly Trend */}
            <div className="bg-white p-10 rounded-[40px] shadow-xl shadow-slate-100 border border-slate-50">
              <div className="flex items-center justify-between mb-10">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center">
                  <Activity className="w-5 h-5 mr-2 text-indigo-600" />
                  Weekly Activity
                </h3>
                <div className="flex gap-2">
                  <span className="w-3 h-3 rounded-full bg-indigo-600" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reports</span>
                </div>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px 16px' }}
                      itemStyle={{ fontWeight: 900, color: '#4f46e5' }}
                    />
                    <Line type="monotone" dataKey="reports" stroke="#4f46e5" strokeWidth={4} dot={{ r: 6, fill: '#4f46e5', strokeWidth: 3, stroke: '#fff' }} activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Category Breakdown */}
              <div className="bg-white p-10 rounded-[40px] shadow-xl shadow-slate-100 border border-slate-50">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-10">By Category</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-6 space-y-2">
                  {categoryData.map((cat, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${COLOR_CLASSES[i % COLOR_CLASSES.length]}`} />
                        <span className="text-xs font-bold text-slate-600">{cat.name}</span>
                      </div>
                      <span className="text-xs font-black text-slate-900">{cat.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status Breakdown */}
              <div className="bg-white p-10 rounded-[40px] shadow-xl shadow-slate-100 border border-slate-50">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-10">By Status</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statusData}>
                      <XAxis dataKey="name" axisLine={false} tickLine={false} hide />
                      <Tooltip />
                      <Bar dataKey="value" radius={[10, 10, 10, 10]}>
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-6 space-y-2">
                  {statusData.map((stat, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${COLOR_CLASSES[i % COLOR_CLASSES.length]}`} />
                        <span className="text-xs font-bold text-slate-600">{stat.name.replace('_', ' ')}</span>
                      </div>
                      <span className="text-xs font-black text-slate-900">{stat.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Leaderboard Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-slate-900 rounded-[40px] p-10 text-white shadow-2xl shadow-indigo-200 relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-10">
                  <h3 className="text-sm font-black uppercase tracking-widest flex items-center">
                    <Award className="w-6 h-6 mr-3 text-indigo-400" />
                    Top Contributors
                  </h3>
                </div>

                <div className="space-y-8">
                  {leaderboard.map((user, i) => (
                    <div key={user.id} className="flex items-center justify-between group">
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-white font-black shadow-lg group-hover:scale-110 transition-transform">
                            {user.name[0]}
                          </div>
                          {i < 3 && (
                            <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border-2 border-slate-900 ${
                              i === 0 ? 'bg-amber-400 text-amber-900' :
                              i === 1 ? 'bg-slate-300 text-slate-900' :
                              'bg-amber-700 text-amber-100'
                            }`}>
                              {i + 1}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-black group-hover:text-indigo-400 transition-colors">{user.name}</p>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{user.reportsCount} Reports</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black text-indigo-400 leading-none">{user.reputationPoints}</p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Points</p>
                      </div>
                    </div>
                  ))}
                </div>

                <Link to="/leaderboard" className="block w-full mt-12 py-5 rounded-3xl bg-indigo-600 text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20 text-center">
                  View Full Leaderboard
                </Link>
              </div>
              <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px]" />
            </div>

            {/* Achievement Highlight */}
            <div className="mt-12 bg-white rounded-[40px] p-10 shadow-xl shadow-slate-100 border border-slate-50 text-center">
              <div className="bg-indigo-50 w-20 h-20 rounded-4xl flex items-center justify-center text-indigo-600 mx-auto mb-8 shadow-lg">
                <Award className="w-10 h-10" />
              </div>
              <h4 className="text-2xl font-black text-slate-900 tracking-tighter mb-4">Earn your badges.</h4>
              <p className="text-slate-500 font-medium mb-8">Contribute to your community and unlock exclusive rewards and recognition.</p>
              <div className="flex justify-center -space-x-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-12 h-12 rounded-2xl bg-slate-100 border-4 border-white flex items-center justify-center text-slate-400">
                    <Award className="w-5 h-5" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsPage;
