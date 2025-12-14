import { sendEmail } from "@/actions/send-email";
import { db } from "../prisma";
import { inngest } from "./client";
import EmailTemplate from "@/emails/template";
import { GoogleGenAI } from "@google/genai";

const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export const checkBudgetAlert = inngest.createFunction(
  { id: "Check Budget Alerts" },
  { cron: "0 */6 * * *" },
  async ({ step }) => {
    const budgets = await step.run("fetch-budget", async () => {
      return await db.budget.findMany({
        include: {
          user: {
            include: {
              accounts: {
                where: {
                  isDefault: true,
                },
              },
            },
          },
        },
      });
    });

    for (const budget of budgets) {
      const defaultAccount = budget.user.accounts[0];
      if (!defaultAccount) continue; // skip if no default account

      await step.run(`check-budget-${budget.id}`, async () => {
        const currentDate = new Date();
        const startOfMonth = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          1
        );
        const endOfMonth = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth() + 1,
          0
        );

        const expenses = await db.transaction.aggregate({
          where: {
            userId: budget.userId,
            accountId: defaultAccount.id, // only consider default account
            type: "EXPENSE",
            date: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
          _sum: {
            amount: true,
          },
        });

        const totalExpenses = expenses._sum.amount?.toNumber() || 0;
        const budgetAmount = budget.amount;
        const percentageUsed = (totalExpenses / budgetAmount) * 100;
        console.log("percentage used", percentageUsed);

        if (
          percentageUsed > 80 &&
          (!budget.lastAlertSent ||
            isNewMonth(new Date(budget.lastAlertSent), new Date()))
        ) {
          // step 1 send the email to user
          await sendEmail({
            to: budget.user.email,
            subject: `Budget Alert for ${defaultAccount.name}`,
            react: EmailTemplate({
              userName: budget.user.name,
              type: "budget-alert",
              data: {
                percentageUsed: percentageUsed,
                budgetAmount: parseInt(budgetAmount).toFixed(1),
                totalExpenses: parseInt(totalExpenses).toFixed(1),
              },
            }),
          });

          // step 2 update lastAlertSent in budget table in db
          await db.budget.update({
            where: {
              id: budget.id,
            },
            data: { lastAlertSent: new Date() },
          });
        }
      });
    }
  }
);

// 1. Recurring Transaction Processing with Throttling
export const processRecurringTransaction = inngest.createFunction(
  {
    id: "process-recurring-transaction",
    name: "Process Recurring Transaction",
    throttle: {
      limit: 10, // Process 10 transactions
      period: "1m", // per minute
      key: "event.data.userId", // Throttle per user
    },
  },
  { event: "transaction.recurring.process" },
  async ({ event, step }) => {
    // Validate event data
    if (!event?.data?.transactionId || !event?.data?.userId) {
      console.error("Invalid event data:", event);
      return { error: "Missing required event data" };
    }

    await step.run("process-transaction", async () => {
      const transaction = await db.transaction.findUnique({
        where: {
          id: event.data.transactionId,
          userId: event.data.userId,
        },
        include: {
          account: true,
        },
      });

      if (!transaction || !isTransactionDue(transaction)) return;

      // Create new transaction and update account balance in a transaction
      await db.$transaction(async (tx) => {
        // Create new transaction
        await tx.transaction.create({
          data: {
            type: transaction.type,
            amount: transaction.amount,
            description: `${transaction.description} (Recurring)`,
            date: new Date(),
            category: transaction.category,
            userId: transaction.userId,
            accountId: transaction.accountId,
            isRecurring: false,
          },
        });

        // Update account balance
        const balanceChange =
          transaction.type === "EXPENSE"
            ? -transaction.amount.toNumber()
            : transaction.amount.toNumber();

        await tx.account.update({
          where: { id: transaction.accountId },
          data: { balance: { increment: balanceChange } },
        });

        // Update last processed date and next recurring date
        await tx.transaction.update({
          where: { id: transaction.id },
          data: {
            lastProcessed: new Date(),
            nextRecurringDate: calculateNextRecurringDate(
              new Date(),
              transaction.recurringInterval
            ),
          },
        });
      });
    });
  }
);

