import { useState, useEffect, useCallback, useMemo } from 'react';
import Header from './components/Header';
import QuestionCard from './components/QuestionCard';
import SidebarNav from './components/SidebarNav';
import ResultModal from './components/ResultModal';
import ProgressBar from './components/ProgressBar';
import ChapterSelection from './components/ChapterSelection';
import ModeSelection from './components/ModeSelection';
import questionsData from './data/questions.json';
import shuffleQuestionsData from './data/questions-shuffle.json';

interface BaseQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: string;
  rationale: string;
}

interface Question extends BaseQuestion {
  chapterId: number;
  chapterTitle: string;
  globalIndex: number;
}

interface Chapter {
  id: number;
  title: string;
  questions: BaseQuestion[];
}

interface ChapterWithFullQuestions {
  id: number;
  title: string;
  questions: Question[];
}

interface UserAnswer {
  questionId: number;
  selectedOption: string;
  chapterId: number;
  questionIndex: number;
}

interface ProgressState {
  answers: UserAnswer[];
  currentQuestionIndex: number;
  isCompleted: boolean;
  showResults: boolean;
}

type Mode = 'chapter' | 'shuffle' | null;
type ProgressRecord = Record<number, ProgressState>;

const getChapterWithFullQuestions = (chapters: Chapter[], chapterId: number): ChapterWithFullQuestions | undefined => {
  const chapter = chapters.find(c => c.id === chapterId);
  if (!chapter) return undefined;
  return {
    ...chapter,
    questions: chapter.questions.map((q) => ({
      ...q,
      chapterId: chapter.id,
      chapterTitle: chapter.title,
      globalIndex: chapters
        .filter(c => c.id <= chapter.id)
        .flatMap(c => c.questions)
        .findIndex(qi => qi.id === q.id)
    }))
  };
};

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) return JSON.parse(saved);
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [mode, setMode] = useState<Mode>(null);
  const [selectedChapterId, setSelectedChapterId] = useState<number | null>(null);
  const [currentStage, setCurrentStage] = useState<number>(0);
  const [reshuffleKey, setReshuffleKey] = useState(0);
  
  const [chapterProgress, setChapterProgress] = useState(() => ({} as ProgressRecord));
  const [shuffleProgress, setShuffleProgress] = useState(() => ({} as ProgressRecord));

  const chapters = useMemo(() => questionsData.chapters.map(c => ({
    id: c.id,
    title: c.title,
    questionCount: c.questions.length
  })), []);

  const shuffledChapters = useMemo(() => {
    const chapters = [...shuffleQuestionsData.chapters];
    let currentSeed = reshuffleKey + Date.now();
    for (let i = chapters.length - 1; i > 0; i--) {
      currentSeed = (currentSeed * 9301 + 49297) % 233280;
      const j = Math.floor((currentSeed / 233280) * (i + 1));
      [chapters[i], chapters[j]] = [chapters[j], chapters[i]];
    }
    return chapters;
  }, [reshuffleKey]);

  const stages = useMemo(() => {
    const chunks: Question[][] = [];
    shuffledChapters.forEach(chapter => {
      const chapterQuestions: Question[] = [];
      let globalIndex = chunks.reduce((sum, c) => sum + c.length, 0);
      chapter.questions.forEach(q => {
        chapterQuestions.push({ ...q, chapterId: chapter.id, chapterTitle: chapter.title, globalIndex });
        globalIndex++;
      });
      chunks.push(chapterQuestions);
    });
    return chunks;
  }, [shuffledChapters]);

  const completedChapters = useMemo(() => 
    Object.entries(chapterProgress)
      .filter(([_, progress]) => progress.isCompleted)
      .map(([id]) => parseInt(id))
      .sort((a, b) => a - b),
    [chapterProgress]
  );

  

  const currentChapter = selectedChapterId 
    ? getChapterWithFullQuestions(questionsData.chapters, selectedChapterId)
    : null;

  const chapterQuestions = currentChapter?.questions || [];
  const chapterProgressState = chapterProgress[selectedChapterId || 0] || {
    answers: [],
    currentQuestionIndex: 0,
    isCompleted: false,
    showResults: false
  };

  const stageQuestions = stages[currentStage] || [];
  const shuffleProgressState = shuffleProgress[currentStage] || {
    answers: [],
    currentQuestionIndex: 0,
    isCompleted: false,
    showResults: false
  };

  const isChapterMode = mode === 'chapter';
  const isShuffleMode = mode === 'shuffle';
  const isInQuiz = isChapterMode ? selectedChapterId !== null : true;

  const currentQuestions = isChapterMode ? chapterQuestions : stageQuestions;
  const progressState = isChapterMode ? chapterProgressState : shuffleProgressState;
  const currentQuestionIndex = progressState.currentQuestionIndex;
  const currentQuestion = currentQuestions[currentQuestionIndex];
  const answers = progressState.answers;
  const answeredCount = answers.length;
  const progressPercent = currentQuestions.length > 0 
    ? ((currentQuestionIndex + 1) / currentQuestions.length) * 100 
    : 0;

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  const getProgress = useCallback((key: number, store: ProgressRecord): ProgressState => {
    return store[key] || {
      answers: [],
      currentQuestionIndex: 0,
      isCompleted: false,
      showResults: false
    };
  }, []);

  type StoreSetter = (updater: (prev: ProgressRecord) => ProgressRecord) => void;

  const updateProgress = useCallback((
    storeSetter: StoreSetter,
    key: number,
    updates: Partial<ProgressState>
  ) => {
    storeSetter(prev => ({
      ...prev,
      [key]: {
        ...getProgress(key, prev),
        ...updates
      }
    }));
  }, [getProgress]);

  const handleAnswer = useCallback((option: string) => {
    if (!currentQuestion) return;

    const existingIndex = answers.findIndex(
      a => a.questionId === currentQuestion.id && a.chapterId === currentQuestion.chapterId
    );

    const newAnswer: UserAnswer = {
      questionId: currentQuestion.id,
      selectedOption: option,
      chapterId: currentQuestion.chapterId,
      questionIndex: currentQuestion.globalIndex
    };

    let updatedAnswers: UserAnswer[];
    if (existingIndex >= 0) {
      updatedAnswers = [...answers];
      updatedAnswers[existingIndex] = newAnswer;
    } else {
      updatedAnswers = [...answers, newAnswer];
    }

    if (isChapterMode && selectedChapterId !== null) {
      updateProgress(setChapterProgress, selectedChapterId, { answers: updatedAnswers });
    } else if (isShuffleMode) {
      updateProgress(setShuffleProgress, currentStage, { answers: updatedAnswers });
    }
  }, [currentQuestion, isChapterMode, isShuffleMode, selectedChapterId, currentStage, answers, updateProgress]);

  const handleNext = useCallback(() => {
    if (currentQuestionIndex < currentQuestions.length - 1) {
      if (isChapterMode && selectedChapterId !== null) {
        updateProgress(setChapterProgress, selectedChapterId, { currentQuestionIndex: currentQuestionIndex + 1 });
      } else if (isShuffleMode) {
        updateProgress(setShuffleProgress, currentStage, { currentQuestionIndex: currentQuestionIndex + 1 });
      }
    }
  }, [currentQuestionIndex, currentQuestions.length, isChapterMode, isShuffleMode, selectedChapterId, currentStage, updateProgress]);

  const handlePrevious = useCallback(() => {
    if (currentQuestionIndex > 0) {
      if (isChapterMode && selectedChapterId !== null) {
        updateProgress(setChapterProgress, selectedChapterId, { currentQuestionIndex: currentQuestionIndex - 1 });
      } else if (isShuffleMode) {
        updateProgress(setShuffleProgress, currentStage, { currentQuestionIndex: currentQuestionIndex - 1 });
      }
    }
  }, [currentQuestionIndex, isChapterMode, isShuffleMode, selectedChapterId, currentStage, updateProgress]);

  const handleQuestionJump = useCallback((index: number) => {
    if (isChapterMode && selectedChapterId !== null) {
      updateProgress(setChapterProgress, selectedChapterId, { currentQuestionIndex: index });
    } else if (isShuffleMode) {
      updateProgress(setShuffleProgress, currentStage, { currentQuestionIndex: index });
    }
  }, [isChapterMode, isShuffleMode, selectedChapterId, currentStage, updateProgress]);

  const handleFinish = useCallback(() => {
    if (isChapterMode && selectedChapterId !== null) {
      updateProgress(setChapterProgress, selectedChapterId, { isCompleted: true, showResults: true });
    } else if (isShuffleMode) {
      updateProgress(setShuffleProgress, currentStage, { isCompleted: true, showResults: true });
    }
  }, [isChapterMode, isShuffleMode, selectedChapterId, currentStage, updateProgress]);

  const handleContinue = useCallback(() => {
    if (isChapterMode && selectedChapterId !== null) {
      const nextChapter = chapters.find(c => c.id === selectedChapterId + 1);
      if (nextChapter) {
        setSelectedChapterId(nextChapter.id);
        updateProgress(setChapterProgress, selectedChapterId, { showResults: false });
      }
    } else if (isShuffleMode) {
      if (currentStage < stages.length - 1) {
        setCurrentStage(prev => prev + 1);
        updateProgress(setShuffleProgress, currentStage, { showResults: false });
      }
    }
  }, [isChapterMode, isShuffleMode, selectedChapterId, currentStage, chapters, stages, updateProgress]);

  const handleRestart = useCallback(() => {
    if (isChapterMode && selectedChapterId !== null) {
      updateProgress(setChapterProgress, selectedChapterId, {
        answers: [],
        currentQuestionIndex: 0,
        isCompleted: false,
        showResults: false
      });
    } else if (isShuffleMode) {
      updateProgress(setShuffleProgress, currentStage, {
        answers: [],
        currentQuestionIndex: 0,
        isCompleted: false,
        showResults: false
      });
    }
  }, [isChapterMode, isShuffleMode, selectedChapterId, currentStage, updateProgress]);

  const handleBack = useCallback(() => {
    if (isChapterMode && selectedChapterId !== null) {
      updateProgress(setChapterProgress, selectedChapterId, { showResults: false });
      setSelectedChapterId(null);
    } else if (isShuffleMode) {
      updateProgress(setShuffleProgress, currentStage, { showResults: false });
      setCurrentStage(0);
      setMode(null);
    }
  }, [isChapterMode, isShuffleMode, selectedChapterId, currentStage, updateProgress]);

  const handleSelectChapter = useCallback((chapterId: number) => {
    setSelectedChapterId(chapterId);
    const existingProgress = getProgress(chapterId, chapterProgress);
    if (existingProgress.isCompleted) {
      updateProgress(setChapterProgress, chapterId, { currentQuestionIndex: 0, showResults: true });
    }
  }, [chapterProgress, getProgress, updateProgress]);

  const handleSelectMode = useCallback((selectedMode: 'chapter' | 'shuffle') => {
    setMode(selectedMode);
    if (selectedMode === 'shuffle') {
      setCurrentStage(0);
      setReshuffleKey(prev => prev + 1);
      // Clear all shuffle progress on reshuffle
      setShuffleProgress({});
    }
  }, []);

  const isShowingResults = progressState.showResults;

  const getCurrentTitle = () => {
    if (isChapterMode && currentChapter) return currentChapter.title;
    if (isShuffleMode) return `Stage ${currentStage + 1} of ${stages.length}`;
    return '';
  };

  const getTotalQuestions = () => currentQuestions.length;
  const hasNext = isChapterMode 
    ? chapters.some(c => c.id === (selectedChapterId || 0) + 1)
    : currentStage < stages.length - 1;

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'dark' : 'light'}`}>
      <Header 
        darkMode={darkMode} 
        onToggleTheme={() => setDarkMode(!darkMode)} 
        currentQuestion={isInQuiz ? currentQuestionIndex + 1 : 0}
        totalQuestions={getTotalQuestions()}
        answeredCount={answeredCount}
        chapterTitle={getCurrentTitle()}
        onBackToChapters={isInQuiz ? handleBack : isChapterMode ? () => setMode(null) : undefined}
      />
      
      {mode === null ? (
        <ModeSelection onSelectMode={handleSelectMode} />
      ) : isInQuiz ? (
        <div className="flex flex-col md:flex-row">
          <aside className="w-full md:w-64 border-r border-[var(--color-border)] bg-[var(--color-card)] hidden md:block">
            <SidebarNav
              questions={currentQuestions}
              currentIndex={currentQuestionIndex}
              userAnswers={answers}
              onQuestionJump={handleQuestionJump}
              chapterTitle={getCurrentTitle()}
            />
          </aside>
          
          <main className="flex-1 flex flex-col min-h-[calc(100vh-80px)]">
            <ProgressBar 
              progress={progressPercent} 
              animatedProgress={progressPercent}
            />
            
            <div className="flex-1 flex items-center justify-center p-4 md:p-8 overflow-y-auto">
              {currentQuestion && (
                <QuestionCard
                  question={currentQuestion}
                  userAnswer={answers.find(a => a.questionId === currentQuestion.id && a.chapterId === currentQuestion.chapterId)?.selectedOption}
                  onAnswer={handleAnswer}
                  isLast={currentQuestionIndex === currentQuestions.length - 1}
                  onNext={handleNext}
                  onPrevious={handlePrevious}
                  hasPrevious={currentQuestionIndex > 0}
                  isCompleted={progressState.isCompleted}
                  onFinish={handleFinish}
                  showResults={progressState.showResults}
                />
              )}
            </div>
          </main>
        </div>
      ) : isChapterMode ? (
        <ChapterSelection
          chapters={chapters}
          completedChapters={completedChapters}
          currentChapterId={selectedChapterId}
          onSelectChapter={handleSelectChapter}
        />
      ) : null}

      {isShowingResults && currentQuestion && (
        <ResultModal
          chapter={isChapterMode && currentChapter ? currentChapter : { id: currentStage + 1, title: `Stage ${currentStage + 1}`, questions: stageQuestions }}
          questions={currentQuestions}
          userAnswers={answers}
          onClose={handleBack}
          onRestart={handleRestart}
          onContinue={handleContinue}
          onReshuffle={isShuffleMode ? () => {
            // Close modal and reset progress before reshuffling
            updateProgress(setShuffleProgress, currentStage, { showResults: false });
            handleSelectMode('shuffle');
          } : undefined}
          hasNextChapter={hasNext}
          isShuffleMode={isShuffleMode}
        />
      )}
      <footer className="fixed bottom-0 left-0 right-0 bg-[var(--color-card)]/95 backdrop-blur-sm border-t border-[var(--color-border)] py-3 px-4">
        <div className="flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
          <span>© Ej Go. Freelance creative art director</span>
          <a 
            href="https://www.behance.net/gallery/245791843/My-Portfolio" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:opacity-70 transition-opacity"
            aria-label="View Behance portfolio"
          >
            <i className="fab fa-behance-square text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors" style={{ fontSize: '1.1rem' }} />
          </a>
        </div>
      </footer>
    </div>
  );
}

export default App;