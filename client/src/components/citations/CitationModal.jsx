import React from 'react';

export default function CitationModal({ citation, isOpen, onClose }) {
  if (!isOpen || !citation) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/60 backdrop-blur-xs select-none"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-2xl bg-surface-container-lowest border border-primary-container shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Sovereign Document Header */}
        <div className="bg-primary-container text-on-primary px-space-md py-3 flex items-center justify-between border-b border-outline-variant/30">
          <div className="flex items-center gap-space-sm">
            <span className="material-symbols-outlined text-[20px] text-tertiary-fixed">verified</span>
            <div>
              <h3 className="font-headline-sm text-headline-sm text-on-primary leading-tight">
                Authentic Statutory Citation Folio
              </h3>
              <div className="font-label-sm text-label-sm text-primary-fixed-dim uppercase tracking-wider">
                Verifiable MCC &amp; ICC Ground Truth Evidence
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-surface-container-highest/20 text-on-primary transition-colors"
            aria-label="Close citation details"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-space-lg overflow-y-auto flex flex-col gap-space-md select-text">
          {/* Law / Clause Metadata Banner */}
          <div className="bg-surface-container-low p-space-md border-l-4 border-tertiary-container flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
            <div className="flex flex-col gap-0.5">
              <span className="font-label-sm text-label-sm font-semibold uppercase text-secondary tracking-wider">
                {citation.issuingOrganisation || 'MCC'} Codified Statute
              </span>
              <h4 className="font-headline-md text-headline-md text-primary-container">
                {citation.lawTitle || `Clause ${citation.clauseNumber || 'General'}`}
              </h4>
              {citation.clauseNumber && (
                <div className="font-label-sm text-label-sm text-on-surface-variant font-mono mt-0.5">
                  Statute Reference: Law {citation.clauseNumber}
                </div>
              )}
            </div>
            {citation.pageStart && (
              <div className="shrink-0 px-2.5 py-1 bg-surface-container-lowest border border-outline-variant/30 font-label-sm text-label-sm text-on-surface">
                Folio p. {citation.pageStart}
              </div>
            )}
          </div>

          {/* Verbatim Statutory Excerpt */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">
                Verbatim Codex Excerpt
              </span>
              <span className="font-label-sm text-label-sm text-outline">AUTHENTIC RECENSION</span>
            </div>
            <blockquote className="p-space-md bg-surface-container-lowest border border-outline-variant/40 font-headline-sm text-body-md text-on-surface leading-relaxed shadow-inner whitespace-pre-wrap">
              {citation.verbatimExcerpt || citation.excerpt || citation.clauseText || 'Verbatim clause excerpt unavailable.'}
            </blockquote>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm text-on-surface">
            <div className="p-space-sm bg-surface-container-low border border-outline-variant/20 flex flex-col">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Codex Repository</span>
              <span className="font-label-md text-label-md font-semibold text-primary mt-0.5">
                {citation.sourceTitle || citation.source?.title || 'MCC Laws of Cricket'}
              </span>
            </div>
            <div className="p-space-sm bg-surface-container-low border border-outline-variant/20 flex flex-col">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Sanctioned Recension</span>
              <span className="font-label-md text-label-md font-semibold text-primary mt-0.5">
                {citation.version || citation.source?.version || '2017 Code (3rd Edition - 2022)'}
              </span>
            </div>
          </div>

          {/* External Source Link */}
          {citation.sourceUrl && (
            <div className="pt-1">
              <a
                href={citation.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-space-md py-2 bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors font-label-md text-label-md uppercase tracking-wider"
              >
                <span>Access Primary Document Folio</span>
                <span className="material-symbols-outlined text-[15px]">open_in_new</span>
              </a>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-space-lg py-space-sm border-t border-outline-variant/20 bg-surface-container flex items-center justify-between">
          <div className="flex items-center gap-1 text-on-surface-variant font-label-sm text-label-sm">
            <span className="material-symbols-outlined text-[15px] text-tertiary-container">balance</span>
            <span>Accredited ICC / MCC Ground Truth</span>
          </div>
          <button
            onClick={onClose}
            className="px-space-md py-1.5 bg-primary-container text-on-primary hover:bg-on-primary-fixed-variant transition-colors font-label-sm text-label-sm font-semibold uppercase tracking-wider"
          >
            Dismiss Folio
          </button>
        </div>
      </div>
    </div>
  );
}
