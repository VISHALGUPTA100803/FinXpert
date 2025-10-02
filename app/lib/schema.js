// schema for account form

import z from "zod";

export const accountSchema = z.object({
  name: z.string().min(1, "Name is Required"), // If empty, it will throw an error: "Name is Required".
  type: z.enum(["CURRENT", "SAVINGS"]),
  balance: z.string().min(1, "Initial balance is required"),
  isDefault: z.boolean().default(false),
});

export const transactionSchema = z
  .object({
    type: z.enum(["INCOME", "EXPENSE"]),
    amount: z.string().min(1, "Amount is required"),
    description: z.string().optional(),
    date: z.date({ required_error: "Date is required" }),
    accountId: z.string().min(1, "Account is required"),
    category: z.string().min(1, "Category is required"),
    isRecurring: z.boolean().default(false),
    recurringInterval: z
      .enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"])
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.isRecurring && !data.recurringInterval) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Recurring interval is required for recurring transactions",
        path: ["recurringInterval"],
      });
    }
  });

//   Schema

// You already have the base transactionSchema with fields like type, amount, date, accountId, etc.
// Now .superRefine adds custom validation logic after Zod does its normal checks.

// .superRefine((data, ctx) => { ... })

// data → the parsed object (values after Zod runs basic checks).

// ctx → context object you can use to add validation errors (ctx.addIssue).
// Case 2: Recurring but missing interval
// isRecurring = true and !data.recurringInterval = true → condition passes.

// ctx.addIssue(...) runs.

// Error: "Recurring interval is required for recurring transactions" at path ["recurringInterval"]. ❌ Invalid.

// Why use .superRefine here?

// Because Zod by itself cannot say “if A is true, then B must also exist.”
// That’s a cross-field validation rule, and .superRefine is designed exactly for that.