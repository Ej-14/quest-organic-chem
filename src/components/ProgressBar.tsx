import { useRef, useEffect } from 'react';
import * as anime from 'animejs';

interface ProgressBarProps {
  progress: number;
  animatedProgress: number;
}

export default function ProgressBar({ progress, animatedProgress }: ProgressBarProps) {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (barRef.current) {
      anime.animate(barRef.current, {
        width: `${animatedProgress}%`,
        duration: 500,
        easing: 'easeOutQuad'
      });
    }
  }, [animatedProgress]);

  return (
    <div className="h-2 bg-[var(--color-border)] overflow-hidden" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100} aria-label="Exam progress">
      <div
        ref={barRef}
        className="h-full bg-gradient-to-r from-[var(--color-accent)] to-[#2d8b8b] transition-all duration-500 ease-out"
        style={{ width: `${animatedProgress}%` }}
      />
    </div>
  );
}