import { useState, useEffect, useRef } from 'react';
import type { CaptureProgressEvent } from '../types';

interface CapturePanelProps {
  onClose: () => void;
  onCaptureComplete: (sessionId: string) => void;
}

interface Config {
  urls?: string[];
  browsers?: string[];
  breakpoints?: Record<string, number>;
}

export default function CapturePanel({ onClose, onCaptureComplete }: CapturePanelProps) {
  const [config, setConfig] = useState<Config>({});
  const [sessionName, setSessionName] = useState('');
  const [urlsText, setUrlsText] = useState('');
  const [selectedBrowsers, setSelectedBrowsers] = useState<string[]>(['chromium']);
  const [isCapturing, setIsCapturing] = useState(false);
  const [log, setLog] = useState<CaptureProgressEvent[]>([]);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const logRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const ALL_BROWSERS = ['chromium', 'firefox', 'webkit', 'edge'];
  const BROWSER_COLOR: Record<string, string> = {
    chromium: 'border-blue-500/50 text-blue-300',
    firefox: 'border-orange-500/50 text-orange-300',
    webkit: 'border-violet-500/50 text-violet-300',
    edge: 'border-cyan-500/50 text-cyan-300',
  };
  const BROWSER_COLOR_ACTIVE: Record<string, string> = {
    chromium: 'bg-blue-500/20 border-blue-400 text-blue-200',
    firefox: 'bg-orange-500/20 border-orange-400 text-orange-200',
    webkit: 'bg-violet-500/20 border-violet-400 text-violet-200',
    edge: 'bg-cyan-500/20 border-cyan-400 text-cyan-200',
  };

  useEffect(() => {
    fetch('/api/config')
      .then((r) => r.json())
      .then((c: Config) => {
        setConfig(c);
        if (c.urls) setUrlsText(c.urls.join('\n'));
        if (c.browsers) setSelectedBrowsers(c.browsers);
        if (c.urls && c.urls.length > 0) {
          try {
            const firstHost = new URL(c.urls[0]).hostname.replace(/^www\./, '');
            setSessionName(`${firstHost} ${new Date().toLocaleDateString()}`);
          } catch (_) {
            setSessionName(`Session ${new Date().toLocaleDateString()}`);
          }
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [log]);

  function toggleBrowser(b: string) {
    setSelectedBrowsers((prev) =>
      prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]
    );
  }

  async function startCapture() {
    const urls = urlsText
      .split('\n')
      .map((u) => u.trim())
      .filter((u) => u.length > 0);

    if (urls.length === 0) return;
    if (selectedBrowsers.length === 0) return;

    setIsCapturing(true);
    setLog([]);
    setProgress(0);

    // Open SSE stream
    const es = new EventSource('/api/capture/status');
    eventSourceRef.current = es;

    es.onmessage = (e) => {
      const event: CaptureProgressEvent = JSON.parse(e.data);
      setLog((prev) => [...prev, event]);

      if (event.type === 'start' && event.total) {
        setTotal(event.total);
      }
      if (event.type === 'progress') {
        setProgress((p) => p + 1);
      }
      if (event.type === 'complete' && event.sessionId) {
        es.close();
        setIsCapturing(false);
        onCaptureComplete(event.sessionId);
      }
      if (event.type === 'error') {
        setLog((prev) => [...prev, event]);
      }
    };

    es.onerror = () => {
      es.close();
      setIsCapturing(false);
    };

    // POST to start capture
    try {
      const res = await fetch('/api/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: sessionName,
          urls,
          browsers: selectedBrowsers,
          breakpoints: config.breakpoints,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setLog((prev) => [...prev, { type: 'error', message: err.error }]);
        es.close();
        setIsCapturing(false);
      }
    } catch (err) {
      setLog((prev) => [...prev, { type: 'error', message: String(err) }]);
      es.close();
      setIsCapturing(false);
    }
  }

  function formatLogEntry(event: CaptureProgressEvent, i: number) {
    if (event.type === 'start') {
      return (
        <div key={i} className="text-emerald-400">
          Starting capture — {event.total} screenshot{event.total !== 1 ? 's' : ''} queued
        </div>
      );
    }
    if (event.type === 'progress') {
      return (
        <div key={i} className="text-gray-400">
          <span className="text-violet-400">[{event.browser}]</span>{' '}
          <span className="text-amber-400/80">{event.breakpoint}</span>{' '}
          <span className="text-gray-500 text-xs">{event.url}</span>
        </div>
      );
    }
    if (event.type === 'complete') {
      return (
        <div key={i} className="text-emerald-400 font-semibold">
          ✓ Capture complete!
        </div>
      );
    }
    if (event.type === 'error') {
      return (
        <div key={i} className="text-rose-400">
          ✗ {event.message}
        </div>
      );
    }
    return null;
  }

  const pct = total > 0 ? Math.round((progress / total) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl animate-scale-in overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 className="font-display text-lg font-semibold text-gray-100">New Capture</h2>
          <button
            onClick={onClose}
            disabled={isCapturing}
            className="w-8 h-8 rounded-full bg-gray-800 hover:bg-rose-500/20 hover:text-rose-400 text-gray-500 flex items-center justify-center transition-all duration-150"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Session name */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
              Session Name
            </label>
            <input
              type="text"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              disabled={isCapturing}
              className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-lg px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/50 disabled:opacity-50"
              placeholder="My capture session"
            />
          </div>

          {/* URLs */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
              URLs <span className="text-gray-600 normal-case">(one per line)</span>
            </label>
            <textarea
              value={urlsText}
              onChange={(e) => setUrlsText(e.target.value)}
              disabled={isCapturing}
              rows={6}
              className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-lg px-3 py-2 text-sm font-mono focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/50 resize-none disabled:opacity-50"
              placeholder="https://example.com&#10;https://example.com/about"
            />
          </div>

          {/* Browsers */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
              Browsers
            </label>
            <div className="flex gap-2 flex-wrap">
              {ALL_BROWSERS.map((b) => {
                const active = selectedBrowsers.includes(b);
                return (
                  <button
                    key={b}
                    onClick={() => toggleBrowser(b)}
                    disabled={isCapturing}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition-all duration-150 capitalize disabled:opacity-50 ${
                      active
                        ? BROWSER_COLOR_ACTIVE[b]
                        : `bg-gray-800/50 border-gray-700 text-gray-500 hover:${BROWSER_COLOR[b]}`
                    }`}
                  >
                    {b}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Progress bar */}
          {isCapturing && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Progress</span>
                <span>{progress} / {total}</span>
              </div>
              <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${pct}%`,
                    background: 'linear-gradient(to right, #8b5cf6, #f59e0b)',
                  }}
                />
              </div>
            </div>
          )}

          {/* Terminal log */}
          {log.length > 0 && (
            <div
              ref={logRef}
              className="terminal-log bg-gray-950 rounded-lg p-4 h-40 overflow-y-auto text-xs font-mono space-y-0.5 border border-gray-800"
            >
              {log.map((event, i) => formatLogEntry(event, i))}
              {isCapturing && (
                <div className="text-gray-600 animate-pulse-amber">_</div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          <button
            onClick={startCapture}
            disabled={isCapturing || urlsText.trim().length === 0 || selectedBrowsers.length === 0}
            className="w-full py-3 rounded-xl font-semibold text-gray-950 text-sm transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: isCapturing
                ? '#374151'
                : 'linear-gradient(135deg, #f59e0b, #d97706)',
            }}
          >
            {isCapturing ? 'Capturing...' : 'Start Capture'}
          </button>
        </div>
      </div>
    </div>
  );
}
