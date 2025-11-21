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
