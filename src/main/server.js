"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const makeLoadPurchases_1 = require("./factories/usecases/makeLoadPurchases");
const fileCacheStore_1 = require("../infra/cache/fileCacheStore");
const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';
const app = (0, fastify_1.default)({ logger: true });
// Allow all origins in dev to ensure frontend requests reach the backend
app.register(cors_1.default, { origin: true });
const loadPurchases = (0, makeLoadPurchases_1.makeLoadPurchases)();
const cacheStore = new fileCacheStore_1.FileCacheStore();
app.get('/purchases', (request, reply) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const purchases = yield loadPurchases.loadAll();
        return reply.code(200).send(purchases);
    }
    catch (err) {
        request.log.error(err);
        return reply.code(500).send({ error: 'Erro ao ler compras' });
    }
}));
app.post('/purchases', (request, reply) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id, value, date } = request.body;
        request.log.info({ event: 'incoming_post', body: request.body });
        if (typeof value !== 'number' || value <= 0) {
            return reply.code(400).send({ error: 'Valor inválido' });
        }
        if (!date || isNaN(new Date(date).getTime())) {
            return reply.code(400).send({ error: 'Data inválida' });
        }
        const newItem = {
            id: typeof id === 'string' ? id : String(Date.now()),
            value,
            date: new Date(date).toISOString()
        };
        // Persist to purchases.json (file-based single source of truth)
        try {
            const DATA_DIR = path_1.default.join(process.cwd(), 'data');
            const PUR_FILE = path_1.default.join(DATA_DIR, 'purchases.json');
            if (!fs_1.default.existsSync(PUR_FILE)) {
                fs_1.default.mkdirSync(DATA_DIR, { recursive: true });
                fs_1.default.writeFileSync(PUR_FILE, JSON.stringify([], null, 2), 'utf8');
            }
            const raw = fs_1.default.readFileSync(PUR_FILE, 'utf8');
            const arr = JSON.parse(raw || '[]');
            arr.push({ id: newItem.id, value: newItem.value, date: newItem.date });
            fs_1.default.writeFileSync(PUR_FILE, JSON.stringify(arr, null, 2), 'utf8');
            // update cache.json purchases key as well
            const cachePayload = {
                timestamp: new Date().toISOString(),
                value: arr
            };
            cacheStore.insert('purchases', cachePayload);
        }
        catch (err) {
            request.log.error('Falha ao persistir purchase em arquivo', err);
            return reply.code(500).send({ error: 'Erro ao persistir compra' });
        }
        return reply.code(201).send(newItem);
    }
    catch (err) {
        request.log.error(err);
        return reply.code(500).send({ error: 'Erro ao salvar compra' });
    }
}));
app.delete('/purchases/:id', (request, reply) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = request.params;
        request.log.info({ event: 'incoming_delete', id });
        const existing = yield loadPurchases.loadAll();
        const toDelete = existing.filter((p) => p.id === id);
        const filtered = existing.filter((p) => p.id !== id);
        // Persist deletion: write to deleted_purchases.json and update purchases.json + cache.json
        try {
            const DATA_DIR = path_1.default.join(process.cwd(), 'data');
            const PUR_FILE = path_1.default.join(DATA_DIR, 'purchases.json');
            const DEL_FILE = path_1.default.join(DATA_DIR, 'deleted_purchases.json');
            if (!fs_1.default.existsSync(PUR_FILE)) {
                fs_1.default.mkdirSync(DATA_DIR, { recursive: true });
                fs_1.default.writeFileSync(PUR_FILE, JSON.stringify([], null, 2), 'utf8');
            }
            if (!fs_1.default.existsSync(DEL_FILE)) {
                fs_1.default.writeFileSync(DEL_FILE, JSON.stringify([], null, 2), 'utf8');
            }
            const raw = fs_1.default.readFileSync(PUR_FILE, 'utf8');
            const arr = JSON.parse(raw || '[]');
            const remaining = arr.filter((p) => p.id !== id);
            const removed = arr.filter((p) => p.id === id);
            // write updated purchases
            fs_1.default.writeFileSync(PUR_FILE, JSON.stringify(remaining, null, 2), 'utf8');
            // append to deleted file
            const rawDel = fs_1.default.readFileSync(DEL_FILE, 'utf8');
            const arrDel = JSON.parse(rawDel || '[]');
            const toAdd = removed.map((p) => (Object.assign(Object.assign({}, p), { deletedAt: new Date().toISOString() })));
            fs_1.default.writeFileSync(DEL_FILE, JSON.stringify(arrDel.concat(toAdd), null, 2), 'utf8');
            // update cache.json
            const cachePayload = {
                timestamp: new Date().toISOString(),
                value: remaining
            };
            cacheStore.insert('purchases', cachePayload);
        }
        catch (err) {
            request.log.error('Falha ao persistir exclusão', err);
            return reply.code(500).send({ error: 'Erro ao persistir exclusão' });
        }
        return reply.code(200).send({ success: true });
    }
    catch (err) {
        request.log.error(err);
        return reply.code(500).send({ error: 'Erro ao deletar compra' });
    }
}));
const start = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield app.listen({ port: PORT, host: '0.0.0.0' });
        app.log.info(`Servidor TS rodando em http://localhost:${PORT}`);
    }
    catch (err) {
        app.log.error(err);
        process.exit(1);
    }
});
start();
