"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileCacheStore = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// Resolve data directory relative to process.cwd() to avoid issues when the
// compiled JS __dirname differs from the project root during execution.
const DATA_DIR = path_1.default.resolve(process.cwd(), 'data');
const FILE = path_1.default.join(DATA_DIR, 'cache.json');
function ensureFileSync() {
    try {
        fs_1.default.accessSync(FILE);
    }
    catch (err) {
        fs_1.default.mkdirSync(DATA_DIR, { recursive: true });
        fs_1.default.writeFileSync(FILE, '{}');
    }
}
function readStoreSync() {
    ensureFileSync();
    try {
        const raw = fs_1.default.readFileSync(FILE, 'utf8');
        return JSON.parse(raw || '{}');
    }
    catch (err) {
        return {};
    }
}
function writeStoreSync(obj) {
    ensureFileSync();
    fs_1.default.writeFileSync(FILE, JSON.stringify(obj, null, 2), 'utf8');
}
class FileCacheStore {
    fetch(key) {
        const s = readStoreSync();
        if (Object.prototype.hasOwnProperty.call(s, key)) {
            return s[key];
        }
        throw new Error('Not found');
    }
    delete(key) {
        const s = readStoreSync();
        delete s[key];
        writeStoreSync(s);
    }
    insert(key, value) {
        const s = readStoreSync();
        s[key] = value;
        writeStoreSync(s);
    }
    replace(key, value) {
        this.insert(key, value);
    }
}
exports.FileCacheStore = FileCacheStore;
