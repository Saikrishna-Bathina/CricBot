import React from 'react';
import { X, BookOpen, ExternalLink, ShieldCheck, FileText } from 'lucide-react';

export default function CitationModal({ citation, isOpen, onClose }) {
  if (!isOpen || !citation) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-slate-900 border border-emerald-800/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-800 flex items-center justify-center text-amber-300">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">Official Regulation Citation</h3>
              <p className="text-xs text-slate-400">Verifiable Ground Truth Evidence</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close citation details"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* Law / Clause Banner */}
          <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-bold">
                {citation.issuingOrganisation || 'Official'} Regulation
              </span>
              <h4 className="text-lg font-bold text-white">
                {citation.lawTitle || `Clause ${citation.clauseNumber || 'General'}`}
              </h4>
              {citation.clauseNumber && (
                <p className="text-xs text-amber-300 font-mono mt-0.5">
                  Specific Clause: {citation.clauseNumber}
                </p>
              )}
            </div>
            {citation.pageStart && (
              <div className="shrink-0 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-emerald-800/40 text-xs font-mono text-slate-300">
                Page {citation.pageStart}
              </div>
            )}
          </div>

          {/* Verbatim Excerpt */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300">
              <BookOpen className="w-4 h-4 text-emerald-400" />
              <span>Verbatim Rulebook Excerpt:</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs leading-relaxed text-slate-200 whitespace-pre-wrap selection:bg-emerald-700">
              {citation.verbatimExcerpt || citation.excerpt || 'Excerpt text unavailable.'}
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800">
              <span className="text-slate-500 block text-[10px] uppercase font-semibold">Source Rulebook</span>
              <span className="text-slate-200 font-medium">{citation.sourceTitle || citation.source?.title || 'MCC Laws of Cricket'}</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800">
              <span className="text-slate-500 block text-[10px] uppercase font-semibold">Edition / Version</span>
              <span className="text-slate-200 font-medium">{citation.version || citation.source?.version || 'Current Official Code'}</span>
            </div>
          </div>

          {/* External Source Link */}
          {citation.sourceUrl && (
            <div className="pt-2">
              <a
                href={citation.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold transition-colors border border-slate-700"
              >
                <span>View Full Official Document at Source</span>
                <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
              </a>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors shadow-lg shadow-emerald-950"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
