import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { 
  ShieldAlert, 
  MapPin, 
  ShieldCheck, 
  Users, 
  ChevronRight, 
  TrendingUp, 
  CheckCircle2, 
  MessageSquare, 
  Award,
  ArrowRight
} from 'lucide-react';
import api from '../lib/api';

const LandingPage = () => {
  const [liveStats, setLiveStats] = useState({
    reports: 0,
    resolved: 0,
    activeUsers: 0,
  });

  useEffect(() => {
    const fetchLiveStats = async () => {
      try {
        const res = await api.get('/issues/stats');
        const data = res?.data ?? {};
        setLiveStats({
          reports: Number(data.total ?? 0),
          resolved: Number(data?.byStatus?.RESOLVED ?? 0),
          activeUsers: Number(data.activeUsers ?? 0),
        });
      } catch (error) {
        console.error('Failed to load landing page stats', error);
      }
    };

    void fetchLiveStats();
  }, []);

  return (
    <div className="min-h-screen bg-white selection:bg-indigo-100 selection:text-indigo-900">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-50 rounded-full blur-[120px] opacity-60" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-50 rounded-full blur-[120px] opacity-60" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-[0.03] [mask-image:radial-gradient(ellipse_at_center,black,transparent)]">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-repeat" />
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest bg-indigo-50 text-indigo-600 border border-indigo-100 mb-8">
                <TrendingUp className="w-3.5 h-3.5 mr-2" />
                Empowering 50+ Communities
              </span>
              <h1 className="text-6xl md:text-8xl font-black text-slate-900 tracking-tighter mb-8 leading-[0.9]">
                Fix your city,<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 bg-[length:200%_auto] animate-gradient">one report at a time.</span>
              </h1>
              <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-12 leading-relaxed font-medium">
                CivicWatch is the next-generation platform for citizens to report local issues, 
                track resolutions, and collaborate with authorities in real-time.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <Link to="/dashboard" className="w-full sm:w-auto bg-slate-900 text-white px-10 py-5 rounded-2xl text-lg font-black hover:bg-slate-800 transition-all shadow-2xl shadow-slate-200 flex items-center justify-center group">
                  Explore Map
                  <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link to="/auth" className="w-full sm:w-auto bg-white text-slate-900 border-2 border-slate-100 px-10 py-5 rounded-2xl text-lg font-black hover:border-indigo-600 hover:text-indigo-600 transition-all flex items-center justify-center group">
                  Join Community
                  <ArrowRight className="ml-2 w-5 h-5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </Link>
              </div>
            </motion.div>

            {/* Stats Bar */}
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="mt-24 grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto bg-white p-8 rounded-[40px] shadow-2xl shadow-slate-100 border border-slate-50"
            >
              {[
                { label: "Reports", value: liveStats.reports.toLocaleString() },
                { label: "Resolved", value: liveStats.resolved.toLocaleString() },
                { label: "Active Users", value: liveStats.activeUsers.toLocaleString() }
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <p className="text-3xl font-black text-slate-900">{stat.value}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter mb-6">Designed for impact.</h2>
            <p className="text-lg text-slate-500 max-w-xl mx-auto font-medium">We've built the most advanced tools for community engagement and issue resolution.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { 
                icon: <MapPin className="w-8 h-8" />, 
                title: "Precision GIS", 
                desc: "Every report is geolocated with sub-meter accuracy, ensuring authorities know exactly where to go.",
                color: "bg-indigo-600"
              },
              { 
                icon: <ShieldCheck className="w-8 h-8" />, 
                title: "Smart Verification", 
                desc: "Our AI-assisted community validation system filters out duplicates and ensures data integrity.",
                color: "bg-violet-600"
              },
              { 
                icon: <Award className="w-8 h-8" />, 
                title: "Reputation Engine", 
                desc: "Earn points and badges for your contributions. The more you help, the more impact you have.",
                color: "bg-indigo-900"
              }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -10 }}
                className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100 hover:shadow-2xl hover:shadow-indigo-100 transition-all group"
              >
                <div className={`${feature.color} w-16 h-16 rounded-3xl flex items-center justify-center text-white mb-8 shadow-lg group-hover:rotate-12 transition-transform`}>
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-4">{feature.title}</h3>
                <p className="text-slate-500 leading-relaxed font-medium">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-20">
            <div className="lg:w-1/2">
              <h2 className="text-5xl font-black text-slate-900 tracking-tighter mb-8 leading-none">Real people.<br />Real results.</h2>
              <div className="space-y-8">
                {[
                  { icon: <CheckCircle2 className="w-5 h-5 text-green-500" />, text: "92% faster response times from local authorities." },
                  { icon: <MessageSquare className="w-5 h-5 text-indigo-500" />, text: "Direct feedback loop between citizens and city hall." },
                  { icon: <Users className="w-5 h-5 text-violet-500" />, text: "Over 500,000 community actions logged this year." }
                ].map((item, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <div className="bg-slate-50 p-2 rounded-xl">{item.icon}</div>
                    <p className="text-lg font-bold text-slate-700">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="lg:w-1/2 relative">
              <div className="bg-indigo-600 rounded-[60px] p-12 text-white relative z-10 shadow-2xl shadow-indigo-200">
                <p className="text-2xl font-medium leading-relaxed mb-8 italic">
                  "CivicWatch has completely transformed how we interact with our city. I reported a broken streetlight and it was fixed within 48 hours. The transparency is incredible."
                </p>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center font-black">JD</div>
                  <div>
                    <p className="font-black">Jane Doe</p>
                    <p className="text-indigo-200 text-sm font-bold uppercase tracking-widest">Community Leader</p>
                  </div>
                </div>
              </div>
              <div className="absolute -top-10 -right-10 w-64 h-64 bg-violet-100 rounded-full -z-10" />
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-50 rounded-full -z-10" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-900 rounded-[60px] p-16 text-center relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-5xl md:text-6xl font-black text-white tracking-tighter mb-8">Ready to make a difference?</h2>
              <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-12 font-medium">Join thousands of citizens who are already helping to build better, safer, and cleaner communities.</p>
              <Link to="/auth" className="inline-flex bg-white text-slate-900 px-12 py-6 rounded-3xl text-xl font-black hover:bg-indigo-50 transition-all shadow-2xl shadow-indigo-500/20">
                Get Started Now
              </Link>
            </div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px]" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-violet-500/10 rounded-full blur-[100px]" />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center space-x-2">
              <div className="bg-indigo-600 p-1.5 rounded-lg">
                <ShieldAlert className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-black text-slate-900">CivicWatch</span>
            </div>
            <div className="flex space-x-8 text-sm font-bold text-slate-400 uppercase tracking-widest">
              <Link to="/dashboard" className="hover:text-indigo-600 transition-colors">Map</Link>
              <Link to="/stats" className="hover:text-indigo-600 transition-colors">Stats</Link>
              <Link to="/auth" className="hover:text-indigo-600 transition-colors">Join</Link>
            </div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">© 2026 CivicWatch. Built for impact.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
