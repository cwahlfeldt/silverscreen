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
}: HeaderProps) {
  if (!manifest) return null;

  const toggleBrowser = (browser: string) => {
    if (selectedBrowsers.includes(browser)) {
      onBrowsersChange(selectedBrowsers.filter((b) => b !== browser));
    } else {
      onBrowsersChange([...selectedBrowsers, browser]);
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Silverscreen Viewer</h1>
          <p className="text-sm text-gray-500 mt-1">
            Compare screenshots across browsers and breakpoints
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Page Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Page / URL
            </label>
            <select
              value={selectedPage || ''}
              onChange={(e) => onPageChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              {Object.keys(manifest.pages).map((pageId) => (
                <option key={pageId} value={pageId}>
                  {manifest.pages[pageId].name}
                </option>
              ))}
            </select>
          </div>

          {/* Browser Toggles */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Browsers
            </label>
            <div className="flex flex-wrap gap-2">
              {manifest.browsers.map((browser) => (
                <button
                  key={browser}
                  onClick={() => toggleBrowser(browser)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    selectedBrowsers.includes(browser)
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {browser}
                </button>
              ))}
            </div>
          </div>

          {/* Breakpoint Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Breakpoint
            </label>
            <select
              value={selectedBreakpoint || ''}
              onChange={(e) => onBreakpointChange(e.target.value || null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="">All Breakpoints</option>
              {availableBreakpoints.map((breakpoint) => (
                <option key={breakpoint} value={breakpoint}>
                  {breakpoint}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </header>
  );
}
