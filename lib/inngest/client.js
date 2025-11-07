import { Inngest } from "inngest";

// Create a client to send and receive events
export const inngest = new Inngest({
  id: "finxpert",
  name: "FinXpert",
  eventKey: process.env.INNGEST_EVENT_KEY,
  retryFunction: async (attempt) => ({
    delay: Math.pow(2, attempt) * 1000, // Exponential Backoff
    maxAttempts: 2,
  }),
});
