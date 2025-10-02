"use client";

import { createTransaction } from "@/actions/transaction";
import { transactionSchema } from "@/app/lib/schema";
import useFetch from "@/hooks/use-fetch";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { use, useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import CreateAccontDrawer from "@/components/create-account-drawer";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Switch } from "@/components/ui/switch";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
const AddTransactionForm = ({ accounts, categories }) => {
  const {
    register,
    setValue,
    handleSubmit,
    formState: { errors },
    watch,
    getValues,
    reset,
  } = useForm({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: "EXPENSE",
      amount: "",
      description: "",
      accountId: accounts.find((ac) => ac.isDefault)?.id,
      date: new Date(),
      isRecurring: false,
    },
  });

  const {
    loading: transactionLoading,
    fn: transactionFn,
    data: transactionResult,
  } = useFetch(createTransaction);
  console.log("transaction result from db", transactionResult);
  const type = watch("type");
  const isRecurring = watch("isRecurring");
  const date = watch("date");

  const filteredCategories = categories.filter(
    (category) => category.type === type
  );

  const router = useRouter();

  const onSubmit = async (data) => {
    const formData = {
      ...data,
      amount: parseFloat(data.amount),
    };
    console.log("from data which is sent", formData);
    transactionFn(formData);
  };
  useEffect(() => {
    console.log('useEffect triggered:', { transactionResult, transactionLoading });
    if (transactionResult?.success && !transactionLoading) {
      toast.success("Transaction created successfully");
      reset();
      router.push(`/account/${transactionResult.data.accountId}`);
    }
  }, [transactionResult, transactionLoading]);
  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
      {/* AI Reciept Scanner */}
      <div className="space-y-2">
        <label className="text-sm font-medium"> Type</label>
        <Select
          onValueChange={(value) => setValue("type", value)}
          defaultValue={type}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="EXPENSE">Expense</SelectItem>
            <SelectItem value="INCOME">Income</SelectItem>
          </SelectContent>
        </Select>

        {errors.type && (
          <p className="text-sm text-red-500">{errors.type.message}</p>
        )}
      </div>
      {/* Amount and Account */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium"> Amount</label>
          <Input
            type="number"
            step="0.01"
            placeholder="0.00"
            {...register("amount")}
          />

          {errors.amount && (
            <p className="text-sm text-red-500">{errors.amount.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium"> Account</label>
          <Select
            onValueChange={(value) => setValue("accountId", value)}
            defaultValue={getValues("accountId")}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select Account" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.name} (${parseFloat(account.balance).toFixed(2)})
                </SelectItem>
              ))}
              <CreateAccontDrawer>
                <Button
                  variant="ghost"
                  className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                >
                  Create Account
                </Button>
              </CreateAccontDrawer>
            </SelectContent>
          </Select>

          {errors.accountId && (
            <p className="text-sm text-red-500">{errors.accountId.message}</p>
          )}
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium"> Category</label>
        <Select
          onValueChange={(value) => setValue("category", value)}
          defaultValue={getValues("category")}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select Category" />
          </SelectTrigger>
          <SelectContent>
            {filteredCategories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {errors.category && (
          <p className="text-sm text-red-500">{errors.category.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium"> Date</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full pl-3 text-left font-normal"
            >
              {date ? format(date, "PPP") : <span>Pick a date</span>}
              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent>
            <Calendar
              mode="single"
              selected={date}
              onSelect={(date) => setValue("date", date)}
              disabled={(date) =>
                date > new Date() || date < new Date("1900-01-01")
              }
              initialFocus
            />
          </PopoverContent>
        </Popover>

        {errors.date && (
          <p className="text-sm text-red-500">{errors.date.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium"> Description</label>
        <Input placeholder="Enter Description" {...register("description")} />

        {errors.description && (
          <p className="text-sm text-red-500">{errors.description.message}</p>
        )}
      </div>

      <div className="flex items-center justify-between rounded-lg border p-3">
        <div className="space-y-0.5">
          <label
            htmlFor="isDefault"
            className="text-sm font-medium cursor-pointer"
          >
            Recurring Transaction
          </label>
          <p className="text-sm text-muted-foreground">
            Set up a recurring schedule for this transaction
          </p>
        </div>
        <Switch
          checked={isRecurring}
          onCheckedChange={(checked) => setValue("isRecurring", checked)}
        />
      </div>
      {isRecurring && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Recurring Interval</label>
          <Select
            onValueChange={(value) => setValue("recurringInterval", value)}
            defaultValue={getValues("recurringInterval")}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select interval" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DAILY">Daily</SelectItem>
              <SelectItem value="WEEKLY">Weekly</SelectItem>
              <SelectItem value="MONTHLY">Monthly</SelectItem>
              <SelectItem value="YEARLY">Yearly</SelectItem>
            </SelectContent>
          </Select>
          {errors.recurringInterval && (
            <p className="text-sm text-red-500">
              {errors.recurringInterval.message}
            </p>
          )}
        </div>
      )}
      <div className="flex gap-4 w-full">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={() => router.back()} // it will go back to that page where it came from
        >
          Cancel
        </Button>
        <Button type="submit" disabled={transactionLoading} className="flex-1">
          Create Transaction
        </Button>
      </div>
    </form>
  );
};

export default AddTransactionForm;
// 1. register

// 👉 Connects your input fields to React Hook Form.
// It tells the form to "watch" this input’s value and apply validation rules.

// <input {...register("email", { required: "Email is required" })} />

// Now the form knows about "email".

// It will validate and include it in formData when submitting.

// 2. setValue

// 👉 Programmatically change a field’s value.
// Useful if you want to update a field without user typing.
// setValue("email", "vishal@gmail.com");
// Updates the "email" field in form state.

// You can also trigger validation with { shouldValidate: true }.

// 3. handleSubmit
// 👉 Function that handles form submission.
// It validates fields first, then runs your callback with form data.

// jsx
// Copy code
// <form onSubmit={handleSubmit((data) => console.log(data))}>
//   <input {...register("name")} />
//   <button type="submit">Submit</button>
// </form>
// If validation passes → data has all fields.

// If validation fails → errors gets filled.

// 4. formState: { errors }
// 👉 Holds all validation errors for the form.

// jsx
// Copy code
// {errors.email && <p>{errors.email.message}</p>}
// errors.email.message → the error message for "email".

// Comes directly from the validation rules in register.

// 5. watch
// 👉 Lets you "watch" values as the user types (real-time).

// js
// Copy code
// const amount = watch("amount");
// Now amount updates live when the user types.

// Good for conditional UI (like showing "remaining budget").

// 6. getValues
// 👉 Get current values of the form (all fields or specific ones).

// js
// Copy code
// console.log(getValues()); // { name: "Vishal", email: "vishal@gmail.com" }
// console.log(getValues("email")); // "vishal@gmail.com"
// Unlike watch, it won’t subscribe to changes — it just fetches once.

// 7. reset
// 👉 Reset form values back to default or given values.

// js
// Copy code
// reset(); // clears everything
// reset({ name: "Vishal", email: "vishal@gmail.com" }); // sets new defaults
// Useful after submitting a form → clear it or pre-fill it with new data.

// ⚡ In short:

// register → connect input

// setValue → update input value programmatically

// handleSubmit → validate + submit

// errors → show validation messages

// watch → live tracking

// getValues → snapshot of values

// reset → reset form

// ✅ formState properties

// errors

// All validation errors.

// formState.errors

// isDirty

// true if any field value was changed from its default.

// formState.isDirty // true if user typed something

// dirtyFields

// Tells you which specific fields were changed.

// formState.dirtyFields // { email: true }

// touchedFields

// Tracks which fields were touched (focused and blurred).

// formState.touchedFields // { password: true }

// isValid

// true if the form passes validation.

// formState.isValid

// isSubmitted

// true if the form has been submitted at least once.

// formState.isSubmitted

// isSubmitting

// true while the form is in the process of submitting (async).

// formState.isSubmitting

// isSubmitSuccessful

// true after a successful submit.

// formState.isSubmitSuccessful

// submitCount

// Number of times the form was submitted.

// formState.submitCount // e.g. 2

// isLoading (v7.55+)

// true while form is resetting or loading default values (async).

// formState.isLoading

{
  /* <Calendar
  mode="single"
  selected={date}
  onSelect={(date) => setValue("date", date)}
  disabled={(date) =>
    date > new Date() || date < new Date("1900-01-01")
  }
  initialFocus
/>
1. <Calendar ... />
This is the Calendar component from shadcn/ui.
Internally, it uses Radix UI + date-fns to render a calendar UI.
It’s highly customizable and works like a date picker.

2. mode="single"
Calendar supports multiple modes:

"single" → lets you pick one date only.

"multiple" → lets you select multiple dates.

"range" → lets you pick a date range (start & end).

Here you’re restricting the calendar to only one date.

3. selected={date}
This prop controls which date is currently selected.

date is probably coming from your state or form (useForm, useState, etc.).

Example: If date = new Date("2025-10-02"), that day will show as selected in the UI.

4. onSelect={(date) => setValue("date", date)}
Runs when the user clicks on a date.

date is the date they clicked.

You’re calling setValue("date", date) → this looks like React Hook Form’s setValue.

It updates the form field "date" with the chosen date.

So this connects the calendar with your form state.

5. disabled={(date) => ...}
This function determines which dates should be unselectable (disabled).

Here:

js
Copy code
date > new Date() || date < new Date("1900-01-01")
Meaning:

Disable all dates after today (no future dates allowed).

Disable all dates before 1 Jan 1900 (no unrealistically old dates).

So the user can only pick valid past dates from 1900 until today.

6. initialFocus
Ensures that when the calendar opens, the focus starts at today’s date.

Improves keyboard accessibility (so Tab/Arrow keys work naturally). */
}

{
  /* <PopoverTrigger asChild>
  <Button>Open Popover</Button>
</PopoverTrigger>
🔹 What is <PopoverTrigger>?
In Radix UI / shadcn, a Trigger is the element that opens or closes the popover.

By default, PopoverTrigger renders a <button> element around its children.

So normally:


<PopoverTrigger>
  Open
</PopoverTrigger>
would render something like:


<button>Open</button>
🔹 What does asChild do?
asChild tells the trigger to not render its own <button>.

Instead, it will use the child element you provide as the trigger.

So:

<PopoverTrigger asChild>
  <Button>Open Popover</Button>
</PopoverTrigger>
renders just:


<button class="your-button-classes">Open Popover</button>
where <Button> (shadcn’s Button component) itself acts as the clickable trigger.

🔹 Why is this useful?
Without asChild, you’d end up with nested buttons:

html
Copy code
<button>   <!-- PopoverTrigger -->
  <button class="btn">Open Popover</button>   <!-- Your Button -->
</button>
⚠️ That’s invalid HTML and breaks accessibility.

With asChild, you avoid that — the child takes over as the trigger element.

✅ Summary:

asChild = “Don’t wrap me, just use my child as the actual trigger.”

It lets you use your own button / icon / custom component as the popover trigger without extra nesting. */
}

// 2️⃣ How onSubmit gets data

// handleSubmit is a function provided by React Hook Form.

// When you call:

// <form onSubmit={handleSubmit(onSubmit)}>


// What happens under the hood:

// RHF intercepts the form submit event.

// It collects all form field values from the inputs you registered via register("fieldName") or Controller.

// It validates the form (if you have validation).

// If valid, it calls your onSubmit function, and automatically passes all collected form values as the data argument.

// 3️⃣ Why you don’t pass arguments manually

// Normally in HTML forms, you might do:

// <form onSubmit={(e) => onSubmit(e)}>


// You’d have to prevent default, collect values manually, etc.

// With RHF:

// onSubmit={handleSubmit(onSubmit)}


// RHF wraps your onSubmit in handleSubmit.

// It automatically extracts all field values and passes them as the first argument (data).

// So even though you didn’t explicitly write onSubmit(formValues), it happens automatically.

// ✅ Key takeaways

// handleSubmit is a wrapper that collects all form values.

// You don’t manually pass form data — handleSubmit does it for you.

// onSubmit(data) receives a plain object with all registered fields.
