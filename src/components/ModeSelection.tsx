import { useEffect, useRef } from 'react';
import { BookOpen, Shuffle, Layers, Target, FlaskConical } from 'lucide-react';
import * as anime from 'animejs';

interface ModeSelectionProps {
  onSelectMode: (mode: 'chapter' | 'shuffle' | 'practice') => void;
}

export default function ModeSelection({ onSelectMode }: ModeSelectionProps) {
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

  const modes = [
    {
      id: 'chapter' as const,
      icon: BookOpen,
      title: 'Chapter Mode',
      subtitle: 'Choose a specific chapter',
      description: 'Practice questions organized by chapter. Select any of the 10 chapters to focus on specific topics.',
      features: ['10 chapters available', '10 questions per chapter', 'Chapter-specific progress tracking', 'Review by topic'],
      color: 'text-[var(--color-accent)]',
      bgColor: 'bg-[var(--color-accent)]/10',
      borderColor: 'border-[var(--color-accent)]'
    },
    {
      id: 'shuffle' as const,
      icon: Shuffle,
      title: 'Shuffle Mode',
      subtitle: 'Randomized mixed questions',
      description: 'All 100 questions combined and shuffled. Answer in stages of 10 questions each for a comprehensive review.',
      features: ['All 100 questions shuffled', '10 questions per stage', 'Mixed topics per stage', 'Exam simulation experience'],
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500'
    },
    {
      id: 'practice' as const,
      icon: FlaskConical,
      title: 'General Chemistry Practice Test',
      subtitle: 'Instant feedback practice',
      description: 'Select specific practice tests with Multiple questions each. Get immediate feedback - correct answers turn green, incorrect turn red.',
      features: ['Mixed practice tests', 'Multiple questions per test', 'Instant correct/incorrect feedback', 'Learn as you go'],
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500'
    }
  ];

  return (
    <div 
      ref={containerRef}
      className="min-h-screen flex flex-col items-center justify-center pt-20 pb-4 md:pt-24 md:pb-8 px-4 md:px-8"
    >
      <div className="w-full max-w-6xl">
        <div className="text-center mb-12 animate-fade-in">
          <Layers className="w-16 h-16 mx-auto text-[var(--color-accent)] mb-4" />
          <h1 className="text-3xl md:text-4xl font-bold text-[var(--color-text)] mb-2">
            Organic Chemistry Board Examination
          </h1>
          <p className="text-[var(--color-text-muted)] text-lg">
            Select your study mode
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {modes.map((mode, index) => {
            const Icon = mode.icon;
            return (
              <button
                key={mode.id}
                ref={(el) => { cardRefs.current[index] = el!; }}
                onClick={() => onSelectMode(mode.id)}
                className={`relative p-6 md:p-10 rounded-2xl border-2 transition-all duration-300 hover:shadow-xl hover:shadow-[var(--color-accent)]/10 ${mode.bgColor} ${mode.borderColor} hover:border-[var(--color-accent)]`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-3 rounded-xl ${mode.bgColor} ${mode.borderColor}`}>
                    <Icon className={`w-7 h-7 ${mode.color}`} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[var(--color-text)]">{mode.title}</h3>
                    <p className="text-sm text-[var(--color-text-muted)]">{mode.subtitle}</p>
                  </div>
                </div>

                <p className="text-[var(--color-text-muted)] mb-6 leading-relaxed">
                  {mode.description}
                </p>

                <div className="space-y-2 mb-6">
                  {mode.features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
                      <Target className="w-4 h-4 text-[var(--color-accent)] flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-[var(--color-border)]">
                  <span className="text-sm font-medium text-[var(--color-accent)] flex items-center gap-1">
                    Start {mode.title}
                    <Icon className="w-4 h-4" />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}