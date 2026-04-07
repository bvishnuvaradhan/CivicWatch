import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  MapPin, 
  Camera, 
  AlertCircle, 
  CheckCircle2, 
  ChevronRight, 
  ArrowLeft,
  Info,
  Loader2,
  ShieldAlert,
  Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

const schema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  category: z.enum(['INFRASTRUCTURE', 'UTILITIES', 'SANITATION', 'SAFETY', 'ENVIRONMENT']),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  address: z.string().min(5, 'Address is required'),
  latitude: z.number(),
  longitude: z.number(),
  imageUrl: z.string().optional()
});

type FormData = z.infer<typeof schema>;

const ReportIssue = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number }>({ lat: 17.3850, lng: 78.4867 });
  const [popup, setPopup] = useState<{ message: string; type: 'error' | 'success' } | null>(null);
  const navigate = useNavigate();

  const showPopup = (message: string, type: 'error' | 'success' = 'error') => {
    setPopup({ message, type });
    window.setTimeout(() => setPopup(null), 2500);
  };

  const { register, handleSubmit, setValue, watch, trigger, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      category: 'INFRASTRUCTURE',
      severity: 'MEDIUM',
      latitude: 17.3850,
      longitude: 78.4867
    }
  });

  useEffect(() => {
    navigator.geolocation.getCurrentPosition((pos) => {
      const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setLocation(loc);
      setValue('latitude', loc.lat);
      setValue('longitude', loc.lng);
    });
  }, [setValue]);

  const LocationPicker = () => {
    useMapEvents({
      click(e) {
        setLocation(e.latlng);
        setValue('latitude', e.latlng.lat);
        setValue('longitude', e.latlng.lng);
      },
    });
    return <Marker position={[location.lat, location.lng]} />;
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await api.post('/issues', data);
      showPopup('Issue submitted successfully!', 'success');
      setStep(4);
      setTimeout(() => navigate('/dashboard'), 3000);
    } catch (err: any) {
      const message = err?.response?.data?.error || 'Failed to report issue';
      showPopup(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const onInvalid = () => {
    if (errors.title || errors.description || errors.category || errors.severity) {
      setStep(1);
      showPopup('Please complete all required fields in Step 1.', 'error');
      return;
    }
    if (errors.address || errors.latitude || errors.longitude) {
      setStep(2);
      showPopup('Please complete all required fields in Step 2.', 'error');
      return;
    }
    setStep(3);
    showPopup('Please review the report details before submitting.', 'error');
  };

  const nextStep = async () => {
    if (step === 1) {
      const isStepOneValid = await trigger(['title', 'description', 'category', 'severity']);
      if (!isStepOneValid) {
        showPopup('Please complete all required fields in Step 1.', 'error');
        return;
      }
    }
    if (step === 2) {
      const isStepTwoValid = await trigger(['address', 'latitude', 'longitude']);
      if (!isStepTwoValid) {
        showPopup('Please complete all required fields in Step 2.', 'error');
        return;
      }
    }
    setStep((s) => s + 1);
  };
  const prevStep = () => setStep(s => s - 1);

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {popup && (
          <div className="fixed top-6 right-6 z-50 max-w-sm">
            <div className={`px-5 py-4 rounded-2xl shadow-2xl border font-bold text-sm ${
              popup.type === 'success'
                ? 'bg-green-50 text-green-800 border-green-200'
                : 'bg-red-50 text-red-800 border-red-200'
            }`}>
              {popup.message}
            </div>
          </div>
        )}
        
        {/* Progress Header */}
        <div className="mb-12">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 text-slate-400 hover:text-indigo-600 font-black uppercase tracking-widest text-xs mb-8 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Cancel Report</span>
          </button>
          
          <div className="flex items-center justify-between">
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Report an Issue</h1>
            <div className="flex items-center space-x-2">
              {[1, 2, 3].map((s) => (
                <div 
                  key={s} 
                  className={`h-2 w-8 rounded-full transition-all duration-500 ${
                    step >= s ? 'bg-indigo-600' : 'bg-slate-200'
                  }`} 
                />
              ))}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit, onInvalid)}>
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white rounded-[40px] p-10 shadow-xl shadow-slate-100 border border-slate-50"
              >
                <div className="flex items-center space-x-4 mb-10">
                  <div className="bg-indigo-50 w-12 h-12 rounded-2xl flex items-center justify-center text-indigo-600">
                    <Info className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tighter">Basic Information</h2>
                    <p className="text-slate-500 font-medium text-sm">Tell us what's happening in your community.</p>
                  </div>
                </div>

                <div className="space-y-8">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Issue Title</label>
                    <input 
                      {...register('title')}
                      className="w-full px-8 py-5 rounded-3xl border-2 border-slate-100 focus:border-indigo-600 outline-none transition-all font-medium"
                      placeholder="e.g., Broken streetlight on 5th Ave"
                    />
                    {errors.title && <p className="text-red-500 text-xs font-bold mt-2 ml-4">{errors.title.message}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Category</label>
                      <select 
                        {...register('category')}
                        className="w-full px-8 py-5 rounded-3xl border-2 border-slate-100 focus:border-indigo-600 outline-none transition-all font-bold text-slate-700 bg-white"
                      >
                        <option value="INFRASTRUCTURE">Infrastructure</option>
                        <option value="UTILITIES">Utilities</option>
                        <option value="SANITATION">Sanitation</option>
                        <option value="SAFETY">Public Safety</option>
                        <option value="ENVIRONMENT">Environment</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Severity</label>
                      <select 
                        {...register('severity')}
                        className="w-full px-8 py-5 rounded-3xl border-2 border-slate-100 focus:border-indigo-600 outline-none transition-all font-bold text-slate-700 bg-white"
                      >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="CRITICAL">Critical</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Description</label>
                    <textarea 
                      {...register('description')}
                      rows={4}
                      className="w-full px-8 py-5 rounded-3xl border-2 border-slate-100 focus:border-indigo-600 outline-none transition-all font-medium resize-none"
                      placeholder="Provide as much detail as possible to help authorities resolve the issue faster."
                    />
                    {errors.description && <p className="text-red-500 text-xs font-bold mt-2 ml-4">{errors.description.message}</p>}
                  </div>
                </div>

                <div className="mt-12 flex justify-end">
                  <button 
                    type="button" 
                    onClick={nextStep}
                    className="bg-slate-900 text-white px-12 py-5 rounded-3xl font-black hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 flex items-center group"
                  >
                    Next Step
                    <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div 
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white rounded-[40px] p-10 shadow-xl shadow-slate-100 border border-slate-50"
              >
                <div className="flex items-center space-x-4 mb-10">
                  <div className="bg-indigo-50 w-12 h-12 rounded-2xl flex items-center justify-center text-indigo-600">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tighter">Location Details</h2>
                    <p className="text-slate-500 font-medium text-sm">Pin the exact location on the map.</p>
                  </div>
                </div>

                <div className="space-y-8">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Street Address</label>
                    <input 
                      {...register('address')}
                      className="w-full px-8 py-5 rounded-3xl border-2 border-slate-100 focus:border-indigo-600 outline-none transition-all font-medium"
                      placeholder="e.g., 123 Main St, New York, NY"
                    />
                    {errors.address && <p className="text-red-500 text-xs font-bold mt-2 ml-4">{errors.address.message}</p>}
                  </div>

                  <div className="h-80 rounded-3xl overflow-hidden border-2 border-slate-100 relative">
                    <MapContainer center={[location.lat, location.lng]} zoom={15} style={{ height: '100%', width: '100%' }}>
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <LocationPicker />
                    </MapContainer>
                    <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur p-4 rounded-2xl border border-slate-100 z-1000 flex items-center space-x-3">
                      <div className="bg-indigo-600 p-2 rounded-xl text-white">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <p className="text-xs font-black text-slate-900 uppercase tracking-widest">Click on map to adjust pin</p>
                    </div>
                  </div>
                </div>

                <div className="mt-12 flex justify-between">
                  <button 
                    type="button" 
                    onClick={prevStep}
                    className="text-slate-400 font-black uppercase tracking-widest text-sm hover:text-slate-600 transition-colors"
                  >
                    Go Back
                  </button>
                  <button 
                    type="button" 
                    onClick={nextStep}
                    className="bg-slate-900 text-white px-12 py-5 rounded-3xl font-black hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 flex items-center group"
                  >
                    Next Step
                    <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div 
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white rounded-[40px] p-10 shadow-xl shadow-slate-100 border border-slate-50"
              >
                <div className="flex items-center space-x-4 mb-10">
                  <div className="bg-indigo-50 w-12 h-12 rounded-2xl flex items-center justify-center text-indigo-600">
                    <Camera className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tighter">Visual Proof</h2>
                    <p className="text-slate-500 font-medium text-sm">Add a photo to help us verify the report.</p>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="h-64 rounded-[40px] border-4 border-dashed border-slate-100 flex flex-col items-center justify-center text-center p-10 group hover:border-indigo-100 hover:bg-indigo-50/30 transition-all cursor-pointer relative overflow-hidden">
                    <div className="bg-slate-50 w-20 h-20 rounded-3xl flex items-center justify-center text-slate-300 mb-6 group-hover:scale-110 group-hover:text-indigo-600 transition-all">
                      <Camera className="w-10 h-10" />
                    </div>
                    <p className="text-lg font-black text-slate-900 tracking-tighter">Upload Photo</p>
                    <p className="text-slate-400 font-bold text-sm mt-1">Drag and drop or click to browse</p>
                    <input 
                      type="file" 
                      accept="image/*"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      title="Upload issue photo"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) {
                          return;
                        }

                        if (!file.type.startsWith('image/')) {
                          showPopup('Please choose an image file.', 'error');
                          return;
                        }

                        const reader = new FileReader();
                        reader.onload = () => {
                          const result = reader.result;
                          if (typeof result === 'string') {
                            // Store real selected image as data URL for preview + submit payload.
                            setValue('imageUrl', result);
                          }
                        };
                        reader.onerror = () => {
                          showPopup('Failed to read image file.', 'error');
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                    {watch('imageUrl') && (
                      <div className="absolute inset-0 bg-white">
                        <img src={watch('imageUrl')} alt="Preview" className="w-full h-full object-cover" />
                        <button 
                          type="button"
                          onClick={() => setValue('imageUrl', '')}
                          className="absolute top-4 right-4 bg-red-600 text-white p-2 rounded-xl shadow-xl"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 flex items-start space-x-4">
                    <AlertCircle className="w-6 h-6 text-amber-600 shrink-0" />
                    <p className="text-sm text-amber-900 font-medium leading-relaxed">
                      Make sure the photo is clear and shows the issue in its surrounding context. 
                      Verified reports with photos earn <span className="font-black text-amber-600">+20 extra reputation points</span>.
                    </p>
                  </div>
                </div>

                <div className="mt-12 flex justify-between items-center">
                  <button 
                    type="button" 
                    onClick={prevStep}
                    className="text-slate-400 font-black uppercase tracking-widest text-sm hover:text-slate-600 transition-colors"
                  >
                    Go Back
                  </button>
                  <button 
                    type="submit"
                    disabled={loading}
                    className="bg-indigo-600 text-white px-12 py-5 rounded-3xl font-black hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 flex items-center disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <ShieldAlert className="w-5 h-5 mr-2" />}
                    Submit Report
                  </button>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div 
                key="step4"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-[40px] p-20 shadow-2xl shadow-indigo-100 border border-indigo-50 text-center"
              >
                <div className="bg-green-50 w-24 h-24 rounded-4xl flex items-center justify-center text-green-600 mx-auto mb-10 shadow-lg">
                  <CheckCircle2 className="w-12 h-12" />
                </div>
                <h2 className="text-4xl font-black text-slate-900 tracking-tighter mb-4">Report Submitted!</h2>
                <p className="text-xl text-slate-500 font-medium mb-10">Thank you for helping to improve your community. Your report is being processed.</p>
                <div className="bg-indigo-50 px-8 py-4 rounded-2xl inline-flex items-center text-indigo-600 font-black uppercase tracking-widest text-xs">
                  <Award className="w-4 h-4 mr-2" />
                  +50 Reputation Points Earned
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </div>
    </div>
  );
};

export default ReportIssue;
