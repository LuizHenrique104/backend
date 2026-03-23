const path = require('path')
const fs = require('fs').promises
const fastify = require('fastify')({ logger: true })
const cors = require('@fastify/cors')

const PORT = process.env.PORT || 4000
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:3000'
const DATA_DIR = path.join(__dirname, 'data')
const PURCHASES_FILE = path.join(DATA_DIR, 'purchases.json')
const CACHE_FILE = path.join(DATA_DIR, 'cache.json')

fastify.register(cors, { origin: FRONTEND_ORIGIN })

async function ensureFile() {
  try {
    await fs.access(PURCHASES_FILE)
  } catch (err) {
    await fs.mkdir(DATA_DIR, { recursive: true })
    await fs.writeFile(PURCHASES_FILE, '[]')
  }
}

async function readPurchases() {
  await ensureFile()
  // Prefer cache.json structure if present (compatible with TS server)
  try {
    const cacheRaw = await fs.readFile(CACHE_FILE, 'utf8').catch(() => null)
    if (cacheRaw) {
      const cacheObj = JSON.parse(cacheRaw || '{}')
      if (cacheObj && cacheObj.purchases && cacheObj.purchases.value) {
        return cacheObj.purchases.value
      }
    }
  } catch (err) {
    // ignore and fallback
  }

  const raw = await fs.readFile(PURCHASES_FILE, 'utf8').catch(() => '[]')
  try {
    return JSON.parse(raw || '[]')
  } catch (err) {
    return []
  }
}

async function writePurchases(purchases) {
  // write into cache.json using the same key/shape as FileCacheStore
  const cacheObj = {
    purchases: {
      timestamp: new Date().toISOString(),
      value: purchases
    }
  }
  await fs.writeFile(CACHE_FILE, JSON.stringify(cacheObj, null, 2))
  // also keep legacy purchases.json for compatibility
  await fs.writeFile(PURCHASES_FILE, JSON.stringify(purchases, null, 2))
}

function isValidISODate(str) {
  const d = new Date(str)
  return !Number.isNaN(d.getTime())
}

fastify.get('/purchases', async (request, reply) => {
  try {
    const purchases = await readPurchases()
    return reply.code(200).send(purchases)
  } catch (err) {
    request.log.error(err)
    return reply.code(500).send({ error: 'Erro ao ler compras' })
  }
})

fastify.post('/purchases', async (request, reply) => {
  try {
    const { id, value, date } = request.body || {}

    if (typeof value !== 'number' || value <= 0) {
      return reply.code(400).send({ error: 'Valor inválido' })
    }

    if (!date || !isValidISODate(date)) {
      return reply.code(400).send({ error: 'Data inválida' })
    }

    const newPurchase = {
      id: typeof id === 'string' ? id : (globalThis.crypto && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString()),
      value,
      date: new Date(date).toISOString()
    }

    const purchases = await readPurchases()
    purchases.push(newPurchase)
    await writePurchases(purchases)

    return reply.code(201).send(newPurchase)
  } catch (err) {
    request.log.error(err)
    return reply.code(500).send({ error: 'Erro ao salvar compra' })
  }
})

fastify.delete('/purchases/:id', async (request, reply) => {
  try {
    const { id } = request.params || {}
    if (!id) return reply.code(400).send({ error: 'id é obrigatório' })

    const purchases = await readPurchases()
    const remaining = purchases.filter((p) => p.id !== id)
    const removed = purchases.filter((p) => p.id === id)

    // persist remaining purchases and update cache
    await writePurchases(remaining)

    // append removed to deleted_purchases.json
    try {
      const DEL_FILE = path.join(DATA_DIR, 'deleted_purchases.json')
      const rawDel = await fs.readFile(DEL_FILE, 'utf8').catch(() => '[]')
      const arrDel = JSON.parse(rawDel || '[]')
      const toAdd = removed.map((p) => ({ ...p, deletedAt: new Date().toISOString() }))
      await fs.writeFile(DEL_FILE, JSON.stringify(arrDel.concat(toAdd), null, 2))
    } catch (err) {
      // ignore deletion logging errors
    }

    return reply.code(200).send({ success: true })
  } catch (err) {
    request.log.error(err)
    return reply.code(500).send({ error: 'Erro ao deletar compra' })
  }
})

const start = async () => {
  try {
    await fastify.listen({ port: Number(PORT), host: '0.0.0.0' })
    fastify.log.info(`Servidor rodando em http://localhost:${PORT}`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
