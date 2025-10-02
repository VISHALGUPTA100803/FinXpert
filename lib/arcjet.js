import arcjet, { tokenBucket } from "@arcjet/next";

const aj = arcjet({
  key: process.env.ARCJET_KEY,
  characteristics: ["userId"], // Track based on Clerk userId
  rules: [
    // Rate limiting specifically for collection creation
    tokenBucket({
      mode: "LIVE",
      refillRate: 2, // 10 collections
      interval: 3600, // per hour
      capacity: 10, // maximum burst capacity
    }),
  ],
});

export default aj;

// import arcjet, { tokenBucket } from "@arcjet/next";
// arcjet → initializes the Arcjet client for Next.js.

// tokenBucket → one of Arcjet’s rate-limiting algorithms (the most flexible one).

// Explain each property:

// aj — the variable holding the configured ArcJet client instance.

// arcjet({...}) — call the factory to create the configured instance.

// key: process.env.ARCJET_KEY — your ArcJet secret key read from environment variables. Must be present server-side.

// characteristics: ["userId"] — tells ArcJet to track usage per characteristic. Here you’re choosing to identify clients by userId (so rate limits apply per user).

// rules: [...] — an array of enforcement rules; you use one rule (token bucket).

// The tokenBucket({...}) options:

// mode: "LIVE" — run in enforcement mode (not just monitor). (Common modes: LIVE vs TEST/MONITOR — LIVE actually blocks).

// refillRate: 2 — how many tokens are added per interval. (Units: tokens).

// interval: 3600 — interval in seconds for the refillRate. 3600s = 1 hour.

// capacity: 10 — max tokens the bucket can hold (burst capacity).

// Meaning: each tracked identity (each userId) has a bucket with up to 10 tokens. Each protected request can request tokens (you pass requested: 1 later). Tokens are replenished at 2 tokens per hour (subject to the library’s refill model — discrete or continuous refill).

// Step-by-step Dry Run (with refill)
// Bucket starts:

// Capacity = 10

// Tokens = 10

// Requests in Hour 0 (first hour)

// Request #1 → consume 1 → 9 left ✅

// Request #2 → consume 1 → 8 left ✅

// Request #3 → consume 1 → 7 left ✅
// ...

// Request #10 → consume 1 → 0 left ✅

// Request #11 (still hour 0, no refill yet) → ❌ Denied (rate limit exceeded).

// 👉 So in the first hour, max 10 requests are allowed.

// At Hour 1 (3600s later)

// RefillRate = 2 → add 2 tokens.

// Bucket = 2 (not 12, because max capacity is 10).

// Request #12 → consume 1 → 1 left ✅

// Request #13 → consume 1 → 0 left ✅

// Request #14 → ❌ Denied (bucket empty again).

// At Hour 2 (7200s later)

// RefillRate = 2 → add 2 tokens.

// Bucket = 2 again.

// Request #15 → consume 1 → 1 left ✅

// Request #16 → consume 1 → 0 left ✅

// Request #17 → ❌ Denied.

// Pattern

// First hour: up to 10 requests allowed (burst).

// Each later hour: only 2 new requests allowed (because refill = 2).

// The bucket never grows beyond 10 tokens (capacity limit).

// ✅ Final Understanding

// capacity = initial burst size (how many a user can do instantly).

// refillRate + interval = how many requests a user can do after burst, per time unit.

// So your setup means:

// A new user can create 10 transactions quickly,

// But after that, they’re limited to 2 transactions per hour.

