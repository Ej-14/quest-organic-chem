import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Check, Flag, CheckCircle, XCircle, FileText, Minus, Plus, Maximize, Minimize, RotateCcw, X } from 'lucide-react';
import * as anime from 'animejs';

interface SVGViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  svgUrl: string;
  title: string;
}

export default function SVGViewerModal({ 
  isOpen, 
  onClose, 
  svgUrl, 
  title 
}: SVGViewerModalProps) {
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
}