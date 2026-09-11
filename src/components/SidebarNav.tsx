import { useRef, useEffect } from 'react';
import { ChevronRight, Circle } from 'lucide-react';
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

interface SidebarNavProps {
  questions: Question[];
  currentIndex: number;
  userAnswers: { questionId: number; chapterId: number; selectedOption: string }[];
  onQuestionJump: (index: number) => void;
  chapterTitle?: string;
}

export default function SidebarNav({ questions, currentIndex, userAnswers, onQuestionJump, chapterTitle }: SidebarNavProps) {
  const sidebarRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<HTMLButtonElement[]>([]);

  useEffect(() => {
    if (!sidebarRef.current) return;

    const items = itemRefs.current.filter(Boolean);
    anime.animate(items, {
      opacity: [0, 1],
      translateX: [-20, 0],
      delay: anime.stagger(30),
      duration: 300,
      easing: 'easeOutQuad'
    });
  }, []);

  useEffect(() => {
    const currentItem = itemRefs.current[currentIndex];
    if (currentItem) {
      currentItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [currentIndex]);

  return (
    <div 
      ref={sidebarRef}
      className="h-[calc(100vh-80px)] flex flex-col p-3 pt-20 bg-[var(--color-card)]"
      role="navigation"
      aria-label="Question navigation"
    >
      <div className="flex-shrink-0 pt-4 pb-4">
        <h3 className="px-2 py-1 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
          {chapterTitle ? `${chapterTitle.replace('Chapter ', '').replace(':', '')} - Questions` : 'Questions'}
        </h3>
      </div>
      
      <div className="flex-1 overflow-hidden min-h-0">
        <div className="space-y-0.5 h-full overflow-y-auto pr-1">
          {questions.map((question, index) => {
            const isAnswered = userAnswers.some(
              a => a.questionId === question.id && a.chapterId === question.chapterId
            );
            const isCurrent = index === currentIndex;
            const userAnswer = userAnswers.find(
              a => a.questionId === question.id && a.chapterId === question.chapterId
            );
            const selectedLetter = userAnswer ? userAnswer.selectedOption.charAt(0) : null;

            return (
              <button
                key={question.globalIndex}
                ref={(el) => { itemRefs.current[index] = el!; }}
                onClick={() => onQuestionJump(index)}
                className={`sidebar-item w-full text-left ${isCurrent ? 'current' : ''} ${isAnswered ? 'answered' : ''}`}
                aria-current={isCurrent ? 'true' : 'false'}
                aria-label={`Question ${index + 1}${isAnswered ? ', answered' : ''}${isCurrent ? ', current' : ''}`}
              >
                <div className="flex items-center gap-2">
                  <div className={`flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-medium transition-all duration-200 ${
                    isCurrent ? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-white' :
                    isAnswered ? 'bg-[var(--color-accent)]/20 border-[var(--color-accent)] text-[var(--color-accent)]' :
                    'border-[var(--color-border)] text-[var(--color-text-muted)]'
                  }`}>
                    {isAnswered ? (
                      <span className="text-xs">{selectedLetter}</span>
                    ) : (
                      <span className="text-xs">{index + 1}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate text-[var(--color-text)]">
                      Q{index + 1}
                    </p>
                    <p className="text-[10px] truncate text-[var(--color-text-muted)]">
                      {question.question.slice(0, 45)}...
                    </p>
                  </div>
                  {isCurrent && (
                    <ChevronRight className="w-3.5 h-3.5 text-[var(--color-accent)] flex-shrink-0" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-shrink-0 mt-3 pt-3 border-t border-[var(--color-border)]">
        <h4 className="px-2 py-1 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
          Legend
        </h4>
        <div className="px-2 space-y-1.5 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full border-2 border-[var(--color-accent)] bg-[var(--color-accent)]/20 flex items-center justify-center text-[var(--color-accent)] flex-shrink-0">
              <Circle className="w-2.5 h-2.5" />
            </div>
            <span className="text-[var(--color-text-muted)]">Current</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full border-2 border-[var(--color-accent)] bg-[var(--color-accent)]/20 flex items-center justify-center text-[var(--color-accent)] flex-shrink-0">
              <span className="text-[10px]">A</span>
            </div>
            <span className="text-[var(--color-text-muted)]">Answered</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full border-2 border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-muted)] flex-shrink-0">
              <span className="text-[10px]">1</span>
            </div>
            <span className="text-[var(--color-text-muted)]">Unanswered</span>
          </div>
        </div>
      </div>
    </div>
  );
}