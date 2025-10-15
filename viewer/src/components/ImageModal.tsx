import { useEffect } from 'react';
import type { Screenshot } from '../types';

interface ImageModalProps {
  screenshot: Screenshot;
  onClose: () => void;
}

export default function ImageModal({ screenshot, onClose }: ImageModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-7xl max-h-full overflow-auto bg-white rounded-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {screenshot.pageName}
            </h3>
            <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
              <span className="capitalize font-medium">{screenshot.browser}</span>
              <span>•</span>
              <span>{screenshot.breakpoint}</span>
              <span>•</span>
              <span>{new Date(screenshot.timestamp).toLocaleString()}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        {/* Image */}
        <div className="p-6 bg-gray-50">
          <img
            src={`/${screenshot.path}`}
            alt={`${screenshot.pageName} - ${screenshot.browser} - ${screenshot.breakpoint}`}
            className="w-full h-auto rounded-lg shadow-lg"
          />
        </div>

        {/* Footer with download button */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
          <a
            href={`/${screenshot.path}`}
            download={screenshot.filename}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
            </svg>
            Download Screenshot
          </a>
        </div>
      </div>
    </div>
  );
}
