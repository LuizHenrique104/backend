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
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalLoadPurchases = void 0;
const cache_1 = require("../../protocols/cache");
class LocalLoadPurchases {
    constructor(cacheStore, currentDate) {
        this.cacheStore = cacheStore;
        this.currentDate = currentDate;
        this.key = 'purchases';
    }
    save(purchases) {
        return __awaiter(this, void 0, void 0, function* () {
            this.cacheStore.replace(this.key, {
                timestamp: this.currentDate,
                value: purchases
            });
        });
    }
    loadAll() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const cache = this.cacheStore.fetch(this.key);
                if (cache_1.CachePolicy.validate(cache.timestamp, this.currentDate)) {
                    return cache.value;
                }
                return [];
            }
            catch (error) {
                return [];
            }
        });
    }
    validate() {
        try {
            const cache = this.cacheStore.fetch(this.key);
            if (!cache_1.CachePolicy.validate(cache.timestamp, this.currentDate)) {
                throw new Error();
            }
        }
        catch (error) {
            this.cacheStore.delete(this.key);
        }
    }
}
exports.LocalLoadPurchases = LocalLoadPurchases;
