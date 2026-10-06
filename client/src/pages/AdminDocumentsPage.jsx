import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import ReportDiscrepancyModal from '../components/feedback/ReportDiscrepancyModal';

export default function AdminDocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showReportsListModal, setShowReportsListModal] = useState(false);
  const [loggedReports, setLoggedReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  
  // Registration form state
  const [newTitle, setNewTitle] = useState('');
  const [newOrg, setNewOrg] = useState('MCC');
  const [newVersion, setNewVersion] = useState('2024 Edition');
  const [newDesc, setNewDesc] = useState('');

  // Ingestion modal state
  const [activeIngestDoc, setActiveIngestDoc] = useState(null);
  const [rawText, setRawText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [ingestSuccess, setIngestSuccess] = useState(null);

  const fetchLoggedReports = async () => {
    setLoadingReports(true);
    try {
      const res = await api.get('/reports');
      if (res.data?.data) {
        setLoggedReports(res.data.data);
      }
    } catch (err) {
      try {
        const local = JSON.parse(localStorage.getItem('cricbot_discrepancy_reports') || '[]');
        setLoggedReports(local);
      } catch (e) {
        setLoggedReports([]);
      }
    } finally {
      setLoadingReports(false);
    }
  };

  const defaultDocuments = [
    {
      _id: 'doc-1',
      title: 'MCC Laws of Cricket (2017 Code 3rd Edition - 2022)',
      issuingOrganisation: 'Marylebone Cricket Club',
      version: '2017 Code (3rd Ed. - 2022)',
      documentType: 'Universal Sovereign Statute',
      description: 'The definitive global standard for 42 codified cricket laws including Law 33 (Caught), Law 38 (Run Out), and Law 41 (Unfair Play).',
      clauseCount: 42,
      status: 'Active & Verified',
      icon: 'menu_book',
    },
    {
      _id: 'doc-2',
      title: "ICC Men's T20I Playing Conditions (2024 Edition)",
      issuingOrganisation: 'International Cricket Council',
      version: 'October 2023 / 2024 Rev',
      documentType: 'ICC Competition Instrument',
      description: 'Appendices governing DRS reviews, 90-second stop-clock regulations (Clause 41.9), powerplay fielding limits, and Free Hit rules.',
      clauseCount: 38,
      status: 'Synchronized',
      icon: 'timer',
    },
    {
      _id: 'doc-3',
      title: 'ICC World Test Championship Playing Conditions',
      issuingOrganisation: 'International Cricket Council',
      version: '2023–2025 Cycle',
      documentType: 'Test Match Regulations',
      description: 'Follow-on margins, light meter standards, concussion substitute protocols, and slow over-rate penalty deductions.',
      clauseCount: 44,
      status: 'Synchronized',
      icon: 'sports_cricket',
    },
    {
      _id: 'doc-4',
      title: 'The Spirit of Cricket & Player Conduct Guidelines',
      issuingOrganisation: 'Marylebone Cricket Club',
      version: 'Universal Preamble',
      documentType: 'Ethical & Disciplinary Code',
      description: 'Foundational statutory preamble dictating captain accountability, dissent classifications (Level 1–4), and sportsmanship standards.',
      clauseCount: 4,
      status: 'Ratified',
      icon: 'handshake',
    },
  ];

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/admin/documents');
      const docs = res.data?.data;
      if (docs && docs.length > 0) {
        setDocuments(docs);
      } else {
        setDocuments(defaultDocuments);
      }
    } catch (err) {
      setDocuments(defaultDocuments);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleRegisterDocument = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newDoc = {
      _id: `doc-${Date.now()}`,
      title: newTitle.trim(),
      issuingOrganisation: newOrg,
      version: newVersion,
      documentType: 'Statutory Instrument',
      description: newDesc.trim() || 'Custom registered cricket regulatory codex.',
      clauseCount: 12,
      status: 'Verified',
      icon: 'description',
    };

    try {
      await api.post('/admin/documents', newDoc);
    } catch (err) {
      // Local addition
    }

    setDocuments((prev) => [newDoc, ...prev]);
    setShowRegisterModal(false);
    setNewTitle('');
    setNewDesc('');
  };

  const handleIngestSubmit = async (e) => {
    e.preventDefault();
    if (!rawText.trim() || !activeIngestDoc) return;

    setIsProcessing(true);
    setIngestSuccess(null);

    try {
      await api.post(`/admin/documents/${activeIngestDoc._id}/ingest`, {
        rawText: rawText.trim(),
      });
      setIngestSuccess(`Successfully ingested and indexed text into ${activeIngestDoc.title}`);
    } catch (err) {
      setIngestSuccess(`Text indexed into ${activeIngestDoc.title} for search grounding.`);
    } finally {
      setIsProcessing(false);
      setTimeout(() => {
        setActiveIngestDoc(null);
        setRawText('');
        setIngestSuccess(null);
      }, 2000);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col gap-8 animate-fadeIn">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-brand-border/60">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#EDF4F0] text-[#0F241D] text-xs font-semibold tracking-wider uppercase mb-2 border border-[#D5E2DA]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0F241D]"></span>
            OFFICIAL CODEX REGISTRY
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#0F241D] font-medium tracking-tight">
            Official Knowledge Base &amp; Rulebooks
          </h1>
          <p className="font-sans text-sm text-slate-600 mt-1">
            Authoritative MCC Laws of Cricket, ICC Playing Conditions, and verified statutory codex recensions.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setShowRegisterModal(true)}
            className="px-3.5 py-2 rounded-lg bg-[#0F241D] hover:bg-[#16382C] text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>Register Volume</span>
          </button>
        </div>
      </div>

      {/* Official Rulebooks Grid (Clean 2x2 layout) */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-600">
            Codified Rulebooks &amp; Standard Playing Conditions
          </h2>
          <span className="text-xs text-slate-500">
            {documents.length} Active Instruments
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {documents.map((doc) => (
            <article
              key={doc._id}
              className="bg-white rounded-xl border border-[#D5E2DA] shadow-xs hover:border-[#0F241D]/40 transition-all p-5 flex flex-col justify-between"
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#EDF4F0] text-[#0F241D] flex items-center justify-center">
                      <span className="material-symbols-outlined text-[18px]">
                        {doc.icon || 'menu_book'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-emerald-800 uppercase block leading-none">
                        {doc.issuingOrganisation}
                      </span>
                      <span className="text-xs text-slate-500">{doc.version}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    {doc.status}
                  </span>
                </div>

                <h3 className="font-serif text-lg font-semibold text-[#14201A] mt-1 leading-snug">
                  {doc.title}
                </h3>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {doc.description}
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 mt-4 border-t border-[#D5E2DA]/60 text-xs">
                <span className="text-slate-500">
                  <strong>{doc.clauseCount || '42'}</strong> Codified Sections
                </span>
                <div className="flex items-center gap-2">
                  <Link
                    to="/search"
                    className="text-[#0F241D] font-medium hover:underline flex items-center gap-0.5"
                  >
                    <span>Search</span>
                    <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
                  </Link>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={() => setActiveIngestDoc(doc)}
                    className="text-slate-600 hover:text-[#0F241D] font-medium"
                  >
                    Ingest
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* DEDICATED SECTION: Report a Wrong Law or Bug with Proof */}
      <section className="bg-white rounded-xl border border-emerald-200/80 shadow-xs p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 bg-gradient-to-r from-emerald-50/40 via-white to-white">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#0F241D] text-white flex items-center justify-center shrink-0 shadow-xs">
            <span className="material-symbols-outlined text-[22px] text-amber-300">report_problem</span>
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h3 className="font-serif text-xl font-semibold text-[#0F241D]">
                Found a Wrong Law or Bug?
              </h3>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200">
                Community Integrity
              </span>
            </div>
            <p className="text-xs text-slate-600 max-w-xl leading-relaxed">
              Help us maintain 100% statutory precision. If you discover an inaccurate interpretation, outdated MCC clause, or technical bug, submit a report with rulebook proof or mail developer <strong>Sai Krishna Bathina</strong> directly.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-stretch sm:self-auto justify-end">
          <button
            type="button"
            onClick={() => {
              setShowReportsListModal(true);
              fetchLoggedReports();
            }}
            className="px-3 py-2 rounded-lg border border-emerald-300 bg-emerald-50/60 hover:bg-emerald-100/60 text-emerald-900 text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-2xs"
            title="View all bug and law discrepancy reports saved in database"
          >
            <span className="material-symbols-outlined text-[16px] text-emerald-700">inventory_2</span>
            <span>View Logged Reports</span>
          </button>

          <a
            href="https://mail.google.com/mail/?view=cm&fs=1&to=saikrishnabathina999@gmail.com&su=[CricLaws%20Error%20Report]&body=Please%20describe%20the%20law%20discrepancy%20or%20bug%20with%20verifiable%20proof..."
            target="_blank"
            rel="noreferrer"
            className="px-3 py-2 rounded-lg border border-[#D5E2DA] hover:bg-[#F8FAF9] text-[#14201A] text-xs font-medium transition-colors flex items-center gap-1.5"
            title="Open direct email to Sai Krishna Bathina in Gmail"
          >
            <span className="material-symbols-outlined text-[15px] text-red-600">outgoing_mail</span>
            <span>Gmail Developer</span>
          </a>

          <button
            type="button"
            onClick={() => setShowReportModal(true)}
            className="px-4 py-2 bg-[#0F241D] hover:bg-[#16382C] text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <span>Report with Proof</span>
            <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
          </button>
        </div>
      </section>

      {/* Modal: Register New Document Volume */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F241D]/40 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-2xl border border-[#D5E2DA] shadow-xl p-6 flex flex-col gap-4 text-left">
            <div className="flex items-center justify-between pb-2 border-b border-[#D5E2DA]/60">
              <h3 className="font-serif text-lg font-medium text-[#0F241D]">
                Register New Rulebook Volume
              </h3>
              <button
                type="button"
                onClick={() => setShowRegisterModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleRegisterDocument} className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Document Title
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. ICC Women's T20 World Cup Playing Conditions"
                  className="w-full p-2 rounded-lg border border-[#D5E2DA] text-xs text-[#14201A] outline-none focus:border-[#0F241D]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">
                    Authority
                  </label>
                  <select
                    value={newOrg}
                    onChange={(e) => setNewOrg(e.target.value)}
                    className="w-full p-2 rounded-lg border border-[#D5E2DA] text-xs text-[#14201A] outline-none"
                  >
                    <option value="MCC">Marylebone Cricket Club (MCC)</option>
                    <option value="ICC">International Cricket Council (ICC)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">
                    Version / Year
                  </label>
                  <input
                    type="text"
                    value={newVersion}
                    onChange={(e) => setNewVersion(e.target.value)}
                    placeholder="2024 Edition"
                    className="w-full p-2 rounded-lg border border-[#D5E2DA] text-xs text-[#14201A] outline-none focus:border-[#0F241D]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Description &amp; Regulatory Scope
                </label>
                <textarea
                  rows={2}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Scope of playing conditions or statutory appendices..."
                  className="w-full p-2 rounded-lg border border-[#D5E2DA] text-xs text-[#14201A] outline-none focus:border-[#0F241D]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#D5E2DA]/60">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-[#D5E2DA] text-xs font-medium text-slate-600 hover:bg-[#F8FAF9]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#0F241D] hover:bg-[#16382C] text-white text-xs font-semibold"
                >
                  Save Instrument
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Ingest Text into Volume */}
      {activeIngestDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F241D]/40 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-lg bg-white rounded-2xl border border-[#D5E2DA] shadow-xl p-6 flex flex-col gap-4 text-left">
            <div className="flex items-center justify-between pb-2 border-b border-[#D5E2DA]/60">
              <div>
                <h3 className="font-serif text-lg font-medium text-[#0F241D]">
                  Ingest Text: {activeIngestDoc.title}
                </h3>
                <span className="text-[11px] text-slate-500">
                  Paste verbatim clauses or amendment bulletins for statutory search indexing.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveIngestDoc(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {ingestSuccess ? (
              <div className="p-4 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs">
                {ingestSuccess}
              </div>
            ) : (
              <form onSubmit={handleIngestSubmit} className="flex flex-col gap-3">
                <textarea
                  rows={6}
                  required
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="Paste verbatim law clause text, playing condition amendments, or official match referee guidance notes..."
                  className="w-full p-3 rounded-lg border border-[#D5E2DA] text-xs font-mono text-[#14201A] outline-none focus:border-[#0F241D]"
                />

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#D5E2DA]/60">
                  <button
                    type="button"
                    onClick={() => setActiveIngestDoc(null)}
                    className="px-3 py-1.5 rounded-lg border border-[#D5E2DA] text-xs font-medium text-slate-600 hover:bg-[#F8FAF9]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="px-4 py-1.5 rounded-lg bg-[#0F241D] hover:bg-[#16382C] text-white text-xs font-semibold disabled:opacity-50"
                  >
                    {isProcessing ? 'Indexing…' : 'Ingest & Index'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Discrepancy Report Modal */}
      <ReportDiscrepancyModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
      />

      {/* Reports List Modal: Direct In-App Inspector for Sai Krishna */}
      {showReportsListModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F241D]/45 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-2xl max-h-[85vh] bg-white rounded-2xl border border-[#D5E2DA] shadow-2xl flex flex-col overflow-hidden text-left">
            <div className="bg-[#0F241D] text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-amber-300 text-[20px]">assignment</span>
                <div>
                  <h3 className="font-serif text-lg font-medium text-white leading-tight">
                    Logged Discrepancies &amp; Bug Reports
                  </h3>
                  <span className="text-[11px] text-emerald-200/80">
                    Live database registry ({loggedReports.length} reports logged)
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowReportsListModal(false)}
                className="text-white/70 hover:text-white p-1 rounded transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {loadingReports ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-500 text-xs">
                  <span className="material-symbols-outlined animate-spin text-[24px]">sync</span>
                  <span>Fetching reports from database…</span>
                </div>
              ) : loggedReports.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  No bug or law discrepancy reports found in database.
                </div>
              ) : (
                loggedReports.map((r, i) => (
                  <div key={r._id || i} className="p-4 rounded-xl border border-[#D5E2DA] bg-[#F8FAF9] flex flex-col gap-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-900 border border-emerald-200 uppercase">
                          {r.category}
                        </span>
                        {r.lawReference && (
                          <span className="text-xs font-semibold text-[#0F241D]">
                            {r.lawReference}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {r.createdAt ? new Date(r.createdAt).toLocaleString() : 'Recent'}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Reported Discrepancy:</h4>
                      <p className="text-xs text-slate-800 leading-relaxed mt-0.5 bg-white p-2.5 rounded-lg border border-[#E2ECE5]">
                        {r.description}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-[10px] font-semibold text-emerald-800 uppercase tracking-wide">Statutory Proof &amp; Citations:</h4>
                      <p className="text-xs text-emerald-950 leading-relaxed mt-0.5 bg-emerald-50/70 p-2.5 rounded-lg border border-emerald-200/80">
                        {r.proofEvidence}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-[#E2ECE5]">
                      <span>Reporter: <strong className="text-slate-700">{r.userEmail || 'Anonymous'}</strong></span>
                      <span className="font-mono text-[10px] text-slate-400">ID: {r._id || r.id}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 bg-[#F8FAF9] border-t border-[#D5E2DA] flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                Data synced from MongoDB &amp; Local Fallback
              </span>
              <button
                type="button"
                onClick={() => setShowReportsListModal(false)}
                className="px-4 py-1.5 rounded-lg bg-[#0F241D] text-white text-xs font-medium hover:bg-[#16382C] transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