// Trigger recurring transactions with batching
export const triggerRecurringTransactions = inngest.createFunction(
  {
    id: "trigger-recurring-transactions", // Unique ID,
    name: "Trigger Recurring Transactions",
  },
  { cron: "0 0 * * *" }, // Daily at midnight
  async ({ step }) => {
    const recurringTransactions = await step.run(
      "fetch-recurring-transactions",
      async () => {
        return await db.transaction.findMany({
          where: {
            isRecurring: true,
            status: "COMPLETED",
            OR: [
              { lastProcessed: null },
              {
                nextRecurringDate: {
                  lte: new Date(),
                },
              },
            ],
          },
        });
      }
    );

    // Send event for each recurring transaction in batches
    if (recurringTransactions.length > 0) {
      const events = recurringTransactions.map((transaction) => ({
        name: "transaction.recurring.process",
        data: {
          transactionId: transaction.id,
          userId: transaction.userId,
        },
      }));

      // Send events directly using inngest.send()
      await inngest.send(events);
    }

    return { triggered: recurringTransactions.length };
  }
);
// if the lastalertsent is of previous month then we should send the budget alert or if same month different year then also alert should be sent
function isNewMonth(lastAlertDate, currentDate) {
  return (
    lastAlertDate.getMonth() !== currentDate.getMonth() ||
    lastAlertDate.getFullYear() !== currentDate.getFullYear()
  );
}

function isTransactionDue(transaction) {
  // If no lastProcessed date, transaction is due
  if (!transaction.lastProcessed) return true;

  const today = new Date();
  const nextDue = new Date(transaction.nextRecurringDate);

  // Compare with nextDue date
  return nextDue <= today;
}

