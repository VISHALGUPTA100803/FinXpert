"use server";
import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { success } from "zod";
import aj from "@/lib/arcjet";
import { request } from "@arcjet/next";
import { GoogleGenAI } from "@google/genai";

const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const serializeAmount = (obj) => {
  const serialized = { ...obj };
  if (obj.amount) {
    serialized.amount = obj.amount.toNumber();
  }
  return serialized;
};
export async function createTransaction(data) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    // add arcjet to add rate limiting (to limit how much a user can create transactions)
    // get request data from arcjet
    const req = await request();
    // check rate limit
    const decision = await aj.protect(req, {
      userId,
      requested: 1,
    });

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        const { remaining, reset } = decision.reason;
        console.error({
          code: "RATE_LIMIT_EXCEEDED",
          details: {
            remaining,
            resetInSeconds: reset,
          },
        });
        throw new Error("Too many requests. Please try again later.");
      }
      throw new Error("Request blocked");
    }
    const user = await db.user.findUnique({
      where: {
        clerkUserId: userId,
      },
    });
    if (!user) {
      throw new Error("User not found");
    }

    // find account where we need to create this transaction

    const account = await db.account.findUnique({
      where: {
        id: data.accountId,
        userId: user.id,
      },
    });
    if (!account) {
      throw new Error("Account Not Found");
    }

    // update balance of the account
    const balanceChange = data.type === "EXPENSE" ? -data.amount : data.amount;
    const newBalance = account.balance.toNumber() + balanceChange;
    // create transaction and update account balance
    const transaction = await db.$transaction(async (tx) => {
      const newTransaction = await tx.transaction.create({
        data: {
          ...data,
          userId: user.id,
          nextRecurringDate:
            data.isRecurring && data.recurringInterval
              ? calculateNextRecurringDate(data.date, data.recurringInterval)
              : null,
        },
      });

      await tx.account.update({
        where: { id: data.accountId },
        data: {
          balance: newBalance,
        },
      });

      return newTransaction;
    });

    revalidatePath("/dashboard");
    revalidatePath(`/account/${transaction.accountId}`);
    return { success: true, data: serializeAmount(transaction) };
  } catch (error) {
    throw new Error(error.message);
  }
}

// Helper function to calculate next recurring date
function calculateNextRecurringDate(startDate, interval) {
  const date = new Date(startDate);

  switch (interval) {
    case "DAILY":
      date.setDate(date.getDate() + 1);
      break;
    case "WEEKLY":
      date.setDate(date.getDate() + 7);
      break;
    case "MONTHLY":
      date.setMonth(date.getMonth() + 1);
      break;
    case "YEARLY":
      date.setFullYear(date.getFullYear() + 1);
      break;
  }

  return date;
}

export async function scanReceipt(file) {
  try {
    // convert file to arraybuffer
    const arrayBuffer = await file.arrayBuffer();

    // convert arraybuffer to base64
    const base64String = Buffer.from(arrayBuffer).toString("base64");

    const prompt = `
       Analyze this receipt image and extract the following information in JSON format:
      - Total amount (just the number)
      - Date (in ISO format)
      - Description or items purchased (brief summary)
      - Merchant/store name
      - Suggested category (one of: housing,transportation,groceries,utilities,entertainment,food,shopping,healthcare,education,personal,travel,insurance,gifts,bills,other-expense )
      
      Only respond with valid JSON in this exact format:
      {
        "amount": number,
        "date": "ISO date string",
        "description": "string",
        "merchantName": "string",
        "category": "string"
      }

      If its not a recipt, return an empty object
    `;

    // In @google/genai, use model.generateContent directly
    const result = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { data: base64String, mimeType: file.type } },
            { text: prompt },
          ],
        },
      ],
    });

    // result.outputText gives plain text response
    const text = result.text; // ✅ Correct - it's a property
    //console.log("outputtext from model", text);

    // Clean markdown JSON formatting
    const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();
    //console.log("cleaned text", cleanedText);

    try {
      const data = JSON.parse(cleanedText);
      //console.log("json.parse", data);
      return {
        amount: parseFloat(data.amount),
        date: new Date(data.date),
        description: data.description,
        category: data.category,
        merchantName: data.merchantName,
      };
    } catch (parseError) {
      console.error("Error parsing JSON response:", parseError);
      throw new Error("Invalid response format from Gemini");
    }
  } catch (e) {
    console.error("Error scanning receipt:", e.message);
    throw new Error("Failed to scan receipt");
  }
}

