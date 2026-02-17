import fs from 'fs';
import path from 'path';
import { defaultConfig } from '../capture/configLoader.js';

const DATA_DIR = path.resolve('data');
const PROFILE_PATH = path.join(DATA_DIR, 'profile.json');

const DEFAULT_PROFILE = {
  browsers: defaultConfig.breakpoints ? ['chromium'] : ['chromium'],
  breakpoints: defaultConfig.breakpoints,
  delay: 2000,
  hideSelectors: [],
  screenshot: defaultConfig.screenshot,
};

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

export function getProfile() {
  ensureDataDir();
  if (!fs.existsSync(PROFILE_PATH)) {
    fs.writeFileSync(PROFILE_PATH, JSON.stringify(DEFAULT_PROFILE, null, 2));
    return DEFAULT_PROFILE;
  }
  return JSON.parse(fs.readFileSync(PROFILE_PATH, 'utf-8'));
}

export function updateProfile(data) {
  ensureDataDir();
  const profile = {
    browsers: data.browsers ?? DEFAULT_PROFILE.browsers,
    breakpoints: data.breakpoints ?? DEFAULT_PROFILE.breakpoints,
    delay: data.delay ?? DEFAULT_PROFILE.delay,
    hideSelectors: data.hideSelectors ?? DEFAULT_PROFILE.hideSelectors,
    screenshot: data.screenshot ?? DEFAULT_PROFILE.screenshot,
  };
  fs.writeFileSync(PROFILE_PATH, JSON.stringify(profile, null, 2));
  return profile;
}
