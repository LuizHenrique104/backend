import fastify from 'fastify'
import cors from '@fastify/cors'
import fs from 'fs'
import path from 'path'
import { makeLoadPurchases } from './factories/usecases/makeLoadPurchases'
import { FileCacheStore } from '../infra/cache/fileCacheStore'

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:3000'

const app = fastify({ logger: true })
// Allow all origins in dev to ensure frontend requests reach the backend
app.register(cors, { origin: true })

const loadPurchases = makeLoadPurchases()
const cacheStore = new FileCacheStore()

app.get('/purchases', async (request, reply) => {
  try {
    const purchases = await loadPurchases.loadAll()
    return reply.code(200).send(purchases)
  } catch (err) {
    request.log.error(err)
    return reply.code(500).send({ error: 'Erro ao ler compras' })
  }
})

app.post('/purchases', async (request, reply) => {
  try {
    const { id, value, date } = request.body as any

    request.log.info({ event: 'incoming_post', body: request.body })

    if (typeof value !== 'number' || value <= 0) {
      return reply.code(400).send({ error: 'Valor inválido' })
    }
    if (!date || isNaN(new Date(date).getTime())) {
      return reply.code(400).send({ error: 'Data inválida' })
    }

    const newItem = {
      id: typeof id === 'string' ? id : String(Date.now()),
      value,
      date: new Date(date).toISOString()
    }

    // Persist to purchases.json (file-based single source of truth)
    try {
      const DATA_DIR = path.join(process.cwd(), 'data')
      const PUR_FILE = path.join(DATA_DIR, 'purchases.json')
      if (!fs.existsSync(PUR_FILE)) {
        fs.mkdirSync(DATA_DIR, { recursive: true })
        fs.writeFileSync(PUR_FILE, JSON.stringify([], null, 2), 'utf8')
      }
      const raw = fs.readFileSync(PUR_FILE, 'utf8')
      const arr = JSON.parse(raw || '[]')
      arr.push({ id: newItem.id, value: newItem.value, date: newItem.date })
      fs.writeFileSync(PUR_FILE, JSON.stringify(arr, null, 2), 'utf8')

      // update cache.json purchases key as well
      const cachePayload = {
        timestamp: new Date().toISOString(),
        value: arr
      }
      cacheStore.insert('purchases', cachePayload)
    } catch (err) {
      request.log.error('Falha ao persistir purchase em arquivo')
      return reply.code(500).send({ error: 'Erro ao persistir compra' })
    }

    return reply.code(201).send(newItem)
  } catch (err) {
    request.log.error(err)
    return reply.code(500).send({ error: 'Erro ao salvar compra' })
  }
})

app.delete('/purchases/:id', async (request, reply) => {
  try {
    const { id } = request.params as any
    request.log.info({ event: 'incoming_delete', id })
    const existing = await loadPurchases.loadAll()
    const toDelete = existing.filter((p: any) => p.id === id)
    const filtered = existing.filter((p: any) => p.id !== id)

    // Persist deletion: write to deleted_purchases.json and update purchases.json + cache.json
    try {
      const DATA_DIR = path.join(process.cwd(), 'data')
      const PUR_FILE = path.join(DATA_DIR, 'purchases.json')
      const DEL_FILE = path.join(DATA_DIR, 'deleted_purchases.json')
      if (!fs.existsSync(PUR_FILE)) {
        fs.mkdirSync(DATA_DIR, { recursive: true })
        fs.writeFileSync(PUR_FILE, JSON.stringify([], null, 2), 'utf8')
      }
      if (!fs.existsSync(DEL_FILE)) {
        fs.writeFileSync(DEL_FILE, JSON.stringify([], null, 2), 'utf8')
      }
      const raw = fs.readFileSync(PUR_FILE, 'utf8')
      const arr = JSON.parse(raw || '[]')
      const remaining = arr.filter((p: any) => p.id !== id)
      const removed = arr.filter((p: any) => p.id === id)
      // write updated purchases
      fs.writeFileSync(PUR_FILE, JSON.stringify(remaining, null, 2), 'utf8')
      // append to deleted file
      const rawDel = fs.readFileSync(DEL_FILE, 'utf8')
      const arrDel = JSON.parse(rawDel || '[]')
      const toAdd = removed.map((p: any) => ({ ...p, deletedAt: new Date().toISOString() }))
      fs.writeFileSync(DEL_FILE, JSON.stringify(arrDel.concat(toAdd), null, 2), 'utf8')

      // update cache.json
      const cachePayload = {
        timestamp: new Date().toISOString(),
        value: remaining
      }
      cacheStore.insert('purchases', cachePayload)
    } catch (err) {
      request.log.error('Falhas ao persistir exclusão')
      return reply.code(500).send({ error: 'Erro ao persistir exclusão' })
    }
    return reply.code(200).send({ success: true })
  } catch (err) {
    request.log.error(err)
    return reply.code(500).send({ error: 'Erro ao deletar compra' })
  }
})

const start = async () => {
  try {
    await app.listen({ port: PORT, host: '0.0.0.0' })
    app.log.info(`Servidor TS rodando em http://localhost:${PORT}`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
