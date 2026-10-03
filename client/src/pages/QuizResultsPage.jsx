import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { 
  Award, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  BookOpen, 
  ShieldCheck, 
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import CitationModal from '../components/citations/CitationModal';

export default function QuizResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const attemptResult = location.state?.attemptResult;
  const [activeCitation, setActiveCitation] = useState(null);

  if (!attemptResult) {
    return (
      <div className="flex-1 max-w-md mx-auto flex flex-col justify-center items-center text-center p-6 space-y-4">
        <Award className="w-12 h-12 text-slate-600" />
        <h2 className="text-xl font-bold text-white">No Active Quiz Results</h2>
        <p className="text-xs text-slate-400">Complete an examination to review your score and official rule explanations.</p>
        <Link
          to="/quiz"
          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold"
        >
          Go to Quizzes
        </Link>
      </div>
    );
  }

  const { score, totalQuestions, percentage, passed, results } = attemptResult;

  return (
    <div className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-8 pb-12">
      {/* Top Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-purple-900/60 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-purple-950 text-purple-300 border border-purple-800">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Official Examination Certified</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white">
            {passed ? 'Examination Passed!' : 'Review & Practice Recommended'}
          </h1>
          <p className="text-xs text-slate-400 max-w-md">
            Every answer has been verified against the official MCC Laws of Cricket and ICC Playing Conditions database.
          </p>
        </div>

        {/* Score Circle */}
        <div className="shrink-0 flex flex-col items-center justify-center w-32 h-32 rounded-full bg-slate-900 border-4 border-purple-500/80 shadow-xl shadow-purple-950/60">
          <span className="text-3xl font-extrabold text-white font-mono">{percentage}%</span>
          <span className="text-xs font-semibold text-purple-300">
            {score} / {totalQuestions} Correct
          </span>
        </div>
      </div>

      {/* Questions Breakdown */}
      <div className="space-y-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-2">
          <BookOpen className="w-4 h-4 text-purple-400" />
          <span>Detailed Legal Breakdown & Citations:</span>
        </h2>

        {results.map((item, idx) => (
          <div
            key={idx}
            className={`p-6 rounded-2xl border transition-all space-y-4 shadow-lg ${
              item.isCorrect
                ? 'bg-slate-900/60 border-emerald-900/60'
                : 'bg-slate-900/60 border-red-900/60'
            }`}
          >
            {/* Question Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <span className="text-[11px] font-mono font-bold uppercase text-slate-400">
                  Question {idx + 1}
                </span>
                <h3 className="text-base font-bold text-white leading-snug">
                  {item.questionText}
                </h3>
              </div>

              <div className="shrink-0">
                {item.isCorrect ? (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Correct</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-950 text-red-400 border border-red-800">
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Incorrect</span>
                  </span>
                )}
              </div>
            </div>

            {/* Answer Comparison */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-slate-500 uppercase text-[10px] block font-bold">Your Response:</span>
                <span className={`font-semibold ${item.isCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
                  Option {item.selectedOption || 'None (Unanswered)'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-slate-500 uppercase text-[10px] block font-bold">Official Ruling Answer:</span>
                <span className="font-semibold text-emerald-400">
                  Option {item.correctAnswer}
                </span>
              </div>
            </div>

            {/* Explanation */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-slate-200 leading-relaxed font-mono">
              <span className="text-amber-400 font-bold block mb-1 font-sans">Official Explanation:</span>
              {item.explanation}
            </div>

            {/* Citations */}
            {item.citations && item.citations.length > 0 && (
              <div className="flex items-center space-x-2 pt-2 border-t border-slate-800/60 text-xs">
                <span className="text-slate-400 font-medium">Supporting Law:</span>
                {item.citations.map((cite, cIdx) => (
                  <button
                    key={cIdx}
                    onClick={() => setActiveCitation(cite)}
                    className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 font-mono font-semibold transition-colors border border-slate-700"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                    <span>{cite.lawTitle || `Clause ${cite.clauseNumber}`}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Bottom Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800">
        <Link
          to="/"
          className="flex items-center space-x-1.5 text-slate-400 hover:text-white text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return Home</span>
        </Link>

        <div className="flex items-center space-x-3">
          <Link
            to="/chat"
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            Study with Chatbot
          </Link>
          <button
            onClick={() => navigate('/quiz')}
            className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-colors shadow-lg shadow-purple-950 flex items-center space-x-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Take Another Quiz</span>
          </button>
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
