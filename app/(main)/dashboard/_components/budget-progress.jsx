"use client";
import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import useFetch from "@/hooks/use-fetch";
import { updateBudgetAmount } from "@/actions/budget";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
const BudgetProgress = ({ initialBudget, currentExpenses }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newBudget, setNewBudget] = useState(
    initialBudget?.amount?.toString() || ""
  );

  const percentUsed = initialBudget
    ? (currentExpenses / initialBudget.amount) * 100
    : 0;
  const {
    data: updatedBudget,
    loading: isLoading,
    fn: updateBudgetFn,
    error,
  } = useFetch(updateBudgetAmount);
  const handleUpdateBudget = async () => {
    const amount = parseFloat(newBudget);

    if (isNaN(amount) || amount < 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    await updateBudgetFn(amount);
  };

  useEffect(() => {
    if (updatedBudget?.success) {
      setIsEditing(false);
      toast.success("Budget updated successfully");
    }
  }, [updatedBudget]);
  useEffect(() => {
    if (error) {
      toast.error(error.message || "Failed to update budget");
    }
  }, [error]);
  const handleCancel = () => {
    setNewBudget(initialBudget?.amount?.toString() || "");
    setIsEditing(false);
  };
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex-1">
          <CardTitle>Monthly Budget (Default Account)</CardTitle>
          <div className="flex items-center gap-2 mt-1">
            {isEditing ? (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={newBudget}
                  onChange={(e) => setNewBudget(e.target.value)}
                  className="w-32"
                  placeholder="Enter amount"
                  autoFocus
                  disabled={isLoading}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleUpdateBudget}
                  disabled={isLoading}
                >
                  <Check className="h-4 w-4 text-green-500" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCancel}
                  disabled={isLoading}
                >
                  <X className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            ) : (
              <>
                <CardDescription>
                  {initialBudget
                    ? `$${currentExpenses.toFixed(
                        2
                      )} of $${initialBudget.amount.toFixed(2)} spent`
                    : "No Budget Set"}
                </CardDescription>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsEditing(true)}
                  className="h-6 w-6"
                >
                  <Pencil className="h-3 w-3" />
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {initialBudget && (
          <div className="space-y-2">
            <Progress
              value={percentUsed}
              extraStyles={`${
                // add to Progress component
                percentUsed >= 90
                  ? "bg-red-500"
                  : percentUsed >= 75
                  ? "bg-yellow-500"
                  : "bg-green-500"
              }`}
            />
            <p className="text-xs text-muted-foreground text-right">
              {percentUsed.toFixed(1)}% used
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BudgetProgress;

// const double = (x) => x * 2;
// // equivalent to
// function double(x) { return x * 2; }
// . What it is
// <>
//   <div>Hello</div>
//   <div>World</div>
// </>

// <> and </> are called React Fragments.

// They let you group multiple JSX elements together without adding an extra DOM element.

// 2. Why we need it

// In React, JSX must return a single parent element:

// ❌ This will throw an error:

// return (
//   <div>Hello</div>
//   <div>World</div>
// );

// ✅ Correct using a fragment:

// return (
//   <>
//     <div>Hello</div>
//     <div>World</div>
//   </>
// );

// React treats the fragment as invisible → no extra <div> in the HTML.
