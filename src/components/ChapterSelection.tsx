import { useEffect, useRef } from 'react';
import { BookOpen, CheckCircle, ArrowRight, Play } from 'lucide-react';
import * as anime from 'animejs';

interface Chapter {
  id: number;
  title: string;
  questionCount: number;
}

interface ChapterSelectionProps {
  chapters: Chapter[];
  completedChapters: number[];
  currentChapterId: number | null;
  onSelectChapter: (chapterId: number) => void;
}

export default function ChapterSelection({ 
  chapters, 
  completedChapters, 
  currentChapterId, 
  onSelectChapter
}: ChapterSelectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<HTMLButtonElement[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;

    const cards = cardRefs.current.filter(Boolean);
    anime.animate(cards, {
      opacity: [0, 1],
      translateY: [30, 0],
      delay: anime.stagger(100),
      duration: 500,
      easing: 'easeOutQuad'
    });
  }, []);

  const getStatus = (chapterId: number) => {
    if (completedChapters.includes(chapterId)) return 'completed';
    if (currentChapterId === chapterId) return 'current';
    return 'available';
  };

  return (
    <div 
      ref={containerRef}
      className="min-h-screen flex flex-col items-center justify-center pt-20 pb-4 md:pt-24 md:pb-8 px-4 md:px-8"
    >
      <div className="w-full max-w-4xl">
        <div className="text-center mb-12 animate-fade-in">
          <BookOpen className="w-16 h-16 mx-auto text-[var(--color-accent)] mb-4" />
          <h1 className="text-3xl md:text-4xl font-bold text-[var(--color-text)] mb-2">
            Organic Chemistry Board Examination
          </h1>
          <p className="text-[var(--color-text-muted)] text-lg">
            Select a chapter to begin your examination
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {chapters.map((chapter, index) => {
            const status = getStatus(chapter.id);
            const isCompleted = status === 'completed';
            const isCurrent = status === 'current';
            const isAvailable = status === 'available';

            return (
              <button
                key={chapter.id}
                ref={(el) => { cardRefs.current[index] = el!; }}
                onClick={() => onSelectChapter(chapter.id)}
                className={`relative p-6 rounded-2xl border-2 transition-all duration-300 ${
                  isCompleted 
                    ? 'bg-green-500/10 border-green-500' 
                    : isCurrent 
                      ? 'bg-[var(--color-accent)]/10 border-[var(--color-accent)] ring-2 ring-[var(--color-accent)]' 
                      : 'bg-[var(--color-card)] border-[var(--color-border)] hover:border-[var(--color-accent)] hover:shadow-lg hover:shadow-[var(--color-accent)]/20'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <span className="text-sm font-medium text-[var(--color-text-muted)]">
                    Chapter {chapter.id}
                  </span>
                  {isCompleted && (
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  )}
                  {isCurrent && (
                    <Play className="w-6 h-6 text-[var(--color-accent)]" />
                  )}
                </div>

                <h3 className="text-xl font-semibold text-[var(--color-text)] mb-2">
                  {chapter.title.replace('Chapter ', '').replace(':', ' -')}
                </h3>
                <p className="text-sm text-[var(--color-text-muted)] mb-4">
                  {chapter.questionCount} questions
                </p>

                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${
                    isCompleted ? 'text-green-500' : 
                    isCurrent ? 'text-[var(--color-accent)]' : 
                    'text-[var(--color-text-muted)]'
                  }`}>
                    {isCompleted ? 'Completed' : isCurrent ? 'In Progress' : 'Start Exam'}
                  </span>
                  {(isCurrent || isAvailable) && (
                    <ArrowRight className={`w-5 h-5 transition-transform duration-200 ${
                      isCurrent ? 'text-[var(--color-accent)] translate-x-1' : 'text-[var(--color-text-muted)]'
                    }`} />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-12 p-4 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] animate-slide-up">
          <h4 className="font-semibold text-[var(--color-text)] mb-3 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[var(--color-accent)]" />
            Progress Overview
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-[var(--color-accent)]">{completedChapters.length}</div>
              <div className="text-xs text-[var(--color-text-muted)]">Chapters Done</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-[var(--color-text)]">{chapters.length}</div>
              <div className="text-xs text-[var(--color-text-muted)]">Total Chapters</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-500">
                {Math.round((completedChapters.length / chapters.length) * 100)}%
              </div>
              <div className="text-xs text-[var(--color-text-muted)]">Completion</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-[var(--color-text)]">
                {chapters.reduce((sum, c) => sum + c.questionCount, 0)}
              </div>
              <div className="text-xs text-[var(--color-text-muted)]">Total Questions</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-[var(--color-accent)]">
                {completedChapters.length * 10}
              </div>
              <div className="text-xs text-[var(--color-text-muted)]">Questions Answered</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}