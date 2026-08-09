import React, { useState, useEffect } from 'react';
import { leaveApi, attendanceApi, reportApi } from '../services/api';
import { 
  Calendar, 
  Send, 
  CheckCircle, 
  XCircle, 
  FileSpreadsheet, 
  Clock, 
  MessageSquare
} from 'lucide-react';

interface LeaveManagementProps {
  user: any;
}

export const LeaveManagement: React.FC<LeaveManagementProps> = ({ user }) => {
  // Leave Form State
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [leaveType, setLeaveType] = useState('ANNUAL');
  const [reason, setReason] = useState('');
  const [applyLoading, setApplyLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);

  // Lists State
  const [myLeaves, setMyLeaves] = useState<any[]>([]);
  const [attendanceHistory, setAttendanceHistory] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [loadingLists, setLoadingLists] = useState(true);

  // Review State
  const [reviewComments, setReviewComments] = useState<{ [key: number]: string }>({});
  const [reviewLoading, setReviewLoading] = useState<{ [key: number]: boolean }>({});

  const loadData = async () => {
    try {
      const leaves = await leaveApi.getMyLeaves();
      setMyLeaves(leaves);

      const attendance = await attendanceApi.getHistory();
      setAttendanceHistory(attendance);

      if (user.role === 'ROLE_MANAGER' || user.role === 'ROLE_ADMIN') {
        const pending = await leaveApi.getPendingLeaves();
        setPendingRequests(pending);
      }
    } catch (err) {
      console.error('Failed to load lists', err);
    } finally {
      setLoadingLists(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    setApplyLoading(true);
    setFormError('');
    setFormSuccess(false);

    try {
      await leaveApi.applyLeave({
        startDate,
        endDate,
        leaveType,
        reason
      });
      setFormSuccess(true);
      setStartDate('');
      setEndDate('');
      setReason('');
      // Reload leaves list
      const leaves = await leaveApi.getMyLeaves();
      setMyLeaves(leaves);
    } catch (err: any) {
      setFormError(err.response?.data || 'Failed to submit leave request');
    } finally {
      setApplyLoading(false);
    }
  };

  const handleReview = async (id: number, status: string) => {
    const comments = reviewComments[id] || '';
    setReviewLoading(prev => ({ ...prev, [id]: true }));
    try {
      await leaveApi.reviewLeave(id, { status, comments });
      // Reload pending and my leaves
      const pending = await leaveApi.getPendingLeaves();
      setPendingRequests(pending);
      const leaves = await leaveApi.getMyLeaves();
      setMyLeaves(leaves);
    } catch (err: any) {
      alert(err.response?.data || 'Failed to review request');
    } finally {
      setReviewLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleCommentChange = (id: number, text: string) => {
    setReviewComments(prev => ({ ...prev, [id]: text }));
  };

  // POI Excel Downloads
  const downloadMyAttendance = async () => {
    try {
      await reportApi.downloadAttendanceExcel();
    } catch (err) {
      alert('Excel export failed');
    }
  };

  const downloadMyLeaves = async () => {
    try {
      await reportApi.downloadLeavesExcel();
    } catch (err) {
      alert('Excel export failed');
    }
  };

  const downloadAllAttendance = async () => {
    try {
      await reportApi.downloadAdminAttendanceExcel();
    } catch (err) {
      alert('Excel export failed');
    }
  };

  const downloadAllLeaves = async () => {
    try {
      await reportApi.downloadAdminLeavesExcel();
    } catch (err) {
      alert('Excel export failed');
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/20';
      case 'REJECTED': return 'bg-rose-950/60 text-rose-400 border border-rose-500/20';
      default: return 'bg-amber-950/60 text-amber-400 border border-amber-500/20';
    }
  };

  const isHrOrManager = user.role === 'ROLE_ADMIN' || user.role === 'ROLE_MANAGER';

  return (
    <div className="space-y-6">
      
      {/* Excel Reports Downloads */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-brand-950/10 to-slate-900/60">
        <div>
          <h3 className="text-sm font-bold text-white">HR Spreadsheet Export Console</h3>
          <p className="text-[11px] text-slate-500">Generated on-demand via Python openpyxl engine</p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={downloadMyLeaves}
            className="flex items-center space-x-1.5 px-4 py-2 border border-slate-850 hover:border-slate-700 bg-slate-900/40 hover:bg-slate-900/80 rounded-xl text-xs font-semibold text-brand-300 transition-all duration-150"
          >
            <FileSpreadsheet size={14} />
            <span>My Leaves Excel</span>
          </button>
          <button
            onClick={downloadMyAttendance}
            className="flex items-center space-x-1.5 px-4 py-2 border border-slate-850 hover:border-slate-700 bg-slate-900/40 hover:bg-slate-900/80 rounded-xl text-xs font-semibold text-emerald-300 transition-all duration-150"
          >
            <FileSpreadsheet size={14} />
            <span>My Clocking Excel</span>
          </button>
          {isHrOrManager && (
            <>
              <button
                onClick={downloadAllLeaves}
                className="flex items-center space-x-1.5 px-4 py-2 border border-purple-950 bg-purple-950/30 hover:bg-purple-950/50 rounded-xl text-xs font-semibold text-purple-300 transition-all duration-150"
              >
                <FileSpreadsheet size={14} />
                <span>All Leaves Report</span>
              </button>
              <button
                onClick={downloadAllAttendance}
                className="flex items-center space-x-1.5 px-4 py-2 border border-purple-950 bg-purple-950/30 hover:bg-purple-950/50 rounded-xl text-xs font-semibold text-purple-300 transition-all duration-150"
              >
                <FileSpreadsheet size={14} />
                <span>All Clocking Report</span>
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Leave application form */}
        <div className="lg:col-span-1 glass-panel p-6 rounded-2xl border border-slate-800 shadow-xl h-fit">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center space-x-2">
            <Calendar size={16} className="text-brand-400" />
            <span>File Leave Application</span>
          </h3>

          {formError && (
            <div className="bg-rose-950/40 border border-rose-500/20 text-rose-300 text-xs p-3 rounded-xl mb-4">
              {formError}
            </div>
          )}

          {formSuccess && (
            <div className="bg-emerald-950/40 border border-emerald-500/20 text-emerald-300 text-xs p-3 rounded-xl mb-4">
              Leave application filed successfully!
            </div>
          )}

          <form onSubmit={handleApplyLeave} className="space-y-4">
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 mb-1.5">START DATE</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 mb-1.5">END DATE</label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 mb-1.5">LEAVE TYPE</label>
              <select
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-brand-500"
              >
                <option value="ANNUAL">Annual Leave</option>
                <option value="SICK">Sick Leave</option>
                <option value="CASUAL">Casual Leave</option>
                <option value="MATERNITY">Maternity Leave</option>
                <option value="PATERNITY">Paternity Leave</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 mb-1.5">REASON & DESCRIPTION</label>
              <textarea
                required
                rows={3}
                placeholder="Brief reason for your request"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-brand-500 placeholder-slate-655"
              />
            </div>
            <button
              type="submit"
              disabled={applyLoading}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-md active:scale-95 disabled:opacity-50 transition-all"
            >
              {applyLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Send size={12} />
                  <span>File Request</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Leaves history lists */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Pending Direct Report Requests (For Managers) */}
          {isHrOrManager && (
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 shadow-xl">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center space-x-2">
                <Clock size={16} className="text-purple-400" />
                <span>Pending Approvals Queue</span>
              </h3>
              {loadingLists ? (
                <div className="text-slate-500 text-xs py-4 text-center">Loading pending approvals...</div>
              ) : pendingRequests.length > 0 ? (
                <div className="space-y-4">
                  {pendingRequests.map((req) => (
                    <div 
                      key={req.id} 
                      className="bg-slate-900/40 border border-slate-850 p-4 rounded-xl space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 rounded-full bg-purple-950 border border-purple-800 flex items-center justify-center font-bold text-xs text-purple-300">
                            {req.user?.fullName?.charAt(0)}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-white">{req.user?.fullName}</p>
                            <p className="text-[10px] text-slate-500">{req.user?.position} • {req.user?.department}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-brand-950 text-brand-400 border border-brand-500/10 self-start sm:self-auto">
                          {req.leaveType}
                        </span>
                      </div>
                      
                      <div className="text-xs text-slate-400 bg-slate-900/60 p-2.5 rounded-lg border border-slate-900">
                        <p className="font-semibold text-[10px] text-slate-500">REASON:</p>
                        <p className="mt-0.5">{req.reason}</p>
                      </div>

                      <div className="flex justify-between items-center text-xs text-slate-500">
                        <span>Duration: <span className="text-slate-350 font-bold">{req.startDate} to {req.endDate}</span></span>
                      </div>

                      {/* Approval Review Tools */}
                      <div className="border-t border-slate-850/60 pt-3 flex flex-col sm:flex-row gap-3 items-center">
                        <div className="relative w-full sm:flex-1">
                          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                            <MessageSquare size={12} />
                          </span>
                          <input
                            type="text"
                            placeholder="Add manager review comments..."
                            value={reviewComments[req.id] || ''}
                            onChange={(e) => handleCommentChange(req.id, e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-brand-500 placeholder-slate-600"
                          />
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                          <button
                            onClick={() => handleReview(req.id, 'APPROVED')}
                            disabled={reviewLoading[req.id]}
                            className="flex-1 sm:flex-initial flex items-center justify-center space-x-1 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm shadow-emerald-600/5 active:scale-95"
                          >
                            <CheckCircle size={12} />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => handleReview(req.id, 'REJECTED')}
                            disabled={reviewLoading[req.id]}
                            className="flex-1 sm:flex-initial flex items-center justify-center space-x-1 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-sm shadow-rose-600/5 active:scale-95"
                          >
                            <XCircle size={12} />
                            <span>Reject</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-xs py-2">No pending leave requests found.</p>
              )}
            </div>
          )}

          {/* My Leaves History */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 shadow-xl">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center space-x-2">
              <Calendar size={16} className="text-brand-400" />
              <span>My Leaves History</span>
            </h3>
            {loadingLists ? (
              <div className="text-slate-500 text-xs py-4 text-center">Loading leaves history...</div>
            ) : myLeaves.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-850 text-[10px] text-slate-500 font-bold uppercase">
                      <th className="py-3 px-2">Type</th>
                      <th className="py-3 px-2">Dates</th>
                      <th className="py-3 px-2">Reason</th>
                      <th className="py-3 px-2 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myLeaves.map((item) => (
                      <tr key={item.id} className="border-b border-slate-900/50 text-xs hover:bg-white/2">
                        <td className="py-3.5 px-2 font-semibold text-white">{item.leaveType}</td>
                        <td className="py-3.5 px-2 text-slate-400">{item.startDate} to {item.endDate}</td>
                        <td className="py-3.5 px-2 text-slate-400 truncate max-w-[150px]" title={item.reason}>{item.reason}</td>
                        <td className="py-3.5 px-2 text-right">
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${getStatusBadge(item.status)}`}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-slate-500 text-xs py-2">No leave applications filed yet.</p>
            )}
          </div>

          {/* My Attendance / Check-In Log */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 shadow-xl">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center space-x-2">
              <Clock size={16} className="text-emerald-400" />
              <span>My Clocking History Logs</span>
            </h3>
            {loadingLists ? (
              <div className="text-slate-500 text-xs py-4 text-center">Loading clocking history...</div>
            ) : attendanceHistory.length > 0 ? (
              <div className="overflow-x-auto max-h-72 overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-850 text-[10px] text-slate-500 font-bold uppercase sticky top-0 bg-[#0c1220]">
                      <th className="py-3 px-2">Date</th>
                      <th className="py-3 px-2">Check In</th>
                      <th className="py-3 px-2">Check Out</th>
                      <th className="py-3 px-2 text-right">Hours</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceHistory.map((item) => (
                      <tr key={item.id} className="border-b border-slate-900/50 text-xs hover:bg-white/2">
                        <td className="py-3 px-2 text-slate-200">{item.date}</td>
                        <td className="py-3 px-2 text-slate-400">
                          {new Date(item.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </td>
                        <td className="py-3 px-2 text-slate-400">
                          {item.checkOutTime 
                            ? new Date(item.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) 
                            : '-'}
                        </td>
                        <td className="py-3 px-2 text-right font-bold text-white">
                          {item.hoursWorked !== null ? `${item.hoursWorked} hrs` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-slate-500 text-xs py-2">No attendance clockings checked yet.</p>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