function calculateNextRecurringDate(date, interval) {
  const next = new Date(date);
  switch (interval) {
    case "DAILY":
      next.setDate(next.getDate() + 1);
      break;
    case "WEEKLY":
      next.setDate(next.getDate() + 7);
      break;
    case "MONTHLY":
      next.setMonth(next.getMonth() + 1);
      break;
    case "YEARLY":
      next.setFullYear(next.getFullYear() + 1);
      break;
  }
  return next;
}
// Monthly Report Generation
async function getMonthlyStats(userId, month) {
  const startDate = new Date(month.getFullYear(), month.getMonth(), 1);
  const endDate = new Date(month.getFullYear(), month.getMonth() + 1, 0);

  const transactions = await db.transaction.findMany({
    where: {
      userId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  const rawStats = transactions.reduce(
    (stats, t) => {
      const amount = t.amount.toNumber();
      if (t.type === "EXPENSE") {
        stats.totalExpenses += amount;
        stats.byCategory[t.category] =
          (stats.byCategory[t.category] || 0) + amount;
      } else {
        stats.totalIncome += amount;
      }
      return stats;
    },
    {
      totalExpenses: 0,
      totalIncome: 0,
      byCategory: {},
      transactionCount: transactions.length,
    }
  );
  return {
    totalIncome: parseFloat(rawStats.totalIncome.toFixed(2)),
    totalExpenses: parseFloat(rawStats.totalExpenses.toFixed(2)),
    netIncome: parseFloat(
      (rawStats.totalIncome - rawStats.totalExpenses).toFixed(2)
    ),
    byCategory: Object.fromEntries(
      Object.entries(rawStats.byCategory).map(([cat, amt]) => [
        cat,
        parseFloat(amt.toFixed(2)),
      ])
    ),
    transactionCount: rawStats.transactionCount,
  };
}

export const generateMonthlyReports = inngest.createFunction(
  {
    id: "generate-monthly-reports",
    name: "Generate Monthly Reports",
  },
  { cron: "0 0 1 * *" }, // First day of each month
  async ({ step }) => {
    const users = await step.run("fetch-users", async () => {
      return await db.user.findMany({
        include: { accounts: true },
      });
    });
    let emailsSent = 0;
    let usersSkipped = 0;
    for (const user of users) {
      if (!user.accounts[0]) {
        usersSkipped++;
        console.log(`⏭️ Skipping ${user.email} - no accounts found`);
        continue;
      }
      const result = await step.run(`generate-report-${user.id}`, async () => {
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);

        const stats = await getMonthlyStats(user.id, lastMonth);
        const monthName = lastMonth.toLocaleString("default", {
          month: "long",
        });

        // ✅ Skip users with no financial activity
        if (stats.transactionCount === 0) {
          console.log(
            `⏭️ Skipping ${user.email} - no transactions in ${monthName}`
          );
          return { skipped: true };
        }

        // ✅ Skip users with both income and expenses at $0
        if (stats.totalIncome === 0 && stats.totalExpenses === 0) {
          console.log(
            `⏭️ Skipping ${user.email} - no financial activity in ${monthName}`
          );
          return { skipped: true };
        }

        console.log(`📧 Sending email to ${user.email}`);

        // Generate AI insights
        const insights = await generateFinancialInsights(stats, monthName);

        await sendEmail({
          to: user.email,
          subject: `Your Monthly Financial Report - ${monthName}`,
          react: EmailTemplate({
            userName: user.name,
            type: "monthly-report",
            data: {
              stats,
              month: monthName,
              insights,
            },
          }),
        });
        return { emailSent: true };
      });
      if (result?.skipped) {
        usersSkipped++;
      } else if (result?.emailSent) {
        emailsSent++;
      }
    }

    return {
      success: true,
      totalUsers: users.length,
      emailsSent: emailsSent,
      usersSkipped: usersSkipped,
      summary: `Sent ${emailsSent} emails out of ${users.length} total users (${usersSkipped} skipped)`,
    };
  }
);

async function generateFinancialInsights(stats, month) {
  const prompt = `
    Analyze this financial data and provide 3 concise, actionable insights.
    Focus on spending patterns and practical advice.
    Keep it friendly and conversational.

    Financial Data for ${month}:
    - Total Income: $${stats.totalIncome}
    - Total Expenses: $${stats.totalExpenses}
    - Net Income: $${stats.totalIncome - stats.totalExpenses}
    - Expense Categories: ${Object.entries(stats.byCategory)
      .map(([category, amount]) => `${category}: $${amount}`)
      .join(", ")}

    Format the response as a JSON array of strings, like this:
    ["insight 1", "insight 2", "insight 3"]
  `;

  try {
    console.log("🤖 Calling Gemini AI with prompt:", prompt);
    const result = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
    });
    console.log("✅ Gemini AI raw result:", result);

    const text = result.text;

    const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();
    console.log("🧹 Cleaned text:", cleanedText);
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error("Error generating insights:", error);
    return [
      "Your highest expense category this month might need attention.",
      "Consider setting up a budget for better financial management.",
      "Track your recurring expenses to identify potential savings.",
    ];
  }
}
// createFunction → Creates a new Inngest function.

// { id: "Check Budget Alerts" } → Name/ID of the function for identification.

// { cron: "0 */6 * * *" } → Schedule to run every 6 hours at minute 0. That means this function executes at 00:00, 06:00, 12:00, 18:00.

// async ({ step }) => {...} → Function body that runs at each scheduled time. step is used to define atomic steps that can be logged, retried, or tracked separately in Inngest.
// Fetch Budgets from the Database
// Explanation:

// step.run("fetch-budget", async () => {...}) → Creates a step named "fetch-budget". Inngest tracks this step for logs and retries.

// db.budget.findMany({...}) → Uses Prisma to fetch all budgets.

// include → Tells Prisma to fetch related data:

