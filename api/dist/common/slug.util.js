"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.slugifyWithUniqueSuffix = slugifyWithUniqueSuffix;
const node_crypto_1 = require("node:crypto");
/**
 * Auto-generates a unique internal key from a human-typed title, so forms
 * and promotion types don't need to ask an admin to invent a "unique key"
 * for a value that's purely a database identifier — the random suffix
 * guarantees uniqueness without a lookup-and-retry loop, and the slug part
 * is just for readability in logs/URLs, not for anyone to type or remember.
 */
function slugifyWithUniqueSuffix(title) {
    const slug = title
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    const suffix = (0, node_crypto_1.randomBytes)(3).toString("hex");
    return slug ? `${slug}-${suffix}` : suffix;
}
