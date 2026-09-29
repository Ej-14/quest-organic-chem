import { useState, useEffect, useCallback, useMemo } from 'react';
import Header from './components/Header';
import QuestionCard from './components/QuestionCard';
import SidebarNav from './components/SidebarNav';
import ResultModal from './components/ResultModal';
import ProgressBar from './components/ProgressBar';
import ChapterSelection from './components/ChapterSelection';
import PracticeTestSelection from './components/PracticeTestSelection';
import ModeSelection from './components/ModeSelection';
import FloatingReferenceButtons from './components/FloatingReferenceButtons';
import SVGViewerModal from './components/SVGViewerModal';
import questionsData from './data/questions.json';
import shuffleQuestionsData from './data/questions-shuffle.json';
import practiceQuestionsData from './data/questions-prac-test.json';

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
  isCorrect?: boolean;
}

interface ProgressState {
  answers: UserAnswer[];
  currentQuestionIndex: number;
  isCompleted: boolean;
  showResults: boolean;
  showFeedback?: boolean;
  lastAnswerCorrect?: boolean;
}

type Mode = 'chapter' | 'shuffle' | 'practice' | null;
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
  const [selectedPracticeTestId, setSelectedPracticeTestId] = useState<number | null>(null);
  const [reshuffleKey, setReshuffleKey] = useState(0);
  
  const [chapterProgress, setChapterProgress] = useState(() => ({} as ProgressRecord));
  const [shuffleProgress, setShuffleProgress] = useState(() => ({} as ProgressRecord));
  const [practiceProgress, setPracticeProgress] = useState(() => ({} as ProgressRecord));
  const [svgViewer, setSvgViewer] = useState<{ isOpen: boolean; url: string; title: string }>({ isOpen: false, url: '', title: '' });

  const chapters = useMemo(() => questionsData.chapters.map(c => ({
    id: c.id,
    title: c.title,
    questionCount: c.questions.length
  })), []);

  const practiceTestsInfo = useMemo(() => practiceQuestionsData.chapters.map(test => ({
    id: test.id,
    title: test.title,
    questionCount: test.questions.length
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

  const practiceTests = useMemo((): Question[][] => {
    const tests: Question[][] = [];
    practiceQuestionsData.chapters.forEach(test => {
      const testQuestions: Question[] = [];
      let globalIndex = 0;
      test.questions.forEach(q => {
        testQuestions.push({ ...q, chapterId: test.id, chapterTitle: test.title, globalIndex });
        globalIndex++;
      });
      tests.push(testQuestions);
    });
    return tests;
  }, []);

  const completedChapters = useMemo(() => 
    Object.entries(chapterProgress)
      .filter(([_, progress]) => progress.isCompleted)
      .map(([id]) => parseInt(id))
      .sort((a, b) => a - b),
    [chapterProgress]
  );

  const completedPracticeTests = useMemo(() => 
    Object.entries(practiceProgress)
      .filter(([_, progress]) => progress.isCompleted)
      .map(([id]) => parseInt(id))
      .sort((a, b) => a - b),
    [practiceProgress]
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

  const practiceTestIndex = (selectedPracticeTestId || 1) - 1;
  const practiceQuestions = practiceTests[practiceTestIndex] || [];
  const practiceProgressState = practiceProgress[selectedPracticeTestId || 1] || {
    answers: [],
    currentQuestionIndex: 0,
    isCompleted: false,
    showResults: false,
    showFeedback: false,
    lastAnswerCorrect: false
  };

  const isChapterMode = mode === 'chapter';
  const isShuffleMode = mode === 'shuffle';
  const isPracticeMode = mode === 'practice';
  const isInQuiz = isChapterMode ? selectedChapterId !== null : isShuffleMode ? true : selectedPracticeTestId !== null;

  const currentQuestions = isChapterMode ? chapterQuestions : isShuffleMode ? stageQuestions : practiceQuestions;
  const progressState = isChapterMode ? chapterProgressState : isShuffleMode ? shuffleProgressState : practiceProgressState;
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
      showResults: false,
      showFeedback: false,
      lastAnswerCorrect: false
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

    const isCorrect = option.charAt(0) === currentQuestion.correctAnswer;
    
    const existingIndex = answers.findIndex(
      a => a.questionId === currentQuestion.id && a.chapterId === currentQuestion.chapterId
    );

    const newAnswer: UserAnswer = {
      questionId: currentQuestion.id,
      selectedOption: option,
      chapterId: currentQuestion.chapterId,
      questionIndex: currentQuestion.globalIndex,
      isCorrect
    };

    let updatedAnswers: UserAnswer[];
    if (existingIndex >= 0) {
      updatedAnswers = [...answers];
      updatedAnswers[existingIndex] = newAnswer;
    } else {
      updatedAnswers = [...answers, newAnswer];
    }

    if (isPracticeMode) {
      // Practice mode: show immediate feedback
      updateProgress(setPracticeProgress, selectedPracticeTestId || 1, { 
        answers: updatedAnswers, 
        showFeedback: true, 
        lastAnswerCorrect: isCorrect 
      });
    } else if (isChapterMode && selectedChapterId !== null) {
      updateProgress(setChapterProgress, selectedChapterId, { answers: updatedAnswers });
    } else if (isShuffleMode) {
      updateProgress(setShuffleProgress, currentStage, { answers: updatedAnswers });
    }
  }, [currentQuestion, isChapterMode, isShuffleMode, isPracticeMode, selectedChapterId, currentStage, selectedPracticeTestId, answers, updateProgress]);

  const handleNext = useCallback(() => {
    if (currentQuestionIndex < currentQuestions.length - 1) {
      if (isPracticeMode) {
        updateProgress(setPracticeProgress, selectedPracticeTestId || 1, { 
          currentQuestionIndex: currentQuestionIndex + 1,
          showFeedback: false 
        });
      } else if (isChapterMode && selectedChapterId !== null) {
        updateProgress(setChapterProgress, selectedChapterId, { currentQuestionIndex: currentQuestionIndex + 1 });
      } else if (isShuffleMode) {
        updateProgress(setShuffleProgress, currentStage, { currentQuestionIndex: currentQuestionIndex + 1 });
      }
    }
  }, [currentQuestionIndex, currentQuestions.length, isChapterMode, isShuffleMode, isPracticeMode, selectedChapterId, currentStage, selectedPracticeTestId, updateProgress]);

  const handlePrevious = useCallback(() => {
    if (currentQuestionIndex > 0) {
      if (isPracticeMode) {
        updateProgress(setPracticeProgress, selectedPracticeTestId || 1, { 
          currentQuestionIndex: currentQuestionIndex - 1,
          showFeedback: false 
        });
      } else if (isChapterMode && selectedChapterId !== null) {
        updateProgress(setChapterProgress, selectedChapterId, { currentQuestionIndex: currentQuestionIndex - 1 });
      } else if (isShuffleMode) {
        updateProgress(setShuffleProgress, currentStage, { currentQuestionIndex: currentQuestionIndex - 1 });
      }
    }
  }, [currentQuestionIndex, isChapterMode, isShuffleMode, isPracticeMode, selectedChapterId, currentStage, selectedPracticeTestId, updateProgress]);

  const handleQuestionJump = useCallback((index: number) => {
    if (isPracticeMode) {
      updateProgress(setPracticeProgress, selectedPracticeTestId || 1, { 
        currentQuestionIndex: index,
        showFeedback: false 
      });
    } else if (isChapterMode && selectedChapterId !== null) {
      updateProgress(setChapterProgress, selectedChapterId, { currentQuestionIndex: index });
    } else if (isShuffleMode) {
      updateProgress(setShuffleProgress, currentStage, { currentQuestionIndex: index });
    }
  }, [isChapterMode, isShuffleMode, isPracticeMode, selectedChapterId, currentStage, selectedPracticeTestId, updateProgress]);

  const handleFinish = useCallback(() => {
    if (isPracticeMode) {
      updateProgress(setPracticeProgress, selectedPracticeTestId || 1, { isCompleted: true, showResults: true });
    } else if (isChapterMode && selectedChapterId !== null) {
      updateProgress(setChapterProgress, selectedChapterId, { isCompleted: true, showResults: true });
    } else if (isShuffleMode) {
      updateProgress(setShuffleProgress, currentStage, { isCompleted: true, showResults: true });
    }
  }, [isChapterMode, isShuffleMode, isPracticeMode, selectedChapterId, currentStage, selectedPracticeTestId, updateProgress]);

  const handleContinue = useCallback(() => {
    if (isPracticeMode) {
      if ((selectedPracticeTestId || 0) < practiceTests.length - 1) {
        setSelectedPracticeTestId(prev => (prev || 0) + 1);
        updateProgress(setPracticeProgress, selectedPracticeTestId || 0, { showResults: false });
      }
    } else if (isChapterMode && selectedChapterId !== null) {
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
  }, [isChapterMode, isShuffleMode, isPracticeMode, selectedChapterId, currentStage, selectedPracticeTestId, chapters, stages, practiceTests, updateProgress]);

  const handleRestart = useCallback(() => {
    if (isPracticeMode) {
      updateProgress(setPracticeProgress, selectedPracticeTestId || 0, {
        answers: [],
        currentQuestionIndex: 0,
        isCompleted: false,
        showResults: false,
        showFeedback: false,
        lastAnswerCorrect: false
      });
    } else if (isChapterMode && selectedChapterId !== null) {
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
  }, [isChapterMode, isShuffleMode, isPracticeMode, selectedChapterId, currentStage, selectedPracticeTestId, updateProgress]);

  const handleBack = useCallback(() => {
    if (isChapterMode && selectedChapterId !== null) {
      updateProgress(setChapterProgress, selectedChapterId, { showResults: false });
      setSelectedChapterId(null);
    } else if (isShuffleMode) {
      updateProgress(setShuffleProgress, currentStage, { showResults: false });
      setCurrentStage(0);
      setMode(null);
    } else if (isPracticeMode) {
      updateProgress(setPracticeProgress, selectedPracticeTestId || 0, { showResults: false });
      setSelectedPracticeTestId(null);
      setMode(null);
    }
  }, [isChapterMode, isShuffleMode, isPracticeMode, selectedChapterId, currentStage, selectedPracticeTestId, updateProgress]);

  const handleSelectChapter = useCallback((chapterId: number) => {
    setSelectedChapterId(chapterId);
    const existingProgress = getProgress(chapterId, chapterProgress);
    if (existingProgress.isCompleted) {
      updateProgress(setChapterProgress, chapterId, { currentQuestionIndex: 0, showResults: true });
    }
  }, [chapterProgress, getProgress, updateProgress]);

  const handleSelectPracticeTest = useCallback((testId: number) => {
    setSelectedPracticeTestId(testId);
    const existingProgress = getProgress(testId, practiceProgress);
    if (existingProgress.isCompleted) {
      updateProgress(setPracticeProgress, testId, { currentQuestionIndex: 0, showResults: true });
    }
  }, [practiceProgress, getProgress, updateProgress]);

  const handleSelectMode = useCallback((selectedMode: 'chapter' | 'shuffle' | 'practice') => {
    setMode(selectedMode);
    if (selectedMode === 'shuffle') {
      setCurrentStage(0);
      setReshuffleKey(prev => prev + 1);
      setShuffleProgress({});
    } else if (selectedMode === 'practice') {
      setSelectedPracticeTestId(null);
      setPracticeProgress({});
    }
  }, []);

  const isShowingResults = progressState.showResults;

  const getCurrentTitle = () => {
    if (isChapterMode && currentChapter) return currentChapter.title;
    if (isShuffleMode) return `Stage ${currentStage + 1} of ${stages.length}`;
    if (isPracticeMode) return `Practice Test ${selectedPracticeTestId || 1} of ${practiceTests.length}`;
    return '';
  };

  const getTotalQuestions = () => currentQuestions.length;
  const hasNext = isChapterMode 
    ? chapters.some(c => c.id === (selectedChapterId || 0) + 1)
    : isShuffleMode 
      ? currentStage < stages.length - 1
      : (selectedPracticeTestId || 0) < practiceTests.length - 1;

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'dark' : 'light'}`}>
      <Header 
        darkMode={darkMode} 
        onToggleTheme={() => setDarkMode(!darkMode)} 
        currentQuestion={isInQuiz ? currentQuestionIndex + 1 : 0}
        totalQuestions={getTotalQuestions()}
        answeredCount={answeredCount}
        chapterTitle={getCurrentTitle()}
        onBackToChapters={isInQuiz ? handleBack : isChapterMode ? () => setMode(null) : isPracticeMode && selectedPracticeTestId === null ? () => setMode(null) : undefined}
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
            
            <div className="flex-1 flex justify-center p-4 md:p-8 pt-8 md:pt-20 overflow-y-auto">
              {currentQuestion && (
                <QuestionCard
                  question={currentQuestion}
                  userAnswer={answers.find(a => a.questionId === currentQuestion.id && a.chapterId === currentQuestion.chapterId)?.selectedOption}
                  userAnswerCorrect={answers.find(a => a.questionId === currentQuestion.id && a.chapterId === currentQuestion.chapterId)?.isCorrect ?? false}
                  showFeedback={isPracticeMode ? progressState.showFeedback : progressState.showResults}
                  correctAnswer={currentQuestion.correctAnswer}
                  rationale={currentQuestion.rationale}
                  onAnswer={handleAnswer}
                  isLast={currentQuestionIndex === currentQuestions.length - 1}
                  onNext={handleNext}
                  onPrevious={handlePrevious}
                  hasPrevious={currentQuestionIndex > 0}
                  isCompleted={progressState.isCompleted}
                  onFinish={handleFinish}
                  showResults={progressState.showResults}
                  isPracticeMode={isPracticeMode}
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
      ) : isPracticeMode && selectedPracticeTestId === null ? (
        <PracticeTestSelection
          practiceTests={practiceTestsInfo}
          completedTests={completedPracticeTests}
          currentTestId={selectedPracticeTestId}
          onSelectTest={handleSelectPracticeTest}
        />
      ) : null}

      {isPracticeMode && selectedPracticeTestId !== null && (
        <FloatingReferenceButtons
          isPracticeMode={isPracticeMode}
          selectedPracticeTestId={selectedPracticeTestId}
          practiceTests={practiceTestsInfo}
          onOpenSvgViewer={(url, title) => setSvgViewer({ isOpen: true, url, title })}
        />
      )}

      {svgViewer.isOpen && (
        <SVGViewerModal
          isOpen={svgViewer.isOpen}
          onClose={() => setSvgViewer({ isOpen: false, url: '', title: '' })}
          svgUrl={svgViewer.url}
          title={svgViewer.title}
        />
      )}

      {isShowingResults && currentQuestion && (
        <ResultModal
          chapter={isChapterMode && currentChapter ? currentChapter : isShuffleMode ? { id: currentStage + 1, title: `Stage ${currentStage + 1}`, questions: stageQuestions } : { id: selectedPracticeTestId || 1, title: `Practice Test ${selectedPracticeTestId || 1}`, questions: practiceQuestions }}
          questions={currentQuestions}
          userAnswers={answers}
          onClose={handleBack}
          onRestart={handleRestart}
          onContinue={handleContinue}
          onReshuffle={isShuffleMode ? () => {
            updateProgress(setShuffleProgress, currentStage, { showResults: false });
            handleSelectMode('shuffle');
          } : undefined}
          hasNextChapter={hasNext}
          isShuffleMode={isShuffleMode}
          isPracticeMode={isPracticeMode}
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