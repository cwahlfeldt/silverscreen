import type { Screenshot } from '../types';

interface ComparisonGridProps {
  screenshots: Screenshot[];
  onImageClick: (screenshot: Screenshot) => void;
}

export default function ComparisonGrid({ screenshots, onImageClick }: ComparisonGridProps) {
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
      {Object.entries(groupedByBreakpoint).map(([breakpoint, breakpointScreenshots]) => (
        <section key={breakpoint} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 pb-3 border-b border-gray-200">
            {breakpoint}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {breakpointScreenshots.map((screenshot) => (
              <div
                key={`${screenshot.browser}-${screenshot.breakpoint}-${screenshot.timestamp}`}
                className="group relative bg-gray-50 rounded-lg overflow-hidden border border-gray-200 hover:border-blue-400 transition-all cursor-pointer"
                onClick={() => onImageClick(screenshot)}
              >
                <div className="aspect-[3/4] relative overflow-hidden bg-gray-100">
                  <img
                    src={`/${screenshot.path}`}
                    alt={`${screenshot.pageName} - ${screenshot.browser} - ${screenshot.breakpoint}`}
                    className="w-full h-full object-contain object-top group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />

                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-opacity flex items-center justify-center">
                    <span className="text-white opacity-0 group-hover:opacity-100 bg-black bg-opacity-70 px-4 py-2 rounded-lg font-medium">
                      Click to enlarge
                    </span>
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 capitalize">
                      {screenshot.browser}
                    </h3>
                    <span className="text-xs text-gray-500">
                      {new Date(screenshot.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{screenshot.pageName}</p>
                </div>
              </div>
            ))}
          </div>

          {breakpointScreenshots.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No screenshots found for this breakpoint
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
