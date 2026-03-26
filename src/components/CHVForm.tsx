import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { db, auth } from '../firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { getDiagnosis } from '../lib/gemini';
import { Diagnosis, Patient } from '../types';
import { X, Camera, MapPin, Loader2, Thermometer, Wind, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

interface CHVFormProps {
  onCancel: () => void;
  onComplete: (diagnosis: Diagnosis) => void;
}

interface FormData {
  age: number;
  gender: 'male' | 'female';
  locationName: string;
  symptoms: string[];
}

const SYMPTOMS = [
  { id: 'fever', label: 'Fever', icon: <Thermometer size={18} /> },
  { id: 'cough', label: 'Cough', icon: <Wind size={18} /> },
  { id: 'rapidBreathing', label: 'Rapid Breathing', icon: <Wind size={18} /> },
  { id: 'vomiting', label: 'Vomiting', icon: <AlertCircle size={18} /> },
  { id: 'diarrhea', label: 'Diarrhea', icon: <AlertCircle size={18} /> },
  { id: 'chills', label: 'Chills', icon: <Thermometer size={18} /> },
  { id: 'sweating', label: 'Sweating', icon: <Thermometer size={18} /> },
  { id: 'fatigue', label: 'Fatigue', icon: <AlertCircle size={18} /> },
  { id: 'appetiteLoss', label: 'Loss of Appetite', icon: <AlertCircle size={18} /> },
];

export default function CHVForm({ onCancel, onComplete }: CHVFormProps) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      age: 12,
      gender: 'male',
      symptoms: [],
    }
  });

  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [images, setImages] = useState<{ face?: string; body?: string }>({});
  const [symptomSeverity, setSymptomSeverity] = useState<Record<string, number>>({});

  const selectedSymptoms = watch('symptoms');

  const handleGetLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setValue('locationName', `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
      });
    }
  };

  const handleCaptureImage = (type: 'face' | 'body') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          setImages(prev => ({ ...prev, [type]: ev.target?.result as string }));
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const onSubmit = async (data: FormData) => {
    if (!auth.currentUser) return;
    setLoading(true);

    try {
      // 1. Get AI Diagnosis
      const aiDiagnosis = await getDiagnosis(
        data.age,
        data.gender,
        data.symptoms,
        symptomSeverity,
        data.locationName,
        images
      );

      // 2. Save Patient
      const patientData: Patient = {
        age: data.age,
        gender: data.gender,
        location: {
          lat: location?.lat || 0,
          lng: location?.lng || 0,
          name: data.locationName,
        },
        chvId: auth.currentUser.uid,
        createdAt: Timestamp.now(),
      };
      const patientRef = await addDoc(collection(db, 'patients'), patientData);

      // 3. Save Diagnosis
      const diagnosisData: Diagnosis = {
        patientId: patientRef.id,
        symptoms: data.symptoms,
        symptomSeverity,
        diagnosis: aiDiagnosis,
        malnutritionStatus: 'not_assessed', // Simplified for now
        malnutritionConfidence: 0,
        location: {
          lat: location?.lat || 0,
          lng: location?.lng || 0,
        },
        timestamp: Timestamp.now(),
        chvId: auth.currentUser.uid,
      };
      const diagnosisRef = await addDoc(collection(db, 'diagnoses'), diagnosisData);
      
      onComplete({ id: diagnosisRef.id, ...diagnosisData });
    } catch (error) {
      console.error("Diagnosis failed", error);
      alert("Failed to generate diagnosis. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-3xl border border-stone-100 shadow-xl overflow-hidden">
        <div className="bg-stone-900 p-6 flex items-center justify-between text-white">
          <div>
            <h2 className="text-xl font-bold">New Patient Assessment</h2>
            <p className="text-stone-400 text-xs">Complete all fields for accurate AI analysis</p>
          </div>
          <button onClick={onCancel} className="p-2 hover:bg-stone-800 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-8">
          {/* Demographics */}
          <section className="space-y-4">
            <h3 className="text-sm font-bold text-stone-400 uppercase tracking-widest">1. Patient Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-stone-700">Age (Months)</label>
                <input 
                  type="number" 
                  {...register('age', { required: true, min: 0, max: 60, valueAsNumber: true })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-stone-700">Gender</label>
                <div className="flex gap-2">
                  {['male', 'female'].map(g => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setValue('gender', g as any)}
                      className={`flex-1 py-3 rounded-2xl font-semibold capitalize border transition-all ${
                        watch('gender') === g 
                          ? 'bg-green-600 text-white border-green-600 shadow-lg shadow-green-100' 
                          : 'bg-white text-stone-500 border-stone-200 hover:bg-stone-50'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-stone-700">Location</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                  <input 
                    {...register('locationName', { required: true })}
                    placeholder="Village or Coordinates"
                    className="w-full bg-stone-50 border border-stone-200 rounded-2xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                  />
                </div>
                <button 
                  type="button"
                  onClick={handleGetLocation}
                  className="p-3 bg-stone-100 text-stone-600 rounded-2xl hover:bg-stone-200 transition-colors"
                >
                  <MapPin size={20} />
                </button>
              </div>
            </div>
          </section>

          {/* Symptoms */}
          <section className="space-y-4">
            <h3 className="text-sm font-bold text-stone-400 uppercase tracking-widest">2. Symptoms</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {SYMPTOMS.map(symptom => (
                <label 
                  key={symptom.id}
                  className={`flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${
                    selectedSymptoms.includes(symptom.id)
                      ? 'bg-green-50 border-green-200 text-green-700 shadow-sm'
                      : 'bg-white border-stone-100 text-stone-500 hover:bg-stone-50'
                  }`}
                >
                  <input 
                    type="checkbox" 
                    value={symptom.id}
                    {...register('symptoms')}
                    className="hidden"
                  />
                  <div className={selectedSymptoms.includes(symptom.id) ? 'text-green-600' : 'text-stone-300'}>
                    {symptom.icon}
                  </div>
                  <span className="text-xs font-bold">{symptom.label}</span>
                </label>
              ))}
            </div>

            {/* Severity Sliders */}
            <div className="space-y-4 mt-6">
              {selectedSymptoms.map(sid => {
                const symptom = SYMPTOMS.find(s => s.id === sid);
                return (
                  <div key={sid} className="space-y-2 bg-stone-50 p-4 rounded-2xl border border-stone-100">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-stone-700">{symptom?.label} Severity</span>
                      <span className="text-xs font-bold text-green-600">{symptomSeverity[sid] || 5}/10</span>
                    </div>
                    <input 
                      type="range" 
                      min="1" 
                      max="10" 
                      value={symptomSeverity[sid] || 5}
                      onChange={(e) => setSymptomSeverity(prev => ({ ...prev, [sid]: parseInt(e.target.value) }))}
                      className="w-full accent-green-600"
                    />
                  </div>
                );
              })}
            </div>
          </section>

          {/* Photos */}
          <section className="space-y-4">
            <h3 className="text-sm font-bold text-stone-400 uppercase tracking-widest">3. Nutritional Photos (Optional)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => handleCaptureImage('face')}
                className={`flex flex-col items-center justify-center gap-3 p-8 rounded-3xl border-2 border-dashed transition-all ${
                  images.face ? 'border-green-500 bg-green-50' : 'border-stone-200 hover:border-stone-300'
                }`}
              >
                {images.face ? (
                  <div className="relative w-full aspect-video rounded-xl overflow-hidden">
                    <img src={images.face} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                      <CheckCircle2 className="text-white" size={32} />
                    </div>
                  </div>
                ) : (
                  <>
                    <Camera className="text-stone-300" size={32} />
                    <span className="text-xs font-bold text-stone-500">Capture Face</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleCaptureImage('body')}
                className={`flex flex-col items-center justify-center gap-3 p-8 rounded-3xl border-2 border-dashed transition-all ${
                  images.body ? 'border-green-500 bg-green-50' : 'border-stone-200 hover:border-stone-300'
                }`}
              >
                {images.body ? (
                  <div className="relative w-full aspect-video rounded-xl overflow-hidden">
                    <img src={images.body} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                      <CheckCircle2 className="text-white" size={32} />
                    </div>
                  </div>
                ) : (
                  <>
                    <Camera className="text-stone-300" size={32} />
                    <span className="text-xs font-bold text-stone-500">Capture Full Body</span>
                  </>
                )}
              </button>
            </div>
          </section>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading || selectedSymptoms.length === 0}
              className="w-full py-4 bg-green-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-green-700 transition-all shadow-xl shadow-green-100 disabled:bg-stone-200 disabled:text-stone-400 disabled:shadow-none"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Analyzing with Gemini AI...
                </>
              ) : (
                'Generate AI Diagnosis'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
