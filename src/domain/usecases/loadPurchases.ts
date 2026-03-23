import { PurchaseModel } from '../models/purchaseModel'

export interface LoadPurchases {
    loadAll: () => Promise<LoadPurchases.Result[]>
}

export namespace LoadPurchases {
  export type Result = PurchaseModel
}
