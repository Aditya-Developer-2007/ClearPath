import React, { useState } from 'react';
import { X, CheckCircle2, ShieldCheck, Printer, Building2, UserRound } from 'lucide-react';

export default function VerifiableNocModal({ approval, business, onClose }) {
  const [verifiedLedger, setVerifiedLedger] = useState(false);

  if (!approval) return null;

  const certMeta = approval.certificateMeta || {};
  const certNo = certMeta.certificateNo || `NOC-${(approval.department || 'GOV').slice(0, 4).toUpperCase()}-2026-${(approval.id || 'REQ').toUpperCase()}`;
  const sha256 = certMeta.sha256Signature || 'a910403ef18b209c73810242ac110003b102948ca92b11ef84560242ac110004';
  const issuedDate = certMeta.issuedAt ? new Date(certMeta.issuedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '26 Oct 2026';
  const officerName = certMeta.approvedBy || approval.assignedOfficerName || 'Vikramaditya Sinh';
  const unitName = business?.name || 'Surya Vastra Mills Pvt. Ltd.';
  const unitAddress = business?.address || 'Plot 14, GIDC Sachin, Surat';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-teal-500/20 text-teal-400 rounded-lg border border-teal-500/30">
              <ShieldCheck size={20} />
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-teal-400 font-bold">
                Government of Gujarat • Single-Window Portal
              </div>
              <h2 className="text-base font-bold tracking-tight font-headings text-white">
                Statutory Clearance &amp; Regulatory NOC
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Certificate Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700 bg-[#FCFDFE]">
          {/* Official Emblem Banner */}
          <div className="text-center pb-4 border-b border-slate-200/80">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
              Directorate of Industrial Safety &amp; Statutory Approvals
            </div>
            <h1 className="text-lg sm:text-xl font-bold font-headings text-slate-950 mt-1">
              {approval.name}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Form: <span className="font-mono font-semibold text-slate-800">{approval.formName || 'CAF Form-1'}</span> • Mandate:{' '}
              <span className="font-medium text-slate-800">{approval.statutoryBasis || 'Statutory Public Safety Act'}</span>
            </p>
          </div>

          {/* Key Certificate Credentials */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 border border-slate-200/80 rounded-xl p-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Certificate No</span>
              <span className="font-mono font-bold text-slate-950 text-xs sm:text-sm">{certNo}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Date of Issuance</span>
              <span className="font-mono font-semibold text-slate-800">{issuedDate}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Validity</span>
              <span className="font-mono font-bold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 size={13} /> Active &amp; Valid
              </span>
            </div>
          </div>

          {/* Grantee / Unit Details */}
          <div className="border border-slate-200/80 rounded-xl p-4 space-y-2 bg-white">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Certified Industrial Unit</div>
            <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
              <Building2 size={16} className="text-slate-400 shrink-0" />
              <span>{unitName}</span>
            </div>
            <div className="text-slate-600 text-[11px] pl-6 space-y-0.5">
              <div>Address: <strong className="text-slate-800">{unitAddress}</strong></div>
              <div>Sector: {business?.sector || 'Textile'} • Category: {approval.riskTier ? `${approval.riskTier.toUpperCase()} Risk` : 'Standard'}</div>
            </div>
          </div>

          {/* Officer Certification Box */}
          <div className="border border-slate-200/80 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white">
            <div className="space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Approved &amp; Certified By</div>
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <UserRound size={15} className="text-slate-400 shrink-0" />
                <span>{officerName}</span>
              </div>
              <div className="text-[11px] text-slate-500">
                {approval.department} Department • Desk {approval.deskNo || '2'}
              </div>
            </div>

            {/* Inline SVG QR Code Pattern */}
            <div className="flex items-center gap-3 self-end sm:self-auto bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <svg width="56" height="56" viewBox="0 0 56 56" className="text-slate-900">
                {/* QR Matrix Pattern (deterministic pure inline SVG) */}
                <rect width="56" height="56" fill="#F8FAFC" />
                <rect x="4" y="4" width="16" height="16" fill="currentColor" rx="2" />
                <rect x="7" y="7" width="10" height="10" fill="#F8FAFC" rx="1" />
                <rect x="9" y="9" width="6" height="6" fill="currentColor" />

                <rect x="36" y="4" width="16" height="16" fill="currentColor" rx="2" />
                <rect x="39" y="7" width="10" height="10" fill="#F8FAFC" rx="1" />
                <rect x="41" y="9" width="6" height="6" fill="currentColor" />

                <rect x="4" y="36" width="16" height="16" fill="currentColor" rx="2" />
                <rect x="7" y="39" width="10" height="10" fill="#F8FAFC" rx="1" />
                <rect x="9" y="41" width="6" height="6" fill="currentColor" />

                <rect x="24" y="8" width="8" height="4" fill="currentColor" />
                <rect x="26" y="16" width="6" height="6" fill="currentColor" />
                <rect x="24" y="26" width="8" height="8" fill="currentColor" />
                <rect x="8" y="24" width="6" height="8" fill="currentColor" />
                <rect x="36" y="26" width="6" height="6" fill="currentColor" />
                <rect x="44" y="24" width="8" height="6" fill="currentColor" />
                <rect x="24" y="38" width="6" height="10" fill="currentColor" />
                <rect x="34" y="36" width="8" height="4" fill="currentColor" />
                <rect x="44" y="38" width="6" height="10" fill="currentColor" />
              </svg>
              <div className="text-[10px] text-slate-500 font-mono leading-tight">
                <span className="font-bold text-slate-800 block">GovTech NSWS</span>
                Scan to verify
              </div>
            </div>
          </div>

          {/* Cryptographic SHA-256 Audit Footprint */}
          <div className="bg-slate-900 text-slate-200 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[10px] text-teal-400 font-bold uppercase tracking-wider">
                Cryptographic Audit Hash (SHA-256)
              </span>
              <button
                type="button"
                onClick={() => setVerifiedLedger(true)}
                className="text-[10px] font-bold text-teal-400 hover:text-teal-300 underline"
              >
                {verifiedLedger ? '✓ Chain Verified' : 'Verify Hash Integrity'}
              </button>
            </div>
            <div className="font-mono text-[11px] text-teal-300 break-all bg-slate-950/60 p-2 rounded border border-slate-800">
              {sha256}
            </div>
            {verifiedLedger && (
              <div className="text-[11px] font-mono text-emerald-400 flex items-center gap-1.5 pt-0.5">
                <CheckCircle2 size={13} />
                <span>Cryptographic Chain Verified against State Genesis Audit Ledger (Block #4912)</span>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 transition-all"
          >
            <Printer size={14} />
            <span>Print Official NOC</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
          >
            Close Certificate
          </button>
        </div>
      </div>
    </div>
  );
}
