import { useState, useEffect, useRef } from 'react';
import type { Manifest, CaptureState } from '../types';
import { BROWSER_COLORS, BROWSER_COLORS_ACTIVE, BROWSER_DOT } from '../constants';

interface HeaderProps {
  manifest: Manifest | null;
  selectedPage: string | null;
  selectedBrowsers: string[];
  selectedBreakpoint: string | null;
  availableBreakpoints: string[];
  onPageChange: (page: string) => void;
  onBrowsersChange: (browsers: string[]) => void;
  onBreakpointChange: (breakpoint: string | null) => void;
  onNewCapture: () => void;
  onLogoClick: () => void;
  sessionName?: string;
  captureState: CaptureState;
}

export default function Header({
  manifest,
  selectedPage,
  selectedBrowsers,
  selectedBreakpoint,
  availableBreakpoints,
  onPageChange,
  onBrowsersChange,
  onBreakpointChange,
  onNewCapture,
  onLogoClick,
  sessionName,
  captureState,
}: HeaderProps) {
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  // Close filter dropdown on outside click
  useEffect(() => {
    if (!filterOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [filterOpen]);

  const toggleBrowser = (browser: string) => {
    if (selectedBrowsers.includes(browser)) {
      onBrowsersChange(selectedBrowsers.filter((b) => b !== browser));
    } else {
      onBrowsersChange([...selectedBrowsers, browser]);
    }
  };

  const currentPageUrl = selectedPage ? manifest?.pages[selectedPage]?.url : null;
  const currentPageName = selectedPage ? manifest?.pages[selectedPage]?.name : null;
  const pct = captureState.total > 0 ? Math.round((captureState.progress / captureState.total) * 100) : 0;

  return (
    <header className="glass sticky top-0 z-40">
      <div className="px-4 py-3 flex items-center gap-4">
        {/* Clickable logo */}
        <button
          onClick={onLogoClick}
          className="flex items-center gap-2 shrink-0 hover:opacity-80 transition-opacity duration-150"
        >
          <span className="font-display text-xl font-bold tracking-tight">
            <span className="text-amber-400">S</span>
            <span className="text-gray-100">ilverscreen</span>
          </span>
        </button>

        {sessionName && (
          <>
            <span className="text-gray-700">/</span>
            <span className="text-gray-400 text-sm font-medium truncate max-w-48">{sessionName}</span>
          </>
        )}

        {/* Compact filter summary — only when manifest is loaded */}
        {manifest && (
          <div ref={filterRef} className="relative flex items-center gap-2">
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-800/50 border border-gray-700 hover:border-gray-600 transition-colors duration-150 text-sm text-gray-300"
            >
              <span className="truncate max-w-32">{currentPageName ?? 'All pages'}</span>
              <span className="text-gray-600">|</span>
              <span className="flex gap-1">
                {selectedBrowsers.map((b) => (
                  <span key={b} className={`w-2 h-2 rounded-full ${BROWSER_DOT[b] ?? 'bg-gray-500'}`} />
                ))}
              </span>
              <span className="text-gray-600">|</span>
              <span className="text-xs">{selectedBreakpoint ?? 'All'}</span>
              <svg className={`w-3 h-3 text-gray-500 transition-transform duration-150 ${filterOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Filter dropdown */}
            {filterOpen && (
              <div className="absolute top-full left-0 mt-2 glass rounded-xl border border-gray-800 p-4 z-50 min-w-80 space-y-4 animate-scale-in">
                {/* Page select */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Page</label>
                  <select
                    value={selectedPage || ''}
                    onChange={(e) => onPageChange(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 text-gray-300 text-sm rounded-lg px-3 py-1.5 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                  >
                    {Object.keys(manifest.pages).map((pageId) => (
                      <option key={pageId} value={pageId}>
                        {manifest.pages[pageId].name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Browser toggles */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Browsers</label>
                  <div className="flex items-center gap-1.5">
                    {manifest.browsers.map((browser) => {
                      const active = selectedBrowsers.includes(browser);
                      return (
                        <button
                          key={browser}
                          onClick={() => toggleBrowser(browser)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150 capitalize ${
                            active
                              ? BROWSER_COLORS_ACTIVE[browser] ?? 'bg-amber-500 text-white border-amber-400'
                              : BROWSER_COLORS[browser] ?? 'bg-gray-800 text-gray-400 border-gray-700'
                          }`}
                        >
                          {browser}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Breakpoint pills */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Breakpoint</label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      onClick={() => onBreakpointChange(null)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150 ${
                        !selectedBreakpoint
                          ? 'bg-amber-500 text-gray-950 border-amber-400 font-semibold'
                          : 'bg-gray-900 text-gray-400 border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      All
                    </button>
                    {availableBreakpoints.map((bp) => (
                      <button
                        key={bp}
                        onClick={() => onBreakpointChange(bp)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150 ${
                          selectedBreakpoint === bp
                            ? 'bg-amber-500 text-gray-950 border-amber-400 font-semibold'
                            : 'bg-gray-900 text-gray-400 border-gray-700 hover:border-gray-600'
                        }`}
                      >
                        {bp}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Visit page link */}
            {currentPageUrl && (
              <a
                href={currentPageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-amber-400 transition-colors duration-150"
                title="Visit page"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Capture progress indicator */}
        {captureState.isCapturing && (
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-24 h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${pct}%`,
                  background: 'linear-gradient(to right, #8b5cf6, #f59e0b)',
                }}
              />
            </div>
            <span className="text-xs text-gray-400 tabular-nums">
              {captureState.progress}/{captureState.total}
            </span>
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse-amber" />
          </div>
        )}

        {/* New capture button */}
        <button
          onClick={onNewCapture}
          disabled={captureState.isCapturing}
          className="shrink-0 bg-amber-500 hover:bg-amber-400 text-gray-950 text-sm font-semibold px-4 py-1.5 rounded-lg transition-all duration-150 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
        >
          + Capture
        </button>
      </div>
    </header>
  );
}