// user → Include the User related to this budget.

// accounts → Include only the user’s accounts where isDefault = true.

// Result structure: Each budget object now contains:

// {
//   id: "...",
//   amount: 1000,
//   lastAlertSent: "...",
//   userId: "...",
//   createdAt: "...",
//   updatedAt: "...",
//   user: {
//     id: "...",
//     clerkUserId: "...",
//     email: "...",
//     name: "...",
//     imageUrl: "...",
//     createdAt: "...",
//     updatedAt: "...",
//     accounts: [
//       {
//         id: "...",
//         name: "...",
//         type: "SAVINGS",
//         balance: 5000,
//         isDefault: true,
//         userId: "...",
//         createdAt: "...",
//         updatedAt: "..."
//       }
//     ]
//   }
// }

// 1️⃣ What’s included:

// Budget data

// Every field of the Budget model (id, amount, lastAlertSent, userId, createdAt, updatedAt) is included by default because findMany returns full rows. ✅

// User data

// All fields of the User model (id, clerkUserId, email, name, imageUrl, createdAt, updatedAt) are included. ✅

// Account data

// Only the accounts where isDefault = true are included.

// All fields of those accounts (id, name, type, balance, isDefault, userId, createdAt, updatedAt) are returned. ✅

// 2️⃣ What’s not included:

// Related fields that are not explicitly included:

// transactions of user or account → Not included.

// budgets of user → Not included (apart from the one you’re querying).

// Accounts that are not default → Filtered out by where: { isDefault: true }

// 4️⃣ Loop Through Budgets
// for(const budget of budgets) {
//     const defaultAccount = budget.user.accounts[0];
//     if (!defaultAccount) continue;
// }

// Loops through all budgets fetched.

// defaultAccount = budget.user.accounts[0] → Picks the first default account of the user.

// if (!defaultAccount) continue; → Skips this budget if the user has no default account.

// 🎯 The Two Functions
// 1. Trigger Function (Scheduler)
// javascripttriggerRecurringTransactions

// Runs: Daily at midnight (cron: "0 0 * * *")
// Job: Find all recurring transactions that need processing and create events for them

// 2. Process Function (Worker)
// javascriptprocessRecurringTransaction

// Runs: When it receives a transaction.recurring.process event
// Job: Actually create the new transaction and update balances

// 🔄 Complete Flow Explanation
// Step 1: Daily Cron Job Triggers (Midnight)
// javascriptexport const triggerRecurringTransactions = inngest.createFunction(
//   {
//     id: "trigger-recurring-transactions",
//     name: "Trigger Recurring Transactions",
//   },
//   { cron: "0 0 * * *" }, // ⏰ Every day at 00:00
//   async ({ step }) => {
// What happens:

// Inngest's scheduler wakes up at midnight
// Calls triggerRecurringTransactions function automatically

// Step 2: Fetch Transactions That Need Processing
// javascriptconst recurringTransactions = await step.run(
//   "fetch-recurring-transactions",
//   async () => {
//     return await db.transaction.findMany({
//       where: {
//         isRecurring: true,           // Only recurring transactions
//         status: "COMPLETED",          // Only active ones
//         OR: [
//           { lastProcessed: null },    // Never processed before
//           {
//             nextRecurringDate: {
//               lte: new Date(),        // Or due date has passed
//             },
//           },
//         ],
//       },
//     });
//   }
// );
// Example Result:
// javascript[
//   {
//     id: "txn_1",
//     description: "Netflix Subscription",
//     amount: 15.99,
//     recurringInterval: "MONTHLY",
//     nextRecurringDate: "2024-12-01", // Due today!
//     lastProcessed: "2024-11-01",
//     userId: "user_123",
//     // ... other fields
//   },
//   {
//     id: "txn_2",
//     description: "Gym Membership",
//     amount: 50.00,
//     recurringInterval: "MONTHLY",
//     nextRecurringDate: "2024-12-01",
//     lastProcessed: null, // Never processed
//     userId: "user_456",
//   }
// ]

