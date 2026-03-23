import fs from 'fs'
import path from 'path'
import { CacheStore } from '../../data/protocols/cache/cacheStore'

// Resolve data directory relative to process.cwd() to avoid issues when the
// compiled JS __dirname differs from the project root during execution.
const DATA_DIR = path.resolve(process.cwd(), 'data')
const FILE = path.join(DATA_DIR, 'cache.json')

function ensureFileSync() {
  try {
    fs.accessSync(FILE)
  } catch (err) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
    fs.writeFileSync(FILE, '{}')
  }
}

function readStoreSync(): any {
  ensureFileSync()
  try {
    const raw = fs.readFileSync(FILE, 'utf8')
    return JSON.parse(raw || '{}')
  } catch (err) {
    return {}
  }
}

function writeStoreSync(obj: any) {
  ensureFileSync()
  fs.writeFileSync(FILE, JSON.stringify(obj, null, 2), 'utf8')
}

export class FileCacheStore implements CacheStore {
  fetch(key: string): any {
    const s = readStoreSync()
    if (Object.prototype.hasOwnProperty.call(s, key)) {
      return s[key]
    }
    throw new Error('Not found')
  }

  delete(key: string): void {
    const s = readStoreSync()
    delete s[key]
    writeStoreSync(s)
  }

  insert(key: string, value: any): void {
    const s = readStoreSync()
    s[key] = value
    writeStoreSync(s)
  }

  replace(key: string, value: any): void {
    this.insert(key, value)
  }
}
