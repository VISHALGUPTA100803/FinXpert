"use server";
import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { success } from "zod";
import aj from "@/lib/arcjet";
import { request } from "@arcjet/next";
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
              ? calculateNextReccuringDate(data.date, data.recurringInterval)
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