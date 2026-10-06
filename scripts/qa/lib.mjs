// Utilitários de QA: abre o Chrome/Edge instalado em modo headless (puppeteer-core).
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import puppeteer from 'puppeteer-core';

export const CHROME = process.env.CHROME_PATH || [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium',
].find(existsSync);

export const OUT = process.env.QA_OUT || join(process.cwd(), 'qa-output');

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const BASE = process.env.QA_BASE || 'http://localhost:3000';

export async function launch(opts = {}) {
  if (!CHROME) throw new Error('Chrome/Edge não encontrado. Defina CHROME_PATH.');
  return puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    defaultViewport: opts.viewport || { width: 1280, height: 720 },
    args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required', '--ignore-gpu-blocklist',
      '--enable-unsafe-swiftshader', '--disable-renderer-backgrounding', '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows', ...(opts.args || [])],
  });
}

/** Coleta erros de console/página para relatório. */
export function watch(page, bag = []) {
  page.on('pageerror', (e) => bag.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') bag.push('console.error: ' + m.text()); });
  page.on('requestfailed', (r) => bag.push('requestfailed: ' + r.url() + ' ' + (r.failure()?.errorText || '')));
  page.on('response', (r) => { if (r.status() >= 400) bag.push(`http ${r.status()}: ${r.url()}`); });
  return bag;
}

export const shot = (page, name, opts = {}) => {
  mkdirSync(OUT, { recursive: true });
  return page.screenshot({ path: join(OUT, name + '.png'), ...opts });
};
