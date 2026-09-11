import { useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Check, Flag, CheckCircle, XCircle } from 'lucide-react';
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

interface QuestionCardProps {
  question: Question;
  userAnswer: string | undefined;
  onAnswer: (option: string) => void;
  isLast: boolean;
  onNext: () => void;
  onPrevious: () => void;
  hasPrevious: boolean;
  isCompleted: boolean;
  onFinish: () => void;
  showResults: boolean;
}

export default function QuestionCard({
  question,
  userAnswer,
  onAnswer,
  isLast,
  onNext,
  onPrevious,
  hasPrevious,
  isCompleted,
  onFinish,
  showResults
}: QuestionCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const optionsRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    if (!cardRef.current) return;

    anime.animate(cardRef.current, {
      opacity: [0, 1],
      translateY: [20, 0],
      duration: 400,
      easing: 'easeOutQuad'
    });

    const optionElements = optionsRef.current.filter(Boolean);
    anime.animate(optionElements, {
      opacity: [0, 1],
      translateX: [-20, 0],
      delay: anime.stagger(80, { start: 200 }),
      duration: 300,
      easing: 'easeOutQuad'
    });
  }, [question.globalIndex]);

  const handleOptionClick = (option: string) => {
    const optionEl = optionsRef.current.find(el => el?.dataset.option === option);
    if (optionEl) {
      anime.animate(optionEl, {
        scale: [1, 0.95, 1],
        duration: 300,
        easing: 'easeOutElastic(1, .5)'
      });
    }
    onAnswer(option);
  };

  const getOptionLetter = (option: string) => option.charAt(0);

  return (
    <div 
      ref={cardRef}
      className="w-full max-w-3xl animate-fade-in"
      role="main"
      aria-label={`Question ${question.globalIndex + 1}`}
    >
      <div className="mb-6">
        <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-[var(--color-accent)]/20 text-[var(--color-accent)] mb-4">
          {question.chapterTitle}
        </span>
        <h2 className="text-2xl md:text-3xl font-bold text-[var(--color-text)] leading-tight">
          {question.question}
        </h2>
      </div>

      <div 
        ref={(el) => { optionsRef.current[0] = el!; }}
        className="space-y-3"
        role="radiogroup"
        aria-label="Answer options"
      >
        {question.options.map((option, index) => {
          const letter = getOptionLetter(option);
          const isSelected = userAnswer === option;
          const isCorrect = showResults && letter === question.correctAnswer;
          const isIncorrect = showResults && isSelected && letter !== question.correctAnswer;
          
          return (
            <div
              key={index}
              ref={(el) => { optionsRef.current[index] = el!; }}
              data-option={option}
              onClick={() => !showResults && handleOptionClick(option)}
              className={`option-card relative group ${
                isSelected ? 'selected' : ''
              } ${isCorrect ? 'correct' : ''} ${isIncorrect ? 'incorrect' : ''}`}
              role="radio"
              aria-checked={isSelected}
              aria-label={option}
              tabIndex={0}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && !showResults) {
                  e.preventDefault();
                  handleOptionClick(option);
                }
              }}
            >
              <div className="flex items-center gap-4">
                <div className={`flex-shrink-0 w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold text-lg transition-all duration-200 ${
                  isSelected ? 'border-[var(--color-accent)] bg-[var(--color-accent)] text-white' : 'border-[var(--color-border)] text-[var(--color-text-muted)]'
                } ${isCorrect ? 'border-green-500 bg-green-500 text-white' : ''} ${isIncorrect ? 'border-red-500 bg-red-500 text-white' : ''}`}>
                  {letter}
                </div>
                <span className="flex-1 text-left text-[var(--color-text)]">
                  {option.slice(3)}
                </span>
                {isSelected && !showResults && (
                  <Check className="w-5 h-5 text-[var(--color-accent)]" />
                )}
                {isCorrect && showResults && (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}
                {isIncorrect && showResults && (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
              </div>
              
              {showResults && (isCorrect || isIncorrect) && (
                <div className="mt-3 pt-3 border-t border-[var(--color-border)] text-sm text-[var(--color-text-muted)]">
                  <strong className="text-[var(--color-text)]">Rationale: </strong>
                  {question.rationale}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showResults && userAnswer && (
        <div className="mt-6 p-4 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)]">
          <div className="flex items-center gap-2 text-sm">
            <Flag className="w-4 h-4 text-[var(--color-accent)]" />
            <span className="font-medium text-[var(--color-text)]">Your answer: {getOptionLetter(userAnswer)}</span>
            {getOptionLetter(userAnswer) === question.correctAnswer ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <XCircle className="w-4 h-4 text-red-500" />
            )}
          </div>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            <strong>Correct answer: </strong> {question.correctAnswer}
          </p>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            <strong>Explanation: </strong> {question.rationale}
          </p>
        </div>
      )}

      <div className="mt-8 flex items-center justify-between pt-6 border-t border-[var(--color-border)]">
        <button
          onClick={onPrevious}
          disabled={!hasPrevious || showResults}
          className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Previous question"
        >
          <ChevronLeft className="w-5 h-5 mr-2" /> Previous
        </button>

        <div className="flex items-center gap-3">
          {isLast && !showResults && !isCompleted ? (
            <button
              onClick={onFinish}
              className="btn btn-primary"
              disabled={!userAnswer}
            >
              Finish Exam
              <ChevronRight className="w-5 h-5 ml-2" />
            </button>
          ) : !showResults ? (
            <button
              onClick={onNext}
              className="btn btn-primary"
              disabled={!userAnswer}
            >
              Next
              <ChevronRight className="w-5 h-5 ml-2" />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}