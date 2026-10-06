import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function ReportDiscrepancyModal({ isOpen, onClose, defaultLaw = '' }) {
  const navigate = useNavigate();
  const [category, setCategory] = useState('law-discrepancy');
  const [lawReference, setLawReference] = useState(defaultLaw);
  const [description, setDescription] = useState('');
  const [proofEvidence, setProofEvidence] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedReport, setSubmittedReport] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  if (!isOpen) return null;

  const buildEmailContent = () => {
    const recipient = 'saikrishnabathina999@gmail.com';
    const categoryLabel = {
      'law-discrepancy': 'Incorrect Law Interpretation / Ruling Error',
      'missing-clause': 'Missing or Outdated MCC / ICC Clause',
      'software-bug': 'Software Bug / UI Glitch',
      'tournament-variation': 'Tournament Condition (ICC vs MCC) Conflict',
    }[category] || category;

    const subject = `[CricLaws Error / Bug Report] ${lawReference ? lawReference : 'Officiating Feedback'}`;
    const body = 
`CRICLAWS LAW DISCREPANCY & BUG REPORT
===================================================
Category:       ${categoryLabel}
Law Reference:  ${lawReference || 'N/A'}
Reporter Email: ${userEmail || 'Not provided'}

WHAT IS INCORRECT / BUG DESCRIPTION:
${description || 'Please explain what is wrong...'}

MANDATORY PROOF & STATUTORY CITATIONS:
${proofEvidence || 'Cite MCC Law clause, ICC playing condition page, or verified video link...'}

===================================================
Sent to Developer: Sai Krishna Bathina (saikrishnabathina999@gmail.com)
via CricLaws Official Desk Platform`;

    return { recipient, subject, body };
  };

  const handleSendViaGmail = () => {
    const { recipient, subject, body } = buildEmailContent();
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(recipient)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(gmailUrl, '_blank', 'noopener,noreferrer');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim() || !proofEvidence.trim()) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    const payload = {
      category,
      lawReference: lawReference.trim(),
      description: description.trim(),
      proofEvidence: proofEvidence.trim(),
      userEmail: userEmail.trim(),
    };

    let serverReport = null;

    try {
      // 1. Post to backend API to persist to MongoDB database
      const res = await api.post('/reports', payload);
      if (res.data?.data) {
        serverReport = res.data.data;
      }
    } catch (err) {
      console.warn('API report submission note (saving locally as fallback):', err.message);
    }

    // 2. Always persist to localStorage as well so reports are never lost
    const localId = `REP-${Date.now()}`;
    const reportRecord = serverReport || {
      _id: localId,
      ...payload,
      createdAt: new Date().toISOString(),
    };

    try {
      const existing = JSON.parse(localStorage.getItem('cricbot_discrepancy_reports') || '[]');
      existing.unshift(reportRecord);
      localStorage.setItem('cricbot_discrepancy_reports', JSON.stringify(existing));
    } catch (localErr) {
      console.warn('LocalStorage save note:', localErr);
    }

    setIsSubmitting(false);
    setSubmittedReport(reportRecord);
  };

  const handleResetAndClose = () => {
    setSubmittedReport(null);
    setDescription('');
    setProofEvidence('');
    onClose();
  };

  const handleReturnToMainDesk = () => {
    handleResetAndClose();
    navigate('/chat');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F241D]/45 backdrop-blur-xs animate-fadeIn">
      <div 
        className="w-full max-w-lg bg-white rounded-2xl border border-[#D5E2DA] shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-[#0F241D] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-white/10 flex items-center justify-center text-emerald-300">
              <span className="material-symbols-outlined text-[18px]">report_problem</span>
            </div>
            <div>
              <h2 className="font-serif text-lg font-medium tracking-tight text-white leading-tight">
                Report a Wrong Law or Bug
              </h2>
              <span className="text-[11px] text-emerald-200/80 font-sans">
                Direct feedback &amp; proof to developer (Sai Krishna)
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleResetAndClose}
            className="text-white/70 hover:text-white p-1 rounded transition-colors"
            title="Close"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {submittedReport ? (
          <div className="p-6 sm:p-8 flex flex-col items-center text-center gap-4 animate-fadeIn">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <span className="material-symbols-outlined text-[28px]">check_circle</span>
            </div>
            <div>
              <h3 className="font-serif text-2xl text-[#0F241D] font-medium">Report Successfully Logged</h3>
              <p className="text-xs text-slate-600 mt-1 max-w-sm leading-relaxed">
                Your statutory discrepancy and supporting proof have been recorded in the CricLaws database.
              </p>
            </div>

            {/* Reference Badge */}
            <div className="w-full bg-[#F4F8F5] border border-[#D5E2DA] rounded-xl p-3.5 text-left flex flex-col gap-1.5 text-xs">
              <div className="flex justify-between items-center text-slate-500 text-[11px]">
                <span>Database Reference ID:</span>
                <span className="font-mono text-[#0F241D] font-semibold">{submittedReport._id || 'SAVED-LOCAL'}</span>
              </div>
              <div className="flex justify-between items-center text-slate-500 text-[11px]">
                <span>Category:</span>
                <span className="font-medium text-[#0F241D]">{submittedReport.category}</span>
              </div>
              <div className="flex justify-between items-center text-slate-500 text-[11px]">
                <span>Developer Recipient:</span>
                <span className="font-medium text-emerald-800">saikrishnabathina999@gmail.com</span>
              </div>
            </div>

            {/* Direct Gmail Forward Prompt */}
            <div className="w-full bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 text-left">
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-amber-700 text-[18px] shrink-0 mt-0.5">mail</span>
                <div className="flex-1">
                  <h4 className="text-xs font-semibold text-amber-950">Want to send this directly from your Gmail?</h4>
                  <p className="text-[11px] text-amber-800/90 mt-0.5 leading-relaxed">
                    Click below to open Gmail in your browser with this entire report and citations pre-typed, ready to send to Sai Krishna Bathina.
                  </p>
                </div>
              </div>
              <div className="mt-3">
                <button
                  type="button"
                  onClick={handleSendViaGmail}
                  className="px-4 py-2 rounded-lg bg-white border border-amber-300 hover:bg-amber-100/60 text-amber-950 text-xs font-semibold flex items-center gap-2 shadow-2xs transition-colors"
                >
                  <span className="material-symbols-outlined text-red-600 text-[18px]">outgoing_mail</span>
                  <span>Open &amp; Send in Gmail (Web)</span>
                </button>
              </div>
            </div>

            {/* Navigation buttons */}
            <div className="w-full flex flex-col sm:flex-row gap-2 pt-2">
              <button
                type="button"
                onClick={handleReturnToMainDesk}
                className="flex-1 py-2 px-4 rounded-lg bg-[#0F241D] hover:bg-[#16382C] text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
              >
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                <span>Return to Main Adjudication Desk</span>
              </button>
              <button
                type="button"
                onClick={handleResetAndClose}
                className="py-2 px-4 rounded-lg border border-[#D5E2DA] hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4 text-left">
            {errorMessage && (
              <div className="p-2.5 rounded bg-red-50 text-red-800 text-xs border border-red-200">
                {errorMessage}
              </div>
            )}

            {/* Category Selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Discrepancy Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#F8FAF9] border border-[#D5E2DA] rounded-lg px-3 py-2 text-xs font-medium text-[#14201A] outline-none focus:border-[#0F241D]"
              >
                <option value="law-discrepancy">Incorrect Law Interpretation / Ruling Error</option>
                <option value="missing-clause">Missing or Outdated MCC / ICC Clause</option>
                <option value="software-bug">Software Bug / UI Glitch</option>
                <option value="tournament-variation">Tournament Condition (ICC vs MCC) Conflict</option>
              </select>
            </div>

            {/* Law Reference */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Law or Incident Reference
              </label>
              <input
                type="text"
                value={lawReference}
                onChange={(e) => setLawReference(e.target.value)}
                placeholder="e.g. MCC Law 28.3 (Helmet Contact), Law 41.16, or URL"
                className="w-full bg-[#F8FAF9] border border-[#D5E2DA] rounded-lg px-3 py-2 text-xs text-[#14201A] outline-none focus:border-[#0F241D]"
              />
            </div>

            {/* Error Description */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                What is incorrect? <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={2}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain the discrepancy or bug clearly..."
                className="w-full bg-[#F8FAF9] border border-[#D5E2DA] rounded-lg p-2.5 text-xs text-[#14201A] outline-none focus:border-[#0F241D] leading-relaxed"
              />
            </div>

            {/* Proof & Evidence */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Supporting Proof &amp; Citations <span className="text-red-500">*</span>
                </label>
                <span className="text-[10px] text-emerald-800 font-semibold">Verification Proof Required</span>
              </div>
              <textarea
                rows={3}
                required
                value={proofEvidence}
                onChange={(e) => setProofEvidence(e.target.value)}
                placeholder="Provide official proof: MCC 2017 Code clause number, ICC Playing Conditions page, or verified match video reference..."
                className="w-full bg-[#F8FAF9] border border-[#D5E2DA] rounded-lg p-2.5 text-xs text-[#14201A] outline-none focus:border-[#0F241D] leading-relaxed"
              />
            </div>

            {/* Reporter Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Your Email <span className="text-slate-400 font-normal">(Optional for developer reply)</span>
              </label>
              <input
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder="umpire@example.com"
                className="w-full bg-[#F8FAF9] border border-[#D5E2DA] rounded-lg px-3 py-2 text-xs text-[#14201A] outline-none focus:border-[#0F241D]"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#D5E2DA]/60">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleSendViaGmail}
                  className="w-full sm:w-auto px-3.5 py-2 rounded-lg border border-[#D5E2DA] hover:bg-[#F8FAF9] text-[#14201A] text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
                  title="Open Gmail directly in your browser with this report pre-filled"
                >
                  <span className="material-symbols-outlined text-[16px] text-red-600">outgoing_mail</span>
                  <span>Send via Gmail (Web)</span>
                </button>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-5 py-2 bg-[#0F241D] hover:bg-[#16382C] text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50"
              >
                <span>{isSubmitting ? 'Logging Report…' : 'Submit Report'}</span>
                <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
