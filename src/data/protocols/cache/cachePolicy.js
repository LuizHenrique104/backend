"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CachePolicy = void 0;
class CachePolicy {
    constructor() { }
    static validate(timestamp, date) {
        const maxAge = new Date(timestamp);
        maxAge.setDate(maxAge.getDate() + CachePolicy.maxAgeInDays);
        return maxAge > date;
    }
}
exports.CachePolicy = CachePolicy;
CachePolicy.maxAgeInDays = 3;
