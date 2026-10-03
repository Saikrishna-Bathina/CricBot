import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Send, 
  Sparkles, 
  Copy, 
  Check, 
  RefreshCw, 
  PlusCircle, 
  ShieldCheck, 
  AlertCircle, 
  BookOpen, 
  Info, 
  HelpCircle,
  MessageSquare
} from 'lucide-react';
import api from '../services/api';
import CitationModal from '../components/citations/CitationModal';

export default function ChatPage() {
  const [searchParams] = useSearchParams();
  const [messages, setMessages] = useState([]);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [activeCitation, setActiveCitation] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [format, setFormat] = useState('ALL');

  const messagesEndRef = useRef(null);

  const samplePrompts = [
    "What happens if the ball hits the helmet placed behind the wicketkeeper?",
    "Can a batter be run out while backing up at the non-striker's end?",
    "When is a batter out Obstructing the field?",
    "What happens if a fielder deliberately stops the ball with their helmet or cap?",
    "In T20 Internationals, which deliveries result in a Free Hit?",
    "What is the time limit for an incoming batter under MCC Law vs ICC T20I conditions?"
  ];

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Handle URL query param `?q=...`
  useEffect(() => {
    const initialQuery = searchParams.get('q');
    if (initialQuery && messages.length === 0) {
      sendMessage(initialQuery);
    }
  }, [searchParams]);

  const sendMessage = async (textToSend) => {
    const q = textToSend || inputQuery;
    if (!q || !q.trim() || isLoading) return;

    setError(null);
    setInputQuery('');

    // Append user message
    const userMsg = {
      role: 'user',
      content: q.trim(),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await api.post('/chat', {
        question: q.trim(),
        conversationId,
        context: { format },
      });

      const data = res.data.data;
      if (data.conversationId) {
        setConversationId(data.conversationId);
      }

      const assistantMsg = {
        role: 'assistant',
        answer: data.answer,
        citations: data.citations || [],
        applicableContext: data.applicableContext,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      setError(err.message || 'Failed to fetch official law response. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (content, index) => {
    navigator.clipboard.writeText(content);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleNewChat = () => {
    setMessages([]);
    setConversationId(null);
    setError(null);
    setInputQuery('');
  };

  return (
    <div className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 flex flex-col h-[calc(100vh-4rem)]">
      {/* Top Header & Context Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-800 gap-3 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400 shadow-md">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center space-x-2">
              <span>Cricket Laws Adjudication Console</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">
                Official Rulebooks
              </span>
            </h1>
            <p className="text-xs text-slate-400">Verifiable rulings grounded in MCC Laws, ICC Playing Conditions, and Tournament Rules</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Format selector */}
          <div className="flex items-center space-x-1.5 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1 text-xs">
            <span className="text-slate-400">Jurisdiction:</span>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="bg-transparent text-emerald-400 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900 text-white">All / Core MCC Laws</option>
              <option value="T20I" className="bg-slate-900 text-white">ICC Men's T20I</option>
              <option value="ODI" className="bg-slate-900 text-white">ICC Men's ODI</option>
              <option value="TEST" className="bg-slate-900 text-white">ICC Men's Test</option>
              <option value="IPL" className="bg-slate-900 text-white">IPL Playing Conditions</option>
            </select>
          </div>

          <button
            onClick={handleNewChat}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors border border-slate-700"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>New Consultation</span>
          </button>
        </div>
      </div>

      {/* Message Feed / Empty State */}
      <div className="flex-1 overflow-y-auto space-y-6 pr-1">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-950/80 border border-emerald-800/80 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-950/50">
              <ShieldCheck className="w-8 h-8 text-amber-300" />
            </div>
            <div className="space-y-2 max-w-md">
              <h2 className="text-2xl font-bold text-white">What law would you like to verify?</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Inquire about complex umpiring dismissals, boundary catches, non-striker run outs, free hits, or penalty runs.
              </p>
            </div>

            <div className="w-full max-w-2xl space-y-2 text-left">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 text-center">
                Sample Official Inquiries
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {samplePrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => sendMessage(prompt)}
                    className="p-3 rounded-xl bg-slate-800/40 hover:bg-emerald-950/60 border border-slate-700/60 hover:border-emerald-800 text-xs text-slate-300 hover:text-white text-left transition-all"
                  >
                    "{prompt}"
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-3xl rounded-2xl p-5 ${
                  msg.role === 'user'
                    ? 'bg-emerald-700 text-white rounded-tr-none shadow-lg shadow-emerald-950/30'
                    : 'bg-slate-800/70 border border-slate-700/70 text-slate-100 rounded-tl-none shadow-xl'
                }`}
              >
                {msg.role === 'user' ? (
                  <p className="text-sm font-medium leading-relaxed">{msg.content}</p>
                ) : (
                  <div className="space-y-4 text-sm">
                    {/* Official Decision Badge */}
                    <div className="p-3.5 rounded-xl bg-slate-900/90 border border-emerald-800/60 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-bold flex items-center space-x-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                          <span>Official Ruling</span>
                        </span>
                        <button
                          onClick={() => handleCopy(msg.answer?.directAnswer || msg.answer?.formattedContent, index)}
                          className="text-xs text-slate-400 hover:text-white flex items-center space-x-1 transition-colors"
                          title="Copy Answer"
                        >
                          {copiedIndex === index ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400 text-[11px]">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span className="text-[11px]">Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                      <p className="text-base font-bold text-white leading-snug">
                        {msg.answer?.directAnswer}
                      </p>
                    </div>

                    {/* Applicable Regulation */}
                    <div className="flex items-center space-x-2 text-xs">
                      <span className="text-slate-400">Applicable Law:</span>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/60 font-semibold font-mono">
                        {msg.answer?.applicableLaw}
                      </span>
                    </div>

                    {/* Explanation */}
                    <div className="space-y-1">
                      <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                        Official Legal Explanation
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal bg-slate-900/40 p-3 rounded-xl border border-slate-800/50">
                        {msg.answer?.explanation}
                      </p>
                    </div>

                    {/* Application */}
                    {msg.answer?.application && (
                      <div className="text-xs text-slate-300 leading-relaxed border-l-2 border-emerald-500 pl-3">
                        <span className="font-semibold text-white">Application to Query: </span>
                        {msg.answer?.application}
                      </div>
                    )}

                    {/* Exceptions */}
                    {msg.answer?.exceptions && msg.answer.exceptions.length > 0 && (
                      <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-900/40 space-y-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300 flex items-center space-x-1">
                          <Info className="w-3.5 h-3.5" />
                          <span>Key Qualifications & Exceptions</span>
                        </span>
                        <ul className="list-disc list-inside text-xs text-amber-200/90 space-y-0.5">
                          {msg.answer.exceptions.map((ex, i) => (
                            <li key={i}>{ex}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Traceable Citations Bar */}
                    {msg.citations && msg.citations.length > 0 && (
                      <div className="pt-2 border-t border-slate-700/60">
                        <div className="flex items-center space-x-1.5 text-xs text-slate-400 mb-2 font-medium">
                          <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Verifiable Official Citations (Click to inspect source):</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {msg.citations.map((cite, cIdx) => (
                            <button
                              key={cIdx}
                              onClick={() => setActiveCitation(cite)}
                              className="group flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-emerald-950 border border-emerald-900/60 hover:border-emerald-500 text-xs text-slate-300 hover:text-white transition-all shadow-sm"
                            >
                              <ShieldCheck className="w-3 h-3 text-amber-300 group-hover:scale-110 transition-transform" />
                              <span className="font-semibold font-mono text-emerald-400">
                                {cite.issuingOrganisation || 'MCC'} {cite.clauseNumber ? `Clause ${cite.clauseNumber}` : `Law ${cite.lawNumber}`}
                              </span>
                              {cite.pageStart && (
                                <span className="text-[10px] text-slate-500">p.{cite.pageStart}</span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {/* Loading Spinner */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-800/70 border border-slate-700/70 rounded-2xl rounded-tl-none p-4 max-w-md flex items-center space-x-3 text-sm text-slate-300 shadow-lg">
              <div className="relative w-6 h-6">
                <div className="w-6 h-6 rounded-full border-2 border-emerald-500/20 border-t-emerald-400 animate-spin"></div>
                <div className="absolute inset-1 rounded-full bg-emerald-600/30"></div>
              </div>
              <span className="text-xs font-mono">Retrieving official MCC/ICC clauses & validating citations...</span>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-xl bg-red-950/60 border border-red-800/80 text-red-200 text-xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => sendMessage()}
              className="px-2.5 py-1 rounded bg-red-900 hover:bg-red-800 text-white font-medium text-xs transition-colors shrink-0"
            >
              Retry
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage();
        }}
        className="mt-4 pt-3 border-t border-slate-800 shrink-0"
      >
        <div className="relative flex items-center bg-slate-950 border border-slate-700/80 focus-within:border-emerald-500 rounded-2xl p-1.5 shadow-xl transition-all">
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            disabled={isLoading}
            placeholder="Ask any question about cricket laws, playing conditions, or decisions..."
            className="w-full bg-transparent px-4 py-2.5 text-sm sm:text-base text-white placeholder-slate-500 focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !inputQuery.trim()}
            className="shrink-0 flex items-center justify-center p-2.5 sm:px-4 sm:py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white disabled:text-slate-500 font-semibold transition-colors shadow-lg shadow-emerald-950"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>

      {/* Citation Inspector Modal */}
      <CitationModal
        isOpen={Boolean(activeCitation)}
        citation={activeCitation}
        onClose={() => setActiveCitation(null)}
      />
    </div>
  );
}
