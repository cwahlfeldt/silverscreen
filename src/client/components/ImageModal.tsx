import { useEffect } from 'react';
import type { Screenshot } from '../types';

interface ImageModalProps {
  screenshot: Screenshot;
  sessionId: string;
  onClose: () => void;
}

export default function ImageModal({ screenshot, sessionId, onClose }: ImageModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const imageUrl = `/api/sessions/${sessionId}/screenshots/${screenshot.browser}/${screenshot.page}/${screenshot.filename}`;
  const downloadUrl = imageUrl;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-gray-950/95 animate-fade-in"
      onClick={onClose}
    >
      {/* Frosted glass header */}
      <div
        className="glass sticky top-0 z-10 px-6 py-4 flex items-center justify-between"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <div className="font-semibold text-gray-100 text-sm">{screenshot.pageName}</div>
          <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
            <span className="capitalize">{screenshot.browser}</span>
            <span>·</span>
            <span>{screenshot.breakpoint}</span>
            <span>·</span>
            <span>{new Date(screenshot.timestamp).toLocaleString()}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={downloadUrl}
            download={screenshot.filename}
            onClick={(e) => e.stopPropagation()}
            className="bg-amber-500 hover:bg-amber-400 text-gray-950 font-semibold text-xs px-4 py-1.5 rounded-full transition-all duration-150 flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download
          </a>
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

      {/* Image */}
      <div
        className="flex-1 overflow-auto p-8 flex items-start justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={imageUrl}
          alt={`${screenshot.pageName} — ${screenshot.browser} — ${screenshot.breakpoint}`}
          className="max-w-full h-auto rounded-lg shadow-2xl animate-scale-in"
        />
      </div>
    </div>
  );
}
