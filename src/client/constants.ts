export const BROWSER_COLORS: Record<string, string> = {
  chromium: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  chrome: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  firefox: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  webkit: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  edge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
};

export const BROWSER_COLORS_ACTIVE: Record<string, string> = {
  chromium: 'bg-blue-500 text-white border-blue-400',
  chrome: 'bg-blue-500 text-white border-blue-400',
  firefox: 'bg-orange-500 text-white border-orange-400',
  webkit: 'bg-violet-500 text-white border-violet-400',
  edge: 'bg-cyan-500 text-white border-cyan-400',
};

export const BROWSER_DOT: Record<string, string> = {
  chromium: 'bg-blue-400',
  chrome: 'bg-blue-400',
  firefox: 'bg-orange-400',
  webkit: 'bg-violet-400',
  edge: 'bg-cyan-400',
};

export const BROWSER_CAPTURE_INACTIVE: Record<string, string> = {
  chromium: 'border-blue-500/50 text-blue-300',
  firefox: 'border-orange-500/50 text-orange-300',
  webkit: 'border-violet-500/50 text-violet-300',
  edge: 'border-cyan-500/50 text-cyan-300',
};

export const BROWSER_CAPTURE_ACTIVE: Record<string, string> = {
  chromium: 'bg-blue-500/20 border-blue-400 text-blue-200',
  firefox: 'bg-orange-500/20 border-orange-400 text-orange-200',
  webkit: 'bg-violet-500/20 border-violet-400 text-violet-200',
  edge: 'bg-cyan-500/20 border-cyan-400 text-cyan-200',
};

export const ALL_BROWSERS = ['chromium', 'firefox', 'webkit', 'edge'];
