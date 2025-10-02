"use server";
import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
export async function getCurrentBudget(accountId) {
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

    const budget = await db.budget.findFirst({
      where: {
        userId: user.id,
      },
    });

    const currentDate = new Date();
    const startOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1,
      0,
      0,
      0,
      0 // Set to start of day
    );
    const endOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0,
      23,
      59,
      59,
      999 // Set to end of day
    );
    //console.log("Date range:", { startOfMonth, endOfMonth, accountId });
    const expenses = await db.transaction.aggregate({
      where: {
        userId: user.id,
        type: "EXPENSE",
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
        accountId,
      },
      _sum: {
        amount: true,
      },
    });

    //console.log("Expenses result:", expenses);

    return {
      budget: budget ? { ...budget, amount: budget.amount.toNumber() } : null,
      currentExpenses: expenses._sum.amount
        ? expenses._sum.amount.toNumber()
        : 0,
    };
  } catch (e) {
    console.error("Error fetching budget:", e);
    throw e;
  }
}

export async function updateBudgetAmount(amount) {
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
    // upsert = update if exists, otherwise create.
    const budget = await db.budget.upsert({
      where: { userId: user.id },
      update: { amount: amount },
      create: {
        userId: user.id,
        amount: amount,
      },
    });
    revalidatePath("/dashboard");
    return {
      success: true,
      budget: { ...budget, amount: budget.amount.toNumber() },
    };
  } catch (e) {
    console.error("Error updating budget:", e);
    return { success: false, error: e.message };
  }
}

// const endOfMonth = new Date(
//   currentDate.getFullYear(),
//   currentDate.getMonth() + 1,
//   0
// );
// Step 1: currentDate.getFullYear()
// Same as before → 2025

// Step 2: currentDate.getMonth() + 1
// If today = Sep 27, 2025 → currentDate.getMonth() = 8 (September)

// Add +1 → 9 (October)

// Step 3: day = 0
// In JavaScript’s new Date(year, monthIndex, day) constructor:

// If you pass 0 as the day → it means “0th day of the month”, which actually resolves to the last day of the previous month.

// So here:

// Year = 2025

// MonthIndex = 9 (October)

// Day = 0 → last day of September

// Step 4: Result
// js
// Copy code
// endOfMonth = Tue Sep 30 2025 00:00:00 GMT+0530 (India Standard Time)

// 2. The aggregate query

// 🔎 Breaking it down:

// db.transaction.aggregate → Prisma’s aggregate query on the transaction table.

// where: { … } → filter conditions:

// type: "EXPENSE" → only expense transactions.

// date: { gte: startOfMonth, lte: endOfMonth } → date is between first day and last day of this month.

// accountId → only for the given account.

// _sum: { amount: true } → tells Prisma:
// “Instead of returning rows, calculate the sum of the amount column for all matching transactions.”

// 👉 Example:
// If in September you have expenses: 100, 250, 50, then:

// expenses._sum.amount = 400

// 3. Returning the result
// return {
//   budget: budget ? { ...budget, amount: budget.amount.toNumber() } : null,
//   currentExpenses: expenses._sum.amount
//     ? expenses._sum.amount.toNumber()
//     : 0,
// };

// 🔎 Breaking it down:

// budget:

// If budget exists → return it as an object, but ensure amount is converted to a normal JavaScript number (budget.amount is probably a Decimal from Prisma).

// If no budget found → return null.

// currentExpenses:

// If expenses._sum.amount exists → convert it to a number.

// Otherwise → return 0 (meaning no expenses recorded).

// const budget = await db.budget.upsert({
//   where: { userId: user.id },
//   update: { amount: amount },
//   create: {
//     userId: user.id,
//     amount: amount,
//   },
// });
// 1️⃣ db.budget.upsert({...})
// db = your Prisma client.

// budget = Prisma model (defined in schema.prisma).

// upsert = update if row exists, insert if not.

// So this single query handles both update and create cases.

// 2️⃣ where: { userId: user.id }
// Prisma looks for an existing budget row where userId matches the logged-in user’s ID.

// Since you defined userId in Budget model as @unique, there can only be one budget per user.

// 3️⃣ update: { amount: amount }
// If a row is found → update that row.

// Only change the amount field to the new value passed in.

// Example: If amount = 8000 → set budget.amount = 8000.

// 4️⃣ create: { userId: user.id, amount: amount }
// If no row is found → create a new budget row.

// Fields to insert:

// userId: user.id → connect budget to this user.

// amount: amount → set the budget value.

// Prisma auto-fills other fields (id, createdAt, updatedAt).
