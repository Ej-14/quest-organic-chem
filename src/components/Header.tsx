import { Sun, Moon, BookOpen, ArrowLeft } from 'lucide-react';

interface HeaderProps {
  darkMode: boolean;
  onToggleTheme: () => void;
  currentQuestion: number;
  totalQuestions: number;
  answeredCount: number;
  chapterTitle?: string;
  onBackToChapters?: () => void;
}

export default function Header({ 
  darkMode, 
  onToggleTheme, 
  currentQuestion, 
  totalQuestions, 
  answeredCount,
  chapterTitle,
  onBackToChapters 
}: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[var(--color-card)]/95 backdrop-blur-sm border-b border-[var(--color-border)]">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBackToChapters && (
            <button
              onClick={onBackToChapters}
              className="p-2 rounded-lg bg-[var(--color-border)] hover:bg-[var(--color-accent)]/20 transition-colors text-[var(--color-text)]"
              aria-label="Back to chapter selection"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <BookOpen className="w-8 h-8 text-[var(--color-accent)]" />
          <div>
            <h1 className="text-xl font-bold text-[var(--color-text)]">Organic Chemistry Board Exam</h1>
            {chapterTitle ? (
              <p className="text-sm text-[var(--color-text-muted)]">{chapterTitle} • Question {currentQuestion} of {totalQuestions} • {answeredCount} answered</p>
            ) : (
              <p className="text-sm text-[var(--color-text-muted)]">Select a chapter to begin</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-lg bg-[var(--color-border)] hover:bg-[var(--color-accent)]/20 transition-colors text-[var(--color-text)]"
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </header>
  );
}