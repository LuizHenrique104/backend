"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockPurchases = void 0;
const faker_1 = __importDefault(require("faker"));
const mockPurchases = () => [{
        id: faker_1.default.datatype.uuid(),
        date: faker_1.default.date.recent(),
        value: faker_1.default.datatype.number()
    }, {
        id: faker_1.default.datatype.uuid(),
        date: faker_1.default.date.recent(),
        value: faker_1.default.datatype.number()
    }];
exports.mockPurchases = mockPurchases;
