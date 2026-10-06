import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar({ onToggleSidebar, onOpenReportModal }) {
  const location = useLocation();

  const navLinks = [
    { name: 'Adjudication', path: '/chat', match: ['/chat', '/adjudication'] },
    { name: 'Scenario Analyser', path: '/scenarios', match: ['/scenarios'] },
    { name: 'Law Search', path: '/search', match: ['/search'] },
    { name: 'Umpire Assessment', path: '/quiz', match: ['/quiz'] },
    { name: 'Official Knowledge Base', path: '/admin/documents', match: ['/admin/documents', '/codex'] },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0F241D] text-white border-b border-white/10 shadow-sm select-none">
      <div className="h-14 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        
        {/* Left: Brand Identity & Nav links */}
        <div className="flex items-center gap-6 shrink-0">
          {/* Codex drawer toggle */}
          <button
            onClick={onToggleSidebar}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded transition-colors"
            aria-label="Toggle Navigation Sidebar"
            title="Toggle Statute Codex"
          >
            <span className="material-symbols-outlined text-[20px]">menu</span>
          </button>

          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 rounded bg-white/10 border border-white/15 flex items-center justify-center text-emerald-200 group-hover:bg-white/20 transition-colors">
              <span className="material-symbols-outlined text-[17px]">gavel</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-lg font-medium tracking-tight text-white leading-none">
                CricLaws
              </span>
              <span className="text-[11px] font-sans text-emerald-300/80 tracking-wide uppercase font-medium hidden sm:inline leading-none">
                Official Desk
              </span>
            </div>
          </Link>

          <div className="h-4 w-px bg-white/15 hidden lg:block"></div>

          {/* Desktop Nav: Exact 5 destinations */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((item) => {
              const isActive = item.match.some((p) => location.pathname.startsWith(p));
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  aria-current={isActive ? 'page' : undefined}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-white/15 text-white'
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right: Jurisdiction & Report Law/Bug Action (Account section removed as requested) */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Concise Jurisdiction Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-black/20 border border-white/10 text-xs text-white/80">
            <span className="material-symbols-outlined text-emerald-300 text-[15px]">balance</span>
            <span className="font-medium text-emerald-100">MCC 2017 &amp; ICC T20I</span>
          </div>

          {/* Report Law Discrepancy / Bug Button */}
          <button
            type="button"
            onClick={() => onOpenReportModal && onOpenReportModal()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors border border-white/15 shadow-2xs"
            title="Report an inaccurate law or bug with proof"
          >
            <span className="material-symbols-outlined text-amber-300 text-[15px]">flag</span>
            <span className="hidden sm:inline">Report Law / Bug</span>
            <span className="sm:hidden">Report</span>
          </button>
        </div>

      </div>
    </header>
  );
}
