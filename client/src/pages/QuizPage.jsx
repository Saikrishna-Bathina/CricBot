import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  HelpCircle, 
  Award, 
  CheckCircle, 
  ArrowRight, 
  RotateCcw, 
  ShieldCheck, 
  BookOpen, 
  Layers,
  Sparkles
} from 'lucide-react';
import api from '../services/api';

export default function QuizPage() {
  const navigate = useNavigate();

  // Configuration state
  const [topic, setTopic] = useState('general');
  const [difficulty, setDifficulty] = useState('intermediate');
  const [questionCount, setQuestionCount] = useState(3);
  const [isGenerating, setIsGenerating] = useState(false);

  // Active quiz state
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({}); // { questionId: 'A' }
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const topics = [
    { id: 'general', name: 'Universal Rules & Spirit', count: '42 Laws' },
    { id: 'fielding', name: 'Law 28 - The Fielder & Helmets', count: 'Law 28' },
    { id: 'boundaries', name: 'Law 19 - Boundaries & Catches', count: 'Law 19' },
    { id: 'no-balls', name: 'Law 21 - No Balls & Free Hits', count: 'Law 21' },
    { id: 'dismissals', name: 'Dismissals (LBW, Run Out, Timed Out)', count: 'Laws 30-39' },
  ];

  const handleStartQuiz = async (e) => {
    e.preventDefault();
    setIsGenerating(true);
    setError(null);

    try {
      const res = await api.post('/quizzes/generate', {
        topic,
        difficulty,
        questionCount: parseInt(questionCount, 10),
      });

      setActiveQuiz(res.data.data);
      setCurrentIndex(0);
      setUserAnswers({});
    } catch (err) {
      setError(err.message || 'Failed to generate quiz. Please try another topic.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectOption = (questionId, optionId) => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  const handleSubmitQuiz = async () => {
    if (!activeQuiz) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const responses = activeQuiz.questions.map((q) => ({
        questionId: q._id,
        selectedOption: userAnswers[q._id] || '',
      }));

      const res = await api.post(`/quizzes/${activeQuiz.quizId}/submit`, {
        responses,
      });

      // Pass attempt data via React Router state to results page
      navigate(`/quiz/${activeQuiz.quizId}/results`, {
        state: { attemptResult: res.data.data },
      });
    } catch (err) {
      setError(err.message || 'Failed to submit quiz. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-purple-950/80 border border-purple-800/80 flex items-center justify-center text-purple-400 shadow-lg">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
              <span>Cricket Laws Mastery Quiz</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800 font-mono">
                Verified Scoring
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Test your knowledge of official MCC Laws & ICC regulations with server-verified scoring
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/60 border border-red-800 text-red-200 text-xs">
          {error}
        </div>
      )}

      {/* State A: Quiz Configuration Generator */}
      {!activeQuiz && (
        <div className="p-6 sm:p-8 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-6 shadow-xl">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>Configure Your Examination</span>
            </h2>
            <p className="text-xs text-slate-400">
              Questions are synthesized from published official rulebooks and test legal nuances.
            </p>
          </div>

          <form onSubmit={handleStartQuiz} className="space-y-6">
            {/* Topic Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
                Select Regulation Module:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {topics.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => setTopic(t.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      topic === t.id
                        ? 'bg-purple-950/60 border-purple-500 text-white shadow-md'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold">{t.name}</h4>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-purple-300 border border-purple-900/60">
                        {t.count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Difficulty & Count */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Difficulty Level:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['beginner', 'intermediate', 'advanced'].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setDifficulty(lvl)}
                      className={`py-2 rounded-lg font-semibold capitalize transition-all border ${
                        difficulty === lvl
                          ? 'bg-purple-600 text-white border-purple-500 shadow-md'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Number of Questions:
                </label>
                <select
                  value={questionCount}
                  onChange={(e) => setQuestionCount(e.target.value)}
                  className="w-full rounded-lg bg-slate-900 border border-slate-700 p-2 text-white font-medium focus:outline-none"
                >
                  <option value={2}>2 Questions (Quick Check)</option>
                  <option value={3}>3 Questions (Standard)</option>
                  <option value={5}>5 Questions (Comprehensive)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={isGenerating}
              className="w-full py-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm transition-colors shadow-lg shadow-purple-950 flex items-center justify-center space-x-2"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin"></div>
                  <span>Assembling Official Questions...</span>
                </>
              ) : (
                <>
                  <Award className="w-4 h-4" />
                  <span>Begin Examination</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* State B: Active Quiz Runner */}
      {activeQuiz && (
        <div className="p-6 sm:p-8 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-6 shadow-2xl">
          {/* Progress Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <span className="text-xs uppercase font-mono text-purple-400 font-bold">
                Question {currentIndex + 1} of {activeQuiz.questions.length}
              </span>
              <h3 className="text-base font-bold text-white mt-0.5">{activeQuiz.title}</h3>
            </div>
            <button
              onClick={() => setActiveQuiz(null)}
              className="text-xs text-slate-400 hover:text-white flex items-center space-x-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Quit Quiz</span>
            </button>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-purple-500 h-full transition-all duration-300"
              style={{
                width: `${((currentIndex + 1) / activeQuiz.questions.length) * 100}%`,
              }}
            ></div>
          </div>

          {/* Current Question */}
          {activeQuiz.questions[currentIndex] && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-[11px] font-mono text-amber-400 uppercase font-bold">
                  {activeQuiz.questions[currentIndex].lawReference?.sourceTitle || 'Official Rule'}
                </span>
                <p className="text-base font-semibold text-white leading-relaxed">
                  {activeQuiz.questions[currentIndex].questionText}
                </p>
              </div>

              {/* Options */}
              <div className="space-y-3">
                {activeQuiz.questions[currentIndex].options.map((opt) => {
                  const currentQId = activeQuiz.questions[currentIndex]._id;
                  const isSelected = userAnswers[currentQId] === opt.id;

                  return (
                    <div
                      key={opt.id}
                      onClick={() => handleSelectOption(currentQId, opt.id)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center space-x-3 text-sm ${
                        isSelected
                          ? 'bg-purple-950/80 border-purple-500 text-white shadow-md'
                          : 'bg-slate-900/50 hover:bg-slate-900 border-slate-800 text-slate-300'
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold shrink-0 ${
                          isSelected
                            ? 'bg-purple-500 text-white'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {opt.id}
                      </div>
                      <span className="leading-snug">{opt.text}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              onClick={() => setCurrentIndex((idx) => Math.max(0, idx - 1))}
              disabled={currentIndex === 0}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs font-semibold transition-colors"
            >
              Previous
            </button>

            {currentIndex < activeQuiz.questions.length - 1 ? (
              <button
                onClick={() => setCurrentIndex((idx) => idx + 1)}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-colors shadow-md flex items-center space-x-1.5"
              >
                <span>Next Question</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={handleSubmitQuiz}
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white font-semibold text-xs transition-colors shadow-lg shadow-emerald-950 flex items-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-white/20 border-t-white animate-spin"></div>
                    <span>Evaluating Submission...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Submit Examination</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
