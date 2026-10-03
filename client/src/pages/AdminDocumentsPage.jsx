import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Layers, 
  RefreshCw, 
  ShieldCheck, 
  PlusCircle, 
  History, 
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import api from '../services/api';
import { Link } from 'react-router-dom';

export default function AdminDocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // Registration modal state
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newOrg, setNewOrg] = useState('MCC');
  const [newType, setNewType] = useState('LAWS_OF_CRICKET');
  const [newVersion, setNewVersion] = useState('2024 Edition');
  const [newSourceUrl, setNewSourceUrl] = useState('');
  const [newFormat, setNewFormat] = useState('ALL');

  // Ingestion modal state
  const [activeIngestDoc, setActiveIngestDoc] = useState(null);
  const [rawText, setRawText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const rawUser = localStorage.getItem('cricket_user');
    if (rawUser) {
      try {
        setCurrentUser(JSON.parse(rawUser));
      } catch (e) {}
    }
    fetchDocuments();
    fetchAuditLogs();
  }, []);

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/admin/documents');
      setDocuments(res.data.data);
    } catch (err) {
      setError(err.message || 'Failed to fetch admin documents. Ensure you are signed in as an administrator.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await api.get('/admin/audit-logs');
      setAuditLogs(res.data.data);
    } catch (err) {
      console.warn('Could not fetch audit logs:', err.message);
    }
  };

  const handleRegisterDocument = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/documents', {
        title: newTitle,
        issuingOrganisation: newOrg,
        documentType: newType,
        version: newVersion,
        sourceUrl: newSourceUrl,
        applicableFormats: [newFormat],
      });
      setShowRegisterModal(false);
      setNewTitle('');
      fetchDocuments();
      fetchAuditLogs();
    } catch (err) {
      alert(err.message || 'Registration failed');
    }
  };

  const handleStartIngest = async (e) => {
    e.preventDefault();
    if (!activeIngestDoc || !rawText.trim()) return;

    setIsProcessing(true);
    try {
      await api.post(`/admin/documents/${activeIngestDoc._id}/ingest`, {
        rawTextContent: rawText.trim(),
      });
      setActiveIngestDoc(null);
      setRawText('');
      setTimeout(() => {
        fetchDocuments();
        fetchAuditLogs();
      }, 1000);
    } catch (err) {
      alert(err.message || 'Ingestion failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePublish = async (docId) => {
    try {
      await api.post(`/admin/documents/${docId}/publish`);
      fetchDocuments();
      fetchAuditLogs();
    } catch (err) {
      alert(err.message || 'Publication failed');
    }
  };

  const handleSupersede = async (docId) => {
    if (!confirm('Are you sure you want to mark this document as superseded? It will no longer be retrieved for current match questions.')) return;
    try {
      await api.post(`/admin/documents/${docId}/supersede`, {});
      fetchDocuments();
      fetchAuditLogs();
    } catch (err) {
      alert(err.message || 'Failed to supersede document');
    }
  };

  // If user is not logged in or not admin, show login prompt
  const token = localStorage.getItem('cricket_auth_token');
  if (!token) {
    return (
      <div className="flex-1 max-w-md mx-auto flex flex-col justify-center items-center text-center p-6 space-y-4">
        <ShieldCheck className="w-12 h-12 text-amber-400" />
        <h2 className="text-xl font-bold text-white">Administrator Access Required</h2>
        <p className="text-xs text-slate-400">
          Source Document Management is restricted to authorized rule administrators.
        </p>
        <Link
          to="/login"
          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors"
        >
          Sign In as Administrator
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-8 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-800 gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400 shadow-lg">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
              <span>Source Document Management</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
                Admin Console
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Register, ingest, parse, review, publish, and supersede official cricket rulebooks
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              fetchDocuments();
              fetchAuditLogs();
            }}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Refresh list"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowRegisterModal(true)}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors shadow-lg shadow-emerald-950"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Register Document</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/60 border border-red-800 text-red-200 text-xs">
          {error}
        </div>
      )}

      {/* Documents Table */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>Managed Rulebooks & Playing Conditions</span>
          </h2>
          <span className="text-xs text-slate-400 font-mono">{documents.length} Records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="px-6 py-3">Document Title</th>
                <th className="px-4 py-3">Authority</th>
                <th className="px-4 py-3">Edition / Version</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Ingested Chunks</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {documents.map((doc) => (
                <tr key={doc._id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-white text-sm">{doc.title}</div>
                    {doc.sourceUrl && (
                      <a
                        href={doc.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-emerald-400 hover:underline flex items-center space-x-1 mt-0.5"
                      >
                        <span>Official Source Link</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 font-mono text-[11px] text-slate-200">
                      {doc.issuingOrganisation}
                    </span>
                  </td>
                  <td className="px-4 py-4 font-mono text-slate-300">
                    {doc.version}
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] tracking-wider ${
                        doc.status === 'published'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : doc.status === 'review'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : doc.status === 'processing'
                          ? 'bg-sky-950 text-sky-400 border border-sky-800 animate-pulse'
                          : doc.status === 'superseded'
                          ? 'bg-slate-900 text-slate-500 border border-slate-700'
                          : 'bg-slate-900 text-slate-400 border border-slate-800'
                      }`}
                    >
                      {doc.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 font-mono text-slate-300">
                    {doc.ingestionMetadata?.chunkCount || 0} chunks
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    {doc.status === 'draft' && (
                      <button
                        onClick={() => setActiveIngestDoc(doc)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 font-semibold text-xs"
                      >
                        Ingest Text
                      </button>
                    )}
                    {doc.status === 'review' && (
                      <button
                        onClick={() => handlePublish(doc._id)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs"
                      >
                        Publish to RAG
                      </button>
                    )}
                    {doc.status === 'published' && (
                      <button
                        onClick={() => handleSupersede(doc._id)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white font-semibold text-xs"
                      >
                        Supersede
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Logs */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
          <History className="w-4 h-4 text-slate-400" />
          <span>Knowledge Base Audit Trails</span>
        </h3>
        <div className="space-y-2 max-h-60 overflow-y-auto pr-2 font-mono text-xs">
          {auditLogs.length === 0 ? (
            <p className="text-slate-500">No audit events recorded yet.</p>
          ) : (
            auditLogs.map((log) => (
              <div
                key={log._id}
                className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80 flex items-center justify-between text-slate-300"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-emerald-400 font-bold">{log.action}</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-300">{log.targetType}</span>
                </div>
                <span className="text-slate-500 text-[11px]">
                  {new Date(log.createdAt).toLocaleString()}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal: Register Document */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <form
            onSubmit={handleRegisterDocument}
            className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl"
          >
            <h3 className="text-lg font-bold text-white">Register Official Rulebook</h3>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Document Title</label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. ICC Men's Cricket World Cup 2023 Playing Conditions"
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Issuing Authority</label>
                <select
                  value={newOrg}
                  onChange={(e) => setNewOrg(e.target.value)}
                  className="w-full p-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                >
                  <option value="MCC">MCC</option>
                  <option value="ICC">ICC</option>
                  <option value="BCCI">BCCI</option>
                  <option value="ECB">ECB</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Edition / Version</label>
                <input
                  type="text"
                  required
                  value={newVersion}
                  onChange={(e) => setNewVersion(e.target.value)}
                  className="w-full p-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Official Source URL</label>
              <input
                type="url"
                value={newSourceUrl}
                onChange={(e) => setNewSourceUrl(e.target.value)}
                placeholder="https://www.lords.org/mcc/the-laws-of-cricket"
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowRegisterModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
              >
                Register
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Ingest Text */}
      {activeIngestDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <form
            onSubmit={handleStartIngest}
            className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl"
          >
            <h3 className="text-lg font-bold text-white">
              Ingest Text for {activeIngestDoc.title}
            </h3>
            <p className="text-xs text-slate-400">
              Paste the verbatim text containing Law headings and clauses. The chunker will automatically detect clauses and generate embeddings.
            </p>

            <textarea
              rows={8}
              required
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste rulebook content with 'LAW 28 - THE FIELDER', '28.1', etc..."
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-mono focus:outline-none"
            />

            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setActiveIngestDoc(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isProcessing}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center space-x-2"
              >
                {isProcessing ? (
                  <>
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-white/20 border-t-white animate-spin"></div>
                    <span>Processing Ingestion Job...</span>
                  </>
                ) : (
                  <span>Start Ingestion Job</span>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
