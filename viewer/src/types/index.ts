export type Screenshot = {
  browser: string;
  page: string;
  pageName: string;
  breakpoint: string;
  timestamp: number;
  filename: string;
  path: string;
  extension: string;
}

export type PageInfo = {
  id: string;
  name: string;
  browsers: string[];
}

export type Manifest = {
  generatedAt: string;
  browsers: string[];
  pages: Record<string, PageInfo>;
  screenshots: Screenshot[];
}
