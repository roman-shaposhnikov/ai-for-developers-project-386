"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.genCancelToken = exports.genId = void 0;
const crypto_1 = require("crypto");
const genId = () => (0, crypto_1.randomUUID)();
exports.genId = genId;
const genCancelToken = () => (0, crypto_1.randomBytes)(24).toString('base64url');
exports.genCancelToken = genCancelToken;
//# sourceMappingURL=ids.js.map