// Step 3: Create Events for Each Transaction
// javascriptif (recurringTransactions.length > 0) {
//   const events = recurringTransactions.map((transaction) => ({
//     name: "transaction.recurring.process", // 📢 Event name
//     data: {
//       transactionId: transaction.id,
//       userId: transaction.userId,
//     },
//   }));

//   // 🚀 Send all events to Inngest
//   await inngest.send(events);
// }
// What this creates:
// javascript[
//   {
//     name: "transaction.recurring.process",
//     data: { transactionId: "txn_1", userId: "user_123" }
//   },
//   {
//     name: "transaction.recurring.process",
//     data: { transactionId: "txn_2", userId: "user_456" }
//   }
// ]
// Important: These events are now queued in Inngest's event system, ready to be processed.

// Step 4: Process Function Receives Events
// Now, for each event sent above, Inngest triggers the processRecurringTransaction function:
// javascriptexport const processRecurringTransaction = inngest.createFunction(
//   {
//     id: "process-recurring-transaction",
//     name: "Process Recurring Transaction",
//     throttle: {
//       limit: 10,              // Process max 10 transactions
//       period: "1m",           // per minute
//       key: "event.data.userId", // per user
//     },
//   },
//   { event: "transaction.recurring.process" }, // 👂 Listens for this event
//   async ({ event, step }) => {
// Throttling explained:

// If you have 100 recurring transactions, they won't all process at once
// Max 10 per user per minute
// Prevents database overload

// Step 5: Validate Event Data
// javascript// Safety check: Make sure event has required data
// if (!event?.data?.transactionId || !event?.data?.userId) {
//   console.error("Invalid event data:", event);
//   return { error: "Missing required event data" };
// }

// Step 6: Fetch Full Transaction Details
// javascriptawait step.run("process-transaction", async () => {
//   const transaction = await db.transaction.findUnique({
//     where: {
//       id: event.data.transactionId,
//       userId: event.data.userId,
//     },
//     include: {
//       account: true, // Need account info to update balance
//     },
//   });
// Why fetch again?

// The event only contains transactionId and userId (minimal data)
// We need full transaction details (amount, type, category, etc.)
// Fresh data from database (in case anything changed)

// getMonthlyStats FULL EXPLANATION

// 📝 Line-by-Line Breakdown
// Line 1: Function Declaration
// javascriptasync function getMonthlyStats(userId, month) {

// async → Function returns a Promise (uses await inside)
// userId → String identifying the user (e.g., "user_123")
// month → JavaScript Date object representing any day in the target month

// Example: getMonthlyStats("user_123", new Date("2024-11-15"))

// Line 2: Calculate Start Date
// javascriptconst startDate = new Date(month.getFullYear(), month.getMonth(), 1);
// What it does: Creates a date for the first day of the month.
// Breakdown:

// month.getFullYear() → Extracts year (e.g., 2024)
// month.getMonth() → Extracts month index (0-11, so November = 10)
// 1 → Day of month (first day)

// Example:

// Input: new Date("2024-11-15")
// startDate → 2024-11-01 00:00:00

// Line 3: Calculate End Date
// javascriptconst endDate = new Date(month.getFullYear(), month.getMonth() + 1, 0);
// What it does: Creates a date for the last day of the month.
// Breakdown:

// month.getMonth() + 1 → Next month (November = 10, so this gives December = 11)
// 0 → Day 0 of next month = last day of current month (JavaScript quirk!)

// Example:

// Input: new Date("2024-11-15")
// month.getMonth() + 1 → 11 (December)
// new Date(2024, 11, 0) → November 30, 2024 (last day of November)
// endDate → 2024-11-30 00:00:00

