"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheStoreSpy = exports.getCacheExpirationDate = void 0;
const maxAgeInDays = 3;
const getCacheExpirationDate = (timestamp) => {
    const maxCacheAge = new Date(timestamp);
    maxCacheAge.setDate(maxCacheAge.getDate() - maxAgeInDays);
    return maxCacheAge;
};
exports.getCacheExpirationDate = getCacheExpirationDate;
class CacheStoreSpy {
    constructor() {
        this.actions = [];
        this.deleteKey = '';
        this.insertKey = '';
        this.fetchkey = '';
        this.insertValues = [];
    }
    fetch(key) {
        this.actions.push(CacheStoreSpy.Action.fetch);
        this.fetchkey = key;
        return this.fetchResult;
    }
    delete(key) {
        this.actions.push(CacheStoreSpy.Action.delete);
        this.deleteKey = key;
    }
    insert(key, value) {
        this.actions.push(CacheStoreSpy.Action.insert);
        this.insertKey = key;
        this.insertValues = value;
    }
    replace(key, value) {
        this.delete(key);
        this.insert(key, value);
    }
    simulateDeleteError() {
        jest.spyOn(CacheStoreSpy.prototype, 'delete').mockImplementationOnce(() => {
            this.actions.push(CacheStoreSpy.Action.delete);
            throw new Error();
        });
    }
    simulateInsertError() {
        jest.spyOn(CacheStoreSpy.prototype, 'insert').mockImplementationOnce(() => {
            this.actions.push(CacheStoreSpy.Action.insert);
            throw new Error();
        });
    }
    simulateFetchError() {
        jest.spyOn(CacheStoreSpy.prototype, 'fetch').mockImplementationOnce(() => {
            this.actions.push(CacheStoreSpy.Action.fetch);
            throw new Error();
        });
    }
}
exports.CacheStoreSpy = CacheStoreSpy;
(function (CacheStoreSpy) {
    let Action;
    (function (Action) {
        Action[Action["delete"] = 0] = "delete";
        Action[Action["insert"] = 1] = "insert";
        Action[Action["fetch"] = 2] = "fetch";
    })(Action = CacheStoreSpy.Action || (CacheStoreSpy.Action = {}));
})(CacheStoreSpy || (exports.CacheStoreSpy = CacheStoreSpy = {}));
