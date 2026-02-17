import { useState } from 'react';
import type { Session } from '../types';
import { BROWSER_DOT } from '../constants';

interface SessionSidebarProps {
  sessions: Session[];
  selectedSessionId: string | null;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
  onNewCapture: () => void;
}

export default function SessionSidebar({
  sessions,
  selectedSessionId,
  collapsed,
  onToggleCollapse,
  onSelectSession,
  onDeleteSession,
  onNewCapture,
}: SessionSidebarProps) {
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (confirmDelete === id) {
      onDeleteSession(id);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(id);
    }
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  return (
    <aside
      className={`shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col h-full transition-all duration-200 ${
        collapsed ? 'w-12' : 'w-64'
      }`}
    >
      {/* Header */}
      <div className={`border-b border-gray-800 ${collapsed ? 'p-1.5' : 'p-4'}`}>
        {collapsed ? (
          <button
            onClick={onNewCapture}
            className="w-full aspect-square rounded-lg bg-amber-500 hover:bg-amber-400 text-gray-950 flex items-center justify-center transition-all duration-150"
            title="New Capture"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        ) : (
          <button
            onClick={onNewCapture}
            className="w-full bg-amber-500 hover:bg-amber-400 text-gray-950 font-semibold py-2 px-4 rounded-lg transition-all duration-150 hover:scale-[1.02] text-sm"
          >
            + New Capture
          </button>
        )}
      </div>

      {/* Session list */}
      <div className={`flex-1 overflow-y-auto ${collapsed ? 'p-1' : 'p-2'}`}>
        {sessions.length === 0 ? (
          !collapsed && (
            <div className="py-12 text-center text-gray-600 text-sm animate-fade-in">
              <div className="text-2xl mb-2">🎬</div>
              <div>No sessions yet</div>
              <div className="mt-1 text-xs">Start a new capture</div>
            </div>
          )
        ) : collapsed ? (
          <div className="space-y-1.5 flex flex-col items-center pt-1">
            {sessions.map((session) => {
              const active = session.id === selectedSessionId;
              const dotColor = session.browsers[0]
                ? BROWSER_DOT[session.browsers[0]] ?? 'bg-gray-500'
                : 'bg-gray-500';
              return (
                <button
                  key={session.id}
                  onClick={() => onSelectSession(session.id)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-150 ${
                    active
                      ? 'ring-2 ring-amber-500 ring-offset-1 ring-offset-gray-900'
                      : 'hover:ring-2 hover:ring-gray-600 hover:ring-offset-1 hover:ring-offset-gray-900'
                  }`}
                  title={session.name}
                >
                  <span className={`w-3 h-3 rounded-full ${dotColor}`} />
                </button>
              );
            })}
          </div>
        ) : (
          <div className="space-y-1">
            {sessions.map((session) => {
              const active = session.id === selectedSessionId;
              return (
                <div
                  key={session.id}
                  onClick={() => onSelectSession(session.id)}
                  className={`group relative rounded-lg p-3 cursor-pointer transition-all duration-150 ${
                    active
                      ? 'bg-gray-800 border-l-2 border-amber-500 pl-2.5'
                      : 'border-l-2 border-transparent hover:bg-gray-800/50 hover:border-amber-500/40'
                  }`}
                >
                  <div className="font-medium text-sm text-gray-100 truncate pr-6">
                    {session.name}
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                    <span>{formatDate(session.createdAt)}</span>
                    <span>·</span>
                    <span>{session.urlCount} URL{session.urlCount !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-1">
                    {session.browsers.map((b) => (
                      <span
                        key={b}
                        className={`w-2 h-2 rounded-full ${BROWSER_DOT[b] ?? 'bg-gray-500'}`}
                        title={b}
                      />
                    ))}
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={(e) => handleDelete(session.id, e)}
                    onBlur={() => setConfirmDelete(null)}
                    className={`absolute right-2 top-2 p-1 rounded transition-all duration-150 text-xs ${
                      confirmDelete === session.id
                        ? 'text-rose-400 bg-rose-500/10'
                        : 'text-gray-700 hover:text-rose-400 opacity-0 group-hover:opacity-100'
                    }`}
                    title={confirmDelete === session.id ? 'Click again to confirm' : 'Delete session'}
                  >
                    {confirmDelete === session.id ? (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Collapse toggle */}
      <div className="border-t border-gray-800 py-2 flex justify-center">
        <button
          onClick={onToggleCollapse}
          className="p-2 text-gray-500 hover:text-amber-400 transition-colors duration-150"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg
            className={`w-4 h-4 transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      </div>
    </aside>
  );
}
