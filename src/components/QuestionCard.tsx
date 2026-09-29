import { useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Check, Flag, CheckCircle, XCircle } from 'lucide-react';
import * as anime from 'animejs';

const BASE_URL = '/quest-organic-chem/';

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: string;
  rationale: string;
  chapterId: number;
  chapterTitle: string;
  globalIndex: number;
  image?: string;
  chemEquation?: string;
}

interface QuestionCardProps {
  question: Question;
  userAnswer: string | undefined;
  userAnswerCorrect?: boolean;
  showFeedback: boolean;
  correctAnswer: string;
  rationale: string;
  onAnswer: (option: string) => void;
  isLast: boolean;
  onNext: () => void;
  onPrevious: () => void;
  hasPrevious: boolean;
  isCompleted: boolean;
  onFinish: () => void;
  showResults: boolean;
  isPracticeMode: boolean;
}



export default function QuestionCard({
  question,
  userAnswer,
  userAnswerCorrect,
  showFeedback,
  correctAnswer,
  rationale,
  onAnswer,
  isLast,
  onNext,
  onPrevious,
  hasPrevious,
  isCompleted,
  onFinish,
  showResults,
  isPracticeMode
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

  const isShowingFeedback = isPracticeMode ? showFeedback : showResults;

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
        <h2 className="whitespace-pre-wrap text-lg md:text-xl font-bold text-[var(--color-text)] leading-tight">
          {question.question}
        </h2>
        {question.chemEquation && (
          <div className="mt-4 p-4 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg font-mono text-sm text-[var(--color-text-muted)] overflow-x-auto whitespace-pre-wrap">
            {question.chemEquation}
          </div>
        )}
        {question.image && (
          <div className="mt-4">
            <img 
              src={`${BASE_URL}images/${question.image}`} 
              alt="Question diagram" 
              className="max-w-full h-auto max-h-64 rounded-lg border border-[var(--color-border)]"
            />
          </div>
        )}

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
            const isCorrect = isShowingFeedback && letter === correctAnswer;
            const isIncorrect = isShowingFeedback && isSelected && letter !== correctAnswer;
            
            // Extract text after "A) " - format: "KMnO4 KMnO4.jpg" (text + image)
            const optionText = option.slice(3).trim();
            
            // Parse text and image: split by space, last word might be image filename
            const parts = optionText.split(' ');
            let imageFilename = '';
            let displayText = optionText;
            
            // Check if last part is an image filename
            const lastPart = parts[parts.length - 1];
            if (lastPart.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
              imageFilename = lastPart;
              displayText = parts.slice(0, -1).join(' ');
            }
            
            return (
              <div
                key={index}
                ref={(el) => { optionsRef.current[index] = el!; }}
                data-option={option}
                onClick={() => !isShowingFeedback && handleOptionClick(option)}
                className={`option-card relative group ${
                  isSelected ? 'selected' : ''
                } ${isCorrect ? 'correct' : ''} ${isIncorrect ? 'incorrect' : ''}`}
                role="radio"
                aria-checked={isSelected}
                aria-label={option}
                tabIndex={0}
                onKeyDown={(e) => {
                  if ((e.key === 'Enter' || e.key === ' ') && !isShowingFeedback) {
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
                  <div className="flex-1 flex items-center flex-col items-start gap-2">
                    {displayText && (
                      <span className="whitespace-pre-wrap font-mono text-left text-[var(--color-text)]">
                        {displayText}
                      </span>
                    )}
                    {imageFilename && (
                      <img 
                        src={`${BASE_URL}images/${imageFilename}`} 
                        alt={`Option ${letter} image`} 
                        className="h-40 w-auto max-w-l rounded-lg border border-[var(--color-border)]"
                      />
                    )}
                  </div>
                  {isSelected && !isShowingFeedback && (
                    <Check className="w-5 h-5 text-[var(--color-accent)]" />
                  )}
                  {isCorrect && isShowingFeedback && (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                  {isIncorrect && isShowingFeedback && (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                </div>
                
                {isShowingFeedback && (isCorrect || isIncorrect) && !isPracticeMode && (
                  <div className="mt-3 pt-3 border-t border-[var(--color-border)] text-sm text-[var(--color-text-muted)]">
                    <strong className="text-[var(--color-text)]">Explanation: </strong>
                    {rationale}
                  </div>
                )}
              </div>
            );
          })}
      </div>

      {isShowingFeedback && userAnswer && (
        <div className="mt-6 p-4 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)]">
          <div className="flex items-center gap-2 text-sm">
            <Flag className="w-4 h-4 text-[var(--color-accent)]" />
            <span className="font-medium text-[var(--color-text)]">Your answer: {getOptionLetter(userAnswer)}</span>
            {userAnswerCorrect ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <XCircle className="w-4 h-4 text-red-500" />
            )}
          </div>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            <strong>Correct answer: </strong> {correctAnswer}
          </p>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            <strong>Explanation: </strong> {rationale}
          </p>
        </div>
      )}

      <div className="mt-8 flex items-center justify-between pt-6 border-t border-[var(--color-border)]">
        <button
          onClick={onPrevious}
          disabled={!hasPrevious || isShowingFeedback}
          className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Previous question"
        >
          <ChevronLeft className="w-5 h-5 mr-2" /> Previous
        </button>

        <div className="flex items-center gap-3">
          {isLast && (!isShowingFeedback || isPracticeMode) && !isCompleted ? (
            <button
              onClick={onFinish}
              className="btn btn-primary"
              disabled={!userAnswer}
            >
              Finish Exam
              <ChevronRight className="w-5 h-5 ml-2" />
            </button>
          ) : (!isShowingFeedback || isPracticeMode) ? (
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