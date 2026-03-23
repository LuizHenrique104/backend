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
const localLoadPurchases_1 = require("./localLoadPurchases");
const tests_1 = require("../../tests");
const makeSut = (timestamp = new Date()) => {
    const cacheStore = new tests_1.CacheStoreSpy();
    const sut = new localLoadPurchases_1.LocalLoadPurchases(cacheStore, timestamp);
    return { sut, cacheStore };
};
describe('LocalLoadPurchases', () => {
    test('Should not delete or insert cache on sut.init', () => {
        const { cacheStore } = makeSut();
        expect(cacheStore.actions).toEqual([]);
    });
    test('Should return empty list is load fails', () => __awaiter(void 0, void 0, void 0, function* () {
        const { cacheStore, sut } = makeSut();
        cacheStore.simulateFetchError();
        const purchases = yield sut.loadAll();
        expect(cacheStore.actions).toEqual([tests_1.CacheStoreSpy.Action.fetch]);
        expect(purchases).toEqual([]);
    }));
    test('Should return a list of purchases if cache is valid', () => __awaiter(void 0, void 0, void 0, function* () {
        const currentDate = new Date();
        const timestamp = (0, tests_1.getCacheExpirationDate)(currentDate);
        timestamp.setSeconds(timestamp.getSeconds() + 1);
        const { cacheStore, sut } = makeSut(timestamp);
        cacheStore.fetchResult = {
            timestamp,
            value: (0, tests_1.mockPurchases)()
        };
        const purchases = yield sut.loadAll();
        expect(cacheStore.actions).toEqual([tests_1.CacheStoreSpy.Action.fetch]);
        expect(purchases).toEqual(cacheStore.fetchResult.value);
        expect(cacheStore.fetchkey).toBe('purchases');
    }));
    test('Should return a empty list if cache is expired', () => __awaiter(void 0, void 0, void 0, function* () {
        const currentDate = new Date();
        const timestamp = (0, tests_1.getCacheExpirationDate)(currentDate);
        timestamp.setSeconds(timestamp.getSeconds() - 1);
        const { cacheStore, sut } = makeSut(currentDate);
        cacheStore.fetchResult = {
            timestamp,
            value: (0, tests_1.mockPurchases)()
        };
        const purchases = yield sut.loadAll();
        expect(cacheStore.actions).toEqual([tests_1.CacheStoreSpy.Action.fetch]);
        expect(cacheStore.fetchkey).toBe('purchases');
        expect(purchases).toEqual([]);
    }));
    test('Should return an empty list if cache is on expiration date', () => __awaiter(void 0, void 0, void 0, function* () {
        const currentDate = new Date();
        const timestamp = (0, tests_1.getCacheExpirationDate)(currentDate);
        const { cacheStore, sut } = makeSut(currentDate);
        cacheStore.fetchResult = {
            timestamp,
            value: (0, tests_1.mockPurchases)()
        };
        const purchases = yield sut.loadAll();
        expect(cacheStore.actions).toEqual([tests_1.CacheStoreSpy.Action.fetch]);
        expect(cacheStore.fetchkey).toBe('purchases');
        expect(purchases).toEqual([]);
    }));
    test('Should return an empty list if cache is empty', () => __awaiter(void 0, void 0, void 0, function* () {
        const currentDate = new Date();
        const timestamp = (0, tests_1.getCacheExpirationDate)(currentDate);
        timestamp.setSeconds(timestamp.getSeconds() + 1);
        const { cacheStore, sut } = makeSut(timestamp);
        cacheStore.fetchResult = {
            timestamp,
            value: []
        };
        const purchases = yield sut.loadAll();
        expect(cacheStore.actions).toEqual([tests_1.CacheStoreSpy.Action.fetch]);
        expect(cacheStore.fetchkey).toBe('purchases');
        expect(purchases).toEqual([]);
    }));
});
