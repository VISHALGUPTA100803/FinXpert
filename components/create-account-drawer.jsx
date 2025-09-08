"use client";
import React, { useState } from "react";
// react-hook form manage forms
// zod is validation for the form
// hook form resolver connects react-hook and zod
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { accountSchema } from "@/app/lib/schema";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "./ui/switch";
import { Button } from "./ui/button";
const CreateAccontDrawer = ({ children }) => {
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: "",
      type: "CURRENT",
      balance: "",
      isDefault: false,
    },
  });

  const onSubmit = async (data) => {
    console.log(data);
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      {/* children lets you decide what element should be clickable to open the drawer (like the Card). */}
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Create New Account</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-4">
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Account Name
              </label>
              <Input
                id="name"
                placeholder="Account Name"
                {...register("name")}
              ></Input>
              {errors.name && (
                <p className="test-sm text-red-500">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="type" className="text-sm font-medium">
                Account Type
              </label>
              <Select
                onValueChange={(value) => setValue("type", value)}
                defaultValue={watch("type")}
              >
                <SelectTrigger className="type">
                  <SelectValue placeholder="Select Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CURRENT">Current</SelectItem>
                  <SelectItem value="SAVINGS">Savings</SelectItem>
                </SelectContent>
              </Select>
              {errors.type && (
                <p className="test-sm text-red-500">{errors.type.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="balance" className="text-sm font-medium">
                Initial Balance
              </label>
              <Input
                id="balance"
                type="number"
                step="0.01"
                // What does step mean?

                // The step attribute defines the smallest interval a user can increase or decrease the number by.

                // step="1" → only whole numbers (1, 2, 3, …).

                // step="0.01" → allows decimals with 2 digits (0.01, 1.23, 50.99, …).

                // step="any" → allows any number (including fractions like 0.3333).
                placeholder="0.00"
                {...register("balance")}
              ></Input>
              {errors.balance && (
                <p className="test-sm text-red-500">{errors.balance.message}</p>
              )}
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <label
                  htmlFor="isDefault"
                  className="text-sm font-medium cursor-pointer"
                >
                  Set as Default
                </label>
                <p className="text-sm text-muted-foreground">
                  This account will be selected by default for transactions
                </p>
              </div>
              <Switch
                id="isDefault"
                onCheckedChange={(checked) => setValue("isDefault", checked)}
                checked={watch("isDefault")}
              />
              {/* onCheckedChange onCheckedChange={(checked) => setValue("isDefault", checked)}
                  onCheckedChange is fired whenever the switch is toggled.
                  checked is a boolean (true if switched on, false if off).
                  setValue("isDefault", checked) updates React Hook Form’s state for the field isDefault.
                  Example:
                  If you turn the switch on, isDefault = true.
                  If you turn it off, isDefault = false.
                  🔹 3. checked={watch("isDefault")}
                  watch("isDefault") reads the current value of isDefault from the form state.
                  Passing it to checked means the Switch stays in sync with the form value.
                  So if the form’s defaultValues said:
                  isDefault: false
                  the switch starts off. If validation or code updates it to true, the switch moves on automatically. */}
            </div>
            <div className="flex gap-4 pt-4">
              <DrawerClose asChild>
                <Button type="button" variant="outline" className="flex-1">
                  Cancel
                </Button>
              </DrawerClose>
              <Button type="submit" className="flex-1">
                Create Account
              </Button>
            </div>
          </form>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default CreateAccontDrawer;

//   1. useForm()

// useForm is a React Hook from react-hook-form.

// It manages the form state, validation, and submission.

// 2. resolver: zodResolver(accountSchema)

// Connects your Zod schema (accountSchema) to the form.

// This means form validation will follow the rules you defined earlier:

// name must not be empty

// type must be "CURRENT" or "SAVINGS"

// balance must not be empty

// isDefault must be boolean (defaults to false)

// If user input doesn’t match, errors will be generated.

// 3. defaultValues

// Sets the initial values for form fields.

// Example: when form loads, type is "CURRENT", isDefault is false.

//Destructured Methods

// register
// → Connects an input field to the form state & validation.
// Example:

// <input {...register("name")} />

// handleSubmit
// → Handles form submission. It automatically validates against accountSchema before calling your function.
// Example:

// <form onSubmit={handleSubmit(onSubmit)}>...</form>

// formState: { errors }
// → Contains validation errors.
// Example:

// {errors.name && <p>{errors.name.message}</p>}

// setValue
// → Manually set a field’s value.
// Example:

// setValue("balance", "5000");

// watch
// → Watch live values of form fields.
// Example:

// const balance = watch("balance");

// reset
// → Reset the whole form back to defaultValues or custom values.

// In your CreateAccontDrawer component:

// const CreateAccontDrawer = ({ children }) => {
//   ...
//   return (
//     <Drawer open={open} onOpenChange={setOpen}>
//       <DrawerTrigger>{children}</DrawerTrigger>
//       ...
//     </Drawer>
//   )
// }

// CreateAccontDrawer is a wrapper.

// It accepts a prop called children

// 👉 Everything inside <CreateAccontDrawer> ... </CreateAccontDrawer> (the <Card> in this case) becomes the children prop.

// label htmlFor="name">Account Name</label>
// Creates a label for the input.

// htmlFor="name" links the label to the input with id="name".

// This improves accessibility (when you click the label, it focuses the input).

// jsx
// Copy code
// <Input
//   id="name"
//   placeholder="Account Name"
//   {...register("name")}
// />
// This is the actual input field (probably a styled component, like from shadcn/ui).

// id="name" → links it with the label.

// placeholder="Account Name" → shows hint text when field is empty

// {...register("name")} is the magic glue between your <Input /> field and React Hook Form.
// Let’s unpack it carefully 👇

// 1. What register("name") does

// When you call:

// register("name")

// React Hook Form returns an object of props that your input needs.
// Something like:

// {
//   name: "name",
//   onChange: ƒ,   // updates form state when typing
//   onBlur: ƒ,     // triggers validation when leaving field
//   ref: ƒ         // gives RHF access to the input DOM node
// }

// So, register("name") is telling React Hook Form:

// “Track the field with the key name in the form state.”

// 2. What {...register("name")} does

// The ... is the spread operator.
// It takes that object and spreads all its props into your <Input />.

// So this:

// <Input {...register("name")} />

// is equivalent to writing:

// <Input
//   name="name"
//   onChange={/* provided by RHF */}
//   onBlur={/* provided by RHF */}
//   ref={/* provided by RHF */}
// />

// 3. Why this is needed

// Without register, the form won’t know about this field.

// With register, React Hook Form:

// Tracks the value (e.g., "My Savings Account")

// Runs validation using your Zod schema

// Reports errors in formState.errors

// Resets it when you call reset()

// 4. Example in action

// If schema says name is required, and the user leaves it blank:

// onBlur triggers → RHF checks accountSchema

// Validation fails → errors.name.message = "Name is Required"

// Your JSX shows the error:

// {errors.name && <p>{errors.name.message}</p>}

// ✅ In short:
// {...register("name")} auto-wires your input field into the form state, event handling, and validation — so you don’t need to manually write onChange, value, onBlur, etc.

// <DrawerTrigger asChild>{children}</DrawerTrigger>

// That asChild prop comes from Radix UI (and Shadcn is built on top of it).

// 🔎 What happens normally

// If you use:

// <DrawerTrigger>Open</DrawerTrigger>

// Radix will render a <button> element by default under the hood, so the DOM will look like:

// <button data-radix-collection-item>Open</button>

// 🔎 What asChild does

// When you add asChild, Radix does not render its own <button>.
// Instead, it expects you to provide a component/element, and it will just attach the trigger behavior to that element.

// Example:

// <DrawerTrigger asChild>
//   <span>Open Drawer</span>
// </DrawerTrigger>

// DOM result:

// <span data-radix-collection-item>Open Drawer</span>

// Here, the <span> becomes the clickable trigger.

// ✅ Why this is useful

// You can use your own components (like <Button> from Shadcn UI, or a custom styled div).

// Prevents extra DOM nesting (no extra button inside your button).

// Lets you preserve your styling/semantics (maybe you want a div, a, or custom Button component instead of a button).

// Validation + Errors

// Because the form state’s type is now updated, when you submit, Zod validates it against:

// type: z.enum(["CURRENT", "SAVINGS"])

// If you didn’t pick anything (and left it empty), Zod would throw an error.

// That error shows up as:

// {errors.type && <p>{errors.type.message}</p>}

// type="button" → Just a clickable button, does not submit the form.

// type="reset" → Resets the form fields.

// type="submit" → When clicked, it submits the form that this button belongs to.

// So in your case:

// <Button type="submit" className="flex-1">
//   Create Account
// </Button>

// 👉 This button will submit the nearest parent <form> in the DOM.
// It doesn’t need any extra onClick handler unless you want custom behavior, because the <form> itself usually has an onSubmit function.

// For example:

// <form onSubmit={handleSubmit(onSubmit)}>
//   <Input id="balance" {...register("balance")} />

//   <Button type="submit">Create Account</Button>
// </form>

// Here’s the flow:

// User clicks Create Account.

// Since it’s type="submit", the form’s onSubmit handler (handleSubmit(onSubmit)) is triggered.

// That handler validates data and calls your onSubmit function.

// ⚡ Without the <form> wrapper, type="submit" doesn’t really do anything — so yes, the button must be inside a <form> for it to work correctly.
