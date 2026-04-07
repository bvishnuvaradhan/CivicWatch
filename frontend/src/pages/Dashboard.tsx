import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { 
  MapPin, 
  Search, 
  Filter, 
  ThumbsUp, 
  MessageSquare, 
  ChevronRight, 
  AlertCircle,
  Clock,
  TrendingUp,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { Issue } from '../types';
import { formatDistanceToNow } from 'date-fns';
import L from 'leaflet';
import { useAuth } from '../context/AuthContext';

// Fix Leaflet icon issue
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const Dashboard = () => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<{ lat: number; lng: number }>({ lat: 17.3850, lng: 78.4867 }); // Default Hyderabad
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [viewMode, setViewMode] = useState<'LIST' | 'MAP'>('LIST');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setLocation(loc);
      },
      () => {
        // Fallback to default location
      }
    );
  }, []);

  const fetchIssues = async (loc: { lat: number; lng: number }) => {
    setLoading(true);
    try {
      const [issuesRes, activityRes, statsRes] = await Promise.allSettled([
        api.get(`/issues/nearby?lat=${loc.lat}&lng=${loc.lng}&category=${filterCategory}&status=${filterStatus}&search=${searchQuery}`),
        api.get('/activity'),
        api.get('/issues/stats')
      ]);

      if (issuesRes.status === 'fulfilled') {
        setIssues(Array.isArray(issuesRes.value.data) ? issuesRes.value.data : []);
      } else {
        console.error(issuesRes.reason);
        setIssues([]);
      }

      if (activityRes.status === 'fulfilled') {
        setActivities(Array.isArray(activityRes.value.data) ? activityRes.value.data.slice(0, 4) : []);
      }

      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues(location);
  }, [location, filterCategory, filterStatus, searchQuery]);

  const filteredIssues = issues;

  const handleVote = async (id: string) => {
    if (!user) {
      navigate('/auth');
      return;
    }
    try {
      await api.post(`/issues/${id}/vote`, {});
      fetchIssues(location);
    } catch (err) {
      alert('Unable to vote right now');
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header & Search */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Community Dashboard</h1>
            <p className="text-slate-500 mt-1 flex items-center">
              <MapPin className="w-4 h-4 mr-1 text-indigo-600" />
              Showing reports near your location
            </p>
          </div>

          <div className="flex flex-col sm:flex-row w-full lg:w-auto gap-4">
            <div className="relative flex-1 sm:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="text"
                placeholder="Search issues..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-white transition-all shadow-sm"
              />
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setViewMode('LIST')}
                className={`px-6 py-3 rounded-2xl font-bold transition-all ${viewMode === 'LIST' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white text-slate-600 border border-slate-200'}`}
              >
                List
              </button>
              <button 
                onClick={() => setViewMode('MAP')}
                className={`px-6 py-3 rounded-2xl font-bold transition-all ${viewMode === 'MAP' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white text-slate-600 border border-slate-200'}`}
              >
                Map
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-8">
          <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
            <Filter className="w-4 h-4 text-slate-400" />
            <select 
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              aria-label="Filter issues by category"
              className="text-sm font-bold text-slate-700 outline-none bg-transparent"
            >
              <option value="ALL">All Categories</option>
              <option value="INFRASTRUCTURE">Infrastructure</option>
              <option value="UTILITIES">Utilities</option>
              <option value="SANITATION">Sanitation</option>
              <option value="SAFETY">Public Safety</option>
              <option value="ENVIRONMENT">Environment</option>
            </select>
          </div>
          <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
            <Activity className="w-4 h-4 text-slate-400" />
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              aria-label="Filter issues by status"
              className="text-sm font-bold text-slate-700 outline-none bg-transparent"
            >
              <option value="ALL">All Status</option>
              <option value="REPORTED">Reported</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {loading ? (
              <div className="flex justify-center items-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
              </div>
            ) : viewMode === 'LIST' ? (
              <div className="space-y-6">
                <AnimatePresence mode="popLayout">
                  {filteredIssues.length === 0 ? (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bg-white p-12 rounded-3xl border border-slate-200 text-center"
                    >
                      <div className="bg-slate-50 w-16 h-16 rounded-2xl flex items-center justify-center text-slate-400 mx-auto mb-4">
                        <AlertCircle className="w-8 h-8" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900">No issues matching your criteria</h3>
                      <p className="text-slate-500 mt-2">Try adjusting your filters or search query.</p>
                    </motion.div>
                  ) : (
                    filteredIssues.map((issue) => (
                      <motion.div 
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        key={issue.id}
                        className="bg-white rounded-3xl border border-slate-200 overflow-hidden hover:shadow-xl transition-all group"
                      >
                        <div className="flex flex-col md:flex-row">
                          <div className="md:w-48 h-48 bg-slate-100 relative overflow-hidden">
                            {issue.imageUrl ? (
                              <img src={issue.imageUrl} alt={issue.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-300">
                                <MapPin className="w-12 h-12" />
                              </div>
                            )}
                            <div className="absolute top-3 left-3">
                              <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter ${
                                issue.severity === 'CRITICAL' ? 'bg-red-600 text-white' :
                                issue.severity === 'HIGH' ? 'bg-orange-500 text-white' :
                                'bg-indigo-600 text-white'
                              }`}>
                                {issue.severity}
                              </span>
                            </div>
                          </div>
                          <div className="flex-1 p-6">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center space-x-2">
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                                  issue.status === 'RESOLVED' ? 'bg-green-50 text-green-700 border-green-200' :
                                  issue.status === 'IN_PROGRESS' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                  'bg-slate-50 text-slate-700 border-slate-200'
                                }`}>
                                  {issue.status.replace('_', ' ')}
                                </span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{issue.category}</span>
                              </div>
                              <div className="flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                <Clock className="w-3 h-3 mr-1" />
                                {formatDistanceToNow(new Date(issue.createdAt))} ago
                              </div>
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">{issue.title}</h3>
                            <p className="text-slate-600 text-sm mb-4 line-clamp-2 leading-relaxed">{issue.description}</p>
                            
                            <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                              <div className="flex items-center space-x-4">
                                <button 
                                  onClick={() => handleVote(issue.id)}
                                  className="flex items-center space-x-1.5 text-slate-600 hover:text-indigo-600 transition-colors group/btn"
                                >
                                  <ThumbsUp className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                                  <span className="text-sm font-black">{issue.voteCount ?? issue._count?.votes ?? 0}</span>
                                </button>
                                <div className="flex items-center space-x-1.5 text-slate-600">
                                  <MessageSquare className="w-4 h-4" />
                                  <span className="text-sm font-black">{issue.commentCount ?? issue._count?.comments ?? 0}</span>
                                </div>
                              </div>
                              <Link to={`/issue/${issue.id}`} className="bg-slate-50 text-slate-900 px-4 py-2 rounded-xl text-xs font-bold hover:bg-indigo-600 hover:text-white transition-all flex items-center group/more">
                                View Details
                                <ChevronRight className="w-3 h-3 ml-1 group-hover/more:translate-x-0.5 transition-transform" />
                              </Link>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="h-150 bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-inner relative">
                <MapContainer center={[location.lat, location.lng]} zoom={13} style={{ height: '100%', width: '100%' }}>
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  {filteredIssues.map((issue) => (
                    <Marker key={issue.id} position={[issue.latitude, issue.longitude]}>
                      <Popup>
                        <div className="p-2">
                          <h4 className="font-bold text-slate-900">{issue.title}</h4>
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2">{issue.description}</p>
                          <Link to={`/issue/${issue.id}`} className="text-indigo-600 text-xs font-bold mt-2 block">View Details</Link>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Community Stats */}
            <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center space-x-2 mb-6">
                  <TrendingUp className="w-5 h-5 text-indigo-400" />
                  <span className="text-xs font-black uppercase tracking-widest text-indigo-400">Community Impact</span>
                </div>
                <div className="space-y-6">
                  <div>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Issues Resolved</p>
                    <h4 className="text-4xl font-black">{stats?.resolvedPercentage || 0}%</h4>
                    <div className="w-full h-2 bg-slate-800 rounded-full mt-2 overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${stats?.resolvedPercentage || 0}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className="h-full bg-linear-to-r from-indigo-500 to-violet-500" 
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Active Users</p>
                      <p className="text-xl font-black">{stats?.activeUsers || 0}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Reports Today</p>
                      <p className="text-xl font-black">{stats?.reportsToday || 0}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl" />
            </div>

            {/* Activity Feed */}
            <div className="bg-white rounded-3xl border border-slate-200 p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-black text-slate-900 uppercase tracking-widest text-sm">Recent Activity</h3>
                <Activity className="w-4 h-4 text-slate-400" />
              </div>
              <div className="space-y-6">
                {activities.map((act, i) => (
                  <div key={i} className="flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500">
                      {act.userName[0]}
                    </div>
                    <div>
                      <p className="text-xs text-slate-900 leading-tight">
                        <span className="font-black">{act.userName}</span> {
                          act.type === 'ISSUE' ? `reported: "${act.action}"` :
                          act.type === 'COMMENT' ? `commented: "${act.action}"` :
                          `voted on an issue`
                        }
                      </p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                        {formatDistanceToNow(new Date(act.createdAt))} ago
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <Link to="/activity" className="block w-full mt-8 py-3 rounded-xl border border-slate-100 text-xs font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-colors text-center">
                View All Activity
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
