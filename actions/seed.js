"use server";

import { db } from "@/lib/prisma";
import { subDays } from "date-fns";

const ACCOUNT_ID = "a655ff0f-c2b3-4568-9e87-6e3878d9938e";
const USER_ID = "29a8a484-2e8d-436b-bfc1-7ccf3aa6feba";

// Categories with their typical amount ranges
const CATEGORIES = {
  INCOME: [
    { name: "salary", range: [5000, 8000] },
    { name: "freelance", range: [1000, 3000] },
    { name: "investments", range: [500, 2000] },
    { name: "other-income", range: [100, 1000] },
  ],
  EXPENSE: [
    { name: "housing", range: [1000, 2000] },
    { name: "transportation", range: [100, 500] },
    { name: "groceries", range: [200, 600] },
    { name: "utilities", range: [100, 300] },
    { name: "entertainment", range: [50, 200] },
    { name: "food", range: [50, 150] },
    { name: "shopping", range: [100, 500] },
    { name: "healthcare", range: [100, 1000] },
    { name: "education", range: [200, 1000] },
    { name: "travel", range: [500, 2000] },
  ],
};

// Helper to generate random amount within a range
function getRandomAmount(min, max) {
  return Number((Math.random() * (max - min) + min).toFixed(2));
}

// Helper to get random category with amount
function getRandomCategory(type) {
  const categories = CATEGORIES[type];
  const category = categories[Math.floor(Math.random() * categories.length)];
  const amount = getRandomAmount(category.range[0], category.range[1]);
  return { category: category.name, amount };
}

export async function seedTransactions() {
  try {
    // Generate 90 days of transactions
    const transactions = [];
    let totalBalance = 0;

    for (let i = 90; i >= -30; i--) {
      const date = subDays(new Date(), i);

      // subDays(new Date(), -30)
      // Internally, subDays does something like:
      // javascriptdate - (-30) days = date + 30 days
      // When i = 120: subDays(today, 120) = 120 days ago
      // When i = 1: subDays(today, 1) = yesterday
      // When i = 0: subDays(today, 0) = today
      // When i = -1: subDays(today, -1) = tomorrow
      // When i = -30: subDays(today, -30) = 30 days from now

      // Generate 1-3 transactions per day
      const transactionsPerDay = Math.floor(Math.random() * 3) + 1;

      for (let j = 0; j < transactionsPerDay; j++) {
        // 40% chance of income, 60% chance of expense
        const type = Math.random() < 0.4 ? "INCOME" : "EXPENSE";
        const { category, amount } = getRandomCategory(type);

        const transaction = {
          id: crypto.randomUUID(),
          type,
          amount,
          description: `${
            type === "INCOME" ? "Received" : "Paid for"
          } ${category}`,
          date,
          category,
          status: "COMPLETED",
          userId: USER_ID,
          accountId: ACCOUNT_ID,
          createdAt: date,
          updatedAt: date,
        };

        totalBalance += type === "INCOME" ? amount : -amount;
        transactions.push(transaction);
      }
    }

    // Insert transactions in batches and update account balance
    await db.$transaction(async (tx) => {
      // Clear existing transactions
      await tx.transaction.deleteMany({
        where: { accountId: ACCOUNT_ID },
      });

      // Insert new transactions
      await tx.transaction.createMany({
        data: transactions,
      });

      // Update account balance
      await tx.account.update({
        where: { id: ACCOUNT_ID },
        data: { balance: totalBalance },
      });
    });

    return {
      success: true,
      message: `Created ${transactions.length} transactions`,
    };
  } catch (error) {
    console.error("Error seeding transactions:", error);
    return { success: false, error: error.message };
  }
}

// await db.$transaction(async (tx) => {
// await → wait for this async operation to finish.

// db → your Prisma database client (imported from @/lib/prisma).

// .$transaction(...) → Prisma method that runs multiple queries inside a single database transaction (all succeed or all fail).

// (async (tx) => { ... }) → you pass an async callback.

// tx is a special Prisma transaction client.

// You use tx instead of db inside this block so all queries are part of the same transaction.

// await tx.transaction.deleteMany({ where: { accountId: ACCOUNT_ID } });
// await → wait for deletion to finish.

// tx.transaction → refers to the transaction table (Prisma model).

// .deleteMany(...) → delete multiple rows.

// { where: { accountId: ACCOUNT_ID } } → condition: delete all rows where accountId matches the hardcoded account.

// 👉 Effect: Clears all existing transactions for this account before inserting fresh ones.

// await tx.transaction.createMany({ data: transactions });
// await → wait for insert to finish.

// tx.transaction → same transaction table.

// .createMany(...) → insert multiple rows at once.

// { data: transactions } → transactions is the array you built earlier (fake transactions for 91 days).

// 👉 Effect: Bulk insert all generated transactions into the database.

// await tx.account.update({
//   where: { id: ACCOUNT_ID },
//   data: { balance: totalBalance },
// });
// await → wait for update.

// tx.account → refers to the account table.

// .update({...}) → update a single row.

// where: { id: ACCOUNT_ID } → find the account by ID.

// data: { balance: totalBalance } → set its balance column to the running total we calculated earlier.

// 👉 Effect: Updates the account’s balance so it matches the sum of all seeded transactions.

// });
// Closes the $transaction block.

// At this point, all 3 queries (deleteMany, createMany, update) are treated as one atomic transaction:

// If they all succeed → changes are committed.

// If any fails → all are rolled back (nothing changes in DB).

// ✅ Summary of what this block does
// Starts a database transaction.

// Deletes all old transactions for the given account.

// Inserts the newly generated transactions.

// Updates the account’s balance to reflect the new data.

// Commits everything (or rolls back if something goes wrong).
