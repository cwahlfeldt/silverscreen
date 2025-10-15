import { useState, useEffect } from "react";
import type { Manifest, Screenshot } from "./types";
import Header from "./components/Header";
import ComparisonGrid from "./components/ComparisonGrid";
import ImageModal from "./components/ImageModal";

function App() {
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [selectedPage, setSelectedPage] = useState<string | null>(null);
  const [selectedBrowsers, setSelectedBrowsers] = useState<string[]>([]);
  const [selectedBreakpoint, setSelectedBreakpoint] = useState<string | null>(
    null
  );

  // Modal state
  const [selectedImage, setSelectedImage] = useState<Screenshot | null>(null);

  useEffect(() => {
    fetch("/manifest.json")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load manifest");
        return res.json();
      })
      .then((data: Manifest) => {
        setManifest(data);
        // Set default selections
        if (data.pages && Object.keys(data.pages).length > 0) {
          setSelectedPage(Object.keys(data.pages)[0]);
        }
        if (data.browsers && data.browsers.length > 0) {
          setSelectedBrowsers(data.browsers);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // Get filtered screenshots
  const filteredScreenshots =
    manifest?.screenshots.filter((screenshot) => {
      if (selectedPage && screenshot.page !== selectedPage) return false;
      if (
        selectedBrowsers.length > 0 &&
        !selectedBrowsers.includes(screenshot.browser)
      )
        return false;
      if (selectedBreakpoint && screenshot.breakpoint !== selectedBreakpoint)
        return false;
      return true;
    }) || [];

  // Get unique breakpoints for selected page
  const availableBreakpoints =
    manifest?.screenshots
      .filter((s) => !selectedPage || s.page === selectedPage)
      .map((s) => s.breakpoint)
      .filter((value, index, self) => self.indexOf(value) === index)
      .sort() || [];

  if (loading) {
    return (
      <div className="flex justify-center items-center bg-gray-100 min-h-screen">
        <div className="text-center">
          <div className="mb-2 font-semibold text-gray-700 text-2xl">
            Loading screenshots...
          </div>
          <div className="text-gray-500">Please wait</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center bg-gray-100 min-h-screen">
        <div className="text-center">
          <div className="mb-2 font-semibold text-red-600 text-2xl">Error</div>
          <div className="text-gray-700">{error}</div>
          <div className="mt-4 text-gray-500 text-sm">
            Make sure manifest.json exists in the public directory
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <Header
        manifest={manifest}
        selectedPage={selectedPage}
        selectedBrowsers={selectedBrowsers}
        selectedBreakpoint={selectedBreakpoint}
        availableBreakpoints={availableBreakpoints}
        onPageChange={setSelectedPage}
        onBrowsersChange={setSelectedBrowsers}
        onBreakpointChange={setSelectedBreakpoint}
      />

      <main className="mx-auto px-4 py-8 ma-w-90">
        {filteredScreenshots.length === 0 ? (
          <div className="py-12 text-center">
            <div className="text-gray-600 text-xl">No screenshots found</div>
            <div className="mt-2 text-gray-500 text-sm">
              Try adjusting your filters or generate screenshots first
            </div>
          </div>
        ) : (
          <ComparisonGrid
            screenshots={filteredScreenshots}
            onImageClick={setSelectedImage}
          />
        )}
      </main>

      {selectedImage && (
        <ImageModal
          screenshot={selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      )}
    </div>
  );
}

export default App;
