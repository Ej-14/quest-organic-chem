import { useEffect, useRef } from 'react';
import { X, CheckCircle, XCircle, AlertCircle, RotateCcw, Trophy, Target, ArrowRight, BookOpen, Shuffle } from 'lucide-react';
import * as anime from 'animejs';

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: string;
  rationale: string;
  chapterId: number;
  chapterTitle: string;
  globalIndex: number;
}

interface Chapter {
  id: number;
  title: string;
  questions: Question[];
}

interface ResultModalProps {
  chapter: Chapter;
  questions: Question[];
  userAnswers: { questionId: number; chapterId: number; selectedOption: string }[];
  onClose: () => void;
  onRestart: () => void;
  onContinue: () => void;
  onReshuffle?: () => void;
  hasNextChapter: boolean;
  isShuffleMode?: boolean;
}

export default function ResultModal({ 
  chapter, 
  questions, 
  userAnswers, 
  onClose, 
  onRestart, 
  onContinue,
  onReshuffle,
  hasNextChapter,
  isShuffleMode = false
}: ResultModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const statsRefs = useRef<HTMLDivElement[]>([]);
  const questionRefs = useRef<HTMLDivElement[]>([]);

  const correctCount = userAnswers.filter(answer => {
    const question = questions.find(q => q.id === answer.questionId && q.chapterId === answer.chapterId);
    return question && answer.selectedOption.charAt(0) === question.correctAnswer;
  }).length;

  const totalQuestions = questions.length;
  const percentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  useEffect(() => {
    if (!overlayRef.current || !contentRef.current) return;

    anime.animate(overlayRef.current, {
      opacity: [0, 1],
      duration: 300,
      easing: 'easeOutQuad'
    });

    anime.animate(contentRef.current, {
      opacity: [0, 1],
      scale: [0.9, 1],
      duration: 400,
      easing: 'easeOutElastic(1, .6)'
    });

    const statElements = statsRefs.current.filter(Boolean);
    anime.animate(statElements, {
      opacity: [0, 1],
      translateY: [20, 0],
      delay: anime.stagger(100, { start: 300 }),
      duration: 400,
      easing: 'easeOutQuad'
    });

    const questionElements = questionRefs.current.filter(Boolean);
    anime.animate(questionElements, {
      opacity: [0, 1],
      translateY: [20, 0],
      delay: anime.stagger(50, { start: 500 }),
      duration: 400,
      easing: 'easeOutQuad'
    });

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [onClose]);

  const getGrade = () => {
    if (percentage >= 90) return { label: 'Excellent!', icon: Trophy, color: 'text-yellow-500' };
    if (percentage >= 70) return { label: 'Good Job!', icon: Target, color: 'text-green-500' };
    if (percentage >= 50) return { label: 'Keep Practicing', icon: AlertCircle, color: 'text-orange-500' };
    return { label: 'Needs Improvement', icon: XCircle, color: 'text-red-500' };
  };

  const grade = getGrade();
  const GradeIcon = grade.icon;
  const chapterNum = chapter.id;

  return (
    <>
      <div
        ref={overlayRef}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={modalRef}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          ref={contentRef}
          className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] shadow-2xl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="result-title"
        >
          <div className="p-6 md:p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 id="result-title" className="text-2xl md:text-3xl font-bold text-[var(--color-text)]">
                  Exam Complete
                </h2>
                <p className="text-[var(--color-text-muted)] mt-1">
                  {isShuffleMode 
                    ? `You've finished Stage ${chapterNum} of the Organic Chemistry Board Examination (Shuffle Mode)`
                    : `You've finished Chapter ${chapterNum} of the Organic Chemistry Board Examination`}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-[var(--color-border)] transition-colors text-[var(--color-text-muted)]"
                aria-label="Close results"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-8 p-4 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)]">
              <div className="flex items-center gap-3 mb-4">
                <BookOpen className="w-8 h-8 text-[var(--color-accent)]" />
                <div>
                  <h3 className="text-lg font-semibold text-[var(--color-text)]">{chapter.title}</h3>
                  <p className="text-sm text-[var(--color-text-muted)]">
                    {correctCount} of {totalQuestions} correct • {percentage}% score
                  </p>
                </div>
              </div>
              <div className="h-2 bg-[var(--color-border)] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[var(--color-accent)] to-[#2d8b8b] rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div
                ref={(el) => { statsRefs.current[0] = el!; }}
                className="p-4 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] text-center"
              >
                <div className="text-3xl md:text-4xl font-bold text-green-500">{correctCount}</div>
                <div className="text-sm text-[var(--color-text-muted)]">Correct Answers</div>
              </div>
              <div
                ref={(el) => { statsRefs.current[1] = el!; }}
                className="p-4 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] text-center"
              >
                <div className="text-3xl md:text-4xl font-bold text-[var(--color-text)]">{totalQuestions}</div>
                <div className="text-sm text-[var(--color-text-muted)]">Total Questions</div>
              </div>
              <div
                ref={(el) => { statsRefs.current[2] = el!; }}
                className="p-4 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] text-center relative"
              >
                <GradeIcon className={`w-8 h-8 mx-auto mb-2 ${grade.color}`} />
                <div className="text-3xl md:text-4xl font-bold text-[var(--color-text)]">{percentage}%</div>
                <div className="text-sm text-[var(--color-text-muted)]">{grade.label}</div>
              </div>
            </div>

            <div className="space-y-4">
              {questions.map((question, qIndex) => {
                const userAnswer = userAnswers.find(a => a.questionId === question.id);
                const selectedLetter = userAnswer ? userAnswer.selectedOption.charAt(0) : null;
                const isCorrect = selectedLetter === question.correctAnswer;
                const isAnswered = !!userAnswer;

                return (
                  <div 
                    key={question.globalIndex} 
                    ref={(el) => { questionRefs.current[qIndex] = el!; }}
                    className="p-4 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)]"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`flex-shrink-0 w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-medium ${
                        isCorrect ? 'bg-green-500 border-green-500 text-white' :
                        isAnswered ? 'bg-red-500 border-red-500 text-white' :
                        'border-[var(--color-border)] text-[var(--color-text-muted)]'
                      }`}>
                        {isCorrect ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : isAnswered ? (
                          <XCircle className="w-5 h-5" />
                        ) : (
                          <span>{qIndex + 1}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--color-text)] mb-2">
                          {question.question}
                        </p>
                        <div className="flex flex-wrap gap-2 text-xs mb-2">
                          {question.options.map((opt, oIndex) => {
                            const letter = opt.charAt(0);
                            const isSelected = selectedLetter === letter;
                            const isCorrectOpt = letter === question.correctAnswer;
                            
                            return (
                              <span
                                key={oIndex}
                                className={`px-2 py-1 rounded text-xs ${
                                  isCorrectOpt ? 'bg-green-500/20 text-green-700 dark:text-green-300 border border-green-500' :
                                  isSelected ? 'bg-red-500/20 text-red-700 dark:text-red-300 border border-red-500' :
                                  'bg-[var(--color-bg)] text-[var(--color-text-muted)] border border-[var(--color-border)]'
                                }`}
                              >
                                {opt}
                              </span>
                            );
                          })}
                        </div>
                        {(isAnswered || isCorrect) && (
                          <p className="text-xs text-[var(--color-text-muted)]">
                            <strong>Explanation: </strong> {question.rationale}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              {isShuffleMode ? (
                <>
                  {onReshuffle && (
                    <button
                      onClick={onReshuffle}
                      className="btn btn-primary flex items-center justify-center gap-2"
                    >
                      <Shuffle className="w-5 h-5" />
                      <span>Reshuffle</span>
                    </button>
                  )}
                  <button
                    onClick={onRestart}
                    className="btn btn-secondary flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-5 h-5" />
                    Retake Stage {chapterNum}
                  </button>
                </>
              ) : (
                <>
                  {hasNextChapter && (
                    <button
                      onClick={onContinue}
                      className="btn btn-primary flex items-center justify-center gap-2"
                    >
                      <BookOpen className="w-5 h-5" />
                      <span>Continue to Next Chapter</span>
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    onClick={onRestart}
                    className="btn btn-secondary flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-5 h-5" />
                    Retake Chapter {chapterNum}
                  </button>
                  <button
                    onClick={onClose}
                    className="btn btn-secondary"
                  >
                    Back to Chapters
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}