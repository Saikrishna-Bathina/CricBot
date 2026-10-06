import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer({ onOpenReportModal }) {
  return (
    <footer className="border-t border-[#D5E2DA] bg-[#0F241D] text-white mt-auto select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand & Purpose */}
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-white/10 flex items-center justify-center text-emerald-300">
                <span className="material-symbols-outlined text-[18px]">gavel</span>
              </div>
              <span className="font-serif text-lg font-medium tracking-tight text-white">
                CricLaws Official Desk
              </span>
            </div>
            <p className="text-xs text-white/70 max-w-md leading-relaxed">
              Authoritative cricket rules reference, multi-event scenario analysis, and statutory adjudication assistant grounded in official MCC Laws of Cricket (2017 Code 3rd Ed. - 2022) and ICC Standard Playing Conditions.
            </p>
            <div className="text-[11px] text-white/50 leading-relaxed pt-1">
              Engineered with precision for Umpires, Match Referees, Scorers, and Cricket Enthusiasts globally.
            </div>
          </div>

          {/* Quick Workspaces */}
          <div>
            <h4 className="text-xs font-semibold text-emerald-300 uppercase tracking-wider mb-3">
              Officiating Tools
            </h4>
            <ul className="space-y-2 text-xs text-white/75">
              <li>
                <Link to="/chat" className="hover:text-white transition-colors">
                  Adjudication Desk
                </Link>
              </li>
              <li>
                <Link to="/scenarios" className="hover:text-white transition-colors">
                  Scenario Analyser
                </Link>
              </li>
              <li>
                <Link to="/search" className="hover:text-white transition-colors">
                  MCC 42 Laws Search
                </Link>
              </li>
              <li>
                <Link to="/quiz" className="hover:text-white transition-colors">
                  Umpire Assessment
                </Link>
              </li>
              <li>
                <Link to="/admin/documents" className="hover:text-white transition-colors">
                  Official Knowledge Base
                </Link>
              </li>
            </ul>
          </div>

          {/* Integrity & Feedback */}
          <div>
            <h4 className="text-xs font-semibold text-emerald-300 uppercase tracking-wider mb-3">
              Integrity &amp; Feedback
            </h4>
            <ul className="space-y-2 text-xs text-white/75">
              <li>
                <button
                  type="button"
                  onClick={() => onOpenReportModal && onOpenReportModal()}
                  className="text-left text-emerald-200 hover:text-white font-medium flex items-center gap-1.5 transition-colors"
                >
                  <span className="material-symbols-outlined text-[15px] text-amber-400">report</span>
                  <span>Report Law Discrepancy / Bug</span>
                </button>
              </li>
              <li>
                <a
                  href="https://www.lords.org/mcc/the-laws-of-cricket"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white flex items-center gap-1 transition-colors"
                >
                  <span>MCC Official Rulebook</span>
                  <span className="material-symbols-outlined text-[13px] text-white/50">open_in_new</span>
                </a>
              </li>
              <li>
                <a
                  href="https://www.icc-cricket.com/about/cricket/rules-and-regulations/playing-conditions"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white flex items-center gap-1 transition-colors"
                >
                  <span>ICC Playing Conditions</span>
                  <span className="material-symbols-outlined text-[13px] text-white/50">open_in_new</span>
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Adequate Developer & Copyright Credits */}
        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-white/60">
          <div className="flex items-center gap-2">
            <span>© {new Date().getFullYear()} CricLaws Official Desk.</span>
            <span>•</span>
            <span className="text-white/80">Developed by <strong className="text-emerald-300 font-semibold">Sai Krishna Bathina</strong></span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-white/50">
            <span>Grounded in MCC 2017 Code 3rd Edition (2022)</span>
            <span>•</span>
            <span>ICC Playing Conditions 2024</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
