import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function HomePage() {
  const navigate = useNavigate();
  const [quickQuestion, setQuickQuestion] = useState('');

  const sampleQuestions = [
    'Can a batter be caught off a helmet?',
    'When is the non-striker run out?',
    'What happens when a delivery is declared a no-ball?',
  ];

  const handleQuickSubmit = (e) => {
    if (e) e.preventDefault();
    if (!quickQuestion.trim()) return;
    navigate(`/chat?q=${encodeURIComponent(quickQuestion.trim())}`);
  };

  const workspaces = [
    {
      title: 'Adjudication',
      subtitle: 'Incident Dispute Resolution',
      desc: 'Instant statutory determinations with verbatim MCC clauses, scoring penalties, and mandatory umpire protocols.',
      icon: 'gavel',
      path: '/chat',
    },
    {
      title: 'Scenario Analyser',
      subtitle: 'Multi-Phase Match Incidents',
      desc: 'Deconstruct compound delivery sequences, pitch multi-bounces, and player conduct edge cases.',
      icon: 'timeline',
      path: '/scenarios',
    },
    {
      title: 'Law Search',
      subtitle: 'MCC 42 Laws & Playing Conditions',
      desc: 'Fast full-text clause search across the MCC 2017 Code 3rd Edition and ICC Standard Playing Conditions.',
      icon: 'search',
      path: '/search',
    },
    {
      title: 'Umpire Assessment',
      subtitle: 'Accreditation & Practice',
      desc: 'Timed and practice scenario tests with instant rationale scorecards for umpires, scorers, and coaches.',
      icon: 'school',
      path: '/quiz',
    },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex flex-col gap-10 animate-fadeIn">
      
      {/* Hero Section: Centered & Focused on Primary Action */}
      <section className="flex flex-col items-center text-center max-w-2xl mx-auto pt-4 pb-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EDF4F0] text-[#0F241D] text-xs font-semibold tracking-wider uppercase mb-5 border border-[#D5E2DA]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#0F241D]"></span>
          CRICKET LAWS ASSISTANT
        </div>

        <h1 className="font-serif text-4xl sm:text-5xl text-[#0F241D] font-medium tracking-tight leading-[1.15] mb-3">
          Understand the Laws.<br className="hidden sm:inline" /> Resolve the Scenario.
        </h1>

        <p className="font-sans text-base text-slate-600 max-w-lg mb-8 leading-relaxed">
          Ask about a cricket incident and explore the relevant laws and playing conditions.
        </p>

        {/* Primary Input Container */}
        <form
          onSubmit={handleQuickSubmit}
          className="w-full bg-white rounded-xl shadow-[0_2px_12px_rgba(15,36,29,0.06)] border border-[#D5E2DA] focus-within:border-[#0F241D] focus-within:ring-2 focus-within:ring-[#0F241D]/10 transition-all p-2 text-left mb-6"
        >
          <div className="flex items-center gap-2">
            <div className="pl-2 text-slate-400 flex items-center">
              <span className="material-symbols-outlined text-[20px]">search</span>
            </div>
            <input
              type="text"
              value={quickQuestion}
              onChange={(e) => setQuickQuestion(e.target.value)}
              placeholder="Describe the incident or enter a law number…"
              className="w-full bg-transparent py-2.5 px-1 text-[#14201A] text-base placeholder:text-gray-400 focus:outline-none"
            />
            <button
              type="submit"
              className="shrink-0 px-4 py-2.5 bg-[#0F241D] hover:bg-[#16382C] text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <span>Analyse scenario</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
        </form>

        {/* 3 Understated Example Prompts */}
        <div className="w-full max-w-xl flex flex-col items-center">
          <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2.5">
            Or try an example
          </span>
          <div className="w-full flex flex-col gap-1.5 text-left">
            {sampleQuestions.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => navigate(`/chat?q=${encodeURIComponent(q)}`)}
                className="w-full group px-4 py-3 rounded-lg bg-white/70 hover:bg-white border border-[#D5E2DA]/80 hover:border-[#D5E2DA] transition-all flex items-center justify-between text-sm text-[#14201A] shadow-xs"
              >
                <span className="group-hover:text-[#0F241D] font-medium">{q}</span>
                <span className="material-symbols-outlined text-[16px] text-slate-400 group-hover:text-[#0F241D] group-hover:translate-x-0.5 transition-all">
                  chevron_right
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 4 Core Workspaces */}
      <section className="flex flex-col gap-4 pt-4 border-t border-[#D5E2DA]/60">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs uppercase font-semibold tracking-wider text-slate-500">
            Officiating Tools &amp; Resources
          </h2>
          <span className="text-xs text-slate-400">MCC 2017 Code &amp; ICC Playing Conditions</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {workspaces.map((ws) => (
            <Link
              key={ws.title}
              to={ws.path}
              className="bg-white p-5 rounded-xl border border-[#D5E2DA] shadow-xs hover:border-[#0F241D] hover:shadow-sm transition-all flex flex-col justify-between group"
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#EDF4F0] text-[#0F241D] group-hover:bg-[#0F241D] group-hover:text-white transition-colors flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">{ws.icon}</span>
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-semibold text-[#14201A] group-hover:text-[#0F241D] transition-colors">
                      {ws.title}
                    </h3>
                    <span className="text-xs text-slate-500 block">{ws.subtitle}</span>
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed mt-1">
                  {ws.desc}
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#D5E2DA]/40 text-xs font-semibold text-[#0F241D]">
                <span>Open tool</span>
                <span className="material-symbols-outlined text-[15px] group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Clean Footer */}
      <footer className="pt-4 pb-6 text-slate-500 text-xs flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-[#D5E2DA]/60">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
          <span>CricLaws Official Desk • Marylebone Cricket Club &amp; ICC Statutory Reference</span>
        </div>
        <div className="flex items-center gap-3">
          <span>MCC 2017 Code 3rd Edition (2022)</span>
          <span>•</span>
          <span>ICC Standard Playing Conditions</span>
        </div>
      </footer>

    </div>
  );
}
