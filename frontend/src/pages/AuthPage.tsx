import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  ShieldAlert, 
  Mail, 
  Lock, 
  User as UserIcon, 
  ArrowRight, 
  CheckCircle2, 
  Loader2,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters').optional()
});

type FormData = z.infer<typeof schema>;

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema)
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError('');
    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';

      const payload = isLogin
        ? {
            email: data.email.trim(),
            password: data.password
          }
        : {
            name: data.name?.trim(),
            email: data.email.trim(),
            password: data.password
          };

      if (!isLogin && !payload.name) {
        setError('Name is required to create an account');
        return;
      }

      const res = await api.post(endpoint, payload);
      login(res.data);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row overflow-hidden">
      
      {/* Left Column: Visuals */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 relative p-20 flex-col justify-between overflow-hidden">
        <div className="relative z-10">
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="bg-indigo-600 p-2 rounded-xl group-hover:rotate-12 transition-transform duration-300">
              <ShieldAlert className="w-8 h-8 text-white" />
            </div>
            <span className="text-2xl font-black text-white tracking-tighter">CivicWatch</span>
          </Link>
          <div className="mt-32">
            <h2 className="text-6xl font-black text-white tracking-tighter leading-none mb-8">Join the movement for a better city.</h2>
            <p className="text-xl text-slate-400 font-medium max-w-md leading-relaxed">
              Empowering citizens with the tools they need to make real change in their communities.
            </p>
          </div>
        </div>

        <div className="relative z-10 grid grid-cols-2 gap-8">
          {[
            { icon: <ShieldCheck className="w-6 h-6" />, title: "Verified Reports", desc: "Community-driven validation system." },
            { icon: <CheckCircle2 className="w-6 h-6" />, title: "Direct Impact", desc: "Real-time feedback from authorities." }
          ].map((item, i) => (
            <div key={i} className="bg-white/5 backdrop-blur-xl p-8 rounded-[40px] border border-white/10">
              <div className="bg-indigo-600 w-12 h-12 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-indigo-500/20">
                {item.icon}
              </div>
              <h4 className="text-lg font-black text-white mb-2">{item.title}</h4>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Background Decorative Elements */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-600/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-violet-600/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />
      </div>

      {/* Right Column: Form */}
      <div className="flex-1 flex items-center justify-center p-8 sm:p-20 relative">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-12">
            <h3 className="text-4xl font-black text-slate-900 tracking-tighter mb-4">
              {isLogin ? 'Welcome back.' : 'Create account.'}
            </h3>
            <p className="text-slate-500 font-medium">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <button 
                onClick={() => setIsLogin(!isLogin)}
                className="ml-2 text-indigo-600 font-black hover:underline"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Full Name</label>
                  <div className="relative group">
                    <UserIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                    <input 
                      {...register('name')}
                      className="w-full pl-16 pr-8 py-5 rounded-3xl border-2 border-slate-100 focus:border-indigo-600 outline-none transition-all font-medium bg-white"
                      placeholder="John Doe"
                    />
                  </div>
                  {errors.name && <p className="text-red-500 text-xs font-bold mt-2 ml-4">{errors.name.message}</p>}
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                <input 
                  {...register('email')}
                  className="w-full pl-16 pr-8 py-5 rounded-3xl border-2 border-slate-100 focus:border-indigo-600 outline-none transition-all font-medium bg-white"
                  placeholder="john@example.com"
                />
              </div>
              {errors.email && <p className="text-red-500 text-xs font-bold mt-2 ml-4">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Password</label>
              <div className="relative group">
                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                <input 
                  {...register('password')}
                  type="password"
                  className="w-full pl-16 pr-8 py-5 rounded-3xl border-2 border-slate-100 focus:border-indigo-600 outline-none transition-all font-medium bg-white"
                  placeholder="••••••••"
                />
              </div>
              {errors.password && <p className="text-red-500 text-xs font-bold mt-2 ml-4">{errors.password.message}</p>}
            </div>

            {error && (
              <div className="bg-red-50 p-4 rounded-2xl border border-red-100 flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <p className="text-xs font-bold text-red-600">{error}</p>
              </div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 text-white py-6 rounded-3xl font-black text-lg hover:bg-slate-800 transition-all shadow-2xl shadow-slate-200 flex items-center justify-center group disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                <>
                  {isLogin ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-12 text-center">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
              By continuing, you agree to our <span className="text-slate-900 hover:underline cursor-pointer">Terms</span> and <span className="text-slate-900 hover:underline cursor-pointer">Privacy Policy</span>.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AuthPage;
