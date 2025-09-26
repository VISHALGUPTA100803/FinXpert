"use client";
import { endOfDay, startOfDay, subDays, format } from "date-fns";
import React, { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  Rectangle,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { object } from "zod";
const DATE_RANGES = {
  "7D": { label: "Last 7 Days", days: 7 },
  "1M": { label: "Last Month", days: 30 },
  "3M": { label: "Last 3 Months", days: 90 },
  "6M": { label: "Last 6 Months", days: 180 },
  ALL: { label: "All Time", days: null },
};
const AccountChart = ({ transactions }) => {
  const [dateRange, setDateRange] = useState("1M");
  const filteredData = useMemo(() => {
    const range = DATE_RANGES[dateRange];
    const now = new Date();
    const startDate = range.days
      ? startOfDay(subDays(now, range.days))
      : startOfDay(new Date(0));

    //Filter transaction within date range
    const filtered = transactions.filter(
      (t) => new Date(t.date) >= startDate && new Date(t.date) <= endOfDay(now)
    );

    const grouped = filtered.reduce((acc, transaction) => {
      const date = format(new Date(transaction.date), "MMM dd");
      if (!acc[date]) {
        acc[date] = { date, income: 0, expense: 0 };
      }
      if (transaction.type === "INCOME") {
        acc[date].income += transaction.amount;
      } else {
        acc[date].expense += transaction.amount;
      }

      return acc;
    }, {});

    // convert to array and sort by date
    return Object.values(grouped).sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );
  }, [transactions, dateRange]);
  //console.log("filtereddata", filteredData);
  const totals = useMemo(() => {
    return filteredData.reduce(
      (acc, day) => ({
        income: acc.income + day.income,
        expense: acc.expense + day.expense,
      }),
      { income: 0, expense: 0 }
    );
  }, [filteredData]);
  //console.log("toatalsdata", totals);
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
        <CardTitle className="text-base font-normal">
          Transaction Overview
        </CardTitle>
        <Select defaultValue={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Select Range" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(DATE_RANGES).map(([key, { label }]) => {
              return (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="flex justify-around mb-6 text-sm">
          <div className="text-center">
            <p className="text-muted-foreground">Total Income</p>
            <p className="text-lg font-bold text-green-500">
              ${totals.income.toFixed(2)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-muted-foreground">Total Expenses</p>
            <p className="text-lg font-bold text-red-500">
              ${totals.expense.toFixed(2)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-muted-foreground">Net</p>
            <p
              className={`text-lg font-bold ${
                totals.income - totals.expense >= 0
                  ? "text-green-500"
                  : "text-red-500"
              }`}
            >
              ${(totals.income - totals.expense).toFixed(2)}
            </p>
          </div>
        </div>

        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={filteredData}
              margin={{
                top: 10,
                right: 10,
                left: 10,
                bottom: 0,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" />
              <YAxis
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip
                formatter={(value) => [`$${value}`, undefined]}
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
              />
              <Legend />
              <Bar
                dataKey="income"
                name="Income"
                fill="#22c55e"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="expense"
                name="Expense"
                fill="#ef4444"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default AccountChart;

// Example transactions
// Example Data (again)
// const transactions = [
//   { date: "2025-09-01", type: "INCOME", amount: 100 },
//   { date: "2025-09-01", type: "EXPENSE", amount: 50 },
//   { date: "2025-09-03", type: "INCOME", amount: 200 },
//   { date: "2025-09-10", type: "EXPENSE", amount: 80 },
//   { date: "2025-09-12", type: "INCOME", amount: 150 },
//   { date: "2025-08-15", type: "EXPENSE", amount: 40 }
// ];

// Assume today is 2025-09-12.

// 🔎 Dry Run (line by line)
// Line 1
// const DATE_RANGES = { ... };

// Creates an object DATE_RANGES with keys "7D", "1M", "3M", "6M", "ALL".

// Each key maps to { label, days }.

// Nothing is executed yet, just definition.

// Line 2
// const AccountChart = ({ transactions }) => {

// Defines a React functional component AccountChart.

// Takes transactions as prop.

// Execution begins when component renders.

// Line 3
// const [dateRange, setDateRange] = useState("1M");

// React state created.

// dateRange = "1M" (initial value).

// setDateRange is a function to change it later.

// Line 4
// const filteredData = useMemo(() => {

// Declares filteredData.

// React will memoize the returned value of this function.

// It only re-runs when transactions or dateRange changes.

// Line 5
// const range = DATE_RANGES[dateRange];

// dateRange = "1M".

// Looks up DATE_RANGES["1M"].

// range = { label: "Last Month", days: 30 }.

// Line 6
// const now = new Date();

// Creates a Date object for current time.

// now = Fri Sep 12 2025 22:19:46 GMT+0530.

// Line 7
// const startDate = range.days
//   ? startOfDay(subDays(now, range.days))
//   : startOfDay(new Date(0));

// range.days = 30 (truthy).

// Executes subDays(now, 30) → subtracts 30 days → Aug 13, 2025 22:19:46.

// Wraps with startOfDay(...) → resets to Aug 13, 2025 00:00:00.

// startDate = Aug 13 2025 00:00:00.

// Line 8
// const filtered = transactions.filter(
//   (t) => new Date(t.date) >= startDate && new Date(t.date) <= endOfDay(now)
// );

// Iterates each transaction:

// "2025-09-01" → Sep 01 >= Aug 13 ✅ and <= Sep 12 ✅ → keep.

// "2025-09-01" → same → keep.

// "2025-09-03" → between → keep.

// "2025-09-10" → between → keep.

// "2025-09-12" → between → keep.

// "2025-08-15" → not >= Aug 13 ❌ → discard.

// filtered = [5 transactions].

// Line 9
// const grouped = filtered.reduce((acc, transaction) => {

// Starts reducing filtered.

// Initial acc = {} (empty object).

// Inside reduce
// First transaction
// const date = format(new Date("2025-09-01"), "MMM dd");
// // "Sep 01"

// acc["Sep 01"] doesn’t exist → create:
// { date:"Sep 01", income:0, expense:0 }.

// Transaction type = INCOME → add 100.

// acc = { "Sep 01": {date:"Sep 01", income:100, expense:0} }.

// Second transaction (2025-09-01 EXPENSE 50)

// date = "Sep 01".

// acc["Sep 01"] exists.

// Transaction type = EXPENSE → add 50.

// acc = { "Sep 01": {date:"Sep 01", income:100, expense:50} }.

// Third transaction (2025-09-03 INCOME 200)

// date = "Sep 03".

// Doesn’t exist → create {date:"Sep 03", income:0, expense:0}.

// Add 200 income.

// acc["Sep 03"] = {date:"Sep 03", income:200, expense:0}.

// Fourth transaction (2025-09-10 EXPENSE 80)

// date = "Sep 10".

// Doesn’t exist → create {date:"Sep 10", income:0, expense:0}.

// Add 80 expense.

// acc["Sep 10"] = {date:"Sep 10", income:0, expense:80}.

// Fifth transaction (2025-09-12 INCOME 150)

// date = "Sep 12".

// Doesn’t exist → create {date:"Sep 12", income:0, expense:0}.

// Add 150 income.

// acc["Sep 12"] = {date:"Sep 12", income:150, expense:0}.

// 👉 After reduce, grouped =:

// {
//   "Sep 01": {date:"Sep 01", income:100, expense:50},
//   "Sep 03": {date:"Sep 03", income:200, expense:0},
//   "Sep 10": {date:"Sep 10", income:0, expense:80},
//   "Sep 12": {date:"Sep 12", income:150, expense:0}
// }
// The code again:
// const totals = useMemo(() => {
//   return filteredData.reduce(
//     (acc, day) => ({
//       income: acc.income + day.income,
//       expense: acc.expense + day.expense,
//     }),
//     { income: 0, expense: 0 }
//   );
// }, [filteredData]);

// Step 1: Understanding reduce

// The signature of reduce is:

// array.reduce((accumulator, currentValue) => newAccumulator, initialValue)

// accumulator (acc) → keeps track of the result as you iterate

// currentValue (day) → the current element in the array

// initialValue → { income: 0, expense: 0 }

// Important:

// On each iteration, whatever you return from the callback becomes the new accumulator for the next iteration.

// After the last iteration, reduce returns the final accumulator.

// Step 2: Iteration flow (with example)

// filteredData:

// [
//   { date:"Sep 01", income:100, expense:50 },
//   { date:"Sep 03", income:200, expense:0 },
//   { date:"Sep 10", income:0, expense:80 }
// ]

// Initial acc = { income:0, expense:0 }

// Iteration 1:
// day = { date:"Sep 01", income:100, expense:50 }

// return { income: 0+100, expense: 0+50 }
// // → { income:100, expense:50 } becomes new acc

// Iteration 2:
// day = { date:"Sep 03", income:200, expense:0 }

// return { income: 100+200, expense: 50+0 }
// // → { income:300, expense:50 } becomes new acc

// Iteration 3:
// day = { date:"Sep 10", income:0, expense:80 }

// return { income: 300+0, expense:50+80 }
// // → { income:300, expense:130 } becomes new acc

// Step 3: What reduce returns

// After the last iteration, reduce automatically returns the final accumulator.

// That final object is what useMemo returns.

// So:

// totals = { income: 300, expense: 130 }

// ✅ Key Concept

// totals does not “equal” acc directly during iterations.

// Instead, totals = the final value returned by reduce, which is the final acc after the last iteration.

// acc is just a temporary variable inside reduce during each iteration.

// 👉 grouped object becomes:

// {
//   "Sep 01": { date:"Sep 01", income:100, expense:50 },
//   "Sep 03": { date:"Sep 03", income:200, expense:0 },
//   "Sep 10": { date:"Sep 10", income:0, expense:80 },
//   "Sep 12": { date:"Sep 12", income:150, expense:0 }
// }

// 4. Convert grouped to array & sort
// Object.values(grouped).sort((a, b) => new Date(a.date) - new Date(b.date))

// Object.values(grouped) →

// [
//   { date:"Sep 01", income:100, expense:50 },
//   { date:"Sep 03", income:200, expense:0 },
//   { date:"Sep 10", income:0, expense:80 },
//   { date:"Sep 12", income:150, expense:0 }
// ]

// Sort by date → stays in order (Sep 01 → Sep 12).

// 👉 filteredData = same as above.

// startOfDay(new Date(0));
// This is usually code from date-fns library (a popular date utility in JavaScript).

// 1. new Date(0)
// In JavaScript, new Date(0) creates a date object set to the Unix epoch start:

// sql
// Copy code
// Thu Jan 01 1970 05:30:00 GMT+0530 (India Standard Time)
// (The exact output depends on your system’s timezone — in UTC it’s 1970-01-01T00:00:00.000Z).

// 2. startOfDay(date)
// From date-fns, startOfDay() takes a date and returns a new date object set to midnight (00:00:00.000) of that date in the same timezone.

// It basically strips off the time part and resets it to the beginning of that calendar day.

// 3. Applying it together
// js
// Copy code
// startOfDay(new Date(0));
// First new Date(0) = epoch time (Jan 1, 1970, 05:30 IST).

// Then startOfDay() resets the time part to 00:00:00.000.

// ✅ Final result in IST (India time):

// sql
// Copy code
// Thu Jan 01 1970 00:00:00 GMT+0530 (India Standard Time)
// ✅ Final result in UTC:

// makefile
// Copy code
// 1969-12-31T18:30:00.000Z
// 👉 In short:
// startOfDay(new Date(0)) gives you the very beginning of Jan 1, 1970 (midnight), adjusted to your system’s local timezone.

// Step 1: Object.entries(DATE_RANGES)

// This converts the object into an array of key-value pairs:

// [
//   ["1M", { label: "Last 1 Month" }],
//   ["3M", { label: "Last 3 Months" }],
//   ["6M", { label: "Last 6 Months" }],
//   ["1Y", { label: "Last 1 Year" }]
// ]

// So now you can .map() over it like an array.

// 🔹 Step 2: .map(([key, { label }]) => {...})

// Each element is a 2-item array: [key, value]

// key will be "1M", "3M", etc.

// { label } destructures the object so you directly get "Last 1 Month", "Last 3 Months", etc.

// So, inside the loop:

// 1st iteration → key = "1M", label = "Last 1 Month"
// 2nd iteration → key = "3M", label = "Last 3 Months"
// 3rd iteration → key = "6M", label = "Last 6 Months"
// 4th iteration → key = "1Y", label = "Last 1 Year"

// 🔹 Step 3: Returning <SelectItem>

// For each, it creates:

// <SelectItem key="1M" value="1M">Last 1 Month</SelectItem>
// <SelectItem key="3M" value="3M">Last 3 Months</SelectItem>
// <SelectItem key="6M" value="6M">Last 6 Months</SelectItem>
// <SelectItem key="1Y" value="1Y">Last 1 Year</SelectItem>

// 🔹 Step 4: Final Rendered Dropdown

// Your Select will look like:

// Last 1 Month

// Last 3 Months

// Last 6 Months

// Last 1 Year

// When a user selects one, onValueChange={setDateRange} updates your state (dateRange) with "1M", "3M", etc.
