import { Diagnosis } from '../types';
import { X, AlertTriangle, CheckCircle2, Info, ArrowRight, Printer, Share2 } from 'lucide-react';
import { motion } from 'motion/react';

interface DiagnosisResultProps {
  diagnosis: Diagnosis;
  onClose: () => void;
}

export default function DiagnosisResult({ diagnosis, onClose }: DiagnosisResultProps) {
  const { diagnosis: ai } = diagnosis;

  const urgencyStyles = {
    critical: 'bg-red-600 text-white',
    high: 'bg-orange-500 text-white',
    medium: 'bg-yellow-500 text-white',
    low: 'bg-green-600 text-white'
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header Banner */}
      <div className={`${urgencyStyles[ai.urgency]} p-8 rounded-3xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6`}>
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
            <AlertTriangle size={32} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest opacity-80">Assessment Result</p>
            <h2 className="text-3xl font-bold tracking-tight">{ai.primaryDiagnosis}</h2>
            {ai.secondaryDiagnosis && <p className="text-lg opacity-90">Secondary: {ai.secondaryDiagnosis}</p>}
          </div>
        </div>
        <div className="text-center sm:text-right">
          <p className="text-xs font-bold uppercase tracking-widest opacity-80">Urgency Level</p>
          <p className="text-4xl font-black uppercase tracking-tighter">{ai.urgency}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Analysis */}
        <div className="lg:col-span-2 space-y-6">
          {/* Reasoning */}
          <section className="bg-white p-8 rounded-3xl border border-stone-100 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-stone-400">
              <Info size={18} />
              <h3 className="text-xs font-bold uppercase tracking-widest">Clinical Reasoning</h3>
            </div>
            <p className="text-stone-700 leading-relaxed italic">"{ai.reasoning}"</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              {ai.keyFindings.map((finding, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-stone-50 rounded-xl">
                  <CheckCircle2 className="text-green-500 shrink-0 mt-0.5" size={16} />
                  <span className="text-xs font-medium text-stone-600">{finding}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Treatment */}
          <section className="bg-white p-8 rounded-3xl border border-stone-100 shadow-sm space-y-6">
            <div className="flex items-center gap-2 text-stone-400">
              <Activity size={18} />
              <h3 className="text-xs font-bold uppercase tracking-widest">Treatment Plan</h3>
            </div>
            
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-green-100 text-green-600 rounded-xl flex items-center justify-center shrink-0">
                  <ArrowRight size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-stone-900">Immediate Actions</h4>
                  <p className="text-sm text-stone-600 mt-1">{ai.treatment.immediate}</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                  <ArrowRight size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-stone-900">Medication</h4>
                  <p className="text-sm text-stone-600 mt-1">{ai.treatment.medication}</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center shrink-0">
                  <ArrowRight size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-stone-900">Monitoring</h4>
                  <p className="text-sm text-stone-600 mt-1">{ai.treatment.monitoring}</p>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Red Flags */}
          {ai.redFlags.length > 0 && (
            <section className="bg-red-50 p-6 rounded-3xl border border-red-100 space-y-4">
              <h3 className="text-xs font-bold text-red-600 uppercase tracking-widest flex items-center gap-2">
                <AlertTriangle size={16} />
                Red Flags
              </h3>
              <ul className="space-y-3">
                {ai.redFlags.map((flag, i) => (
                  <li key={i} className="text-sm font-bold text-red-900 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-red-600 rounded-full mt-1.5 shrink-0" />
                    {flag}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Referral Status */}
          <section className={`p-6 rounded-3xl border space-y-2 ${ai.referralNeeded ? 'bg-orange-50 border-orange-100' : 'bg-green-50 border-green-100'}`}>
            <h3 className="text-xs font-bold uppercase tracking-widest text-stone-500">Referral Status</h3>
            <p className={`text-lg font-bold ${ai.referralNeeded ? 'text-orange-700' : 'text-green-700'}`}>
              {ai.referralNeeded ? 'Hospital Referral Required' : 'Manage at Health Post'}
            </p>
            <p className="text-xs text-stone-500 italic">{ai.followUp}</p>
          </section>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <button className="w-full py-4 bg-stone-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-black transition-all">
              <Printer size={18} />
              Print Assessment
            </button>
            <button className="w-full py-4 bg-white text-stone-900 border border-stone-200 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-stone-50 transition-all">
              <Share2 size={18} />
              Share with District
            </button>
            <button 
              onClick={onClose}
              className="w-full py-4 bg-stone-100 text-stone-500 rounded-2xl font-bold hover:bg-stone-200 transition-all"
            >
              Close Assessment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import { Activity } from 'lucide-react';
