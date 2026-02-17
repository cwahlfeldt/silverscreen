import { useRef, useCallback } from 'react';
import type { Screenshot } from '../types';

interface ComparisonGridProps {
  screenshots: Screenshot[];
  sessionId: string;
  onImageClick: (screenshot: Screenshot) => void;
}

const BROWSER_PILL: Record<string, string> = {
  chromium: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  chrome:   'bg-blue-500/20 text-blue-300 border-blue-500/30',
  firefox:  'bg-orange-500/20 text-orange-300 border-orange-500/30',
  webkit:   'bg-violet-500/20 text-violet-300 border-violet-500/30',
  edge:     'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
};

export default function ComparisonGrid({ screenshots, sessionId, onImageClick }: ComparisonGridProps) {
  const grouped = screenshots.reduce((acc, s) => {
    if (!acc[s.breakpoint]) acc[s.breakpoint] = [];
    acc[s.breakpoint].push(s);
    return acc;
  }, {} as Record<string, Screenshot[]>);

  return (
    <div className="space-y-12 animate-fade-in">
      {Object.entries(grouped).map(([breakpoint, bpScreenshots]) => (
        <BreakpointSection
          key={breakpoint}
          breakpoint={breakpoint}
          screenshots={bpScreenshots}
          sessionId={sessionId}
          onImageClick={onImageClick}
        />
      ))}
    </div>
  );
}

interface BreakpointSectionProps {
  breakpoint: string;
  screenshots: Screenshot[];
  sessionId: string;
  onImageClick: (screenshot: Screenshot) => void;
}

function BreakpointSection({ breakpoint, screenshots, sessionId, onImageClick }: BreakpointSectionProps) {
  const scrollContainersRef = useRef<HTMLDivElement[]>([]);
  const scrollingFromIndexRef = useRef<number | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleScroll = useCallback((index: number) => {
    if (scrollingFromIndexRef.current !== null && scrollingFromIndexRef.current !== index) return;
    scrollingFromIndexRef.current = index;

    const sourceContainer = scrollContainersRef.current[index];
    if (!sourceContainer) return;

    const scrollPct =
      sourceContainer.scrollTop / (sourceContainer.scrollHeight - sourceContainer.clientHeight);

    scrollContainersRef.current.forEach((container, i) => {
      if (i !== index && container) {
        container.scrollTop = scrollPct * (container.scrollHeight - container.clientHeight);
      }
    });

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      scrollingFromIndexRef.current = null;
    }, 150);
  }, []);

  return (
    <section>
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">{breakpoint}</h2>
        <div className="flex-1 h-px bg-amber-500/20" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {screenshots.map((screenshot, index) => {
          const imgUrl = `/api/sessions/${sessionId}/screenshots/${screenshot.browser}/${screenshot.page}/${screenshot.filename}`;
          return (
            <div
              key={`${screenshot.browser}-${screenshot.breakpoint}-${screenshot.timestamp}`}
              className="card-hover bg-gray-900 border border-gray-800 rounded-xl overflow-hidden"
            >
              <div
                ref={(el) => { if (el) scrollContainersRef.current[index] = el; }}
                onScroll={() => handleScroll(index)}
                className="screenshot-scroll relative bg-gray-950 h-[600px] overflow-x-hidden overflow-y-auto"
              >
                <img
                  src={imgUrl}
                  alt={`${screenshot.pageName} — ${screenshot.browser} — ${screenshot.breakpoint}`}
                  className="w-full h-auto"
                  loading="lazy"
                />

                <div
                  className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-150 cursor-zoom-in"
                  onClick={() => onImageClick(screenshot)}
                >
                  <span className="bg-gray-950/80 backdrop-blur-sm text-white text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-700">
                    View full size
                  </span>
                </div>
              </div>

              <div className="px-4 py-3 flex items-center justify-between border-t border-gray-800">
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full border capitalize ${
                    BROWSER_PILL[screenshot.browser] ?? 'bg-gray-800 text-gray-400 border-gray-700'
                  }`}
                >
                  {screenshot.browser}
                </span>
                <span className="text-gray-600 text-xs">
                  {new Date(screenshot.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
