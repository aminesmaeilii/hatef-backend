import { hash, verify, type Options } from "@node-rs/argon2";

// @node-rs/argon2 declares `Algorithm` as a `const enum`, which isolatedModules
// forbids referencing by member access (e.g. Algorithm.Argon2id) since it can't
// be inlined across separately-compiled files. Argon2id's underlying value (2)
// is stable ABI, so we use the literal directly and keep the type import only.
const ARGON2ID: Options["algorithm"] = 2;

const HASH_OPTIONS: Options = {
  algorithm: ARGON2ID,
  memoryCost: 19456, // ~19 MiB, OWASP-recommended minimum for Argon2id
  timeCost: 2,
  parallelism: 1,
};

export async function hashPassword(plainTextPassword: string): Promise<string> {
  return hash(plainTextPassword, HASH_OPTIONS);
}

export async function verifyPassword(hashedPassword: string, plainTextPassword: string): Promise<boolean> {
  return verify(hashedPassword, plainTextPassword);
}
