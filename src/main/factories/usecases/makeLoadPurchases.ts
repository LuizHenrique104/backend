import { LocalLoadPurchases } from '../../../data/usecases/loadPurchases/localLoadPurchases'
import { FileCacheStore } from '../../../infra/cache/fileCacheStore'

export const makeLoadPurchases = () => {
  const cacheStore = new FileCacheStore()
  const currentDate = new Date()
  return new LocalLoadPurchases(cacheStore, currentDate)
}
