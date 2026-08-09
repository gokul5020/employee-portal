import React, { useEffect, useState } from 'react';
import { reportApi } from '../services/api';
import { FileText, Download, DollarSign, ArrowUpRight, TrendingUp } from 'lucide-react';

interface PayrollProps {
  user: any;
}

export const Payroll: React.FC<PayrollProps> = ({ user }) => {
  const [payslips, setPayslips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayslip, setSelectedPayslip] = useState<any>(null);

  const loadPayslips = async () => {
    try {
      const data = await reportApi.getPayslips();
      setPayslips(data);
      if (data.length > 0) {
        setSelectedPayslip(data[0]);
      }
    } catch (err) {
      console.error('Failed to load payslips', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayslips();
  }, []);

  const handleDownload = async (id: number, month: number, year: number) => {
    try {
      const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ];
      const filename = `payslip_${year}_${monthNames[month - 1]}.pdf`;
      await reportApi.downloadPayslip(id, filename);
    } catch (err) {
      alert('Failed to download PDF payslip.');
    }
  };

  const getMonthName = (m: number) => {
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun", 
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    return months[m - 1] || 'Unknown';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 rounded-full border-4 border-slate-700 border-t-brand-500 animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Grid: Overview cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Basic Annual Allocation */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Base Salary Allocation</span>
            <h2 className="text-2xl font-extrabold text-white mt-1">
              ${user?.salary?.toLocaleString() || '0.00'}
            </h2>
            <p className="text-[10px] text-slate-400 mt-0.5">Annual compensation rate</p>
          </div>
          <div className="p-3 bg-brand-950/30 border border-brand-550/20 text-brand-400 rounded-2xl">
            <DollarSign size={22} />
          </div>
        </div>

        {/* Allowances */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Standard Allowance</span>
            <h2 className="text-2xl font-extrabold text-emerald-400 mt-1">
              $400.00
            </h2>
            <p className="text-[10px] text-slate-400 mt-0.5">HRA, Conveyance & Travel allowances</p>
          </div>
          <div className="p-3 bg-emerald-950/30 border border-emerald-550/20 text-emerald-400 rounded-2xl">
            <ArrowUpRight size={22} />
          </div>
        </div>

        {/* Deductions */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Standard Deductions</span>
            <h2 className="text-2xl font-extrabold text-rose-400 mt-1">
              $200.00
            </h2>
            <p className="text-[10px] text-slate-400 mt-0.5">Provident Fund & Professional Tax</p>
          </div>
          <div className="p-3 bg-rose-950/30 border border-rose-550/20 text-rose-400 rounded-2xl">
            <TrendingUp size={22} />
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Payslip History List */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800 shadow-xl">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center space-x-2">
            <FileText size={16} className="text-brand-400" />
            <span>Monthly Payslips Records</span>
          </h3>

          {payslips.length > 0 ? (
            <div className="space-y-3">
              {payslips.map((slip) => (
                <div 
                  key={slip.id} 
                  onClick={() => setSelectedPayslip(slip)}
                  className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all duration-150 ${
                    selectedPayslip?.id === slip.id 
                      ? 'bg-brand-950/20 border-brand-500/40' 
                      : 'bg-slate-900/40 border-slate-850 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center font-bold text-xs text-brand-300">
                      <span>{getMonthName(slip.month)}</span>
                      <span className="text-[9px] text-slate-500">{slip.year}</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Payslip #{slip.id}</p>
                      <p className="text-[10px] text-slate-500">Net take-home: <span className="text-emerald-400 font-semibold">${slip.netSalary.toLocaleString()}</span></p>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(slip.id, slip.month, slip.year);
                    }}
                    className="p-2 border border-slate-800 hover:border-slate-750 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-all"
                    title="Download Payslip PDF (JasperReports)"
                  >
                    <Download size={14} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-xs py-4">No payslip records found for your account.</p>
          )}
        </div>

        {/* Right Side: Payslip Detail Breakdown Viewer */}
        <div className="lg:col-span-1">
          {selectedPayslip ? (
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 shadow-xl bg-gradient-to-b from-slate-900/60 to-slate-950/80 space-y-5">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Payslip Detailed Breakdown</h4>
                <h3 className="text-lg font-bold text-white mt-0.5">{getMonthName(selectedPayslip.month)} {selectedPayslip.year}</h3>
              </div>

              <div className="border-t border-slate-850 pt-4 space-y-3.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Employee Name:</span>
                  <span className="text-white font-medium">{user?.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Official Position:</span>
                  <span className="text-white font-medium">{user?.position}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Disbursed Institution:</span>
                  <span className="text-white font-medium">{user?.bankName || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Account Number:</span>
                  <span className="text-white font-medium">{user?.bankAccountNumber || 'N/A'}</span>
                </div>
              </div>

              <div className="border-t border-slate-850 pt-4 space-y-3.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">Basic Allocation (Monthly)</span>
                  <span className="text-white font-bold">${selectedPayslip.basicSalary.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">Total Allowances</span>
                  <span className="text-emerald-400 font-bold">+${(selectedPayslip.allowances || 0.0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">Total Deductions</span>
                  <span className="text-rose-400 font-bold">-${(selectedPayslip.deductions || 0.0).toLocaleString()}</span>
                </div>
              </div>

              <div className="border-t border-slate-850 pt-4">
                <div className="bg-slate-900 border border-slate-850 rounded-xl p-3 flex justify-between items-center">
                  <div>
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">NET DISBURSED AMOUNT</span>
                    <p className="text-xl font-extrabold text-emerald-400">${selectedPayslip.netSalary.toLocaleString()}</p>
                  </div>
                  <button
                    onClick={() => handleDownload(selectedPayslip.id, selectedPayslip.month, selectedPayslip.year)}
                    className="px-3.5 py-2 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center space-x-1 transition-all"
                  >
                    <Download size={12} />
                    <span>Download PDF</span>
                  </button>
                </div>
              </div>

            </div>
          ) : (
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 text-center text-slate-500 text-xs">
              Select a payslip record to inspect.
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