// Lines 5-14: Fetch Transactions
// javascriptconst transactions = await db.transaction.findMany({
//   where: {
//     userId,
//     date: {
//       gte: startDate,  // Greater than or equal
//       lte: endDate,    // Less than or equal
//     },
//   },
// });
// What it does: Fetches all transactions for this user within the date range.
// Prisma Query Translation:
// sqlSELECT * FROM transactions
// WHERE userId = 'user_123'
//   AND date >= '2024-11-01'
//   AND date <= '2024-11-30'
// Example Result:
// javascripttransactions = [
//   { id: 1, type: "EXPENSE", amount: Decimal(50.00), category: "food", date: "2024-11-05" },
//   { id: 2, type: "INCOME", amount: Decimal(1000.00), category: "salary", date: "2024-11-10" },
//   { id: 3, type: "EXPENSE", amount: Decimal(30.00), category: "food", date: "2024-11-12" },
//   { id: 4, type: "EXPENSE", amount: Decimal(100.00), category: "shopping", date: "2024-11-20" }
// ]

// Lines 16-30: Calculate Statistics with reduce
// javascriptreturn transactions.reduce(
//   (stats, t) => {
//     const amount = t.amount.toNumber();
//     if (t.type === "EXPENSE") {
//       stats.totalExpenses += amount;
//       stats.byCategory[t.category] =
//         (stats.byCategory[t.category] || 0) + amount;
//     } else {
//       stats.totalIncome += amount;
//     }
//     return stats;
//   },
//   {
//     totalExpenses: 0,
//     totalIncome: 0,
//     byCategory: {},
//     transactionCount: transactions.length,
//   }
// );

// 🔄 Understanding reduce
// Syntax:
// javascriptarray.reduce(callback, initialValue)

// callback(accumulator, currentItem) → Runs for each item
// accumulator → Running total (starts as initialValue)
// currentItem → Current array element
// initialValue → Starting value

// Initial Value (Line 27-32)
// javascript{
//   totalExpenses: 0,
//   totalIncome: 0,
//   byCategory: {},
//   transactionCount: transactions.length,  // Set once at start
// }
// Starting state:
// javascriptstats = {
//   totalExpenses: 0,
//   totalIncome: 0,
//   byCategory: {},
//   transactionCount: 4  // We have 4 transactions
// }

// 🏃 Complete Dry Run
// Setup:
// javascripttransactions = [
//   { type: "EXPENSE", amount: Decimal(50.00), category: "food" },
//   { type: "INCOME", amount: Decimal(1000.00), category: "salary" },
//   { type: "EXPENSE", amount: Decimal(30.00), category: "food" },
//   { type: "EXPENSE", amount: Decimal(100.00), category: "shopping" }
// ]

// Iteration 1: Transaction #1
// javascriptt = { type: "EXPENSE", amount: Decimal(50.00), category: "food" }
// Line 18: const amount = t.amount.toNumber();

// amount = 50.00

// Line 19: if (t.type === "EXPENSE")

// true ✅

// Line 20: stats.totalExpenses += amount;

// stats.totalExpenses = 0 + 50.00 = 50.00

// Line 21-22: Update category
// javascriptstats.byCategory[t.category] = (stats.byCategory[t.category] || 0) + amount;

// stats.byCategory["food"] doesn't exist yet
// (undefined || 0) + 50.00 = 50.00
// stats.byCategory["food"] = 50.00

// Line 26: return stats;
// State after iteration 1:
// javascriptstats = {
//   totalExpenses: 50.00,
//   totalIncome: 0,
//   byCategory: { food: 50.00 },
//   transactionCount: 4
// }

// Iteration 2: Transaction #2
// javascriptt = { type: "INCOME", amount: Decimal(1000.00), category: "salary" }
// Line 18: amount = 1000.00
// Line 19: if (t.type === "EXPENSE")

// false ❌ → Skip to else

// Line 24: stats.totalIncome += amount;

// stats.totalIncome = 0 + 1000.00 = 1000.00

