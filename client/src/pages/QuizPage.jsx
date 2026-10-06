import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function QuizPage() {
  const navigate = useNavigate();

  // Configuration state
  const [selectedModule, setSelectedModule] = useState(1);
  const [difficulty, setDifficulty] = useState('Intermediate');
  const [questionCount, setQuestionCount] = useState(3);
  const [timeOption, setTimeOption] = useState('timed');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  // Active quiz execution state
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(90);

  const modules = [
    {
      id: 1,
      tag: 'Module 01',
      title: 'Universal Rules & Spirit',
      topicKey: 'general',
      desc: 'Preamble, Match Officials, Pitch Dimensions, & Equipment Standards.',
      clauses: '124 Clauses',
    },
    {
      id: 2,
      tag: 'Module 02',
      title: 'Law 28: Fielders & Helmets',
      topicKey: 'fielding',
      desc: 'Fielder positioning restrictions, illegal fielding, helmet contact & 5 penalty runs.',
      clauses: '38 Clauses',
    },
    {
      id: 3,
      tag: 'Module 03',
      title: 'Law 19 & 33: Boundaries & Catches',
      topicKey: 'boundaries',
      desc: 'Airborne fielders, boundary ropes, cushion contact, and fair catch criteria.',
      clauses: '46 Clauses',
    },
    {
      id: 4,
      tag: 'Module 04',
      title: 'Law 21: No Balls & Free Hits',
      topicKey: 'no-balls',
      desc: 'Crease infringements, beamers, multi-bounce pitches, and ICC Free Hit rules.',
      clauses: '52 Clauses',
    },
    {
      id: 5,
      tag: 'Module 05',
      title: 'Laws 30–39: Dismissals',
      topicKey: 'dismissals',
      desc: 'LBW guidelines, Run Out criteria, Timed Out thresholds, and appeal protocols.',
      clauses: '89 Clauses',
    },
    {
      id: 6,
      tag: 'Module 06',
      title: 'Laws 41 & 42: Unfair Play & Conduct',
      topicKey: 'conduct',
      desc: 'Ball tampering, deliberate distraction, player conduct levels, and penalty runs.',
      clauses: '64 Clauses',
    },
  ];

  // Timer countdown during active quiz
  useEffect(() => {
    if (!activeQuiz || timeOption === 'untimed') return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [activeQuiz, currentIndex, timeOption]);

  const handleStartExamination = async () => {
    setIsGenerating(true);
    setError(null);

    const activeMod = modules.find((m) => m.id === selectedModule);

    try {
      const res = await api.post('/quizzes/generate', {
        topic: activeMod?.topicKey || 'general',
        difficulty: difficulty.toLowerCase(),
        questionCount: parseInt(questionCount, 10),
      });

      const quizData = res.data?.data;
      if (quizData && quizData.questions?.length > 0) {
        setActiveQuiz(quizData);
        setCurrentIndex(0);
        setUserAnswers({});
        setTimeLeft(timeOption === 'strict' ? 45 : 90);
      } else {
        throw new Error('Fallback to local official test questions');
      }
    } catch (err) {
      // High-quality codified fallback questions
      const fallbackQuestions = [
        {
          _id: 'q1',
          questionText:
            'If a ball in play strikes a protective helmet placed on the ground behind the wicket-keeper, what is the mandatory umpire ruling?',
          options: [
            { id: 'A', text: '5 penalty runs awarded; play continues live' },
            { id: 'B', text: 'Ball immediately dead; 5 penalty runs awarded to batting side' },
            { id: 'C', text: 'Umpire discretion to award 5 runs only if deemed deliberate' },
            { id: 'D', text: 'Dead ball called without penalty run imposition' },
          ],
          citation: { law: '28.3', text: 'MCC Law 28.3.2 (Protective Equipment)' },
        },
        {
          _id: 'q2',
          questionText:
            'A bowler halts delivery stride before releasing the ball and runs out the non-striker who has stepped out of the crease early. Is this out?',
          options: [
            { id: 'A', text: 'Yes, legitimate Run Out under Law 41.16 before ball release' },
            { id: 'B', text: 'No, instant Dead Ball and 5 penalty runs to batting side' },
            { id: 'C', text: 'Permissible only if the bowler issued a prior formal warning' },
            { id: 'D', text: 'Illegal action classified as Level 2 Unfair Play conduct' },
          ],
          citation: { law: '41.16', text: 'MCC Law 41.16 (Non-striker leaving ground early)' },
        },
        {
          _id: 'q3',
          questionText:
            'A delivery pitches three times along the pitch surface before reaching the striker’s popping crease. What is the official call?',
          options: [
            { id: 'A', text: 'Fair delivery if it reaches batsman below waist height' },
            { id: 'B', text: 'No ball under Law 21.10 for bouncing more than once' },
            { id: 'C', text: 'Dead ball immediately with re-bowl mandated' },
            { id: 'D', text: 'Wide ball if outside the standard tramline marks' },
          ],
          citation: { law: '21.10', text: 'MCC Law 21.10 (Ball bouncing more than once)' },
        },
      ];

      setActiveQuiz({
        quizId: `EXAM-${Date.now()}`,
        topic: activeMod?.title || 'Universal Rules',
        difficulty,
        questions: fallbackQuestions.slice(0, parseInt(questionCount, 10)),
      });
      setCurrentIndex(0);
      setUserAnswers({});
      setTimeLeft(timeOption === 'strict' ? 45 : 90);
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

      navigate(`/quiz/${activeQuiz.quizId}/results`, {
        state: { attemptResult: res.data.data },
      });
    } catch (err) {
      // Local grading fallback
      const totalQ = activeQuiz.questions.length;
      let correctCount = 0;
      const resultsBreakdown = activeQuiz.questions.map((q) => {
        const userChoice = userAnswers[q._id];
        const correctChoice = q._id === 'q1' ? 'B' : q._id === 'q2' ? 'A' : 'B';
        const isCorrect = userChoice === correctChoice;
        if (isCorrect) correctCount++;

        return {
          questionText: q.questionText,
          selectedOption: userChoice || 'None',
          selectedOptionText: q.options?.find((o) => o.id === userChoice)?.text || 'No answer selected',
          correctOption: correctChoice,
          correctOptionText: q.options?.find((o) => o.id === correctChoice)?.text || 'Official MCC Ruling',
          isCorrect,
          explanation: 'Evaluated under MCC Laws of Cricket 2017 Code 3rd Edition.',
          citation: q.citation || { lawTitle: 'MCC Law Codex', clauseNumber: '28.3' },
        };
      });

      const percentage = Math.round((correctCount / totalQ) * 100);
      const fallbackResult = {
        quizId: activeQuiz.quizId,
        score: percentage,
        totalQuestions: totalQ,
        correctAnswers: correctCount,
        resultsBreakdown,
        passed: percentage >= 75,
      };

      navigate(`/quiz/${activeQuiz.quizId}/results`, {
        state: { attemptResult: fallbackResult },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col gap-6 animate-fadeIn">
      
      {/* ============================================================ */}
      {/* VIEW 1: QUIZ CONFIGURATION (Clean & Intuitive)               */}
      {/* ============================================================ */}
      {!activeQuiz && (
        <>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-brand-border/60">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#EDF4F0] text-[#0F241D] text-xs font-semibold tracking-wider uppercase mb-2 border border-[#D5E2DA]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0F241D]"></span>
                ACCREDITATION &amp; ASSESSMENT
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl text-[#0F241D] font-medium tracking-tight">
                Umpire Assessment &amp; Laws Quiz
              </h1>
              <p className="font-sans text-sm text-slate-600 mt-1">
                Test and sharpen your officiating decisions with scenario-based rulebook questions.
              </p>
            </div>

            {/* Candidate Summary Pill */}
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-[#D5E2DA] shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="text-xs text-slate-600">Candidate Standing:</span>
              <span className="text-xs font-bold text-[#0F241D]">Tier II Certified (88%)</span>
            </div>
          </div>

          {/* Module Selection Grid */}
          <div className="flex flex-col gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              Select Examination Module
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {modules.map((mod) => (
                <div
                  key={mod.id}
                  onClick={() => setSelectedModule(mod.id)}
                  className={`cursor-pointer p-4 rounded-xl border transition-all flex flex-col justify-between ${
                    selectedModule === mod.id
                      ? 'bg-white border-[#0F241D] shadow-sm ring-1 ring-[#0F241D]'
                      : 'bg-white/80 hover:bg-white border-[#D5E2DA] hover:border-slate-400'
                  }`}
                >
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold font-mono text-emerald-800 bg-[#EDF4F0] px-2 py-0.5 rounded">
                        {mod.tag}
                      </span>
                      <input
                        type="radio"
                        checked={selectedModule === mod.id}
                        onChange={() => setSelectedModule(mod.id)}
                        className="accent-[#0F241D]"
                      />
                    </div>
                    <h3 className="font-serif text-base font-semibold text-[#14201A]">
                      {mod.title}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {mod.desc}
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-[#D5E2DA]/50 text-[11px] text-slate-500 flex items-center justify-between">
                    <span>Codified Content</span>
                    <span className="font-medium text-[#0F241D]">{mod.clauses}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quiz Settings & Start Action Bar */}
          <div className="bg-white rounded-xl border border-[#D5E2DA] shadow-xs p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-700">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">Questions:</span>
                <select
                  value={questionCount}
                  onChange={(e) => setQuestionCount(e.target.value)}
                  className="bg-[#F8FAF9] border border-[#D5E2DA] rounded px-2 py-1 text-xs text-[#14201A] font-semibold outline-none"
                >
                  <option value={3}>3 Questions</option>
                  <option value={5}>5 Questions</option>
                  <option value={10}>10 Questions</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">Difficulty:</span>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="bg-[#F8FAF9] border border-[#D5E2DA] rounded px-2 py-1 text-xs text-[#14201A] font-semibold outline-none"
                >
                  <option value="Intermediate">Intermediate Panel</option>
                  <option value="Elite">Elite Panel</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">Timer:</span>
                <select
                  value={timeOption}
                  onChange={(e) => setTimeOption(e.target.value)}
                  className="bg-[#F8FAF9] border border-[#D5E2DA] rounded px-2 py-1 text-xs text-[#14201A] font-semibold outline-none"
                >
                  <option value="timed">Timed (90s / question)</option>
                  <option value="untimed">Practice (Untimed)</option>
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={handleStartExamination}
              disabled={isGenerating}
              className="w-full sm:w-auto px-6 py-2.5 bg-[#0F241D] hover:bg-[#16382C] text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs shrink-0 disabled:opacity-50"
            >
              <span>{isGenerating ? 'Preparing Examination…' : 'Start Assessment'}</span>
              <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
            </button>
          </div>
        </>
      )}

      {/* ============================================================ */}
      {/* VIEW 2: ACTIVE QUESTION STATE (Focused & Ergonomic)           */}
      {/* ============================================================ */}
      {activeQuiz && (
        <div className="flex flex-col gap-5">
          {/* Quiz Status Header Bar */}
          <div className="bg-white rounded-xl border border-[#D5E2DA] shadow-xs p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-[#0F241D] bg-[#EDF4F0] px-2.5 py-1 rounded">
                Question {currentIndex + 1} of {activeQuiz.questions.length}
              </span>
              <span className="text-xs text-slate-600 font-medium hidden sm:inline">
                {activeQuiz.topic}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {timeOption === 'timed' && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-50 text-amber-900 border border-amber-200 text-xs font-bold">
                  <span className="material-symbols-outlined text-[15px]">timer</span>
                  <span>{timeLeft}s remaining</span>
                </div>
              )}
              <button
                type="button"
                onClick={() => setActiveQuiz(null)}
                className="text-xs text-slate-500 hover:text-slate-800"
              >
                Exit quiz
              </button>
            </div>
          </div>

          {/* Current Question Card */}
          <article className="bg-white rounded-xl border border-[#D5E2DA] shadow-sm p-6 sm:p-8 flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Adjudication Scenario
              </span>
              <h2 className="font-serif text-xl sm:text-2xl text-[#0F241D] font-medium leading-snug">
                {activeQuiz.questions[currentIndex]?.questionText}
              </h2>
            </div>

            {/* Answer Options */}
            <div className="flex flex-col gap-2.5">
              {activeQuiz.questions[currentIndex]?.options?.map((option) => {
                const currentQId = activeQuiz.questions[currentIndex]._id;
                const isSelected = userAnswers[currentQId] === option.id;

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleSelectOption(currentQId, option.id)}
                    className={`w-full text-left p-4 rounded-xl border transition-all flex items-center gap-3.5 ${
                      isSelected
                        ? 'bg-[#EDF4F0] border-[#0F241D] text-[#0F241D] shadow-2xs'
                        : 'bg-[#F8FAF9] hover:bg-white border-[#D5E2DA] text-[#14201A]'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-[#0F241D] text-white'
                          : 'bg-white border border-[#D5E2DA] text-slate-700'
                      }`}
                    >
                      {option.id}
                    </div>
                    <span className="text-sm font-medium leading-relaxed">{option.text}</span>
                  </button>
                );
              })}
            </div>

            {/* Navigation / Submission Bar */}
            <div className="flex items-center justify-between pt-4 border-t border-[#D5E2DA]/60">
              <button
                type="button"
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((prev) => prev - 1)}
                className="px-4 py-2 rounded-lg border border-[#D5E2DA] text-xs font-medium text-slate-700 hover:bg-[#F8FAF9] disabled:opacity-40 disabled:pointer-events-none transition-colors"
              >
                Previous
              </button>

              {currentIndex < activeQuiz.questions.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentIndex((prev) => prev + 1)}
                  className="px-5 py-2 rounded-lg bg-[#0F241D] hover:bg-[#16382C] text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <span>Next Question</span>
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmitQuiz}
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <span>{isSubmitting ? 'Grading…' : 'Submit Assessment'}</span>
                  <span className="material-symbols-outlined text-[14px]">check</span>
                </button>
              )}
            </div>
          </article>
        </div>
      )}

    </div>
  );
}
