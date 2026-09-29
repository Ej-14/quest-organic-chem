import { useEffect, useRef } from 'react';
import { CheckCircle, ArrowRight, FlaskConical } from 'lucide-react';
import * as anime from 'animejs';

interface PracticeTest {
  id: number;
  title: string;
  questionCount: number;
}

interface PracticeTestSelectionProps {
  practiceTests: PracticeTest[];
  completedTests: number[];
  currentTestId: number | null;
  onSelectTest: (testId: number) => void;
}

export default function PracticeTestSelection({ 
  practiceTests, 
  completedTests, 
  currentTestId, 
  onSelectTest
}: PracticeTestSelectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<HTMLButtonElement[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;

    const cards = cardRefs.current.filter(Boolean);
    anime.animate(cards, {
      opacity: [0, 1],
      translateY: [30, 0],
      delay: anime.stagger(150),
      duration: 500,
      easing: 'easeOutQuad'
    });
  }, []);

  const getStatus = (testId: number) => {
    if (completedTests.includes(testId)) return 'completed';
    if (currentTestId === testId) return 'current';
    return 'available';
  };

  return (
    <div 
      ref={containerRef}
      className="min-h-screen flex flex-col items-center justify-center pt-20 pb-4 md:pt-24 md:pb-8 px-4 md:px-8"
    >
      <div className="w-full max-w-4xl">
        <div className="text-center mb-12 animate-fade-in">
          <FlaskConical className="w-16 h-16 mx-auto text-emerald-500 mb-4" />
          <h1 className="text-3xl md:text-4xl font-bold text-[var(--color-text)] mb-2">
            General Chemistry Practice Test
          </h1>
          <p className="text-[var(--color-text-muted)] text-lg">
            Select a practice test to begin
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {practiceTests.map((test, index) => {
            const status = getStatus(test.id);
            const isCompleted = status === 'completed';
            const isCurrent = status === 'current';
            const isAvailable = status === 'available';

            return (
              <button
                key={test.id}
                ref={(el) => { cardRefs.current[index] = el!; }}
                onClick={() => onSelectTest(test.id)}
                className={`relative p-6 md:p-10 rounded-2xl border-2 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/10 ${
                  isCompleted 
                    ? 'bg-green-500/10 border-green-500' 
                    : isCurrent 
                      ? 'bg-emerald-500/10 border-emerald-500 ring-2 ring-emerald-500' 
                      : 'bg-[var(--color-card)] border-[var(--color-border)] hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-500/20'
                }`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-xl bg-emerald-500/10 border-emerald-500 border">
                    <FlaskConical className="w-7 h-7 text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[var(--color-text)]">{test.title}</h3>
                    <p className="text-sm text-[var(--color-text-muted)]">{test.questionCount} questions</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {isCompleted && (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                  {isCurrent && (
                    <span className="text-sm font-medium text-emerald-500">In Progress</span>
                  )}
                  {isAvailable && (
                    <span className="text-sm font-medium text-[var(--color-text-muted)]">Start Test</span>
                  )}
                  {(isCurrent || isAvailable) && (
                    <ArrowRight className="w-5 h-5 text-emerald-500" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-12 p-4 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] animate-slide-up">
          <h4 className="font-semibold text-[var(--color-text)] mb-3 flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-emerald-500" />
            Progress Overview
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-emerald-500">{completedTests.length}</div>
              <div className="text-xs text-[var(--color-text-muted)]">Tests Done</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-[var(--color-text)]">{practiceTests.length}</div>
              <div className="text-xs text-[var(--color-text-muted)]">Total Tests</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-500">
                {Math.round((completedTests.length / practiceTests.length) * 100)}%
              </div>
              <div className="text-xs text-[var(--color-text-muted)]">Completion</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-[var(--color-text)]">
                {completedTests.length * 15}
              </div>
              <div className="text-xs text-[var(--color-text-muted)]">Questions Answered</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}