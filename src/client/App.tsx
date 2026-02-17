import { useState, useEffect, useCallback } from 'react';
import type { Manifest, Screenshot, Session } from './types';
import Header from './components/Header';
import ComparisonGrid from './components/ComparisonGrid';
import ImageModal from './components/ImageModal';
import SessionSidebar from './components/SessionSidebar';
import CapturePanel from './components/CapturePanel';

function App() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCapture, setShowCapture] = useState(false);

  // Filter states
  const [selectedPage, setSelectedPage] = useState<string | null>(null);
  const [selectedBrowsers, setSelectedBrowsers] = useState<string[]>([]);
  const [selectedBreakpoint, setSelectedBreakpoint] = useState<string | null>(null);

  // Modal state
  const [selectedImage, setSelectedImage] = useState<Screenshot | null>(null);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch('/api/sessions');
      const data: Session[] = await res.json();
      setSessions(data);
      return data;
    } catch (_) {
      return [];
    }
  }, []);

  const loadSession = useCallback(async (id: string) => {
    setLoading(true);
    setManifest(null);
    setSelectedPage(null);
    setSelectedBrowsers([]);
    setSelectedBreakpoint(null);
    setSelectedImage(null);

    try {
      const res = await fetch(`/api/sessions/${id}/manifest`);
      if (!res.ok) {
        setLoading(false);
        return;
      }
      const data: Manifest = await res.json();
      setManifest(data);

      if (data.pages && Object.keys(data.pages).length > 0) {
        setSelectedPage(Object.keys(data.pages)[0]);
      }
      if (data.browsers && data.browsers.length > 0) {
        setSelectedBrowsers(data.browsers);
      }
    } catch (_) {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions().then((data) => {
      if (data.length > 0) {
        setSelectedSessionId(data[0].id);
        loadSession(data[0].id);
      }
    });
  }, [fetchSessions, loadSession]);

  function handleSelectSession(id: string) {
    setSelectedSessionId(id);
    loadSession(id);
  }

  async function handleDeleteSession(id: string) {
    await fetch(`/api/sessions/${id}`, { method: 'DELETE' });
    const newSessions = await fetchSessions();
    if (selectedSessionId === id) {
      if (newSessions.length > 0) {
        setSelectedSessionId(newSessions[0].id);
        loadSession(newSessions[0].id);
      } else {
        setSelectedSessionId(null);
        setManifest(null);
      }
    }
  }

  async function handleCaptureComplete(sessionId: string) {
    await fetchSessions();
    setSelectedSessionId(sessionId);
    loadSession(sessionId);
    setShowCapture(false);
  }

  // Filtered screenshots
  const filteredScreenshots = manifest?.screenshots.filter((s) => {
    if (selectedPage && s.page !== selectedPage) return false;
    if (selectedBrowsers.length > 0 && !selectedBrowsers.includes(s.browser)) return false;
    if (selectedBreakpoint && s.breakpoint !== selectedBreakpoint) return false;
    return true;
  }) ?? [];

  const availableBreakpoints = [
    ...new Set(
      (manifest?.screenshots ?? [])
        .filter((s) => !selectedPage || s.page === selectedPage)
        .map((s) => s.breakpoint)
    ),
  ].sort();

  const selectedSession = sessions.find((s) => s.id === selectedSessionId);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header
        manifest={manifest}
        selectedPage={selectedPage}
        selectedBrowsers={selectedBrowsers}
        selectedBreakpoint={selectedBreakpoint}
        availableBreakpoints={availableBreakpoints}
        onPageChange={setSelectedPage}
        onBrowsersChange={setSelectedBrowsers}
        onBreakpointChange={setSelectedBreakpoint}
        onNewCapture={() => setShowCapture(true)}
        sessionName={selectedSession?.name}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <SessionSidebar
          sessions={sessions}
          selectedSessionId={selectedSessionId}
          onSelectSession={handleSelectSession}
          onDeleteSession={handleDeleteSession}
          onNewCapture={() => setShowCapture(true)}
        />

        {/* Main content */}
        <main className="flex-1 overflow-y-auto px-6 py-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in">
              <div className="text-amber-400 text-4xl mb-4 animate-pulse-amber">◉</div>
              <div className="text-gray-400 text-sm">Loading session...</div>
            </div>
          ) : !selectedSessionId ? (
            <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in">
              <div className="text-6xl mb-4">🎬</div>
              <h2 className="font-display text-xl font-semibold text-gray-300 mb-2">
                Lights, camera, capture!
              </h2>
              <p className="text-gray-500 text-sm mb-6">No screenshots yet. Start a new capture to get going.</p>
              <button
                onClick={() => setShowCapture(true)}
                className="bg-amber-500 hover:bg-amber-400 text-gray-950 font-semibold px-6 py-2.5 rounded-lg transition-all duration-150 hover:scale-105"
              >
                + New Capture
              </button>
            </div>
          ) : manifest && filteredScreenshots.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in">
              <div className="text-gray-600 text-lg mb-2">No screenshots match your filters</div>
              <div className="text-gray-600 text-sm">Try adjusting the browser or breakpoint filters</div>
            </div>
          ) : manifest ? (
            <ComparisonGrid
              screenshots={filteredScreenshots}
              sessionId={selectedSessionId}
              onImageClick={setSelectedImage}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in">
              <div className="text-gray-600 text-sm">Select a session to view screenshots</div>
            </div>
          )}
        </main>
      </div>

      {/* Capture panel overlay */}
      {showCapture && (
        <CapturePanel
          onClose={() => setShowCapture(false)}
          onCaptureComplete={handleCaptureComplete}
        />
      )}

      {/* Image modal */}
      {selectedImage && selectedSessionId && (
        <ImageModal
          screenshot={selectedImage}
          sessionId={selectedSessionId}
          onClose={() => setSelectedImage(null)}
        />
      )}
    </div>
  );
}

export default App;
