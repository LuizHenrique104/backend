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
    test('Should not insert new Cache if delete fails', () => __awaiter(void 0, void 0, void 0, function* () {
        const { cacheStore, sut } = makeSut();
        cacheStore.simulateDeleteError();
        const promise = sut.save((0, tests_1.mockPurchases)());
        expect(cacheStore.actions).toEqual([tests_1.CacheStoreSpy.Action.delete]);
        yield expect(promise).rejects.toThrow();
    }));
    test('Should insert new Cache if delete succeeds', () => __awaiter(void 0, void 0, void 0, function* () {
        const timestamp = new Date();
        const { cacheStore, sut } = makeSut(timestamp);
        const purchases = (0, tests_1.mockPurchases)();
        const promise = sut.save(purchases);
        expect(cacheStore.actions).toEqual([tests_1.CacheStoreSpy.Action.delete, tests_1.CacheStoreSpy.Action.insert]);
        expect(cacheStore.deleteKey).toBe('purchases');
        expect(cacheStore.insertKey).toBe('purchases');
        expect(cacheStore.insertValues).toEqual({
            timestamp,
            value: purchases
        });
        yield expect(promise).resolves.toBeFalsy();
    }));
    test('Should throw if insert throw', () => __awaiter(void 0, void 0, void 0, function* () {
        const { cacheStore, sut } = makeSut();
        cacheStore.simulateInsertError();
        const promise = sut.save((0, tests_1.mockPurchases)());
        expect(cacheStore.actions).toEqual([tests_1.CacheStoreSpy.Action.delete, tests_1.CacheStoreSpy.Action.insert]);
        yield expect(promise).rejects.toThrow();
    }));
});
