import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Sidebar({ isOpen, onClose, isDrawer = false }) {
  const location = useLocation();

  const codexLinks = [
    {
      title: 'Active Incident',
      badge: 'LIVE',
      badgeClass: 'bg-secondary-fixed text-on-secondary-fixed',
      path: '/chat',
      match: ['/chat', '/adjudication'],
    },
    {
      title: 'Multi-Event Log',
      badge: '§ 41/42',
      badgeClass: 'text-on-surface-variant',
      path: '/scenarios',
      match: ['/scenarios'],
    },
    {
      title: 'MCC 42 Laws Index',
      badge: 'v3.2',
      badgeClass: 'text-on-surface-variant',
      path: '/search',
      match: ['/search'],
    },
    {
      title: 'Precedent Casefiles',
      badge: 'Archive',
      badgeClass: 'text-on-surface-variant',
      path: '/search?domain=precedent',
      match: ['/search?domain=precedent'],
    },
    {
      title: 'Certification Ledger',
      badge: 'Module 4',
      badgeClass: 'text-on-surface-variant',
      path: '/quiz',
      match: ['/quiz'],
    },
    {
      title: 'ICC Standard PC',
      badge: '2024 Ed.',
      badgeClass: 'text-on-surface-variant',
      path: '/admin/documents',
      match: ['/admin/documents'],
    },
  ];

  return (
    <>
      {/* Backdrop for drawer mode or mobile */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-[#0F241D]/30 backdrop-blur-xs z-40 transition-opacity"
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed left-0 top-14 bottom-0 w-64 bg-surface-container-low border-r border-outline-variant/30 z-50 flex flex-col justify-between transition-transform duration-200 select-none shadow-md ${
          isOpen
            ? 'translate-x-0'
            : isDrawer
            ? '-translate-x-full'
            : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col py-space-md overflow-y-auto">
          <div className="px-space-md mb-space-sm flex items-center justify-between">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest font-semibold">
              Statute Codex
            </span>
            <button
              onClick={onClose}
              className="text-on-surface-variant hover:text-on-surface p-1 rounded"
              title="Close panel"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>

          <nav className="flex flex-col gap-0.5 px-space-xs">
            {codexLinks.map((item) => {
              const isActive = item.match.some((p) =>
                p.includes('?')
                  ? location.pathname + location.search === p
                  : location.pathname === p || (p !== '/' && location.pathname.startsWith(p))
              );

              return (
                <Link
                  key={item.title}
                  to={item.path}
                  onClick={() => onClose && onClose()}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex items-center justify-between px-space-md py-space-sm transition-colors text-left ${
                    isActive
                      ? 'bg-surface-container-high text-on-surface font-semibold border-l-2 border-secondary'
                      : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                  }`}
                >
                  <span className="font-body-md text-body-md">{item.title}</span>
                  <span className={`font-label-sm text-label-sm px-1.5 py-0.5 ${item.badgeClass}`}>
                    {item.badge}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Protocol Status Ledger */}
        <div className="p-space-md border-t border-outline-variant/20 bg-surface-container">
          <div className="flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm mb-1">
            <span>PROTOCOL STATUS</span>
            <span className="text-on-primary-container font-semibold">RATIFIED</span>
          </div>
          <div className="font-label-md text-label-md text-on-surface truncate">
            Session: 2 | Over: 34.2
          </div>
          <div className="font-label-sm text-label-sm text-on-surface-variant mt-0.5 truncate">
            Ref: MCC-2017-L38.2
          </div>
        </div>
      </aside>
    </>
  );
}
