import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import CitationModal from '../components/citations/CitationModal';

export default function QuizResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const attemptResult = location.state?.attemptResult;
  const [activeCitation, setActiveCitation] = useState(null);

  // Fallback demo results if navigated directly
  const resultData = attemptResult || {
    quizId: 'EXAM-DEMO-01',
    score: 67,
    totalQuestions: 3,
    correctAnswers: 2,
    passed: true,
    resultsBreakdown: [
      {
        questionText:
          'If a ball in play strikes a protective helmet placed on the ground behind the wicket-keeper, what is the mandatory umpire ruling?',
        selectedOption: 'B',
        selectedOptionText: 'Ball immediately dead; 5 penalty runs awarded to batting side',
        correctOption: 'B',
        correctOptionText: 'Ball immediately dead; 5 penalty runs awarded to batting side',
        isCorrect: true,
        explanation:
          'Under MCC Law 28.3.2, the ball becomes immediately dead when it strikes placed equipment, and 5 penalty runs are awarded to the batting side.',
        citation: { lawTitle: 'MCC Law 28.3 (Protective Equipment)', clauseNumber: '28.3.2' },
      },
      {
        questionText:
          'A bowler halts delivery stride before releasing the ball and runs out the non-striker who has stepped out of the crease early. Is this out?',
        selectedOption: 'A',
        selectedOptionText: 'Yes, legitimate Run Out under Law 41.16 before ball release',
        correctOption: 'A',
        correctOptionText: 'Yes, legitimate Run Out under Law 41.16 before ball release',
        isCorrect: true,
        explanation:
          'Under MCC Law 41.16, the bowler is permitted to run out the non-striker if they leave their ground early prior to expected ball release.',
        citation: { lawTitle: 'MCC Law 41.16 (Non-striker leaving ground early)', clauseNumber: '41.16' },
      },
      {
        questionText:
          'A delivery pitches three times along the pitch surface before reaching the striker’s popping crease. What is the official call?',
        selectedOption: 'C',
        selectedOptionText: 'Dead ball immediately with re-bowl mandated',
        correctOption: 'B',
        correctOptionText: 'No ball under Law 21.10 for bouncing more than once',
        isCorrect: false,
        explanation:
          'Under MCC Law 21.10, any ball bouncing more than once prior to the popping crease is an automatic No Ball.',
        citation: { lawTitle: 'MCC Law 21.10 (Ball bouncing more than once)', clauseNumber: '21.10' },
      },
    ],
  };

  const { score, totalQuestions, correctAnswers, passed, resultsBreakdown } = resultData;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col gap-6 animate-fadeIn">
      
      {/* Header & Score Summary Card */}
      <div className="bg-white rounded-xl border border-[#D5E2DA] shadow-xs p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex flex-col gap-1.5 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#EDF4F0] text-[#0F241D] text-xs font-semibold tracking-wider uppercase mb-1 border border-[#D5E2DA] self-center sm:self-start">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0F241D]"></span>
            ASSESSMENT COMPLETE
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl text-[#0F241D] font-medium tracking-tight">
            {passed ? 'Certification Benchmark Achieved' : 'Review & Practice Recommended'}
          </h1>
          <p className="font-sans text-xs sm:text-sm text-slate-600">
            {passed
              ? 'Congratulations! Your decisions satisfied the official MCC officiating standards.'
              : 'Review the statutory explanations below to reinforce key cricket law precedents.'}
          </p>
        </div>

        {/* Score Badge */}
        <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-[#F8FAF9] border border-[#D5E2DA] shrink-0 min-w-[140px]">
          <span className="font-serif text-3xl font-bold text-[#0F241D]">{score}%</span>
          <span className="text-xs text-slate-600 mt-0.5">
            {correctAnswers || Math.round((score / 100) * totalQuestions)} of {totalQuestions} Correct
          </span>
          <span className={`text-[11px] font-bold uppercase mt-1 px-2 py-0.5 rounded ${
            passed ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
          }`}>
            {passed ? 'Passed' : 'Needs Review'}
          </span>
        </div>
      </div>

      {/* Breakdown Header */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-600">
          Question-by-Question Breakdown
        </h2>
        <span className="text-xs text-slate-500">Official MCC Code Citations</span>
      </div>

      {/* Results List */}
      <div className="flex flex-col gap-4">
        {resultsBreakdown?.map((item, idx) => (
          <article
            key={idx}
            className={`bg-white rounded-xl border p-5 flex flex-col gap-3 shadow-xs ${
              item.isCorrect ? 'border-[#D5E2DA]' : 'border-amber-200 bg-amber-50/20'
            }`}
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#D5E2DA]/60">
              <span className="text-xs font-bold text-[#0F241D]">Question {idx + 1}</span>
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded flex items-center gap-1 ${
                  item.isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">
                  {item.isCorrect ? 'check' : 'close'}
                </span>
                <span>{item.isCorrect ? 'Correct' : 'Incorrect'}</span>
              </span>
            </div>

            <h3 className="font-serif text-lg font-medium text-[#14201A] leading-snug">
              {item.questionText}
            </h3>

            {/* Answer comparison */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
              <div className="p-2.5 rounded bg-[#F8FAF9] border border-[#D5E2DA]">
                <span className="text-slate-500 block mb-0.5">Your Selected Answer:</span>
                <span className={`font-semibold ${item.isCorrect ? 'text-emerald-800' : 'text-red-700'}`}>
                  {item.selectedOptionText}
                </span>
              </div>
              <div className="p-2.5 rounded bg-[#F8FAF9] border border-[#D5E2DA]">
                <span className="text-slate-500 block mb-0.5">Statutory Decision:</span>
                <span className="font-semibold text-[#0F241D]">
                  {item.correctOptionText}
                </span>
              </div>
            </div>

            {/* Explanation & Citation */}
            <div className="pt-2 border-t border-[#D5E2DA]/60 flex flex-col gap-1 text-xs text-slate-600">
              <p><strong>Rationale:</strong> {item.explanation}</p>
              {item.citation && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[11px] font-mono font-semibold bg-[#EDF4F0] text-[#0F241D] px-2 py-0.5 rounded">
                    {item.citation.lawTitle || `Law ${item.citation.clauseNumber}`}
                  </span>
                </div>
              )}
            </div>
          </article>
        ))}
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-2">
        <Link
          to="/quiz"
          className="px-4 py-2 rounded-lg bg-[#0F241D] hover:bg-[#16382C] text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-[15px]">refresh</span>
          <span>Take Another Quiz</span>
        </Link>

        <Link
          to="/chat"
          className="px-4 py-2 rounded-lg bg-white hover:bg-[#F8FAF9] border border-[#D5E2DA] text-[#14201A] text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-2xs"
        >
          <span>Ask Adjudication Desk</span>
          <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
        </Link>
      </div>

      <CitationModal
        citation={activeCitation}
        isOpen={Boolean(activeCitation)}
        onClose={() => setActiveCitation(null)}
      />

    </div>
  );
}
