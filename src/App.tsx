import { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User } from 'firebase/auth';
import { collection, query, orderBy, onSnapshot, where, limit } from 'firebase/firestore';
import { Patient, Diagnosis, Alert } from './types';
import CHVForm from './components/CHVForm';
import DiagnosisResult from './components/DiagnosisResult';
import Dashboard from './components/Dashboard';
import { Activity, LayoutDashboard, UserPlus, LogOut, LogIn, Plus, ChevronRight, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type View = 'chv-home' | 'intake-form' | 'diagnosis-result' | 'dashboard';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<View>('chv-home');
  const [selectedDiagnosis, setSelectedDiagnosis] = useState<Diagnosis | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [recentDiagnoses, setRecentDiagnoses] = useState<Diagnosis[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) return;

    // Fetch patients
    const qPatients = query(
      collection(db, 'patients'),
      where('chvId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    const unsubPatients = onSnapshot(qPatients, (snap) => {
      setPatients(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Patient)));
    });

    // Fetch recent diagnoses
    const qDiagnoses = query(
      collection(db, 'diagnoses'),
      where('chvId', '==', user.uid),
      orderBy('timestamp', 'desc'),
      limit(10)
    );
    const unsubDiagnoses = onSnapshot(qDiagnoses, (snap) => {
      setRecentDiagnoses(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Diagnosis)));
    });

    // Fetch active alerts
    const qAlerts = query(
      collection(db, 'alerts'),
      where('resolved', '==', false),
      orderBy('timestamp', 'desc')
    );
    const unsubAlerts = onSnapshot(qAlerts, (snap) => {
      setActiveAlerts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Alert)));
    });

    return () => {
      unsubPatients();
      unsubDiagnoses();
      unsubAlerts();
    };
  }, [user]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleLogout = () => signOut(auth);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <motion.div 
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="text-green-600 font-bold text-2xl"
        >
          GURD
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-stone-100 text-center"
        >
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Activity className="text-green-600 w-10 h-10" />
          </div>
          <h1 className="text-3xl font-bold text-stone-900 mb-2">GURD Health</h1>
          <p className="text-stone-500 mb-8 italic">AI-Powered Diagnostics for Rural Communities</p>
          <button
            onClick={handleLogin}
            className="w-full py-4 bg-green-600 text-white rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-green-700 transition-colors shadow-lg shadow-green-200"
          >
            <LogIn size={20} />
            Sign in with Google
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('chv-home')}>
            <Activity className="text-green-600 w-8 h-8" />
            <span className="text-xl font-bold text-stone-900 tracking-tight">GURD</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-6">
            <button 
              onClick={() => setView('chv-home')}
              className={`flex items-center gap-2 text-sm font-medium ${view === 'chv-home' || view === 'intake-form' ? 'text-green-600' : 'text-stone-500 hover:text-stone-900'}`}
            >
              <UserPlus size={18} />
              CHV Portal
            </button>
            <button 
              onClick={() => setView('dashboard')}
              className={`flex items-center gap-2 text-sm font-medium ${view === 'dashboard' ? 'text-green-600' : 'text-stone-500 hover:text-stone-900'}`}
            >
              <LayoutDashboard size={18} />
              District Dashboard
            </button>
          </nav>

          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-xs font-semibold text-stone-900">{user.displayName}</p>
              <p className="text-[10px] text-stone-400 uppercase tracking-wider">Community Health Volunteer</p>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 text-stone-400 hover:text-red-500 transition-colors"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        <AnimatePresence mode="wait">
          {view === 'chv-home' && (
            <motion.div 
              key="chv-home"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-8"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-stone-900">Welcome back, {user.displayName?.split(' ')[0]}</h2>
                  <p className="text-stone-500">Manage your patients and diagnostic assessments.</p>
                </div>
                <button 
                  onClick={() => setView('intake-form')}
                  className="bg-green-600 text-white px-6 py-3 rounded-2xl font-semibold flex items-center justify-center gap-2 shadow-lg shadow-green-100 hover:bg-green-700 transition-all"
                >
                  <Plus size={20} />
                  New Assessment
                </button>
              </div>

              {/* Active Alerts Banner */}
              {activeAlerts.length > 0 && (
                <div className="bg-red-50 border border-red-100 rounded-3xl p-6 flex items-start gap-4">
                  <div className="bg-red-100 p-3 rounded-2xl">
                    <AlertTriangle className="text-red-600 w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-red-900">Active Outbreak Alerts</h3>
                    <p className="text-red-700 text-sm mb-3">The system has detected potential outbreaks in your district. Please exercise caution.</p>
                    <div className="flex flex-wrap gap-2">
                      {activeAlerts.slice(0, 3).map(alert => (
                        <span key={alert.id} className="bg-white/50 text-red-800 text-[10px] font-bold px-3 py-1 rounded-full border border-red-200 uppercase tracking-wider">
                          {alert.disease}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Patients */}
                <div className="lg:col-span-2 space-y-4">
                  <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                    Recent Patients
                    <span className="text-xs font-normal text-stone-400">({patients.length})</span>
                  </h3>
                  <div className="bg-white rounded-3xl border border-stone-100 overflow-hidden">
                    {patients.length > 0 ? (
                      <div className="divide-y divide-stone-50">
                        {patients.map(patient => (
                          <div key={patient.id} className="p-4 hover:bg-stone-50 transition-colors flex items-center justify-between group cursor-pointer">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center text-stone-500 font-bold">
                                {patient.gender === 'male' ? 'M' : 'F'}
                              </div>
                              <div>
                                <p className="font-bold text-stone-900">{patient.age} months old</p>
                                <p className="text-xs text-stone-400">{patient.location.name}</p>
                              </div>
                            </div>
                            <ChevronRight className="text-stone-300 group-hover:text-green-600 transition-colors" size={20} />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-12 text-center">
                        <p className="text-stone-400">No patients recorded yet.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Recent Diagnoses */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-stone-900">Recent Assessments</h3>
                  <div className="space-y-3">
                    {recentDiagnoses.map(diag => (
                      <div 
                        key={diag.id} 
                        onClick={() => {
                          setSelectedDiagnosis(diag);
                          setView('diagnosis-result');
                        }}
                        className="bg-white p-4 rounded-3xl border border-stone-100 hover:border-green-200 transition-all cursor-pointer shadow-sm"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            diag.diagnosis.urgency === 'critical' ? 'bg-red-100 text-red-600' :
                            diag.diagnosis.urgency === 'high' ? 'bg-orange-100 text-orange-600' :
                            'bg-green-100 text-green-600'
                          }`}>
                            {diag.diagnosis.urgency}
                          </span>
                          <span className="text-[10px] text-stone-400">
                            {new Date(diag.timestamp?.toDate()).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="font-bold text-stone-900 line-clamp-1">{diag.diagnosis.primaryDiagnosis}</p>
                        <p className="text-xs text-stone-500 mt-1">Confidence: {diag.diagnosis.confidence}%</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {view === 'intake-form' && (
            <motion.div 
              key="intake-form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <CHVForm 
                onCancel={() => setView('chv-home')} 
                onComplete={(diagnosis) => {
                  setSelectedDiagnosis(diagnosis);
                  setView('diagnosis-result');
                }}
              />
            </motion.div>
          )}

          {view === 'diagnosis-result' && selectedDiagnosis && (
            <motion.div 
              key="diagnosis-result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
            >
              <DiagnosisResult 
                diagnosis={selectedDiagnosis} 
                onClose={() => setView('chv-home')} 
              />
            </motion.div>
          )}

          {view === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Dashboard />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Mobile Navigation */}
      <nav className="md:hidden bg-white border-t border-stone-200 px-6 py-4 flex items-center justify-around sticky bottom-0 z-50">
        <button 
          onClick={() => setView('chv-home')}
          className={`flex flex-col items-center gap-1 ${view === 'chv-home' || view === 'intake-form' ? 'text-green-600' : 'text-stone-400'}`}
        >
          <UserPlus size={24} />
          <span className="text-[10px] font-bold uppercase">CHV</span>
        </button>
        <button 
          onClick={() => setView('dashboard')}
          className={`flex flex-col items-center gap-1 ${view === 'dashboard' ? 'text-green-600' : 'text-stone-400'}`}
        >
          <LayoutDashboard size={24} />
          <span className="text-[10px] font-bold uppercase">District</span>
        </button>
      </nav>
    </div>
  );
}
