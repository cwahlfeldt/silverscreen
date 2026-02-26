import { useState, useEffect } from 'react';
import type { Session } from '../types';

interface SettingsModalProps {
  sessions: Session[];
  onClose: () => void;
  onDeleteSession: (id: string) => void;
  onClearAll: () => void;
}

export default function SettingsModal({ sessions, onClose, onDeleteSession, onClearAll }: SettingsModalProps) {
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative glass rounded-2xl border border-gray-800 w-full max-w-lg max-h-[80vh] flex flex-col animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 className="text-lg font-display font-semibold text-gray-100">Settings</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-500 hover:text-gray-300 transition-colors duration-150"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {/* Sessions management */}
          <div>
            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">Sessions</h3>

            {sessions.length === 0 ? (
              <p className="text-sm text-gray-600">No sessions</p>
            ) : (
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50 group"
                  >
                    <div className="min-w-0">
                      <div className="text-sm text-gray-200 truncate">{session.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {formatDate(session.createdAt)} · {session.urlCount} URL{session.urlCount !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (confirmDeleteId === session.id) {
                          onDeleteSession(session.id);
                          setConfirmDeleteId(null);
                        } else {
                          setConfirmDeleteId(session.id);
                        }
                      }}
                      onBlur={() => setConfirmDeleteId(null)}
                      className={`shrink-0 ml-3 px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-150 ${
                        confirmDeleteId === session.id
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                          : 'text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent'
                      }`}
                    >
                      {confirmDeleteId === session.id ? 'Confirm?' : 'Delete'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Danger zone */}
          <div>
            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">Danger Zone</h3>
            <div className="p-4 rounded-lg border border-rose-500/20 bg-rose-500/5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-200 font-medium">Clear all data</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    Delete all sessions and screenshots. This cannot be undone.
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (confirmClearAll) {
                      onClearAll();
                      setConfirmClearAll(false);
                      onClose();
                    } else {
                      setConfirmClearAll(true);
                    }
                  }}
                  onBlur={() => setConfirmClearAll(false)}
                  className={`shrink-0 ml-4 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                    confirmClearAll
                      ? 'bg-rose-500 text-white'
                      : 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 border border-rose-500/40'
                  }`}
                >
                  {confirmClearAll ? 'Are you sure?' : 'Clear All'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
