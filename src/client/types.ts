export interface Screenshot {
  browser: string;
  page: string;
  pageName: string;
  breakpoint: string;
  timestamp: number;
  filename: string;
  path: string;
  extension: string;
}

export interface PageInfo {
  id: string;
  name: string;
  url: string | null;
  browsers: string[];
}

export interface Manifest {
  generatedAt: string;
  browsers: string[];
  pages: Record<string, PageInfo>;
  screenshots: Screenshot[];
}

export interface Session {
  id: string;
  name: string;
  createdAt: string;
  urlCount: number;
  browsers: string[];
}

export interface SessionDetail extends Session {
  urls: string[];
  breakpoints: Record<string, number>;
  manifest: Manifest | null;
}

export interface CaptureJob {
  sessionId: string;
  status: 'running' | 'complete' | 'error';
  progress: CaptureProgressEvent[];
}

export interface CaptureProgressEvent {
  type: 'start' | 'progress' | 'complete' | 'error';
  sessionId?: string;
  total?: number;
  browser?: string;
  url?: string;
  breakpoint?: string;
  path?: string;
  message?: string;
}

export interface CaptureState {
  isCapturing: boolean;
  sessionId: string | null;
  progress: number;
  total: number;
  log: CaptureProgressEvent[];
}

export interface Profile {
  browsers: string[];
  breakpoints: Record<string, number>;
  delay: number;
  hideSelectors: string[];
  screenshot: { fullPage?: boolean };
}