export async function getTransaction(id) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  const transaction = await db.transaction.findUnique({
    where: {
      id,
      userId: user.id,
    },
  });

  if (!transaction) throw new Error("Transaction not found");

  return serializeAmount(transaction);
}

export async function updateTransaction(id, data) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User not found");

    // Get original transaction to calculate balance change
    const originalTransaction = await db.transaction.findUnique({
      where: {
        id,
        userId: user.id,
      },
      include: {
        account: true,
      },
    });

    if (!originalTransaction) throw new Error("Transaction not found");

    // Calculate balance changes
    const oldBalanceChange =
      originalTransaction.type === "EXPENSE"
        ? -originalTransaction.amount.toNumber()
        : originalTransaction.amount.toNumber();

    const newBalanceChange =
      data.type === "EXPENSE" ? -data.amount : data.amount;

    const netBalanceChange = newBalanceChange - oldBalanceChange;

    // Update transaction and account balance in a transaction
    const transaction = await db.$transaction(async (tx) => {
      const updated = await tx.transaction.update({
        where: {
          id,
          userId: user.id,
        },
        data: {
          ...data,
          nextRecurringDate:
            data.isRecurring && data.recurringInterval
              ? calculateNextRecurringDate(data.date, data.recurringInterval)
              : null,
        },
      });

      // Update account balance
      await tx.account.update({
        where: { id: data.accountId },
        data: {
          balance: {
            increment: netBalanceChange,
          },
        },
      });

      return updated;
    });

    revalidatePath("/dashboard");
    revalidatePath(`/account/${data.accountId}`);

    return { success: true, data: serializeAmount(transaction) };
  } catch (error) {
    throw new Error(error.message);
  }
}

// const req = await request();
// request() — server helper that returns the incoming HTTP request (headers, ip, user-agent, cookies, etc.). ArcJet uses these details to fingerprint the client. In Next.js, request() likely yields the Request object for the current route.

// req must be the real request-like object (headers, ip info), and it must run server-side.

//     // check rate limit
//     const decision = await aj.protect(req, {
//       userId,
//       requested: 1,
//     });
// aj.protect(req, { userId, requested: 1 }) — core call:

// req — request object for fingerprinting.

// userId — characteristic value (so ArcJet tracks the bucket for this user).

// requested: 1 — this operation “costs” 1 token from the bucket.

// decision — an object returned by ArcJet describing whether the request is allowed or denied, and if denied why.

//     if (decision.isDenied()) {
//       if (decision.reason.isRateLimit()) {
//         const { remaining, reset } = decision.reason;
//         console.error({
//           code: "RATE_LIMIT_EXCEEDED",
//           details: {
//             remaining,
//             resetInSeconds: reset,
//           },
//         });
//         throw new Error("Too many requests. Please try again later.");
//       }
//       throw new Error("Request blocked");
//     }
// decision.isDenied() — method that returns true if ArcJet decided to block this request.

// decision.reason — object describing the deny reason.

// decision.reason.isRateLimit() — checks specifically if it was denied due to rate-limiting.

// remaining — how many tokens are left (often 0 when denied).

// reset — how many seconds until tokens will be refilled (or until next refill). The exact meaning depends on ArcJet internals; here code treats it as seconds until next usable tokens.

// If rate-limited, you log and throw a rate-limit error (you should usually return HTTP 429 to client with Retry-After header).

// const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();
// 🔹 What this line does overall
// It removes Markdown code fences (like json or just ) from the response text and trims extra spaces.
// This is useful because LLMs often wrap JSON in:

// ```json
// { ... }
// ```

// …but your app only needs the JSON itself.

// 🔍 Breaking down the regex:
// /```(?:json)?\n?/g

// / ... /
// → Delimiters for regex in JavaScript.

// ```
// → Matches exactly three backticks.
// This targets Markdown’s code block markers.

// (?:json)?

// (?: ... ) = a non-capturing group (groups regex parts without saving them).

// json = matches the word "json".

// ? = makes it optional (0 or 1 time).
// ✅ So it matches either:

// ```json

// ```

// \n?

// \n = newline character.

// ? = optional.
// ✅ Matches an optional newline right after the backticks.

// g flag

// Means global → replace all occurrences, not just the first.

// Example file content

// Suppose you have a text file example.txt with this content:

// Hi

// This is 2 characters: H and i

// In ASCII, these characters are stored as bytes:

// H → 72

// i → 105

// Step 1: file.arrayBuffer()
// const arrayBuffer = await file.arrayBuffer();

// arrayBuffer stores raw bytes of the file.