// State after iteration 2:
// javascriptstats = {
//   totalExpenses: 50.00,
//   totalIncome: 1000.00,
//   byCategory: { food: 50.00 },
//   transactionCount: 4
// }

// Iteration 3: Transaction #3
// javascriptt = { type: "EXPENSE", amount: Decimal(30.00), category: "food" }
// Line 18: amount = 30.00
// Line 19: if (t.type === "EXPENSE") → true ✅
// Line 20: stats.totalExpenses += amount;

// stats.totalExpenses = 50.00 + 30.00 = 80.00

// Line 21-22: Update category
// javascriptstats.byCategory["food"] = (stats.byCategory["food"] || 0) + amount;

// stats.byCategory["food"] already exists = 50.00
// (50.00 || 0) + 30.00 = 80.00
// stats.byCategory["food"] = 80.00

// State after iteration 3:
// javascriptstats = {
//   totalExpenses: 80.00,
//   totalIncome: 1000.00,
//   byCategory: { food: 80.00 },
//   transactionCount: 4
// }

// Iteration 4: Transaction #4
// javascriptt = { type: "EXPENSE", amount: Decimal(100.00), category: "shopping" }
// Line 18: amount = 100.00
// Line 19: if (t.type === "EXPENSE") → true ✅
// Line 20: stats.totalExpenses += amount;

// stats.totalExpenses = 80.00 + 100.00 = 180.00

// Line 21-22: Update category
// javascriptstats.byCategory["shopping"] = (stats.byCategory["shopping"] || 0) + amount;

// stats.byCategory["shopping"] doesn't exist yet
// (undefined || 0) + 100.00 = 100.00
// stats.byCategory["shopping"] = 100.00

// ✅ Final Result
// javascript{
//   totalExpenses: 180.00,
//   totalIncome: 1000.00,
//   byCategory: {
//     food: 80.00,
//     shopping: 100.00
//   },
//   transactionCount: 4
// }

// Generate Financial Insights
// Part 4: Complex Data Transformation
// javascript- Expense Categories: ${Object.entries(stats.byCategory)
//   .map(([category, amount]) => `${category}: $${amount}`)
//   .join(", ")}
// Let's break this down step-by-step!

// 🔍 Deep Dive: Category Formatting
// Input:
// javascriptstats.byCategory = {
//   food: 400,
//   housing: 600,
//   transportation: 200
// }

// Step 1: Object.entries()
// javascriptObject.entries(stats.byCategory)
// What it does: Converts object to array of [key, value] pairs.
// Output:
// javascript[
//   ["food", 400],
//   ["housing", 600],
//   ["transportation", 200]
// ]

// Step 2: .map()
// javascript.map(([category, amount]) => `${category}: $${amount}`)
// What it does: Transform each pair into a formatted string.
// Iteration breakdown:
// Iteration 1:
// javascript[category, amount] = ["food", 400]  // Destructuring
// return `food: $400`
// Iteration 2:
// javascript[category, amount] = ["housing", 600]
// return `housing: $600`
// Iteration 3:
// javascript[category, amount] = ["transportation", 200]
// return `transportation: $200`
// After .map() output:
// javascript[
//   "food: $400",
//   "housing: $600",
//   "transportation: $200"
// ]

// Step 3: .join(", ")
// javascript.join(", ")
// What it does: Combine array into single string with commas.
// Output:
// javascript"food: $400, housing: $600, transportation: $200"
// ```

// ---

// #### **Final Prompt Result**
// ```
// - Expense Categories: food: $400, housing: $600, transportation: $200

// Line 28: Parse JSON
// javascriptreturn JSON.parse(cleanedText);
// What it does: Convert JSON string to JavaScript array.
// Input (string):
// javascript"[\"Great savings!\", \"Housing is healthy\", \"Consider meal planning\"]"
// Output (array):
// javascript[
//   "Great savings!",
//   "Housing is healthy",
//   "Consider meal planning"
// ]
