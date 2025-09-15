import React from "react";
import CreateAccontDrawer from "@/components/create-account-drawer";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { getUserAccounts } from "@/actions/dashboard";
import AccountCard from "./_components/account-card";

async function DashboardPage() {
  const accounts = await getUserAccounts();
  //console.log(accounts);
  return (
    <div className="px-5">
      {/* Budget Progress  */}

      {/* Overview  */}

      {/* Accounts Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <CreateAccontDrawer>
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-dashed">
            <CardContent className="flex flex-col items-center justify-center text-muted-foreground h-full pt-5">
              <Plus className="h-10 w-10 mb-2" />
              <p className="text-sm font-medium">Add New Account</p>
            </CardContent>
          </Card>
        </CreateAccontDrawer>

        {accounts.length > 0 &&
          accounts?.map((account) => {
            return <AccountCard key={account.id} account={account} />;
          })}
          {/* Evaluation rules: if the left side (accounts.length > 0) is truthy, the expression evaluates to the right side; if the left side is falsy, the whole expression returns the left side (which React ignores when rendering).

In short: “only render the right side when the left side is true.”

accounts?.map((account) => { ... })

accounts?.map uses optional chaining: if accounts is null or undefined, .map won’t be called and the expression returns undefined.

.map(...) iterates over every account in the array and returns a new array of whatever the callback returns (here, React elements).

(account) => { return <AccountCard key={account.id} account={account} />; }

Arrow function callback for .map. For each account object it:

Creates an <AccountCard /> React element.

Passes the account object as a prop: account={account}.

Adds key={account.id} — very important: key is a React-only attribute used to uniquely identify list items for efficient re-rendering (reconciliation). Use a stable unique id (not the array index) when possible. */}
      </div>
    </div>
  );
}

export default DashboardPage;

{
  /* <Card>
<Card className="hover:shadow-md transition-shadow cursor-pointer border-dashed">


hover:shadow-md → adds a medium shadow only when hovering over the card.

transition-shadow → animates the shadow smoothly when hover starts/ends.

cursor-pointer → changes cursor to a pointer hand (looks clickable).

border-dashed → makes the card’s border dashed instead of solid.

👉 The card looks like a dashed box that reacts to hover.

🔹 <CardContent>
<CardContent className="flex flex-col items-center justify-center text-muted-foreground h-full pt-5">


flex → makes this a flexbox container.

flex-col → children are stacked vertically.

items-center → centers children horizontally.

justify-center → centers children vertically.

text-muted-foreground → uses a lighter text color from your theme (usually gray).

h-full → makes it take up the full height of the parent card.

pt-5 → adds padding-top = 1.25rem (20px).

👉 This centers the plus icon + text in the middle of the card. */
}
