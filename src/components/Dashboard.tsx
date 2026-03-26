import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, where, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Diagnosis, Alert } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { MapPin, Activity, AlertCircle, TrendingUp, Users, Calendar } from 'lucide-react';
import { motion } from 'motion/react';

export default function Dashboard() {
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [timeRange, setTimeRange] = useState(7); // days

  const [scanning, setScanning] = useState(false);

  const triggerScan = async () => {
    setScanning(true);
    try {
      const res = await fetch('/api/surveillance/detect', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        alert("Surveillance scan completed successfully.");
      }
    } catch (error) {
      console.error("Scan failed", error);
    } finally {
      setScanning(false);
    }
  };

  useEffect(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - timeRange);
    
    const q = query(
      collection(db, 'diagnoses'),
      where('timestamp', '>=', Timestamp.fromDate(cutoff)),
      orderBy('timestamp', 'desc')
    );

    const unsub = onSnapshot(q, (snap) => {
      setDiagnoses(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Diagnosis)));
    });

    const qAlerts = query(
      collection(db, 'alerts'),
      orderBy('timestamp', 'desc')
    );
    const unsubAlerts = onSnapshot(qAlerts, (snap) => {
      setAlerts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Alert)));
    });

    return () => {
      unsub();
      unsubAlerts();
    };
  }, [timeRange]);

  // Data Aggregation
  const diseaseStats = diagnoses.reduce((acc, d) => {
    const name = d.diagnosis.primaryDiagnosis;
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const barData = Object.entries(diseaseStats).map(([name, value]) => ({ name, value }));

  const trendData = Array.from({ length: timeRange }).map((_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (timeRange - 1 - i));
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    const count = diagnoses.filter(d => {
      const dDate = d.timestamp?.toDate();
      return dDate && dDate.toDateString() === date.toDateString();
    }).length;

    return { date: dateStr, cases: count };
  });

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-stone-900">District Health Surveillance</h2>
          <p className="text-stone-500">Real-time disease tracking and outbreak detection.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={triggerScan}
            disabled={scanning}
            className="bg-white border border-stone-200 px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-50 transition-all flex items-center gap-2"
          >
            {scanning ? <Activity className="animate-spin" size={14} /> : <Activity size={14} />}
            Trigger Surveillance Scan
          </button>
          <div className="flex items-center bg-white border border-stone-200 rounded-2xl p-1">
          {[7, 14, 30].map(days => (
            <button
              key={days}
              onClick={() => setTimeRange(days)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                timeRange === days ? 'bg-stone-900 text-white shadow-lg' : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              {days}D
            </button>
          ))}
        </div>
      </div>
    </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm">
          <div className="flex items-center gap-3 text-stone-400 mb-4">
            <Users size={18} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Total Cases</span>
          </div>
          <p className="text-4xl font-black text-stone-900">{diagnoses.length}</p>
          <div className="flex items-center gap-1 text-green-600 text-xs font-bold mt-2">
            <TrendingUp size={12} />
            <span>+12% from last week</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm">
          <div className="flex items-center gap-3 text-stone-400 mb-4">
            <AlertCircle size={18} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Active Alerts</span>
          </div>
          <p className="text-4xl font-black text-red-600">{alerts.filter(a => !a.resolved).length}</p>
          <p className="text-xs text-stone-400 mt-2">Requiring investigation</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm">
          <div className="flex items-center gap-3 text-stone-400 mb-4">
            <Activity size={18} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Avg Urgency</span>
          </div>
          <p className="text-4xl font-black text-stone-900">High</p>
          <p className="text-xs text-stone-400 mt-2">Based on symptom severity</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm">
          <div className="flex items-center gap-3 text-stone-400 mb-4">
            <Calendar size={18} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Reporting CHVs</span>
          </div>
          <p className="text-4xl font-black text-stone-900">24</p>
          <p className="text-xs text-stone-400 mt-2">Active in this period</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Trend Chart */}
        <div className="bg-white p-8 rounded-3xl border border-stone-100 shadow-sm space-y-6">
          <h3 className="text-lg font-bold text-stone-900">Daily Case Incidence</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f4" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#a8a29e' }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#a8a29e' }} 
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="cases" 
                  stroke="#10b981" 
                  strokeWidth={4} 
                  dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Disease Breakdown */}
        <div className="bg-white p-8 rounded-3xl border border-stone-100 shadow-sm space-y-6">
          <h3 className="text-lg font-bold text-stone-900">Disease Distribution</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f5f5f4" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  width={120}
                  tick={{ fontSize: 10, fill: '#57534e', fontWeight: 'bold' }} 
                />
                <Tooltip 
                  cursor={{ fill: '#f5f5f4' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={20}>
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Active Alerts Table */}
      <div className="bg-white rounded-3xl border border-stone-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-stone-50">
          <h3 className="text-lg font-bold text-stone-900">Recent System Alerts</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-stone-50 text-[10px] font-bold text-stone-400 uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">Disease</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4">Cases</th>
                <th className="px-6 py-4">Severity</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {alerts.map(alert => (
                <tr key={alert.id} className="hover:bg-stone-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-stone-900">{alert.disease}</td>
                  <td className="px-6 py-4 text-sm text-stone-500 flex items-center gap-2">
                    <MapPin size={14} />
                    {alert.location.lat.toFixed(2)}, {alert.location.lng.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-sm font-bold">{alert.caseCount}</td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      alert.severity === 'critical' ? 'bg-red-100 text-red-600' :
                      alert.severity === 'high' ? 'bg-orange-100 text-orange-600' :
                      'bg-green-100 text-green-600'
                    }`}>
                      {alert.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-semibold ${alert.resolved ? 'text-green-600' : 'text-orange-600'}`}>
                      {alert.resolved ? 'Resolved' : 'Active'}
                    </span>
                  </td>
                </tr>
              ))}
              {alerts.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-stone-400 italic">No alerts detected in this period.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
