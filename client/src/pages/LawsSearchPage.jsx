import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  BookOpen, 
  ExternalLink, 
  ChevronLeft, 
  ChevronRight, 
  ShieldCheck, 
  Layers, 
  X,
  FileText
} from 'lucide-react';
import api from '../services/api';
import CitationModal from '../components/citations/CitationModal';

export default function LawsSearchPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLaw, setSelectedLaw] = useState('');
  const [selectedOrg, setSelectedOrg] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('');
  const [page, setPage] = useState(1);
  const [results, setResults] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(false);
  const [activeModalItem, setActiveModalItem] = useState(null);

  const fetchResults = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/laws/search', {
        params: {
          q: searchTerm.trim() || undefined,
          lawNumber: selectedLaw || undefined,
          issuingOrganisation: selectedOrg || undefined,
          format: selectedFormat || undefined,
          page,
          limit: 10,
        },
      });

      setResults(res.data.data.items);
      setPagination(res.data.data.pagination);
    } catch (err) {
      console.error('Failed to search laws:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [page, selectedLaw, selectedOrg, selectedFormat]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchResults();
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedLaw('');
    setSelectedOrg('');
    setSelectedFormat('');
    setPage(1);
  };

  return (
    <div className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-sky-950/80 border border-sky-800/80 flex items-center justify-center text-sky-400 shadow-lg">
            <Search className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
              <span>Cricket Law & Clause Archive</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-sky-950 text-sky-300 border border-sky-800 font-mono">
                Official Repository
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Explore verbatim MCC 42 Laws and ICC Playing Conditions with clause-level precision
            </p>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="p-4 sm:p-6 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4 shadow-xl">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by keywords, law name, or clause (e.g., 'Law 28', 'protective helmet', 'free hit', 'timed out')..."
              className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-sm transition-colors shadow-lg shadow-sky-950 shrink-0"
          >
            Search
          </button>
        </form>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/60 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            {/* Law Number Selector */}
            <div className="flex items-center space-x-1.5">
              <span className="text-slate-400">Law Number:</span>
              <select
                value={selectedLaw}
                onChange={(e) => {
                  setSelectedLaw(e.target.value);
                  setPage(1);
                }}
                className="rounded-lg bg-slate-900 border border-slate-700 px-2 py-1 text-slate-200 focus:outline-none"
              >
                <option value="">All 42 Laws</option>
                {Array.from({ length: 42 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>Law {n}</option>
                ))}
              </select>
            </div>

            {/* Issuing Organisation */}
            <div className="flex items-center space-x-1.5">
              <span className="text-slate-400">Authority:</span>
              <select
                value={selectedOrg}
                onChange={(e) => {
                  setSelectedOrg(e.target.value);
                  setPage(1);
                }}
                className="rounded-lg bg-slate-900 border border-slate-700 px-2 py-1 text-slate-200 focus:outline-none"
              >
                <option value="">All Authorities</option>
                <option value="MCC">MCC (Universal Laws)</option>
                <option value="ICC">ICC (Playing Conditions)</option>
              </select>
            </div>

            {/* Match Format */}
            <div className="flex items-center space-x-1.5">
              <span className="text-slate-400">Format:</span>
              <select
                value={selectedFormat}
                onChange={(e) => {
                  setSelectedFormat(e.target.value);
                  setPage(1);
                }}
                className="rounded-lg bg-slate-900 border border-slate-700 px-2 py-1 text-slate-200 focus:outline-none"
              >
                <option value="">All Formats</option>
                <option value="ALL">Universal / Tests</option>
                <option value="T20I">T20 Internationals</option>
                <option value="ODI">One Day Internationals</option>
              </select>
            </div>
          </div>

          {(searchTerm || selectedLaw || selectedOrg || selectedFormat) && (
            <button
              onClick={handleResetFilters}
              className="flex items-center space-x-1 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Results Feed */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span>Found <strong className="text-white">{pagination.total}</strong> official clauses</span>
          <span>Page {pagination.page} of {pagination.totalPages || 1}</span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-sky-500/20 border-t-sky-400 animate-spin mx-auto"></div>
            <p className="text-xs font-mono">Searching official rulebook database...</p>
          </div>
        ) : results.length === 0 ? (
          <div className="p-12 rounded-2xl bg-slate-950/40 border border-slate-800 text-center space-y-3">
            <BookOpen className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-slate-300">No Clauses Match Your Filter</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try adjusting your search terms or clearing specific authority filters.
            </p>
          </div>
        ) : (
          results.map((item) => (
            <div
              key={item._id}
              onClick={() => setActiveModalItem(item)}
              className="p-5 rounded-2xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-sky-700/80 cursor-pointer transition-all shadow-md group space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-2.5">
                  <span className="px-2 py-0.5 rounded bg-sky-950 border border-sky-800 text-sky-300 text-xs font-mono font-bold">
                    {item.issuingOrganisation}
                  </span>
                  <h3 className="text-base font-bold text-white group-hover:text-sky-300 transition-colors">
                    {item.lawTitle || `Clause ${item.clauseNumber}`}
                  </h3>
                  {item.clauseNumber && (
                    <span className="text-xs font-mono text-amber-300 font-semibold">
                      Clause {item.clauseNumber}
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-2 text-xs text-slate-400 font-mono">
                  {item.pageStart && <span>Page {item.pageStart}</span>}
                  <span>•</span>
                  <span>{item.document?.version || 'Current'}</span>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-mono line-clamp-3 bg-slate-950/80 p-3 rounded-xl border border-slate-800/60">
                {item.excerpt}
              </p>

              <div className="flex items-center justify-between pt-1 text-xs">
                <span className="text-slate-400 font-medium">{item.document?.title}</span>
                <span className="text-sky-400 font-semibold group-hover:translate-x-1 transition-transform inline-flex items-center space-x-1">
                  <span>Inspect Full Clause</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2 pt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={!pagination.hasPrev || isLoading}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-xs text-slate-400 px-3 font-mono">
            {pagination.page} / {pagination.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            disabled={!pagination.hasNext || isLoading}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Citation / Clause Detail Modal */}
      <CitationModal
        isOpen={Boolean(activeModalItem)}
        citation={activeModalItem ? {
          lawTitle: activeModalItem.lawTitle,
          clauseNumber: activeModalItem.clauseNumber,
          issuingOrganisation: activeModalItem.issuingOrganisation,
          verbatimExcerpt: activeModalItem.excerpt,
          pageStart: activeModalItem.pageStart,
          sourceTitle: activeModalItem.document?.title,
          version: activeModalItem.document?.version,
          sourceUrl: activeModalItem.document?.sourceUrl,
        } : null}
        onClose={() => setActiveModalItem(null)}
      />
    </div>
  );
}
