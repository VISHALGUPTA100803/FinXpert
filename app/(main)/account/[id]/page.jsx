import { getAccountWithTransactions } from "@/actions/accounts";
import { notFound } from "next/navigation";
import React, { Suspense } from "react";
import TransactionTable from "../_components/transaction-table";
import { BarLoader } from "react-spinners";
// account/[id] it means route of account/123 or any number [] used for dynamic
const AccountsPage = async ({ params }) => {
  const { id } = await params;
  const accountData = await getAccountWithTransactions(id);
  if (!accountData) {
    notFound();
  }
  const { transactions, ...account } = accountData;
  //   transactions → pulls out the transactions property.

  // ...account → the rest operator, collects everything else (all remaining key-value pairs) into a new object called account.
  return (
    <div className="space-y-8 px-5 ">
      <div className="flex gap-4 items-end justify-between">
        <div>
          <h1 className="text-5xl sm:text-6xl font-bold gradient gradient-title capitalize">
            {account.name}
          </h1>
          <p className="text-muted-foreground">
            {account.type.charAt(0) + account.type.slice(1).toLowerCase()}{" "}
            Account
          </p>
        </div>
        <div className="text-right pb-2">
          <div className="text-xl sm:text-2xl font-bold">
            ${parseFloat(account.balance).toFixed(2)}
          </div>
          <p className="text-sm text-muted-foreground">
            {account._count.transactions} Transactions{" "}
          </p>
        </div>
      </div>

      {/* Chart Section  */}

      {/* Transaction Table  */}
      <Suspense
        fallback={<BarLoader className="mt-4" width={"100%"} color="#9333ea" />}
      >
        <TransactionTable transactions={transactions} />
      </Suspense>
    </div>
  );
};

export default AccountsPage;

// When you define a server component page with dynamic routes (app/account/[id]/page.js), Next.js passes params as part of the context object.

// Behind the scenes:

// Next.js doesn’t just give you a plain object immediately.

// It’s wrapped in something that looks synchronous, but internally can be asynchronous (because the framework might need to fetch or resolve those params on the server).

// That’s why the docs sometimes say:

// You may need to await params before using it.

// So is params always async?

// In Pages Router (pages/) → params is always synchronous (plain object).

// In App Router (app/) with server components → params can be a Promise-like object, depending on context.

// Where params comes from

// In the App Router (app/ folder), when you define a dynamic segment in your folder name, e.g.:

// app/account/[id]/page.jsx

// The [id] part is a dynamic route segment.

// Whatever the user puts in the URL (/account/123) → Next.js captures it and puts it inside params.

// 2️⃣ Example

// If the user visits:

// /account/123

// Then in your page component:

// const AccountsPage = async ({ params }) => {
//   console.log(await params);
// };

// params will be:

// { id: "123" }

// 3️⃣ Multiple dynamic segments

// If your folder structure was:

// app/users/[userId]/accounts/[accountId]/page.jsx

// And the user visits:

// /users/42/accounts/abc123

// Then params will be:

// { userId: "42", accountId: "abc123" }

// 4️⃣ Catch-all routes

// If you define [...slug] (catch-all), e.g.:

// app/docs/[...slug]/page.jsx

// URL:

// /docs/nextjs/routing/dynamic

// Then params will be:

// { slug: ["nextjs", "routing", "dynamic"] }

// 5️⃣ Your case

// Your file is:

// app/account/[id]/page.jsx

// So for URL /account/789, params is:

// { id: "789" }

// And you’re doing:

// const { id } = await params;

// So now id = "789".
