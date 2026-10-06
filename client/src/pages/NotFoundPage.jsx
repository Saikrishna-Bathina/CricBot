import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="text-center max-w-md bg-surface-container-lowest p-space-xl border border-outline-variant/30 shadow-md flex flex-col items-center gap-space-sm">
        <div className="w-12 h-12 bg-secondary text-on-secondary flex items-center justify-center">
          <span className="material-symbols-outlined text-[24px]">gavel</span>
        </div>
        <div className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-semibold">
          STATUTORY ERROR 404
        </div>
        <h1 className="font-headline-md text-headline-md text-primary">
          Regulation Folio Not Found
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          The requested rulebook clause or administrative dossier does not exist in the active codex.
        </p>
        <div className="pt-space-xs">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 px-space-md py-2 bg-primary-container text-on-primary font-label-md text-label-md uppercase tracking-wider hover:bg-on-primary-fixed-variant transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            <span>Return to Official Desk</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
