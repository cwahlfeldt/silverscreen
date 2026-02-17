import type { Manifest } from '../types';

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
  sessionName?: string;
}

const BROWSER_COLORS: Record<string, string> = {
  chromium: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  chrome: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  firefox: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  webkit: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  edge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
};

const BROWSER_COLORS_ACTIVE: Record<string, string> = {
  chromium: 'bg-blue-500 text-white border-blue-400',
  chrome: 'bg-blue-500 text-white border-blue-400',
  firefox: 'bg-orange-500 text-white border-orange-400',
  webkit: 'bg-violet-500 text-white border-violet-400',
  edge: 'bg-cyan-500 text-white border-cyan-400',
};

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
  sessionName,
}: HeaderProps) {
  const toggleBrowser = (browser: string) => {
    if (selectedBrowsers.includes(browser)) {
      onBrowsersChange(selectedBrowsers.filter((b) => b !== browser));
    } else {
      onBrowsersChange([...selectedBrowsers, browser]);
    }
  };

  const currentPageUrl = selectedPage ? manifest?.pages[selectedPage]?.url : null;

  return (
    <header className="glass sticky top-0 z-40">
      <div className="px-4 py-3 flex items-center gap-4 flex-wrap">
        {/* Wordmark */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="font-display text-xl font-bold tracking-tight">
            <span className="text-amber-400">S</span>
            <span className="text-gray-100">ilverscreen</span>
          </span>
          {sessionName && (
            <>
              <span className="text-gray-700">/</span>
              <span className="text-gray-400 text-sm font-medium truncate max-w-48">{sessionName}</span>
            </>
          )}
        </div>

        {/* Filters — only shown when manifest is loaded */}
        {manifest && (
          <div className="flex items-center gap-3 flex-wrap flex-1">
            {/* Page selector */}
            <select
              value={selectedPage || ''}
              onChange={(e) => onPageChange(e.target.value)}
              className="bg-gray-900 border border-gray-700 text-gray-300 text-sm rounded-lg px-3 py-1.5 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/50 min-w-0 max-w-64"
            >
              {Object.keys(manifest.pages).map((pageId) => (
                <option key={pageId} value={pageId}>
                  {manifest.pages[pageId].name}
                </option>
              ))}
            </select>

            {/* Browser toggles */}
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

            {/* Breakpoint pills */}
            <div className="flex items-center gap-1.5">
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

            {/* Visit page link */}
            {currentPageUrl && (
              <a
                href={currentPageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-amber-400 transition-colors duration-150 ml-auto"
                title="Visit page"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}
          </div>
        )}

        {/* New capture button */}
        <button
          onClick={onNewCapture}
          className="shrink-0 ml-auto bg-amber-500 hover:bg-amber-400 text-gray-950 text-sm font-semibold px-4 py-1.5 rounded-lg transition-all duration-150 hover:scale-105"
        >
          + Capture
        </button>
      </div>
    </header>
  );
}