// So for "Hi":

// arrayBuffer = [72, 105]   // in bytes

// Actually, in memory, ArrayBuffer is just a sequence of 2 bytes.

// If we inspect it in JS:

// let uint8 = new Uint8Array(arrayBuffer);
// console.log(uint8);

// Output:

// Uint8Array(2) [72, 105]

// ✅ So the file is now raw binary, not a string anymore.

// "H" → ASCII decimal 72 → binary 01001000 → stored in 1 byte

// "i" → ASCII decimal 105 → binary 01101001 → stored in 1 byte

// ArrayBuffer stores these bytes in sequence:

// Byte 0: 01001000 (72)
// Byte 1: 01101001 (105)

// ✅ Key Points

// ArrayBuffer stores raw bytes (binary), not characters.

// ASCII is just a mapping from characters to numbers (0–127).

// When you call .toString("base64"), it reads these binary bytes and converts them to Base64 text.
// Step 2: Buffer.from(arrayBuffer)
// const buffer = Buffer.from(arrayBuffer);

// Converts the ArrayBuffer (raw bytes) into a Node.js Buffer.

// The Buffer contains the same bytes: [72, 105]

// But Buffer has methods to manipulate them, e.g., .toString("base64").

// If you print:

// console.log(buffer);

// Output:

// <Buffer 48 69>

// 48 is hexadecimal for 72 (H)

// 69 is hexadecimal for 105 (i)

// ✅ Buffer is now ready to convert to Base64.

// Step 3: .toString("base64")
// const base64String = buffer.toString("base64");

// Converts each byte into Base64 characters.

// Base64 encoding works on 3-byte blocks, mapping them to 4 ASCII characters.

// Our bytes [72,105] → Base64: "SGk="

// Explanation:

// Bytes: 72 105 → binary:

// 72  = 01001000
// 105 = 01101001

// Concatenate bits: 01001000 01101001 → 16 bits

// Base64 works in 6-bit chunks → split into 3 chunks of 6 bits, pad as needed:

// 010010 000110 1001  => add padding bits to make 24 bits

// Encodes to Base64 chars: "SGk="

// ✅ So now base64String = "SGk="

// 3️⃣ Sending to AI
// {
//   "inlineData": {
//     "data": "iVBORw0KGgo=...",
//     "mimeType": "image/png"
//   }
// }

// Gemini AI receives text-safe Base64, not raw bytes.

// The Base64 string encodes all bytes, so nothing is lost.

// 4️⃣ How it comes back to original bytes

// Gemini (or any Base64 decoder) does reverse mapping:

// Take 4 Base64 characters → convert back to 24-bit sequence.

// Split into 3 bytes (8 bits each).

// Result = original bytes [137, 80, 78, ...].

// No precision is lost — it’s lossless encoding.

// Dry Run Example
// Input: image of receipt

// Base64 of image: "iVBORw0KGgo=..."

// Prompt: extract JSON

// Gemini Output (text):
// ```json
// {
//   "amount": 120.5,
//   "date": "2025-10-03",
//   "description": "Groceries at Walmart",
//   "merchantName": "Walmart",
//   "category": "groceries"
// }

// ### After cleaning:

// ```text
// {
//   "amount": 120.5,
//   "date": "2025-10-03",
//   "description": "Groceries at Walmart",
//   "merchantName": "Walmart",
//   "category": "groceries"
// }

// After JSON.parse:
// {
//   amount: 120.5,
//   date: "2025-10-03",
//   description: "Groceries at Walmart",
//   merchantName: "Walmart",
//   category: "groceries"
// }

// Final processed object:
// {
//   amount: 120.5,               // Number
//   date: new Date("2025-10-03"),// Date object
//   description: "Groceries at Walmart",
//   merchantName: "Walmart",
//   category: "groceries"
// }
// 1️⃣ JSON text vs JavaScript object
// JSON text

// Type: string

// Format: Text that looks like JavaScript object literal:

// {
//   "amount": 120.5,
//   "date": "2025-10-03",
//   "description": "Groceries at Walmart"
// }

// ✅ It is just text, not a real JS object.

// You cannot do text.amount yet — JS sees it as a string.

// Often returned by APIs or AI models as their output.

// JavaScript object

// Type: object

// Format: Real JavaScript object in memory:

// {
//   amount: 120.5,
//   date: "2025-10-03",
//   description: "Groceries at Walmart"
// }

// ✅ You can now access properties:

// console.log(obj.amount); // 120.5

// It lives in memory, not as a string.
