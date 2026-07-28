/**
 * Auto-generates a unique internal key from a human-typed title, so forms
 * and promotion types don't need to ask an admin to invent a "unique key"
 * for a value that's purely a database identifier — the random suffix
 * guarantees uniqueness without a lookup-and-retry loop, and the slug part
 * is just for readability in logs/URLs, not for anyone to type or remember.
 */
export declare function slugifyWithUniqueSuffix(title: string): string;
//# sourceMappingURL=slug.util.d.ts.map