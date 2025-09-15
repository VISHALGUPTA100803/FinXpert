"use server";
import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

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

export async function createAccount(data) {
  //console.log("📡 createAccount called with data:", data);
  try {
    // checking user is in db  or not then only create acount data
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
    //convert balance to float before saving
    const balanceFloat = parseFloat(data.balance);
    if (isNaN(balanceFloat)) {
      throw new Error("Invalid balance amount");
    }

    // check if this user's first account
    const existingAccounts = await db.account.findMany({
      where: { userId: user.id },
    });

    const shouldBeDefault =
      existingAccounts.length === 0 ? true : data.isDefault;

    // if this account should be default, unset other default accounts
    if (shouldBeDefault) {
      await db.account.updateMany({
        where: { userId: user.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    const account = await db.account.create({
      data: {
        ...data,
        balance: balanceFloat,
        userId: user.id,
        isDefault: shouldBeDefault,
      },
    });
    //console.log("🟡 Raw DB Account:", account);

    // next js does not support decimal value before returning account its balance should be again number
    const serializedAccount = serializeTransaction(account);
    //console.log("✅ DB Inserted Account:", serializedAccount);
    revalidatePath("/dashboard");

    return { success: true, data: serializedAccount };
  } catch (e) {
    throw new Error(e.message);
  }
}

//revalidatePath("/dashboard");
//Tells Next.js to revalidate (refresh) any cached server-rendered data for the /dashboard route so the dashboard will show fresh data

export async function getUserAccounts() {
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
  const accounts = await db.account.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          transactions: true,
        },
      },
    },
  });
  // console.log(accounts);

  const serializedAccount = accounts.map(serializeTransaction);
  return serializedAccount;
}

// account table balance
// transaction table amount

// include: {
//   _count: {
//     select: {
//       transactions: true,
//     },
//   },
// },
// comes from Prisma ORM (since you’re using db.account.findMany).

// 🔎 What it does:
// When you query account, Prisma lets you include extra related data.

// _count is a special Prisma field that gives you the number of related records.

// Here, you’re saying:
// 👉 "When fetching accounts, also include how many transactions each account has."
// include: { _count: { select: { transactions: true } } }
// adds a transaction count field into each account object returned by your query.

// That include: { _count: { select: { transactions: true }}} is just telling Prisma:
// “When you return each account, also attach a field showing how many transactions it has.”
