import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  MapPin, 
  User as UserIcon, 
  MessageSquare, 
  ThumbsUp, 
  ChevronRight, 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  Activity,
  Share2,
  Flag,
  ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import api from '../lib/api';
import { Issue, Comment } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../context/AuthContext';

const IssueDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [issue, setIssue] = useState<Issue | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [similarIssues, setSimilarIssues] = useState<Issue[]>([]);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [issueRes, commentsRes, similarRes] = await Promise.allSettled([
          api.get(`/issues/${id}`),
          api.get(`/issues/${id}/comments`),
          api.get(`/issues/nearby?lat=0&lng=0&radius=10000000`) // Mock similar
        ]);

        if (issueRes.status === 'fulfilled') {
          setIssue(issueRes.value.data);
        }

        if (commentsRes.status === 'fulfilled') {
          setComments(Array.isArray(commentsRes.value.data) ? commentsRes.value.data : []);
        }

        if (similarRes.status === 'fulfilled') {
          setSimilarIssues(Array.isArray(similarRes.value.data) ? similarRes.value.data.slice(0, 3) : []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      await api.post(`/issues/${id}/comment`, { text: newComment });
      const commentsRes = await api.get(`/issues/${id}/comments`);
      setComments(Array.isArray(commentsRes.data) ? commentsRes.data : []);
      setNewComment('');
    } catch (err) {
      alert('Failed to add comment');
    }
  };

  const handleVote = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    try {
      await api.post(`/issues/${id}/vote`, {});
      const res = await api.get(`/issues/${id}`);
      setIssue(res.data);
    } catch (err) {
      alert('You have already voted on this issue');
    }
  };

  if (loading) return <div className="flex justify-center py-40"><div className="animate-spin h-12 w-12 border-b-2 border-indigo-600 rounded-full" /></div>;
  if (!issue) return <div className="p-20 text-center text-slate-500 font-black uppercase tracking-widest">Issue not found</div>;

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Back Button */}
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-slate-400 hover:text-indigo-600 font-black uppercase tracking-widest text-xs mb-8 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Dashboard</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Left Column: Issue Info */}
          <div className="lg:col-span-2 space-y-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-[40px] shadow-2xl shadow-slate-100 border border-slate-50 overflow-hidden"
            >
              {/* Image Header */}
              <div className="h-96 bg-slate-100 relative">
                {issue.imageUrl ? (
                  <img src={issue.imageUrl} alt={issue.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-200">
                    <MapPin className="w-32 h-32" />
                  </div>
                )}
                <div className="absolute top-8 left-8 flex gap-3">
                  <span className="bg-white/90 backdrop-blur px-6 py-2 rounded-2xl text-xs font-black text-indigo-600 shadow-xl uppercase tracking-widest">
                    {issue.category}
                  </span>
                  <span className={`px-6 py-2 rounded-2xl text-xs font-black text-white shadow-xl uppercase tracking-widest ${
                    issue.severity === 'CRITICAL' ? 'bg-red-600' : 'bg-indigo-600'
                  }`}>
                    {issue.severity}
                  </span>
                </div>
              </div>

              <div className="p-10">
                <div className="flex flex-col md:flex-row justify-between items-start mb-10 gap-6">
                  <div>
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter mb-4 leading-none">{issue.title}</h1>
                    <div className="flex flex-wrap items-center gap-6 text-slate-400">
                      <div className="flex items-center font-bold text-sm">
                        <MapPin className="w-4 h-4 mr-2 text-indigo-600" />
                        {issue.address}
                      </div>
                      <div className="flex items-center font-bold text-sm">
                        <UserIcon className="w-4 h-4 mr-2 text-indigo-600" />
                        Reported by {issue.createdBy?.name}
                      </div>
                      <div className="flex items-center font-bold text-sm">
                        <Clock className="w-4 h-4 mr-2 text-indigo-600" />
                        {formatDistanceToNow(new Date(issue.createdAt))} ago
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      aria-label="Share issue"
                      title="Share issue"
                      className="p-3 bg-slate-50 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 rounded-2xl transition-all"
                    >
                      <span className="sr-only">Share issue</span>
                      <Share2 className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      aria-label="Report issue"
                      title="Report issue"
                      className="p-3 bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-2xl transition-all"
                    >
                      <span className="sr-only">Report issue</span>
                      <Flag className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="prose prose-slate max-w-none mb-12">
                  <p className="text-xl text-slate-600 leading-relaxed font-medium">{issue.description}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-6 py-8 border-t border-slate-50">
                  <button 
                    onClick={handleVote}
                    className="flex items-center space-x-3 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 group"
                  >
                    <ThumbsUp className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span>{issue.voteCount ?? issue._count?.votes ?? 0} Upvotes</span>
                  </button>
                  <div className="flex items-center space-x-3 px-8 py-4 bg-slate-50 text-slate-600 rounded-2xl font-black">
                    <MessageSquare className="w-5 h-5" />
                    <span>{comments.length} Comments</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Discussion Section */}
            <div className="bg-white rounded-[40px] p-10 shadow-xl shadow-slate-100 border border-slate-50">
              <h3 className="text-2xl font-black text-slate-900 tracking-tighter mb-10 flex items-center">
                <MessageSquare className="w-8 h-8 mr-3 text-indigo-600" />
                Community Discussion
              </h3>

              <div className="space-y-8 mb-12">
                {comments.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No comments yet. Be the first to join the conversation.</p>
                  </div>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="flex space-x-6">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black shrink-0 shadow-lg">
                        {comment.user?.name?.[0]}
                      </div>
                      <div className="flex-1">
                        <div className="bg-slate-50 p-6 rounded-3xl relative">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-black text-slate-900 text-sm">{comment.user?.name}</span>
                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{formatDistanceToNow(new Date(comment.createdAt))} ago</span>
                          </div>
                          <p className="text-slate-600 font-medium leading-relaxed">{comment.text}</p>
                          <div className="absolute top-4 -left-2 w-4 h-4 bg-slate-50 rotate-45 -z-10" />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {user ? (
                <form onSubmit={handleComment} className="flex flex-col sm:flex-row gap-4">
                  <input 
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="flex-1 px-8 py-5 rounded-3xl border-2 border-slate-100 focus:border-indigo-600 outline-none transition-all font-medium"
                    placeholder="Add your thoughts..."
                  />
                  <button className="bg-slate-900 text-white px-10 py-5 rounded-3xl font-black hover:bg-slate-800 transition-all shadow-xl shadow-slate-200">
                    Post Comment
                  </button>
                </form>
              ) : (
                <div className="bg-indigo-50 p-8 rounded-[40px] text-center border border-indigo-100">
                  <p className="text-indigo-900 font-bold">Please <Link to="/auth" className="text-indigo-600 font-black hover:underline">login</Link> to join the discussion.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Timeline & Similar */}
          <div className="space-y-12">
            {/* Status Timeline */}
            <div className="bg-white rounded-[40px] p-10 shadow-xl shadow-slate-100 border border-slate-50">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest mb-10 flex items-center">
                <Activity className="w-5 h-5 mr-2 text-indigo-600" />
                Resolution Timeline
              </h3>
              <div className="space-y-10 relative before:absolute before:left-4.75 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                {[
                  { status: 'REPORTED', desc: 'Issue reported by citizen', time: issue.createdAt, active: true },
                  { status: 'IN_PROGRESS', desc: 'Assigned to local authority', time: null, active: issue.status !== 'REPORTED' },
                  { status: 'RESOLVED', desc: 'Issue marked as fixed', time: null, active: issue.status === 'RESOLVED' }
                ].map((step, i) => (
                  <div key={i} className="flex items-start space-x-6 relative">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 z-10 shadow-lg ${
                      step.active ? 'bg-indigo-600 text-white' : 'bg-white text-slate-300 border-2 border-slate-100'
                    }`}>
                      {step.status === 'RESOLVED' ? <CheckCircle2 className="w-5 h-5" /> : 
                       step.status === 'REPORTED' ? <AlertCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className={`text-sm font-black uppercase tracking-widest ${step.active ? 'text-slate-900' : 'text-slate-300'}`}>{step.status.replace('_', ' ')}</p>
                      <p className="text-xs text-slate-400 font-medium mt-1">{step.desc}</p>
                      {step.time && <p className="text-[10px] text-indigo-400 font-black uppercase mt-2">{formatDistanceToNow(new Date(step.time))} ago</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Similar Issues */}
            <div className="bg-slate-900 rounded-[40px] p-10 text-white shadow-2xl shadow-slate-200">
              <h3 className="text-xl font-black uppercase tracking-widest mb-8 text-indigo-400">Nearby Reports</h3>
              <div className="space-y-6">
                {similarIssues.map((sim) => (
                  <Link key={sim.id} to={`/issue/${sim.id}`} className="block group">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-2xl bg-slate-800 shrink-0 overflow-hidden">
                        {sim.imageUrl ? (
                          <img src={sim.imageUrl} alt={sim.title} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-600">
                            <MapPin className="w-5 h-5" />
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-black group-hover:text-indigo-400 transition-colors line-clamp-1">{sim.title}</h4>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">{sim.status.replace('_', ' ')}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              <Link to="/dashboard" className="w-full mt-10 py-4 rounded-2xl bg-slate-800 text-xs font-black uppercase tracking-widest text-center block hover:bg-slate-700 transition-colors">
                View All on Map
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IssueDetail;
