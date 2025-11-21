import { useRef, useCallback } from "react";
import type { Screenshot } from "../types";

interface ComparisonGridProps {
  screenshots: Screenshot[];
  onImageClick: (screenshot: Screenshot) => void;
}

export default function ComparisonGrid({
  screenshots,
  onImageClick,
}: ComparisonGridProps) {
  // Group screenshots by breakpoint
  const groupedByBreakpoint = screenshots.reduce((acc, screenshot) => {
    if (!acc[screenshot.breakpoint]) {
      acc[screenshot.breakpoint] = [];
    }
    acc[screenshot.breakpoint].push(screenshot);
    return acc;
  }, {} as Record<string, Screenshot[]>);

  return (
    <div className="space-y-12">
      {Object.entries(groupedByBreakpoint).map(
        ([breakpoint, breakpointScreenshots]) => (
          <BreakpointSection
            key={breakpoint}
            breakpoint={breakpoint}
            screenshots={breakpointScreenshots}
            onImageClick={onImageClick}
          />
        )
      )}
    </div>
  );
}

interface BreakpointSectionProps {
  breakpoint: string;
  screenshots: Screenshot[];
  onImageClick: (screenshot: Screenshot) => void;
}

function BreakpointSection({
  breakpoint,
  screenshots,
  onImageClick,
}: BreakpointSectionProps) {
  const scrollContainersRef = useRef<HTMLDivElement[]>([]);
  const scrollingFromIndexRef = useRef<number | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Synchronized scroll handler
  const handleScroll = useCallback((index: number) => {
    // If another container is currently the source of scrolling, ignore this event
    if (
      scrollingFromIndexRef.current !== null &&
      scrollingFromIndexRef.current !== index
    ) {
      return;
    }

    // Mark this container as the scroll source
    scrollingFromIndexRef.current = index;

    const sourceContainer = scrollContainersRef.current[index];
    if (!sourceContainer) return;

    const scrollPercentage =
      sourceContainer.scrollTop /
      (sourceContainer.scrollHeight - sourceContainer.clientHeight);

    // Sync all other containers in this breakpoint
    scrollContainersRef.current.forEach((container, i) => {
      if (i !== index && container) {
        const targetScrollTop =
          scrollPercentage * (container.scrollHeight - container.clientHeight);
        container.scrollTop = targetScrollTop;
      }
    });

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Reset the scroll source after scrolling has stopped
    timeoutRef.current = setTimeout(() => {
      scrollingFromIndexRef.current = null;
    }, 150);
  }, []);

  if (screenshots.length === 0) {
    return (
      <section className="bg-white shadow-sm p-6 border border-gray-200 rounded-lg">
        <h2 className="mb-6 pb-3 border-gray-200 border-b font-semibold text-gray-800 text-2xl">
          {breakpoint}
        </h2>
        <div className="py-8 text-gray-500 text-center">
          No screenshots found for this breakpoint
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white shadow-sm p-6 border border-gray-200 rounded-lg">
      <h2 className="mb-6 pb-3 border-gray-200 border-b font-semibold text-gray-800 text-2xl">
        {breakpoint}
      </h2>

      <div className="gap-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {screenshots.map((screenshot, index) => (
          <div
            key={`${screenshot.browser}-${screenshot.breakpoint}-${screenshot.timestamp}`}
            className="group relative bg-gray-50 border border-gray-200 hover:border-blue-400 rounded-lg overflow-hidden transition-colors"
          >
            {/* Scrollable container with fixed height */}
            <div
              ref={(el) => {
                if (el) scrollContainersRef.current[index] = el;
              }}
              onScroll={() => handleScroll(index)}
              className="relative bg-gray-100 h-[600px] overflow-x-hidden overflow-y-auto"
              style={{ scrollbarWidth: "thin" }}
            >
              <img
                src={`/${screenshot.path}`}
                alt={`${screenshot.pageName} - ${screenshot.browser} - ${screenshot.breakpoint}`}
                className="w-full h-auto"
                loading="lazy"
              />

              {/* Click to enlarge overlay */}
              <div
                className="absolute inset-0 flex justify-center items-center bg-opacity-0 group-hover:bg-opacity-10 transition-opacity cursor-pointer"
                onClick={() => onImageClick(screenshot)}
              >
                <span className="bg-black bg-opacity-70 opacity-0 group-hover:opacity-100 px-4 py-2 rounded-lg font-medium text-white text-sm">
                  Click to enlarge
                </span>
              </div>
            </div>

            {/* Browser info footer */}
            <div className="bg-white p-4 border-gray-200 border-t">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-gray-900 capitalize">
                  {screenshot.browser}
                </h3>
                <span className="text-gray-500 text-xs">
                  {new Date(screenshot.timestamp).toLocaleString()}
                </span>
              </div>
              <p className="mt-1 text-gray-600 text-sm">
                <a
                  href={screenshot.pageName}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  {screenshot.pageName}
                </a>
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
