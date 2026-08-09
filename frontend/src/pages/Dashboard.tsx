import React, { useEffect, useState, useRef } from 'react';
import { attendanceApi } from '../services/api';
import { 
  Play, 
  Square, 
  Clock, 
  DollarSign, 
  ChevronRight,
  User as UserIcon,
  CalendarDays
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DashboardProps {
  user: any;
}

export const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [attendance, setAttendance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [clockLoading, setClockLoading] = useState(false);
  const [timeString, setTimeString] = useState('00:00:00');
  const timerRef = useRef<any | null>(null);
  const navigate = useNavigate();

  const loadData = async () => {
    try {
      const attData = await attendanceApi.getStatus();
      setAttendance(attData);
    } catch (error) {
      console.error("Failed to load dashboard data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Live Timer for active check-in
  useEffect(() => {
    if (attendance && attendance.checkInTime && !attendance.checkOutTime) {
      const checkIn = new Date(attendance.checkInTime).getTime();
      
      const updateTimer = () => {
        const now = new Date().getTime();
        const diff = now - checkIn;
        
        if (diff > 0) {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          
          const pad = (num: number) => String(num).padStart(2, '0');
          setTimeString(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
        }
      };

      updateTimer();
      timerRef.current = setInterval(updateTimer, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setTimeString('00:00:00');
    }
  }, [attendance]);

  const handleClockToggle = async () => {
    setClockLoading(true);
    try {
      if (attendance && !attendance.checkOutTime) {
        // Clock Out
        const updated = await attendanceApi.checkOut();
        setAttendance(updated);
      } else {
        // Clock In
        const updated = await attendanceApi.checkIn();
        setAttendance(updated);
      }
    } catch (err: any) {
      alert(err.response?.data || "Clock action failed");
    } finally {
      setClockLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-4 border-slate-700 border-t-brand-500 animate-spin"></div>
      </div>
    );
  }

  const isCheckedIn = attendance && !attendance.checkOutTime;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative rounded-2xl overflow-hidden glass-panel p-6 border border-slate-800/80 shadow-xl bg-gradient-to-r from-brand-950/20 via-slate-900/60 to-purple-950/15">
        <div className="absolute top-0 right-0 w-32 h-32 glow-spot-purple pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
              Welcome back, <span className="bg-gradient-to-r from-brand-300 to-purple-300 bg-clip-text text-transparent">{user?.fullName}</span>
            </h2>
            <p className="text-slate-400 text-xs md:text-sm mt-1">
              {user?.position} • {user?.department} Department
            </p>
          </div>
          <div className="flex items-center space-x-3 text-xs bg-slate-900/80 px-4 py-2.5 rounded-xl border border-slate-800">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-slate-300 font-semibold">Active Session JWT Secured</span>
          </div>
        </div>
      </div>

      {/* Grid: Clock-in panel + Quick Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Clock In / Out Console */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col justify-between h-full bg-gradient-to-br from-slate-900/60 to-slate-950/80">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-2">
              <Clock size={16} className="text-brand-400" />
              <span>Time Clock Console</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Work Hours & Attendance Tracking</p>
          </div>

          <div className="my-8 text-center">
            {isCheckedIn ? (
              <div className="space-y-2">
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-950/50 text-emerald-400 border border-emerald-500/20">
                  Checked In at {new Date(attendance.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <h1 className="text-4xl font-extrabold text-white tracking-widest font-mono mt-3">
                  {timeString}
                </h1>
                <p className="text-slate-400 text-xs">Elapsed work duration today</p>
              </div>
            ) : (
              <div className="space-y-2">
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-950/50 text-slate-400 border border-slate-800">
                  Not Checked In
                </span>
                <h1 className="text-4xl font-extrabold text-slate-500 tracking-widest font-mono mt-3">
                  00:00:00
                </h1>
                <p className="text-slate-500 text-xs">Ready for check-in</p>
              </div>
            )}
          </div>

          <button
            onClick={handleClockToggle}
            disabled={clockLoading}
            className={`w-full py-3.5 px-4 rounded-xl font-bold flex items-center justify-center space-x-2 shadow-lg transition-all duration-200 active:scale-[0.98] ${
              isCheckedIn 
                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/10' 
                : 'bg-brand-600 hover:bg-brand-700 text-white shadow-brand-600/10'
            }`}
          >
            {isCheckedIn ? (
              <>
                <Square size={16} fill="white" />
                <span>Clock Out</span>
              </>
            ) : (
              <>
                <Play size={16} fill="white" />
                <span>Clock In Now</span>
              </>
            )}
          </button>
        </div>

        {/* Dashboard Cards */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Compensation Snapshot */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col justify-between bg-gradient-to-br from-slate-900/40 to-indigo-950/5 shadow-xl">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Payroll Snapshot</p>
                <h4 className="text-lg font-bold text-white mt-1">Est. Compensation</h4>
              </div>
              <div className="p-2 bg-emerald-950/30 border border-emerald-500/20 text-emerald-400 rounded-xl">
                <DollarSign size={20} />
              </div>
            </div>
            
            <div className="my-6">
              <h3 className="text-3xl font-extrabold text-white">
                ${user?.salary ? (user.salary / 12).toLocaleString([], { maximumFractionDigits: 2 }) : '0.00'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">Calculated net take-home per month</p>
            </div>
            
            <button 
              onClick={() => navigate('/payroll')} 
              className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center space-x-1 hover:underline"
            >
              <span>View Payslip History</span>
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Quick Actions Panel */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col justify-between shadow-xl">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Portal Actions</p>
              <h4 className="text-lg font-bold text-white mt-1">Quick Links</h4>
            </div>
            
            <div className="space-y-2.5 my-4">
              <button 
                onClick={() => navigate('/profile')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900/50 hover:bg-slate-800/40 border border-slate-800 hover:border-slate-700 transition-all duration-150 text-left"
              >
                <div className="flex items-center space-x-2.5">
                  <UserIcon size={14} className="text-brand-400" />
                  <span className="text-xs text-slate-300 font-semibold">Update Banking details</span>
                </div>
                <ChevronRight size={12} className="text-slate-500" />
              </button>
              
              <button 
                onClick={() => navigate('/leaves')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900/50 hover:bg-slate-800/40 border border-slate-800 hover:border-slate-700 transition-all duration-150 text-left"
              >
                <div className="flex items-center space-x-2.5">
                  <CalendarDays size={14} className="text-indigo-400" />
                  <span className="text-xs text-slate-300 font-semibold">Apply for Leave Request</span>
                </div>
                <ChevronRight size={12} className="text-slate-500" />
              </button>
            </div>

            <div className="text-[10px] text-slate-500 italic">
              Access leaves, payroll info, and bank credentials from shortcuts.
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
