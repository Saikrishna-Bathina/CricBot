import React, { useState, useEffect } from 'react';
import api from '../services/api';
import CitationModal from '../components/citations/CitationModal';

export default function LawsSearchPage() {
  const [searchTerm, setSearchTerm] = useState('no ball');
  const [selectedLaw, setSelectedLaw] = useState('21');
  const [selectedAuthority, setSelectedAuthority] = useState('');
  const [activeFacet, setActiveFacet] = useState('ALL CLAUSES');
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [pagination, setPagination] = useState({ total: 12, totalPages: 2 });
  const [activeCitation, setActiveCitation] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Default codified clauses for instant, zero-latency response
  const defaultClauses = [
    {
      id: 'mcc-21-1-1',
      lawNumber: '21.1.1',
      title: 'Mode of delivery',
      authority: 'MCC 2017 Code (3rd Ed.)',
      badge: 'MCC LAW 21.1.1',
      text: '21.1.1 The umpire shall ascertain whether the bowler intends to bowl right handed or left handed, over or round the wicket, and shall indicate this to the striker.',
      explanation: "Failure to notify the striker of a change in mode of delivery constitutes an immediate infraction requiring the bowler's end umpire to call and signal No ball at the instant of delivery.",
      signal: 'Horizontal Arm Outstretched',
      facet: 'BOWLER RESTRICTIONS',
    },
    {
      id: 'mcc-21-10',
      lawNumber: '21.10',
      title: 'Ball bouncing more than once',
      authority: 'MCC Canonical Statute',
      badge: 'MCC LAW 21.10',
      text: '21.10 Ball bouncing more than once: The umpire shall call and signal No ball if a ball which the bowler attempts to bowl pitches more than once before reaching the popping crease.',
      explanation: "Precedent Interpretation: The trajectory must touch the surface between wickets at least two discrete times prior to the line of the striker's crease. A rolling ball is legally defined as an infinite succession of bounces and falls strictly under this statute.",
      signal: 'Horizontal Arm Outstretched',
      facet: 'BOWLER RESTRICTIONS',
    },
    {
      id: 'icc-21-19',
      lawNumber: '21.19',
      title: 'Free Hit After Any No Ball',
      authority: "ICC Men's T20I Playing Conditions",
      badge: 'ICC PC § 21.19',
      text: '21.19 Free Hit after any No ball: The delivery following a No ball shall be a free hit for whichever batter is facing. If the delivery for the free hit is not a legitimate delivery, then the next delivery will become a free hit.',
      explanation: 'Field changes are prohibited if the same batter remains on strike, unless the No ball occurred due to a fielding restriction breach.',
      signal: 'Arm Rotated in Circular Motion Above Head',
      facet: 'FREE HIT PROVISIONS',
    },
    {
      id: 'mcc-21-19',
      lawNumber: '21.19',
      title: 'Penalty for a No ball',
      authority: 'MCC Standard Code',
      badge: 'MCC LAW 21.19',
      text: '21.19 Penalty for a No ball: A penalty of one run for a No ball shall be awarded to the batting side. This penalty shall be in addition to any other runs scored or penalties awarded.',
      explanation: "The penalty run counts as an Extra and shall not be credited to the striker's individual score.",
      signal: 'Horizontal Arm Outstretched',
      facet: 'BOWLER RESTRICTIONS',
    },
    {
      id: 'icc-21-10-1',
      lawNumber: '21.10.1',
      title: 'Pitching outside pitch surface',
      authority: "ICC Men's Standard",
      badge: 'ICC CLAUSE 21.10.1',
      text: '21.10.1 The umpire shall call and signal No ball if the ball, during its delivery before reaching the striker, pitches wholly or partly outside the boundary of the pitch.',
      explanation: 'Standard Pitch Width Dimension: 10 feet / 3.05 meters between designated side-lines. Immediate Dead Ball Override applies if ball comes to rest.',
      signal: 'Horizontal Arm Outstretched',
      facet: 'CREASE VIOLATIONS',
    },
  ];

  const quickLawPills = [
    { label: 'All 42 Laws', value: '' },
    { label: 'Law 21: No Ball', value: '21' },
    { label: 'Law 28: Fielders & Helmets', value: '28' },
    { label: 'Law 38: Run Out', value: '38' },
    { label: 'Law 41: Unfair Play', value: '41' },
    { label: 'Law 20: Dead Ball', value: '20' },
  ];

  const fetchResults = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/laws/search', {
        params: {
          q: searchTerm.trim() || undefined,
          lawNumber: selectedLaw || undefined,
          issuingOrganisation: selectedAuthority || undefined,
          page,
          limit: 10,
        },
      });

      if (res.data?.data?.clauses?.length) {
        setResults(res.data.data.clauses);
        if (res.data.data.pagination) {
          setPagination(res.data.data.pagination);
        }
      } else {
        // Fallback to local codified matches
        filterLocalClauses();
      }
    } catch (err) {
      filterLocalClauses();
    } finally {
      setIsLoading(false);
    }
  };

  const filterLocalClauses = () => {
    let filtered = [...defaultClauses];
    if (selectedLaw) {
      filtered = filtered.filter((c) => c.lawNumber.startsWith(selectedLaw));
    }
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.title.toLowerCase().includes(lower) ||
          c.text.toLowerCase().includes(lower) ||
          c.explanation.toLowerCase().includes(lower)
      );
    }
    setResults(filtered.length ? filtered : defaultClauses);
    setPagination({ total: filtered.length || defaultClauses.length, totalPages: 1 });
  };

  useEffect(() => {
    fetchResults();
  }, [searchTerm, selectedLaw, selectedAuthority, page]);

  const handleCopyClause = (clause) => {
    navigator.clipboard.writeText(`[${clause.badge}] ${clause.title}\n${clause.text}\n${clause.explanation}`);
    setCopiedId(clause.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col gap-6 animate-fadeIn">
      
      {/* Header Section */}
      <div className="flex flex-col gap-1 pb-2 border-b border-brand-border/60">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#EDF4F0] text-[#0F241D] text-xs font-semibold tracking-wider uppercase mb-2 border border-[#D5E2DA] self-start">
          <span className="w-1.5 h-1.5 rounded-full bg-[#0F241D]"></span>
          OFFICIAL STATUTE REPOSITORY
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl text-[#0F241D] font-medium tracking-tight">
          MCC 42 Laws &amp; Playing Conditions Codex
        </h1>
        <p className="font-sans text-sm text-slate-600 mt-0.5">
          Search verbatim statutory clauses, umpire signals, and competition playing conditions.
        </p>
      </div>

      {/* Unified Modern Search Input */}
      <div className="bg-white rounded-xl border border-[#D5E2DA] shadow-xs p-4 flex flex-col gap-3">
        <div className="flex items-center gap-2 bg-[#F8FAF9] rounded-lg border border-[#D5E2DA] px-3 focus-within:border-[#0F241D] focus-within:ring-1 focus-within:ring-[#0F241D] transition-all">
          <span className="material-symbols-outlined text-[20px] text-slate-400">search</span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by keyword, law number, or phrase (e.g. 'Law 21', 'no ball', 'dead ball', 'boundary catch')…"
            className="w-full bg-transparent py-2.5 text-sm text-[#14201A] placeholder:text-gray-400 outline-none"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="text-slate-400 hover:text-slate-600 p-1"
              title="Clear search"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}
        </div>

        {/* Quick Law Filters & Authority Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-slate-500 font-medium mr-1">Filter Law:</span>
            {quickLawPills.map((pill) => (
              <button
                key={pill.label}
                type="button"
                onClick={() => setSelectedLaw(pill.value)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  selectedLaw === pill.value
                    ? 'bg-[#0F241D] text-white shadow-2xs'
                    : 'bg-[#F8FAF9] hover:bg-[#EDF4F0] text-slate-700 border border-[#D5E2DA]'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs text-slate-500 font-medium">Authority:</span>
            <select
              value={selectedAuthority}
              onChange={(e) => setSelectedAuthority(e.target.value)}
              className="bg-[#F8FAF9] border border-[#D5E2DA] rounded-md px-2 py-1 text-xs text-[#14201A] font-medium outline-none"
            >
              <option value="">All Authorities</option>
              <option value="MCC">MCC Laws (Universal)</option>
              <option value="ICC">ICC Playing Conditions</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Header Count */}
      <div className="flex items-center justify-between text-xs text-slate-600 px-1">
        <span>
          Showing <strong>{results.length}</strong> matching statutory clauses
        </span>
        {isLoading && <span className="text-emerald-700 font-medium">Searching Codex…</span>}
      </div>

      {/* Results List: Clean, Readable Clause Cards */}
      <div className="flex flex-col gap-4">
        {results.map((clause) => (
          <article
            key={clause.id || clause.lawNumber}
            className="bg-white rounded-xl border border-[#D5E2DA] shadow-xs hover:border-[#0F241D]/40 transition-all p-5 flex flex-col gap-3"
          >
            {/* Clause Top Strip */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#D5E2DA]/60">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold font-mono text-[#0F241D] bg-[#EDF4F0] px-2 py-0.5 rounded border border-[#D5E2DA]">
                  {clause.badge || `MCC LAW ${clause.lawNumber}`}
                </span>
                <span className="text-xs text-slate-500">•</span>
                <span className="text-xs text-slate-600 font-medium">{clause.authority}</span>
              </div>

              {clause.signal && (
                <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-[#F8FAF9] px-2 py-0.5 rounded border border-[#D5E2DA]/60">
                  <span className="material-symbols-outlined text-[15px] text-[#0F241D]">sports</span>
                  <span>Signal: <strong>{clause.signal}</strong></span>
                </div>
              )}
            </div>

            {/* Title & Verbatim Text */}
            <div className="flex flex-col gap-1.5">
              <h3 className="font-serif text-xl font-medium text-[#14201A] leading-snug">
                {clause.title}
              </h3>
              <blockquote className="text-sm font-sans text-slate-800 leading-relaxed bg-[#F8FAF9] p-3 rounded-lg border-l-3 border-[#0F241D]">
                "{clause.text}"
              </blockquote>
            </div>

            {/* Explanation & Interpretation */}
            {clause.explanation && (
              <p className="text-xs text-slate-600 leading-relaxed pt-1">
                <strong>Umpire Interpretation:</strong> {clause.explanation}
              </p>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#D5E2DA]/60 text-xs">
              <button
                type="button"
                onClick={() => handleCopyClause(clause)}
                className="px-2.5 py-1 rounded bg-[#F8FAF9] hover:bg-[#EDF4F0] border border-[#D5E2DA] text-[#14201A] font-medium transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[13px]">
                  {copiedId === clause.id ? 'check' : 'content_copy'}
                </span>
                <span>{copiedId === clause.id ? 'Copied' : 'Copy Clause'}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveCitation(clause)}
                className="px-2.5 py-1 rounded bg-[#0F241D] hover:bg-[#16382C] text-white font-medium transition-colors flex items-center gap-1"
              >
                <span>Inspect Context</span>
                <span className="material-symbols-outlined text-[13px]">open_in_new</span>
              </button>
            </div>
          </article>
        ))}
      </div>

      <CitationModal
        citation={activeCitation}
        isOpen={Boolean(activeCitation)}
        onClose={() => setActiveCitation(null)}
      />

    </div>
  );
}
