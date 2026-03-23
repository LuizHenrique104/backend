"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeLoadPurchases = void 0;
const localLoadPurchases_1 = require("../../../data/usecases/loadPurchases/localLoadPurchases");
const fileCacheStore_1 = require("../../../infra/cache/fileCacheStore");
const makeLoadPurchases = () => {
    const cacheStore = new fileCacheStore_1.FileCacheStore();
    const currentDate = new Date();
    return new localLoadPurchases_1.LocalLoadPurchases(cacheStore, currentDate);
};
exports.makeLoadPurchases = makeLoadPurchases;
