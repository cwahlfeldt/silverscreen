import { useState, useEffect } from 'react';
import type { Profile } from '../types';
import { getApiBase } from '../api';
import { ALL_BROWSERS, BROWSER_CAPTURE_ACTIVE, BROWSER_CAPTURE_INACTIVE } from '../constants';

interface CapturePanelProps {
  onClose: () => void;
  onStartCapture: (payload: {
    name: string;
    urls: string[];
    browsers: string[];
    breakpoints?: Record<string, number>;
  }) => void;
  isCapturing: boolean;
}

export default function CapturePanel({ onClose, onStartCapture, isCapturing }: CapturePanelProps) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sessionName, setSessionName] = useState(`Session ${new Date().toLocaleDateString()}`);
  const [urlsText, setUrlsText] = useState('');
  const [selectedBrowsers, setSelectedBrowsers] = useState<string[]>(['chromium']);
  const [showSettings, setShowSettings] = useState(false);

  // Editable profile settings
  const [editBreakpoints, setEditBreakpoints] = useState<Record<string, number>>({});
  const [editDelay, setEditDelay] = useState(0);
  const [editHideSelectors, setEditHideSelectors] = useState('');

  useEffect(() => {
    getApiBase()
      .then((base) => fetch(`${base}/api/profile`))
      .then((r) => r.json())
      .then((p: Profile) => {
        setProfile(p);
        setSelectedBrowsers(p.browsers);
        setEditBreakpoints(p.breakpoints);
        setEditDelay(p.delay);
        setEditHideSelectors(p.hideSelectors.join('\n'));
      })
      .catch(() => {});
  }, []);

  function toggleBrowser(b: string) {
    setSelectedBrowsers((prev) =>
      prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]
    );
  }

  function handleStart() {
    const urls = urlsText
      .split('\n')
      .map((u) => u.trim())
      .filter((u) => u.length > 0);

    if (urls.length === 0 || selectedBrowsers.length === 0) return;

    onStartCapture({
      name: sessionName,
      urls,
      browsers: selectedBrowsers,
      breakpoints: editBreakpoints,
    });
  }

  async function handleSaveProfile() {
    const hideSelectors = editHideSelectors
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const updated: Profile = {
      browsers: selectedBrowsers,
      breakpoints: editBreakpoints,
      delay: editDelay,
      hideSelectors,
      screenshot: profile?.screenshot ?? { fullPage: true },
    };

    const base = await getApiBase();
    await fetch(`${base}/api/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    });

    setProfile(updated);
    setShowSettings(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl animate-scale-in overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 className="font-display text-lg font-semibold text-gray-100">New Capture</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-150 ${
                showSettings
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-gray-800 text-gray-500 hover:text-gray-300'
              }`}
              title="Profile settings"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-800 hover:bg-rose-500/20 hover:text-rose-400 text-gray-500 flex items-center justify-center transition-all duration-150"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {showSettings ? (
            /* Profile settings editor */
            <>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                  Breakpoints
                </label>
                <div className="space-y-2">
                  {Object.entries(editBreakpoints).map(([name, width]) => (
                    <div key={name} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={name}
                        readOnly
                        className="flex-1 bg-gray-800 border border-gray-700 text-gray-300 rounded-lg px-3 py-1.5 text-sm"
                      />
                      <input
                        type="number"
                        value={width}
                        onChange={(e) =>
                          setEditBreakpoints((prev) => ({
                            ...prev,
                            [name]: parseInt(e.target.value) || 0,
                          }))
                        }
                        className="w-24 bg-gray-800 border border-gray-700 text-gray-300 rounded-lg px-3 py-1.5 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                      />
                      <button
                        onClick={() =>
                          setEditBreakpoints((prev) => {
                            const next = { ...prev };
                            delete next[name];
                            return next;
                          })
                        }
                        className="text-gray-600 hover:text-rose-400 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      const name = `custom-${Object.keys(editBreakpoints).length + 1}`;
                      setEditBreakpoints((prev) => ({ ...prev, [name]: 1024 }));
                    }}
                    className="text-xs text-amber-400 hover:text-amber-300 transition-colors"
                  >
                    + Add breakpoint
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                  Delay (ms)
                </label>
                <input
                  type="number"
                  value={editDelay}
                  onChange={(e) => setEditDelay(parseInt(e.target.value) || 0)}
                  className="w-full bg-gray-800 border border-gray-700 text-gray-300 rounded-lg px-3 py-1.5 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                  Hide Selectors <span className="text-gray-600 normal-case">(one per line)</span>
                </label>
                <textarea
                  value={editHideSelectors}
                  onChange={(e) => setEditHideSelectors(e.target.value)}
                  rows={3}
                  className="w-full bg-gray-800 border border-gray-700 text-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/50 resize-none"
                  placeholder=".cookie-banner&#10;.modal-overlay"
                />
              </div>
            </>
          ) : (
            /* Capture form */
            <>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                  Session Name
                </label>
                <input
                  type="text"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-lg px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                  placeholder="My capture session"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                  URLs <span className="text-gray-600 normal-case">(one per line)</span>
                </label>
                <textarea
                  value={urlsText}
                  onChange={(e) => setUrlsText(e.target.value)}
                  rows={6}
                  className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-lg px-3 py-2 text-sm font-mono focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/50 resize-none"
                  placeholder="https://example.com&#10;https://example.com/about"
                />
              </div>

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
                        className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition-all duration-150 capitalize ${
                          active
                            ? BROWSER_CAPTURE_ACTIVE[b] ?? 'bg-amber-500/20 border-amber-400 text-amber-200'
                            : BROWSER_CAPTURE_INACTIVE[b] ? `bg-gray-800/50 ${BROWSER_CAPTURE_INACTIVE[b]}` : 'bg-gray-800/50 border-gray-700 text-gray-500'
                        }`}
                      >
                        {b}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          {showSettings ? (
            <button
              onClick={handleSaveProfile}
              className="w-full py-3 rounded-xl font-semibold text-gray-950 text-sm transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }}
            >
              Save Settings
            </button>
          ) : (
            <button
              onClick={handleStart}
              disabled={isCapturing || urlsText.trim().length === 0 || selectedBrowsers.length === 0}
              className="w-full py-3 rounded-xl font-semibold text-gray-950 text-sm transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              }}
            >
              Start Capture
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
