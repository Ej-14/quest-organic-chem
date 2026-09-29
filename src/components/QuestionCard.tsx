import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Check, Flag, CheckCircle, XCircle, Minus, Plus, Maximize, Minimize, RotateCcw, X } from 'lucide-react';
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

// SVG Viewer Modal Component
const SVGViewerModal = ({ 
  isOpen, 
  onClose, 
  svgUrl, 
  title 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  svgUrl: string; 
  title: string;
}) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [lastTap, setLastTap] = useState<number>(0);
  const [touchDistance, setTouchDistance] = useState<number>(0);
  const [touchCenter, setTouchCenter] = useState({ x: 0, y: 0 });
  const svgRef = useRef<HTMLDivElement>(null);

  const zoomIn = () => setScale(s => Math.min(s * 1.2, 5));
  const zoomOut = () => setScale(s => Math.max(s / 1.2, 0.2));
  const resetZoom = () => { setScale(1); setPosition({ x: 0, y: 0 }); };
  const rotate = () => { /* rotate functionality if needed */ };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    e.preventDefault();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) zoomIn();
    else zoomOut();
  };

  // Touch event handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch to zoom - two fingers
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
      const centerX = (touch1.clientX + touch2.clientX) / 2;
      const centerY = (touch1.clientY + touch2.clientY) / 2;
      setTouchDistance(distance);
      setTouchCenter({ x: centerX, y: centerY });
    } else if (e.touches.length === 1) {
      // Single finger - potential pan or double tap
      const now = Date.now();
      const touch = e.touches[0];
      
      // Double tap detection
      if (now - lastTap < 300) {
        // Double tap - zoom to 2x or reset to 1x
        if (scale > 1.5) {
          resetZoom();
        } else {
          setScale(2);
        }
        setLastTap(0); // Reset to prevent triple tap
        e.preventDefault();
        return;
      }
      setLastTap(now);
      
      // Single finger drag start
      setIsDragging(true);
      setDragStart({ x: touch.clientX - position.x, y: touch.clientY - position.y });
    }
    e.preventDefault();
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch zoom
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
      const centerX = (touch1.clientX + touch2.clientX) / 2;
      const centerY = (touch1.clientY + touch2.clientY) / 2;
      
      if (touchDistance > 0) {
        const zoomFactor = distance / touchDistance;
        const newScale = Math.min(Math.max(scale * (distance / touchDistance), 0.2), 5);
        setScale(newScale);
        
        // Adjust position to keep pinch center fixed
        const scaleRatio = newScale / scale;
        setPosition({
          x: touchCenter.x - (touchCenter.x - position.x) * scaleRatio,
          y: touchCenter.y - (touchCenter.y - position.y) * scaleRatio
        });
      }
      setTouchDistance(distance);
      setTouchCenter({ x: centerX, y: centerY });
      e.preventDefault();
    } else if (e.touches.length === 1 && isDragging) {
      // Single finger pan
      const touch = e.touches[0];
      setPosition({ x: touch.clientX - dragStart.x, y: touch.clientY - dragStart.y });
      e.preventDefault();
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      setTouchDistance(0);
    }
    setIsDragging(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    if (e.key === '+' || e.key === '=') zoomIn();
    if (e.key === '-') zoomOut();
    if (e.key === '0') { setScale(1); setPosition({ x: 0, y: 0 }); }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="svg-viewer-title"
    >
      <div 
        ref={svgRef}
        className="relative w-full h-full max-w-[90vw] max-h-[90vh] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div 
          className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl overflow-hidden max-w-[90vw] max-h-[90vh]"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transformOrigin: 'center center',
            transition: 'transform 0.1s ease-out'
          }}
        >
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 id="svg-viewer-title" className="font-semibold text-lg text-gray-900 dark:text-white">{title}</h3>
            <div className="flex items-center gap-2 ml-auto">
              <button 
                onClick={zoomOut}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                aria-label="Zoom out"
                title="Zoom out (-)"
              >
                <Minus className="w-5 h-5" />
              </button>
              <button 
                onClick={resetZoom}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                aria-label="Reset zoom"
                title="Reset zoom (0)"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
              <button 
                onClick={zoomIn}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                aria-label="Zoom in"
                title="Zoom in (+)"
              >
                <Plus className="w-5 h-5" />
              </button>
              <button 
                onClick={onClose}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-red-100 dark:hover:bg-red-900 transition-colors"
                aria-label="Close"
                title="Close (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="w-full h-full overflow-hidden">
            <img 
              src={svgUrl} 
              alt={title}
              className="w-full h-auto max-h-[70vh] object-contain"
              style={{ pointerEvents: 'none' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

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
              src={`/images/${question.image}`} 
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
            
            const isImageOption = !!imageFilename;
            
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
                        src={`/images/${imageFilename}`} 
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