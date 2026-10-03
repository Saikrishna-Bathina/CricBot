import React, { useState } from 'react';
import { 
  Compass, 
  Send, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  GitBranch, 
  BookOpen, 
  Sparkles,
  HelpCircle,
  Clock
} from 'lucide-react';
import api from '../services/api';
import CitationModal from '../components/citations/CitationModal';

export default function ScenarioPage() {
  const [scenarioText, setScenarioText] = useState('');
  const [format, setFormat] = useState('ALL');
  const [competition, setCompetition] = useState('ALL');
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);
  const [activeCitation, setActiveCitation] = useState(null);

  const sampleScenarios = [
    {
      title: "Boundary Catch After Stepping Over",
      text: "The bowler delivers the ball, the batter hits it into the air, and a fielder catches it after stepping over the boundary. What is the decision?"
    },
    {
      title: "Ball Striking Wicketkeeper's Grounded Helmet",
      text: "The batter edges the ball past the stumps, the batters complete one run, and while attempting a second, the throw from third man strikes the wicket-keeper's spare protective helmet on the ground. How many runs are scored and is the ball dead?"
    },
    {
      title: "Non-Striker Backing Up Run Out (Law 41.16)",
      text: "The bowler enters the delivery stride, notices the non-striker 2 yards out of their crease before releasing the ball, stops their arm, and breaks the stumps. What is the umpire's ruling?"
    },
    {
      title: "T20I Incoming Batter 90-Second Delay",
      text: "In a Men's T20 International, the incoming batter experiences an issue with their equipment in the dugout and walks onto the pitch 1 minute and 45 seconds after the previous wicket fell. The fielding captain appeals. What is the ruling?"
    }
  ];

  const handleAnalyze = async (e) => {
    if (e) e.preventDefault();
    if (!scenarioText.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const res = await api.post('/scenarios/analyze', {
        scenario: scenarioText.trim(),
        format,
        competition,
      });
      setAnalysisResult(res.data.data);
    } catch (err) {
      setError(err.message || 'Failed to analyze scenario. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSample = (sample) => {
    setScenarioText(sample.text);
    setAnalysisResult(null);
    setError(null);
  };

  return (
    <div className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-amber-950/80 border border-amber-800/80 flex items-center justify-center text-amber-400 shadow-lg">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
              <span>Match Scenario Analyser</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800 font-mono">
                Legal Reasoning
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Structured legal breakdown of complex on-field match situations and edge cases
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Input Form & Sample Scenarios */}
        <div className="lg:col-span-5 space-y-6">
          <form onSubmit={handleAnalyze} className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4 shadow-xl">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Describe Match Incident</span>
            </h2>

            <div>
              <textarea
                value={scenarioText}
                onChange={(e) => setScenarioText(e.target.value)}
                rows={6}
                placeholder="Describe the play in detail (e.g., bowler's delivery stride, boundary contact, helmet strike, deflection, or fielder movement)..."
                className="w-full rounded-xl bg-slate-900 border border-slate-700/80 p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            {/* Context Filters */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Match Format:</label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  className="w-full rounded-lg bg-slate-900 border border-slate-700 p-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="ALL">Universal MCC Laws</option>
                  <option value="T20I">ICC Men's T20I</option>
                  <option value="ODI">ICC Men's ODI</option>
                  <option value="TEST">ICC Men's Test</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Competition Scope:</label>
                <select
                  value={competition}
                  onChange={(e) => setCompetition(e.target.value)}
                  className="w-full rounded-lg bg-slate-900 border border-slate-700 p-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="ALL">All Competitions</option>
                  <option value="INTERNATIONAL">International Bilateral</option>
                  <option value="WORLD_CUP">ICC World Cup</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !scenarioText.trim()}
              className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 text-white font-semibold text-sm transition-colors shadow-lg shadow-amber-950 flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin"></div>
                  <span>Reasoning from Official Rulebooks...</span>
                </>
              ) : (
                <>
                  <Compass className="w-4 h-4" />
                  <span>Analyze Scenario</span>
                </>
              )}
            </button>
          </form>

          {/* Sample Scenarios */}
          <div className="space-y-3">
            <h3 className="text-xs uppercase font-bold text-slate-400 tracking-wider">
              Common High-Stakes Scenarios:
            </h3>
            <div className="space-y-2">
              {sampleScenarios.map((s, idx) => (
                <div
                  key={idx}
                  onClick={() => loadSample(s)}
                  className="p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/60 hover:border-amber-800 cursor-pointer transition-all text-xs"
                >
                  <h4 className="font-bold text-slate-200">{s.title}</h4>
                  <p className="text-slate-400 line-clamp-2 mt-1">{s.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Structured Analysis Output */}
        <div className="lg:col-span-7 space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-red-950/60 border border-red-800 text-red-200 text-xs">
              {error}
            </div>
          )}

          {!analysisResult && !isLoading && !error && (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8 rounded-2xl bg-slate-950/40 border border-slate-800/80 space-y-3">
              <Compass className="w-12 h-12 text-slate-600" />
              <h3 className="text-lg font-bold text-slate-300">Ready for Scenario Evaluation</h3>
              <p className="text-xs text-slate-500 max-w-sm">
                Enter an on-field cricket situation on the left or select a sample scenario to generate structured legal reasoning.
              </p>
            </div>
          )}

          {analysisResult && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* 1. Likely Decision */}
              <div className="p-5 rounded-2xl bg-slate-950/90 border border-emerald-800/80 shadow-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-bold flex items-center space-x-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-300" />
                    <span>Likely Official Decision</span>
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
                    {analysisResult.applicableContext?.governingAuthority || 'MCC'} Grounded
                  </span>
                </div>
                <p className="text-base sm:text-lg font-bold text-white leading-snug">
                  {analysisResult.analysis.likelyDecision}
                </p>
              </div>

              {/* 2. Relevant Facts & Applicable Law Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Relevant Facts */}
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Material Facts</span>
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {analysisResult.analysis.relevantFacts.map((fact, idx) => (
                      <li key={idx} className="flex items-start space-x-1.5">
                        <span className="text-emerald-400 font-bold">•</span>
                        <span>{fact}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Applicable Law */}
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
                    <BookOpen className="w-4 h-4 text-amber-400" />
                    <span>Governing Regulation</span>
                  </h4>
                  <p className="text-sm font-bold text-amber-300 font-mono">
                    {analysisResult.analysis.applicableLaw}
                  </p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {analysisResult.analysis.confidenceAndLimitations}
                  </p>
                </div>
              </div>

              {/* 3. Rule Explanation & Application */}
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Official Law Text & Interpretation
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-mono bg-slate-950 p-3 rounded-xl border border-slate-800">
                    {analysisResult.analysis.ruleExplanation}
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Application to Scenario Facts
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {analysisResult.analysis.applicationToScenario}
                  </p>
                </div>
              </div>

              {/* 4. Alternative Outcomes & Conditions */}
              {analysisResult.analysis.alternativeOutcomes && analysisResult.analysis.alternativeOutcomes.length > 0 && (
                <div className="p-5 rounded-2xl bg-amber-950/20 border border-amber-900/40 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center space-x-1.5">
                    <GitBranch className="w-4 h-4" />
                    <span>Conditional & Alternative Outcomes</span>
                  </h4>
                  <ul className="space-y-1.5 text-xs text-amber-200/90">
                    {analysisResult.analysis.alternativeOutcomes.map((alt, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <span className="text-amber-400 font-bold shrink-0">→</span>
                        <span>{alt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 5. Umpire Discretion */}
              {analysisResult.analysis.umpireDiscretionNotes && (
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start space-x-3 text-xs text-slate-300">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white">Umpire Discretion Note: </span>
                    {analysisResult.analysis.umpireDiscretionNotes}
                  </div>
                </div>
              )}

              {/* 6. Citations */}
              {analysisResult.citations && analysisResult.citations.length > 0 && (
                <div className="pt-2">
                  <h4 className="text-xs uppercase font-bold text-slate-400 mb-2">
                    Verified Citations:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {analysisResult.citations.map((cite, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveCitation(cite)}
                        className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-emerald-950 border border-emerald-800/60 hover:border-emerald-500 text-xs text-slate-300 hover:text-white transition-all"
                      >
                        <ShieldCheck className="w-3 h-3 text-amber-300" />
                        <span className="font-mono text-emerald-400">
                          {cite.issuingOrganisation} {cite.clauseNumber ? `Clause ${cite.clauseNumber}` : `Law ${cite.lawNumber}`}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Citation Inspector Modal */}
      <CitationModal
        isOpen={Boolean(activeCitation)}
        citation={activeCitation}
        onClose={() => setActiveCitation(null)}
      />
    </div>
  );
}
