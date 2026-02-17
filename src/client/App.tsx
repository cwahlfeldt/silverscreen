import { useState, useEffect, useCallback, useRef } from 'react';
import type { Manifest, Screenshot, Session, CaptureState, CaptureProgressEvent } from './types';
import Header from './components/Header';
import ComparisonGrid from './components/ComparisonGrid';
import ImageModal from './components/ImageModal';
import SessionSidebar from './components/SessionSidebar';
import CapturePanel from './components/CapturePanel';
import Dashboard from './components/Dashboard';

type View = 'dashboard' | 'session';

function App() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCapture, setShowCapture] = useState(false);
  const [currentView, setCurrentView] = useState<View>('dashboard');

  // Sidebar collapse (persisted)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('silverscreen:sidebar-collapsed') === 'true';
  });

  // Filter states
  const [selectedPage, setSelectedPage] = useState<string | null>(null);
  const [selectedBrowsers, setSelectedBrowsers] = useState<string[]>([]);
  const [selectedBreakpoint, setSelectedBreakpoint] = useState<string | null>(null);

  // Modal state
  const [selectedImage, setSelectedImage] = useState<Screenshot | null>(null);

  // Capture state (lifted from CapturePanel)
  const [captureState, setCaptureState] = useState<CaptureState>({
    isCapturing: false,
    sessionId: null,
    progress: 0,
    total: 0,
    log: [],
  });
  const eventSourceRef = useRef<EventSource | null>(null);

  // Persist sidebar state
  useEffect(() => {
    localStorage.setItem('silverscreen:sidebar-collapsed', String(sidebarCollapsed));
  }, [sidebarCollapsed]);

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
    fetchSessions();
  }, [fetchSessions]);

  function handleSelectSession(id: string) {
    setSelectedSessionId(id);
    setCurrentView('session');
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
        setCurrentView('dashboard');
      }
    }
  }

  function handleLogoClick() {
    setCurrentView('dashboard');
    setSelectedSessionId(null);
    setManifest(null);
  }

  // Start capture — lifted from CapturePanel
  async function handleStartCapture(payload: {
    name: string;
    urls: string[];
    browsers: string[];
    breakpoints?: Record<string, number>;
  }) {
    const bpCount = Object.keys(payload.breakpoints ?? {}).length;
    const computedTotal = payload.urls.length * payload.browsers.length * bpCount;

    setCaptureState({
      isCapturing: true,
      sessionId: null,
      progress: 0,
      total: computedTotal,
      log: [],
    });
    setShowCapture(false);

    // Open SSE stream
    const es = new EventSource('/api/capture/status');
    eventSourceRef.current = es;

    es.onmessage = (e) => {
      const event: CaptureProgressEvent = JSON.parse(e.data);

      setCaptureState((prev) => {
        const newLog = [...prev.log, event];

        if (event.type === 'start') {
          return { ...prev, total: event.total ?? prev.total, sessionId: event.sessionId ?? prev.sessionId, log: newLog };
        }
        if (event.type === 'progress') {
          return { ...prev, progress: prev.progress + 1, log: newLog };
        }
        if (event.type === 'complete') {
          es.close();
          if (event.sessionId) {
            fetchSessions().then(() => {
              setSelectedSessionId(event.sessionId!);
              setCurrentView('session');
              loadSession(event.sessionId!);
            });
          }
          return { ...prev, isCapturing: false, log: newLog };
        }
        if (event.type === 'error') {
          return { ...prev, log: newLog };
        }
        return prev;
      });
    };

    es.onerror = () => {
      es.close();
      setCaptureState((prev) => ({ ...prev, isCapturing: false }));
    };

    // POST to start capture
    try {
      const res = await fetch('/api/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        setCaptureState((prev) => ({
          ...prev,
          isCapturing: false,
          log: [...prev.log, { type: 'error', message: err.error }],
        }));
        es.close();
      }
    } catch (err) {
      setCaptureState((prev) => ({
        ...prev,
        isCapturing: false,
        log: [...prev.log, { type: 'error', message: String(err) }],
      }));
      es.close();
    }
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
        manifest={currentView === 'session' ? manifest : null}
        selectedPage={selectedPage}
        selectedBrowsers={selectedBrowsers}
        selectedBreakpoint={selectedBreakpoint}
        availableBreakpoints={availableBreakpoints}
        onPageChange={setSelectedPage}
        onBrowsersChange={setSelectedBrowsers}
        onBreakpointChange={setSelectedBreakpoint}
        onNewCapture={() => setShowCapture(true)}
        onLogoClick={handleLogoClick}
        sessionName={currentView === 'session' ? selectedSession?.name : undefined}
        captureState={captureState}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <SessionSidebar
          sessions={sessions}
          selectedSessionId={selectedSessionId}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
          onSelectSession={handleSelectSession}
          onDeleteSession={handleDeleteSession}
          onNewCapture={() => setShowCapture(true)}
        />

        {/* Main content */}
        <main className="flex-1 overflow-y-auto px-6 py-8">
          {currentView === 'dashboard' ? (
            <Dashboard
              sessions={sessions}
              onSelectSession={handleSelectSession}
              onNewCapture={() => setShowCapture(true)}
            />
          ) : loading ? (
            <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in">
              <div className="text-amber-400 text-4xl mb-4 animate-pulse-amber">◉</div>
              <div className="text-gray-400 text-sm">Loading session...</div>
            </div>
          ) : manifest && filteredScreenshots.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in">
              <div className="text-gray-600 text-lg mb-2">No screenshots match your filters</div>
              <div className="text-gray-600 text-sm">Try adjusting the browser or breakpoint filters</div>
            </div>
          ) : manifest && selectedSessionId ? (
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
          onStartCapture={handleStartCapture}
          isCapturing={captureState.isCapturing}
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
