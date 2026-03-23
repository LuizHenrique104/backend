"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const localLoadPurchases_1 = require("./localLoadPurchases");
const tests_1 = require("../../tests");
const makeSut = (timestamp = new Date()) => {
    const cacheStore = new tests_1.CacheStoreSpy();
    const sut = new localLoadPurchases_1.LocalLoadPurchases(cacheStore, timestamp);
    return {
        sut,
        cacheStore
    };
};
describe('LocalLoadPurchases', () => {
    test('Should not delete or insert cache on sut.init', () => {
        const { cacheStore } = makeSut();
        expect(cacheStore.actions).toEqual([]);
    });
    test('Should delete cache if load fails', () => {
        const { cacheStore, sut } = makeSut();
        cacheStore.simulateFetchError();
        sut.validate();
        expect(cacheStore.actions).toEqual([tests_1.CacheStoreSpy.Action.fetch, tests_1.CacheStoreSpy.Action.delete]);
        expect(cacheStore.deleteKey).toBe('purchases');
    });
    test('Should has no side effect if load succeeds', () => {
        const currentDate = new Date();
        const timestamp = (0, tests_1.getCacheExpirationDate)(currentDate);
        timestamp.setSeconds(timestamp.getSeconds() + 1);
        const { cacheStore, sut } = makeSut(timestamp);
        cacheStore.fetchResult = { timestamp };
        sut.validate();
        expect(cacheStore.actions).toEqual([tests_1.CacheStoreSpy.Action.fetch]);
        expect(cacheStore.fetchkey).toBe('purchases');
    });
    test('Should delete cache if its expired', () => {
        const currentDate = new Date();
        const timestamp = (0, tests_1.getCacheExpirationDate)(currentDate);
        timestamp.setSeconds(timestamp.getSeconds() - 1);
        const { cacheStore, sut } = makeSut(currentDate);
        cacheStore.fetchResult = { timestamp };
        sut.validate();
        expect(cacheStore.actions).toEqual([tests_1.CacheStoreSpy.Action.fetch, tests_1.CacheStoreSpy.Action.delete]);
        expect(cacheStore.fetchkey).toBe('purchases');
        expect(cacheStore.deleteKey).toBe('purchases');
    });
    test('Should delete cache if its on expiration date', () => {
        const currentDate = new Date();
        const timestamp = (0, tests_1.getCacheExpirationDate)(currentDate);
        const { cacheStore, sut } = makeSut(currentDate);
        cacheStore.fetchResult = { timestamp };
        sut.validate();
        expect(cacheStore.actions).toEqual([tests_1.CacheStoreSpy.Action.fetch, tests_1.CacheStoreSpy.Action.delete]);
        expect(cacheStore.fetchkey).toBe('purchases');
        expect(cacheStore.deleteKey).toBe('purchases');
    });
});
