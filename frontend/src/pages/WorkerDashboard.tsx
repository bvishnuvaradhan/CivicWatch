import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  CheckCircle2, 
  Clock, 
  MapPin, 
  AlertCircle, 
  ChevronRight,
  User,
  Phone,
  Briefcase,
  ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../context/AuthContext';

const WorkerDashboard = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [reviewModal, setReviewModal] = useState<{ open: boolean; taskId: string | null }>({ open: false, taskId: null });
  const [reviewPhoto, setReviewPhoto] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await api.get('/worker/tasks');
      setTasks(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    setUpdating(id);
    try {
      await api.put(`/worker/tasks/${id}/status`, { status });
      await fetchTasks();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(null);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReviewPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewPhoto || !reviewModal.taskId) {
      alert('Please upload a photo');
      return;
    }
    
    setSubmitting(true);
    try {
      await api.post(`/worker/tasks/${reviewModal.taskId}/submit-review`, {
        photoUrl: reviewPhoto
      });
      setReviewModal({ open: false, taskId: null });
      setReviewPhoto('');
      await fetchTasks();
    } catch (err) {
      console.error(err);
      alert('Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center py-40"><div className="animate-spin h-12 w-12 border-b-2 border-indigo-600 rounded-full" /></div>;

  const pendingTasks = tasks.filter(t => t.status !== 'RESOLVED');
  const completedTasks = tasks.filter(t => t.status === 'RESOLVED');
  const completionPercent = tasks.length ? Math.round((completedTasks.length / tasks.length) * 100) : 0;
  const progressWidthClass = completionPercent >= 100
    ? 'w-full'
    : completionPercent >= 90
      ? 'w-11/12'
      : completionPercent >= 80
        ? 'w-10/12'
        : completionPercent >= 70
          ? 'w-9/12'
          : completionPercent >= 60
            ? 'w-8/12'
            : completionPercent >= 50
              ? 'w-6/12'
              : completionPercent >= 40
                ? 'w-5/12'
                : completionPercent >= 30
                  ? 'w-4/12'
                  : completionPercent >= 20
                    ? 'w-3/12'
                    : completionPercent >= 10
                      ? 'w-2/12'
                      : completionPercent > 0
                        ? 'w-1/12'
                        : 'w-0';

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Worker Dashboard</h1>
            <p className="text-slate-500 mt-2 font-medium">Manage your assigned community tasks and updates.</p>
          </div>
          <div className="flex items-center space-x-4 bg-white p-4 rounded-3xl shadow-sm border border-slate-100">
            <div className="bg-green-100 text-green-600 p-3 rounded-2xl">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900 leading-none">{completedTasks.length}</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Tasks Completed</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Active Tasks */}
          <div className="lg:col-span-2 space-y-8">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center">
              <Clock className="w-5 h-5 mr-2 text-amber-500" />
              Active Assignments ({pendingTasks.length})
            </h2>

            {pendingTasks.length === 0 ? (
              <div className="bg-white rounded-[40px] p-20 text-center border border-slate-100 shadow-xl shadow-slate-100">
                <div className="bg-slate-50 w-20 h-20 rounded-4xl flex items-center justify-center text-slate-300 mx-auto mb-8">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tighter">No active tasks!</h3>
                <p className="text-slate-500 font-medium mt-2">You're all caught up. New assignments will appear here.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {pendingTasks.map((task) => (
                  <motion.div 
                    key={task.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-[40px] p-8 shadow-xl shadow-slate-100 border border-slate-50 group hover:border-indigo-100 transition-all"
                  >
                    <div className="flex flex-col md:flex-row gap-8">
                      <div className="w-full md:w-48 h-48 rounded-3xl bg-slate-100 overflow-hidden shrink-0">
                        {task.imageUrl ? (
                          <img src={task.imageUrl} alt={task.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <MapPin className="w-10 h-10" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-2">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                              task.severity === 'HIGH' ? 'bg-red-50 text-red-600' :
                              task.severity === 'MEDIUM' ? 'bg-amber-50 text-amber-600' :
                              'bg-blue-50 text-blue-600'
                            }`}>
                              {task.severity} Severity
                            </span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{task.category}</span>
                          </div>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            {formatDistanceToNow(new Date(task.createdAt))} ago
                          </span>
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 mb-2">{task.title}</h3>
                        <p className="text-slate-500 font-medium mb-6 line-clamp-2">{task.description}</p>

                        {task.reviewNotes && (
                          <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3">
                            <p className="text-[10px] font-black uppercase tracking-widest text-red-500">Rejected Reason</p>
                            <p className="mt-1 text-sm font-bold text-red-700">{task.reviewNotes}</p>
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-4 text-slate-400 mb-8">
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            <span className="text-xs font-bold">{task.address}</span>
                          </div>
                          <div className="flex items-center">
                            <User className="w-4 h-4 mr-1" />
                            <span className="text-xs font-bold">Reported by {task.createdBy.name}</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-4 pt-6 border-t border-slate-100">
                          <button 
                            onClick={() => handleUpdateStatus(task.id, 'IN_PROGRESS')}
                            disabled={updating === task.id || task.status === 'IN_PROGRESS'}
                            className="px-6 py-3 bg-amber-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-600 transition-all disabled:opacity-50"
                          >
                            Mark In Progress
                          </button>
                          <button 
                            onClick={() => {
                              setReviewModal({ open: true, taskId: task.id });
                              setReviewPhoto('');
                            }}
                            disabled={updating === task.id || task.status === 'REVIEW'}
                            className="px-6 py-3 bg-green-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-green-700 transition-all disabled:opacity-50"
                          >
                            Submit for Review
                          </button>
                          <Link 
                            to={`/issue/${task.id}`}
                            className="px-6 py-3 bg-slate-100 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center"
                          >
                            View Details
                            <ExternalLink className="w-3 h-3 ml-2" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-8">
            {/* Quick Stats */}
            <div className="bg-slate-900 rounded-[40px] p-10 text-white shadow-2xl shadow-indigo-200">
              <h3 className="text-sm font-black uppercase tracking-widest mb-8 flex items-center">
                <Briefcase className="w-5 h-5 mr-3 text-indigo-400" />
                Performance
              </h3>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                    <span className="text-slate-400">Completion Rate</span>
                    <span className="text-indigo-400">{completionPercent}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full bg-indigo-500 ${progressWidthClass}`} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="bg-slate-800 p-4 rounded-2xl">
                    <p className="text-2xl font-black text-white">{pendingTasks.length}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Pending</p>
                  </div>
                  <div className="bg-slate-800 p-4 rounded-2xl">
                    <p className="text-2xl font-black text-white">{completedTasks.length}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Resolved</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Support/Contact */}
            <div className="bg-white rounded-[40px] p-10 shadow-xl shadow-slate-100 border border-slate-50">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">Support</h3>
              <p className="text-slate-500 font-medium mb-8 text-sm">Need help with an assignment or have safety concerns?</p>
              <a
                href="mailto:admin@civicwatch.local?subject=Worker%20Support%20Request"
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center"
              >
                <Phone className="w-4 h-4 mr-2" />
                Contact Admin
              </a>
            </div>
          </div>

        </div>

        {/* Review Modal */}
        {reviewModal.open && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-[40px] p-10 max-w-md w-full shadow-2xl"
            >
              <h2 className="text-2xl font-black text-slate-900 mb-6">Submit Task for Review</h2>
              
              <div className="mb-6">
                <label className="block text-sm font-black text-slate-900 mb-3 uppercase tracking-widest">
                  Upload Evidence Photo *
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    id="photo-upload"
                  />
                  <label 
                    htmlFor="photo-upload"
                    className="block w-full border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center cursor-pointer hover:border-indigo-500 transition-all"
                  >
                    {reviewPhoto ? (
                      <div className="space-y-4">
                        <img src={reviewPhoto} alt="Preview" className="w-full h-40 object-cover rounded-lg" />
                        <p className="text-xs font-bold text-slate-500">Click to change</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="text-4xl">📷</div>
                        <p className="text-sm font-bold text-slate-700">Click to upload photo</p>
                        <p className="text-xs text-slate-500">PNG, JPG up to 10MB</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setReviewModal({ open: false, taskId: null })}
                  className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitReview}
                  disabled={!reviewPhoto || submitting}
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-green-700 transition-all disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkerDashboard;
