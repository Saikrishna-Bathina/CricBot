import React, { useState, useEffect } from 'react';
import api from '../services/api';
import CitationModal from '../components/citations/CitationModal';

export default function ScenarioPage() {
  const [scenarioText, setScenarioText] = useState(
    "When a bowler stopped at the bowling crease during delivery stride, then bowled a ball that bounced more than once along the pitch surface before reaching the striker's popping crease."
  );
  const [authorityFramework, setAuthorityFramework] = useState("ICC Men's T20I Playing Conditions");
  const [matchPhase, setMatchPhase] = useState("Powerplay (Overs 0.1 - 5.6)");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeCitation, setActiveCitation] = useState(null);

  // Analysis result state
  const [analysisResult, setAnalysisResult] = useState({
    title: 'MCC Law 21 — No Ball (Clause 21.10) & Law 20.4 (Dead Ball)',
    determination: 'Infraction Confirmed: Immediate No Ball Call Required',
    summary:
      "The umpire shall call and signal No ball immediately upon the second bounce prior to the striker's crease, and award statutory penalties pursuant to prevailing competition regulations.",
    phases: [
      {
        step: '1',
        title: 'Delivery Stride Abrupt Halting',
        lawBadge: 'Law 41.4 & 21.4',
        description:
          'Bowler enters delivery stride, comes to an unnatural halt, but proceeds to cast the ball toward the striker. If this stop was deliberate to distract the striker, Law 41.4 applies. If non-malicious, it is judged strictly on trajectory.',
      },
      {
        step: '2',
        title: 'Multi-Bounce Pitch Incursion',
        lawBadge: 'Violation: Law 21.10',
        description:
          'The ball bounced 3 discrete times on the pitch surface before reaching the popping crease. Under MCC Law 21.10, any ball bouncing more than once prior to the popping crease is an automatic No Ball.',
        isCritical: true,
      },
      {
        step: '3',
        title: 'Umpire Mechanical Signaling & Penalty',
        lawBadge: 'Law 2.1 & ICC PC 21.19',
        description:
          "Bowler's end umpire calls and signals No ball (horizontal arm). Under ICC T20I Playing Conditions, the subsequent delivery is declared an active Free Hit.",
      },
    ],
    formatDivergence: {
      title: 'ICC T20I Free Hit Rule vs. Universal MCC Code',
      text:
        'Under Universal MCC Laws, a No Ball confers a 1-run penalty and an extra delivery. Under ICC T20I Playing Conditions Clause 21.19, all pitch-bounce No Balls trigger a mandatory Free Hit for the next ball.',
      badge: 'Free Hit Active',
    },
    umpireProtocol: [
      'Call & signal "No ball" instantaneously upon second pitch bounce.',
      'Signal Free Hit by circular rotation of arm above head.',
      'Check batter safety and confirm scorer recording before next bowl.',
    ],
  });

  const presets = [
    {
      label: 'Bowler halts + multi-bounce delivery',
      text: "When a bowler stopped at the bowling crease during delivery stride, then bowled a ball that bounced more than once along the pitch surface before reaching the striker's popping crease.",
    },
    {
      label: 'Boundary catch after stepping over rope',
      text: 'Deep mid-wicket fielder takes a catch, steps over the boundary cushion onto the ground beyond, jumps back into the field of play, and tosses the ball into the air before grounding.',
    },
    {
      label: "Ball striking fielder's placed helmet",
      text: "Striker edges the ball past wicketkeeper into spare helmet resting on the turf behind the stumps while batters attempt a single.",
    },
    {
      label: 'Non-striker run out before delivery stride',
      text: 'Bowler enters run-up and breaks the non-striker’s wicket before releasing the ball as the non-striker leaves the crease early under Law 41.16.',
    },
  ];

  const handleAnalyze = async () => {
    if (!scenarioText.trim() || isLoading) return;

    setIsLoading(true);

    try {
      const res = await api.post('/scenarios/analyze', {
        scenario: scenarioText.trim(),
        format: authorityFramework.includes('T20') ? 'T20' : 'ALL',
        competition: authorityFramework,
      });

      const data = res.data?.data;
      if (data) {
        setAnalysisResult((prev) => ({
          ...prev,
          title: data.determination || data.applicableLaws?.[0]?.title || prev.title,
          summary: data.rationale || data.decision || prev.summary,
          phases: data.steps?.length
            ? data.steps.map((st, i) => ({
                step: `${i + 1}`,
                title: st.title || `Phase ${i + 1}`,
                lawBadge: st.lawClause || `Statute § ${i + 1}`,
                description: st.description || st.text,
                isCritical: i === 1,
              }))
            : prev.phases,
        }));
      }
    } catch (err) {
      console.warn('Backend scenario analyze fallback:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyRuling = () => {
    const text = `[SCENARIO ADJUDICATION DETERMINATION]\n` +
      `Incident: ${scenarioText}\n` +
      `Ruling: ${analysisResult.title}\n` +
      `Summary: ${analysisResult.summary}\n` +
      `Authority: ${authorityFramework}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportBrief = () => {
    const docketText = `==========================================================\n` +
      `CRICLAWS SCENARIO ANALYSER & STATUTORY SYNTHESIS\n` +
      `AUTHORITY: ${authorityFramework} | PHASE: ${matchPhase}\n` +
      `==========================================================\n\n` +
      `INCIDENT TRANSCRIPT:\n${scenarioText}\n\n` +
      `DETERMINATION:\n${analysisResult.title}\n\n` +
      `RATIONALE:\n${analysisResult.summary}\n\n` +
      `SEQUENTIAL EVENT CHRONOLOGY:\n` +
      analysisResult.phases.map((p) => `* Step ${p.step}: ${p.title} (${p.lawBadge})\n  ${p.description}`).join('\n\n') +
      `\n\nTOURNAMENT VARIATION:\n${analysisResult.formatDivergence.text}\n` +
      `==========================================================\n`;

    const blob = new Blob([docketText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Scenario-Analysis-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col gap-6 animate-fadeIn">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-brand-border/60">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#EDF4F0] text-[#0F241D] text-xs font-semibold tracking-wider uppercase mb-2 border border-[#D5E2DA]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0F241D]"></span>
            MULTI-EVENT ADJUDICATION
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#0F241D] font-medium tracking-tight">
            Scenario Analyser
          </h1>
          <p className="font-sans text-sm text-slate-600 mt-1 max-w-2xl">
            Break down compound match incidents against MCC 42 Laws and ICC Playing Conditions.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleExportBrief}
            className="px-3 py-1.5 rounded-lg bg-white hover:bg-[#F8FAF9] border border-[#D5E2DA] text-[#14201A] text-xs font-medium transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <span className="material-symbols-outlined text-[15px]">download</span>
            <span>Export Brief</span>
          </button>
        </div>
      </div>

      {/* Primary Input Card (Compact & Ergonomic) */}
      <div className="bg-white rounded-xl border border-[#D5E2DA] shadow-xs p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <label htmlFor="scenarioInput" className="text-xs font-semibold uppercase tracking-wider text-slate-600">
            Incident Description
          </label>
          <span className="text-xs text-slate-400">Describe the sequence of field events</span>
        </div>

        <textarea
          id="scenarioInput"
          rows={3}
          value={scenarioText}
          onChange={(e) => setScenarioText(e.target.value)}
          placeholder="Describe the incident (e.g. Bowler stopped in delivery stride, ball bounced twice, non-striker left crease)..."
          className="w-full p-3 rounded-lg border border-[#D5E2DA] focus:border-[#0F241D] focus:ring-1 focus:ring-[#0F241D] text-sm text-[#14201A] placeholder:text-gray-400 leading-relaxed outline-none"
        />

        {/* Quick Presets: Understated Pill Buttons */}
        <div className="flex flex-col gap-2">
          <span className="text-xs text-slate-500 font-medium">Quick Incident Presets:</span>
          <div className="flex flex-wrap gap-2">
            {presets.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setScenarioText(preset.text)}
                className={`px-3 py-1 rounded-lg text-xs transition-all border ${
                  scenarioText === preset.text
                    ? 'bg-[#0F241D] text-white border-[#0F241D]'
                    : 'bg-[#F8FAF9] hover:bg-[#EDF4F0] text-slate-700 border-[#D5E2DA]'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Compact Settings & Action Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#D5E2DA]/60">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <span className="text-slate-400">Authority:</span>
              <select
                value={authorityFramework}
                onChange={(e) => setAuthorityFramework(e.target.value)}
                className="bg-[#F8FAF9] border border-[#D5E2DA] rounded px-2 py-1 text-xs text-[#14201A] font-medium outline-none"
              >
                <option value="ICC Men's T20I Playing Conditions">ICC Men's T20I</option>
                <option value="MCC 2017 Code (Universal)">MCC 2017 Code</option>
                <option value="ICC World Test Championship">ICC Test Match</option>
              </select>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <span className="text-slate-400">Phase:</span>
              <select
                value={matchPhase}
                onChange={(e) => setMatchPhase(e.target.value)}
                className="bg-[#F8FAF9] border border-[#D5E2DA] rounded px-2 py-1 text-xs text-[#14201A] font-medium outline-none"
              >
                <option value="Powerplay (Overs 0.1 - 5.6)">Powerplay</option>
                <option value="Middle Overs (6.1 - 15.6)">Middle Overs</option>
                <option value="Death Overs (16.1 - 20.0)">Death Overs</option>
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAnalyze}
            disabled={isLoading}
            className="w-full sm:w-auto px-5 py-2.5 bg-[#0F241D] hover:bg-[#16382C] text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs shrink-0 disabled:opacity-50"
          >
            <span>{isLoading ? 'Analysing Sequence…' : 'Analyse Sequence'}</span>
            <span className="material-symbols-outlined text-[15px]">
              {isLoading ? 'hourglass_top' : 'arrow_forward'}
            </span>
          </button>
        </div>
      </div>

      {/* Analysis Results Section */}
      <div className="flex flex-col gap-5">
        
        {/* Determination Card */}
        <article className="bg-white rounded-xl border border-[#D5E2DA] shadow-xs overflow-hidden">
          <div className="bg-[#0F241D] text-white px-5 py-3 flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wider uppercase text-emerald-200">
              Statutory Synthesis Determination
            </span>
            <span className="text-xs text-white/70">{authorityFramework}</span>
          </div>

          <div className="p-5 sm:p-6 flex flex-col gap-4">
            <div>
              <span className="text-xs uppercase font-bold text-[#9B2226] block mb-1">
                {analysisResult.determination}
              </span>
              <h2 className="font-serif text-2xl text-[#0F241D] font-medium leading-snug">
                {analysisResult.title}
              </h2>
            </div>

            <p className="text-sm text-slate-700 leading-relaxed border-t border-[#D5E2DA]/60 pt-3">
              {analysisResult.summary}
            </p>

            {/* Sequential Event Chronology (Innovative Clean Stepper) */}
            <div className="flex flex-col gap-3 pt-2">
              <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                Sequential Event Chronology
              </span>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {analysisResult.phases.map((phase) => (
                  <div
                    key={phase.step}
                    className={`p-4 rounded-lg border flex flex-col justify-between ${
                      phase.isCritical
                        ? 'bg-red-50/40 border-red-200'
                        : 'bg-[#F8FAF9] border-[#D5E2DA]'
                    }`}
                  >
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#0F241D]">
                          Step {phase.step}
                        </span>
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                          phase.isCritical ? 'bg-red-100 text-red-800' : 'bg-white text-slate-700 border border-[#D5E2DA]'
                        }`}>
                          {phase.lawBadge}
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-[#14201A]">
                        {phase.title}
                      </h4>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {phase.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tournament Divergence Card */}
            <div className="p-4 rounded-lg bg-emerald-50/60 border border-emerald-200/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-emerald-950 uppercase tracking-wide">
                  {analysisResult.formatDivergence.title}
                </span>
                <p className="text-xs text-emerald-950 leading-relaxed">
                  {analysisResult.formatDivergence.text}
                </p>
              </div>
              <span className="shrink-0 px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded">
                {analysisResult.formatDivergence.badge}
              </span>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-[#D5E2DA]/60 text-xs text-slate-500">
              <span>Grounding: 100% Codified MCC Laws</span>
              <button
                type="button"
                onClick={handleCopyRuling}
                className="px-3 py-1.5 rounded bg-[#F8FAF9] hover:bg-[#EDF4F0] border border-[#D5E2DA] text-[#14201A] font-medium transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px]">
                  {copied ? 'check' : 'content_copy'}
                </span>
                <span>{copied ? 'Copied' : 'Copy Determination'}</span>
              </button>
            </div>

          </div>
        </article>

      </div>

      <CitationModal
        citation={activeCitation}
        isOpen={Boolean(activeCitation)}
        onClose={() => setActiveCitation(null)}
      />

    </div>
  );
}
