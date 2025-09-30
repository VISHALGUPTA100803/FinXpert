import { sendEmail } from "@/actions/send-email";
import { db } from "../prisma";
import { inngest } from "./client";
import EmailTemplate from "@/emails/template";

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
// if the lastalertsent is of previous month then we should send the budget alert or if same month different year then also alert should be sent
function isNewMonth(lastAlertDate, currentDate) {
  return (
    lastAlertDate.getMonth() !== currentDate.getMonth() ||
    lastAlertDate.getFullYear() !== currentDate.getFullYear()
  );
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
