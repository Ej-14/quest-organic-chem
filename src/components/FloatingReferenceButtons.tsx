import { Superscript, Atom } from 'lucide-react';

const BASE_URL = '/quest-organic-chem/';

interface FloatingReferenceButtonsProps {
  isPracticeMode: boolean;
  selectedPracticeTestId: number | null;
  onOpenSvgViewer: (url: string, title: string) => void;
}

export default function FloatingReferenceButtons({ 
  isPracticeMode, 
  selectedPracticeTestId,
  onOpenSvgViewer
}: FloatingReferenceButtonsProps) {
  // Only show in practice mode when a test is selected (not in selection screen)
  if (!isPracticeMode || selectedPracticeTestId === null) {
    return null;
  }

  return (
    <div className="fixed bottom-2 right-32 z-40 flex items-center gap-3">
      {/* Abbreviations and Symbols, Constants and Equations (Left) */}
      <div className="relative group">
        <button
          onClick={() => onOpenSvgViewer(`${BASE_URL}images/sym-const-equa.svg`, 'ABBREVIATIONS AND SYMBOLS, CONSTANTS AND EQUATIONS')}
          className="flex items-center gap-2 px-3 py-2 bg-[var(--color-accent)] text-white rounded-xl shadow-lg hover:opacity-90 transition-all duration-200"
          aria-label="View Abbreviations and Symbols, Constants and Equations"
        >
<Superscript className="w-4 h-4 flex-shrink-0" />
</button>
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-black text-white text-xs font-medium rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-10">
          ABBREVIATIONS AND SYMBOLS, CONSTANTS AND EQUATIONS
        </div>
      </div>
      
      {/* Periodic Table of the Elements (Right) */}
      <div className="relative group">
        <button
          onClick={() => onOpenSvgViewer(`${BASE_URL}images/perio-table.svg`, 'PERIODIC TABLE OF THE ELEMENTS')}
          className="flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-xl shadow-lg hover:opacity-90 transition-all duration-200"
          aria-label="View Periodic Table of the Elements"
        >
          <Atom className="w-4 h-4 flex-shrink-0" />
        </button>
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-black text-white text-xs font-medium rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-10">
          PERIODIC TABLE OF THE ELEMENTS
        </div>
      </div>
    </div>
  );
}