import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../data');

if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

const filePath = (name) => path.join(DATA_DIR, `${name}.json`);

export function readJSON(name) {
  const fp = filePath(name);
  if (!existsSync(fp)) return [];
  try {
    return JSON.parse(readFileSync(fp, 'utf8'));
  } catch {
    return [];
  }
}

export function writeJSON(name, data) {
  writeFileSync(filePath(name), JSON.stringify(data, null, 2), 'utf8');
}
