import type { Session } from '../types';
import { BROWSER_DOT } from '../constants';

interface DashboardProps {
  sessions: Session[];
  onSelectSession: (id: string) => void;
  onNewCapture: () => void;
}

export default function Dashboard({ sessions, onSelectSession, onNewCapture }: DashboardProps) {
  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  return (
    <div className="max-w-4xl mx-auto py-12 animate-fade-in">
      {/* Hero */}
      <div className="text-center mb-12">
        <h1 className="font-display text-3xl font-bold text-gray-100 mb-2">
          <span className="text-amber-400">S</span>ilverscreen
        </h1>
        <p className="text-gray-500">Responsive screenshot capture and comparison</p>
      </div>

      {/* Quick action */}
      <div className="flex justify-center mb-10">
        <button
          onClick={onNewCapture}
          className="bg-amber-500 hover:bg-amber-400 text-gray-950 font-semibold px-6 py-3 rounded-xl transition-all duration-150 hover:scale-105"
        >
          + New Capture
        </button>
      </div>

      {/* Recent sessions */}
      {sessions.length > 0 ? (
        <div>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">
            Recent Sessions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => onSelectSession(session.id)}
                className="text-left bg-gray-900 border border-gray-800 rounded-xl p-4 card-hover hover:border-amber-500/30 transition-all"
              >
                <div className="font-medium text-gray-100 text-sm mb-1 truncate">
                  {session.name}
                </div>
                <div className="text-xs text-gray-500 mb-2">
                  {formatDate(session.createdAt)} — {session.urlCount} URL
                  {session.urlCount !== 1 ? 's' : ''}
                </div>
                <div className="flex gap-1">
                  {session.browsers.map((b) => (
                    <span
                      key={b}
                      className={`w-2 h-2 rounded-full ${BROWSER_DOT[b] ?? 'bg-gray-500'}`}
                      title={b}
                    />
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-600 py-12">
          No sessions yet. Start your first capture above.
        </div>
      )}
    </div>
  );
}
