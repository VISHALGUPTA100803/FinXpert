"use server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { success } from "zod";
const serializeTransaction = (obj) => {
  const serialized = { ...obj };

  if (obj.balance) {
    serialized.balance = obj.balance.toNumber();
  }
  if (obj.amount) {
    serialized.amount = obj.amount.toNumber();
  }
  return serialized;
};

export async function updateDefaultAccount(accountId) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");
    const user = await db.user.findUnique({
      where: {
        clerkUserId: userId,
      },
    });
    if (!user) {
      throw new Error("User not found");
    }
    // unset other default accounts
    await db.account.updateMany({
      where: { userId: user.id, isDefault: true },
      data: { isDefault: false },
    });

    const account = await db.account.update({
      where: {
        id: accountId,
        userId: user.id,
      },
      data: { isDefault: true },
    });
    revalidatePath("/dashboard");
    return { success: true, data: serializeTransaction(account) };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getAccountWithTransactions(accountId) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const user = await db.user.findUnique({
    where: {
      clerkUserId: userId,
    },
  });
  if (!user) {
    throw new Error("User not found");
  }

  const account = await db.account.findUnique({
    where: { id: accountId, userId: user.id },
    include: {
      transactions: {
        orderBy: { date: "desc" },
      },
      _count: {
        select: { transactions: true },
      },
    },
  });
  if (!account) return null;
  return {
    ...serializeTransaction(account),
    transactions: account.transactions.map(serializeTransaction),
  };
}

export async function bulkDeleteTransaction(transactionIds) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");
    const user = await db.user.findUnique({
      where: {
        clerkUserId: userId,
      },
    });
    if (!user) {
      throw new Error("User not found");
    }

    const transactions = await db.transaction.findMany({
      where: {
        id: { in: transactionIds },
        userId: user.id,
      },
    });

    const accountBalanceChanges = transactions.reduce((acc, transaction) => {
      const change =
        transaction.type === "EXPENSE"
          ? Number(transaction.amount)
          : -Number(transaction.amount);
      // if transaction is from multiple different account
      acc[transaction.accountId] = (acc[transaction.accountId] || 0) + change;
      return acc;
    }, {});
    // Delete transactions and update account balances in a transaction
    await db.$transaction(async (tx) => {
      // Delete transaction
      await tx.transaction.deleteMany({
        where: {
          id: { in: transactionIds },
          userId: user.id,
        },
      });

      for (const [accountId, balanceChange] of Object.entries(
        accountBalanceChanges
      )) {
        await tx.account.update({
          where: { id: accountId },
          data: {
            balance: {
              increment: balanceChange,
            },
          },
        });
      }
    });
    revalidatePath("/dashboard");
    revalidatePath("/account[id]");
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ...serializeTransaction(account) → serializes account-level balance, spreads its fields.

// transactions: account.transactions.map(serializeTransaction) → separately serializes each transaction’s amount.

// Here we explicitly add a transactions property.

// ⚡ Important: if the object already had a transactions property (which it does), this new one will overwrite it.

// So instead of the raw transactions array, we replace it with a serialized array:

// ... (spread) just means “copy all fields from this object here.”

// 🟢 Part 1: Calculating accountBalanceChanges
// const accountBalanceChanges = transactions.reduce((acc, transaction) => {
//   const change =
//     transaction.type === "EXPENSE"
//       ? transaction.amount
//       : -transaction.amount;
//   // if transaction is from multiple different account
//   acc[transaction.accountId] = (acc[transaction.accountId] || 0) + change;
//   return acc;
// }, {});

// Word by word:

// transactions.reduce(...)

// Loops through the transactions array.

// acc = accumulator object (starts as {} because of {}, at the end).

// transaction = the current transaction in the loop.

// const change = transaction.type === "EXPENSE" ? transaction.amount : -transaction.amount;

// If transaction type = "EXPENSE" → change = +amount.

// If type = "INCOME" → change = -amount.

// 👉 This means expenses reduce account balance, so we store them as positive changes (later they will be subtracted from account balance). Incomes increase balance, so we use negative (later we add it back).

// acc[transaction.accountId] = (acc[transaction.accountId] || 0) + change;

// Look up if we already have a balance change recorded for this account.

// If not, use 0.

// Add the current change.

// Save it back to acc for this accountId.

// return acc;

// Reduce requires returning the accumulator each iteration.

// Dry run example:

// Say:

// transactions = [
//   { id: 1, type: "EXPENSE", amount: 50, accountId: "A1" },
//   { id: 2, type: "EXPENSE", amount: 30, accountId: "A2" },
//   { id: 3, type: "INCOME", amount: 20, accountId: "A1" }
// ]

// Start: acc = {}

// Transaction 1: A1 EXPENSE 50

// change = 50

// acc["A1"] = (undefined || 0) + 50 = 50

// acc = { A1: 50 }

// Transaction 2: A2 EXPENSE 30

// change = 30

// acc["A2"] = (undefined || 0) + 30 = 30

// acc = { A1: 50, A2: 30 }

// Transaction 3: A1 INCOME 20

// change = -20

// acc["A1"] = (50 || 0) + (-20) = 30

// acc = { A1: 30, A2: 30 }

// ✅ Final:

// accountBalanceChanges = { A1: 30, A2: 30 }

// This means:

// A1’s balance should change by +30

// A2’s balance should change by +30

// 🟢 Part 2: Deleting + Updating Accounts
// await db.$transaction(async (tx) => {
//   // Delete transaction
//   await tx.transaction.deleteMany({
//     where: {
//       id: { in: transactionIds },
//       userId: user.id,
//     },
//   });

//   for (const [accountId, balanceChange] of Object.entries(accountBalanceChanges)) {
//     await tx.account.update({
//       where: { id: accountId },
//       data: {
//         balance: {
//           increment: balanceChange,
//         },
//       },
//     });
//   }
// });

// Word by word:

// await db.$transaction(async (tx) => { ... })

// Runs everything inside as a single database transaction.

// Either all queries succeed or all are rolled back.

// tx is the transaction object used instead of db.

// await tx.transaction.deleteMany(...)

// Deletes all transactions whose id is in transactionIds and belong to this user.

// Example: transactionIds = [1, 2, 3] → deletes them all.

// for (const [accountId, balanceChange] of Object.entries(accountBalanceChanges)) { ... }

// Loops through each account and its balance change.

// Object.entries({ A1: 30, A2: 30 }) → [["A1", 30], ["A2", 30]]

// await tx.account.update({ ... })

// await tx.account.update({
//   where: { id: accountId },
//   data: {
//     balance: {
//       increment: balanceChange,
//     },
//   },
// });

// Finds the account with id = accountId.

// Updates its balance by incrementing with balanceChange.

// increment: 30 means balance = balance + 30.

// Dry run continued from Part 1:

// We had:

// accountBalanceChanges = { A1: 30, A2: 30 }

// So inside the loop:

// For A1: balance = balance + 30

// For A2: balance = balance + 30

// ✅ Both account balances are updated after deleting the transactions.

// What Object.entries(obj) does

// If you have:

// const accountBalanceChanges = { A1: 30, A2: 50 };

// Then:

// Object.entries(accountBalanceChanges);

// gives you:

// [
//   ["A1", 30],
//   ["A2", 50]
// ]
