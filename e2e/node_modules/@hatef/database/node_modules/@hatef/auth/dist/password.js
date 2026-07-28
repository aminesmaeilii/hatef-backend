"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashPassword = hashPassword;
exports.verifyPassword = verifyPassword;
const argon2_1 = require("@node-rs/argon2");
// @node-rs/argon2 declares `Algorithm` as a `const enum`, which isolatedModules
// forbids referencing by member access (e.g. Algorithm.Argon2id) since it can't
// be inlined across separately-compiled files. Argon2id's underlying value (2)
// is stable ABI, so we use the literal directly and keep the type import only.
const ARGON2ID = 2;
const HASH_OPTIONS = {
    algorithm: ARGON2ID,
    memoryCost: 19456, // ~19 MiB, OWASP-recommended minimum for Argon2id
    timeCost: 2,
    parallelism: 1,
};
async function hashPassword(plainTextPassword) {
    return (0, argon2_1.hash)(plainTextPassword, HASH_OPTIONS);
}
async function verifyPassword(hashedPassword, plainTextPassword) {
    return (0, argon2_1.verify)(hashedPassword, plainTextPassword);
}
