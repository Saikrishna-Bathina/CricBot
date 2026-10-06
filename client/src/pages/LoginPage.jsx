import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function LoginPage() {
  const navigate = useNavigate();
  const [jurisdiction, setJurisdiction] = useState('mcc-universal');
  const [userName, setUserName] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSavePreferences = (e) => {
    e.preventDefault();
    const prefs = {
      name: userName.trim() || 'Match Official',
      jurisdiction,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem('cricket_user', JSON.stringify(prefs));
    setSaved(true);
    setTimeout(() => {
      navigate('/chat');
    }, 800);
  };

  return (
    <div className="w-full max-w-lg mx-auto px-4 py-12 sm:py-16 flex flex-col items-center animate-fadeIn">
      
      {/* Small Badge */}
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EDF4F0] text-[#0F241D] text-xs font-semibold tracking-wider uppercase mb-5 border border-[#D5E2DA]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#0F241D]"></span>
        OFFICIATING PREFERENCES
      </div>

      <div className="w-full bg-white rounded-2xl border border-[#D5E2DA] shadow-xs p-6 sm:p-8 flex flex-col gap-6 text-left">
        <div className="flex flex-col gap-1 border-b border-[#D5E2DA]/60 pb-4">
          <h1 className="font-serif text-2xl sm:text-3xl text-[#0F241D] font-medium tracking-tight">
            Officiating Desk Settings
          </h1>
          <p className="text-xs text-slate-600">
            Configure your default tournament jurisdiction and display preferences. No mandatory login required.
          </p>
        </div>

        {saved ? (
          <div className="p-6 rounded-xl bg-emerald-50 border border-emerald-200 text-center flex flex-col items-center gap-2">
            <span className="material-symbols-outlined text-emerald-800 text-[28px]">check_circle</span>
            <span className="text-xs font-semibold text-emerald-950">Preferences Saved</span>
            <span className="text-xs text-emerald-800">Redirecting to Adjudication Desk…</span>
          </div>
        ) : (
          <form onSubmit={handleSavePreferences} className="flex flex-col gap-4">
            {/* Preferred Jurisdiction */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Default Statutory Jurisdiction
              </label>
              <select
                value={jurisdiction}
                onChange={(e) => setJurisdiction(e.target.value)}
                className="w-full bg-[#F8FAF9] border border-[#D5E2DA] rounded-lg px-3 py-2 text-xs font-medium text-[#14201A] outline-none focus:border-[#0F241D]"
              >
                <option value="mcc-universal">MCC 2017 Code 3rd Edition (Universal Laws)</option>
                <option value="icc-t20i">ICC Men's T20I Playing Conditions (2024 Edition)</option>
                <option value="icc-wtc">ICC World Test Championship Playing Conditions</option>
              </select>
              <span className="text-[11px] text-slate-500">
                Controls tournament rule divergences such as Free Hit dispensations and stop-clock penalties.
              </span>
            </div>

            {/* Optional Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Official Identifier / Name <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="e.g. Umpire Sarah Jenkins"
                className="w-full bg-[#F8FAF9] border border-[#D5E2DA] rounded-lg px-3 py-2 text-xs text-[#14201A] outline-none focus:border-[#0F241D]"
              />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#D5E2DA]/60">
              <Link
                to="/chat"
                className="text-xs text-slate-500 hover:text-[#0F241D] font-medium"
              >
                Skip &amp; Go to Desk
              </Link>

              <button
                type="submit"
                className="px-5 py-2.5 bg-[#0F241D] hover:bg-[#16382C] text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <span>Save Preferences</span>
                <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
              </button>
            </div>
          </form>
        )}
      </div>

    </div>
  );
}
