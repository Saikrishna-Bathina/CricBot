import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MessageSquare, 
  Compass, 
  Search, 
  HelpCircle, 
  ShieldCheck, 
  ArrowRight, 
  BookCheck, 
  GitBranch, 
  FileCheck2,
  Sparkles
} from 'lucide-react';

export default function HomePage() {
  const navigate = useNavigate();
  const [quickQuestion, setQuickQuestion] = useState('');

  const sampleQuestions = [
    "What happens if the ball hits the helmet placed behind the wicketkeeper?",
    "Can a batter be run out while backing up at the non-striker's end?",
    "When is a batter out obstructing the field?",
    "What happens if a fielder deliberately stops the ball with their cap or helmet?",
    "Can a bowler change ends during an innings?",
    "How do no-ball penalty runs differ between MCC Laws and ICC T20I playing conditions?"
  ];

  const handleQuickSubmit = (e) => {
    e.preventDefault();
    if (!quickQuestion.trim()) return;
    navigate(`/chat?q=${encodeURIComponent(quickQuestion.trim())}`);
  };

  const handleSampleClick = (question) => {
    navigate(`/chat?q=${encodeURIComponent(question)}`);
  };

  const features = [
    {
      title: "RAG Law Chatbot",
      description: "Ask natural language questions about any cricket law and receive structured, source-grounded answers with verifiable clause citations.",
      icon: MessageSquare,
      path: "/chat",
      badge: "Source Grounded",
      color: "emerald"
    },
    {
      title: "Scenario Analyser",
      description: "Submit complex match incidents. Get step-by-step reasoning on relevant facts, applicable clauses, umpire discretion, and alternative outcomes.",
      icon: Compass,
      path: "/scenarios",
      badge: "Deep Reasoning",
      color: "amber"
    },
    {
      title: "Law & Clause Search",
      description: "Search the MCC 42 Laws and ICC Playing Conditions by exact law number, title, clause, competition format, and keyword filters.",
      icon: Search,
      path: "/search",
      badge: "Official Archive",
      color: "sky"
    },
    {
      title: "Umpire & Law Quizzes",
      description: "Test your mastery of cricket regulations with multiple choice and scenario questions, server-verified scoring, and official explanations.",
      icon: HelpCircle,
      path: "/quiz",
      badge: "Certified Testing",
      color: "purple"
    }
  ];

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 md:pt-20 pb-16 border-b border-emerald-950/60 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none"></div>
        
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-800/80 text-emerald-300 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Retrieved from Official MCC Laws & ICC Playing Conditions</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight leading-tight">
            Official Cricket Laws. <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-emerald-300 to-amber-300">
              Zero Guesswork. Traceable Citations.
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
            Understand complex cricket laws, umpiring decisions, and boundary regulations with high-precision Retrieval-Augmented Generation grounded in official rulebooks.
          </p>

          {/* Quick Search Input */}
          <form onSubmit={handleQuickSubmit} className="max-w-2xl mx-auto mt-6">
            <div className="relative flex items-center shadow-2xl rounded-2xl bg-slate-950/90 border border-emerald-800/60 focus-within:border-emerald-500 transition-all p-1.5">
              <Search className="w-5 h-5 text-slate-400 ml-3 shrink-0" />
              <input
                type="text"
                value={quickQuestion}
                onChange={(e) => setQuickQuestion(e.target.value)}
                placeholder="Ask any law question (e.g., ball hitting helmet, run out at non-striker's end)..."
                className="w-full bg-transparent px-3 py-2.5 text-sm sm:text-base text-white placeholder-slate-500 focus:outline-none"
              />
              <button
                type="submit"
                className="shrink-0 flex items-center space-x-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-emerald-900/40"
              >
                <span>Ask</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Sample Questions Pills */}
          <div className="pt-2 text-left">
            <p className="text-xs uppercase font-bold text-slate-400 text-center tracking-wider mb-3">Popular Official Inquiries:</p>
            <div className="flex flex-wrap justify-center gap-2 max-w-4xl mx-auto">
              {sampleQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSampleClick(q)}
                  className="text-xs bg-slate-800/70 hover:bg-emerald-950/80 hover:text-emerald-300 border border-slate-700/60 hover:border-emerald-800 text-slate-300 px-3 py-1.5 rounded-lg text-left transition-all"
                >
                  "{q}"
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Feature Navigation Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Specialized Cricket Regulation Modules
          </h2>
          <p className="text-slate-400 text-sm mt-2 max-w-xl mx-auto">
            Engineered for aspiring umpires, scorers, players, commentators, and discerning cricket fans.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.title}
                onClick={() => navigate(feat.path)}
                className="group relative cursor-pointer bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/60 hover:border-emerald-700/80 rounded-2xl p-6 transition-all duration-200 flex flex-col justify-between shadow-lg hover:shadow-emerald-950/50 hover:-translate-y-1"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-950/80 border border-emerald-800/80 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-900 text-amber-300 border border-amber-900/30">
                      {feat.badge}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">
                    {feat.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    {feat.description}
                  </p>
                </div>

                <div className="mt-6 flex items-center text-xs font-semibold text-emerald-400 group-hover:translate-x-1 transition-transform">
                  <span>Launch Tool</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Trust & Architecture Section */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-gradient-to-br from-emerald-950/50 via-slate-900 to-slate-950 border border-emerald-800/50 p-6 sm:p-10 shadow-xl">
          <div className="flex items-center space-x-3 mb-6">
            <ShieldCheck className="w-8 h-8 text-amber-300" />
            <div>
              <h3 className="text-xl font-bold text-white">The Source-Grounded Difference</h3>
              <p className="text-xs text-slate-400">Why general-purpose chat models fail at cricket law questions</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-300">
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center space-x-2 text-emerald-400 font-bold">
                <BookCheck className="w-4 h-4" />
                <span>Zero Hallucinated Laws</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                General AI often confuses obsolete 2017 code with the 2022 3rd Edition MCC Code. CricLaws matches exact current clauses before answering.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center space-x-2 text-amber-300 font-bold">
                <GitBranch className="w-4 h-4" />
                <span>MCC vs ICC Resolution</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                ICC Playing Conditions often modify MCC Laws (e.g., Free Hits on no-balls, DRS limits, stop clocks). We clearly delineate MCC general laws from tournament specific playing conditions.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center space-x-2 text-sky-400 font-bold">
                <FileCheck2 className="w-4 h-4" />
                <span>Audit-Ready Citations</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Click any citation badge in a response to review the exact verbatim clause, issuing organisation, and page range stored in the knowledge base.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
