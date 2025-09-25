"use client";
import React, { useEffect, useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { categoryColors } from "@/data/categories";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  ChevronUp,
  Clock,
  MoreHorizontal,
  RefreshCcw,
  Search,
  Trash,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import useFetch from "@/hooks/use-fetch";
import { bulkDeleteTransaction } from "@/actions/accounts";
import { toast } from "sonner";
import { BarLoader } from "react-spinners";

const ITEMS_PER_PAGE = 10;

const RECURRING_INTERVALS = {
  DAILY: "Daily",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
  YEARLY: "Yearly",
};

const TransactionTable = ({ transactions }) => {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState([]);
  console.log(selectedIds);
  const [sortConfig, setSortConfig] = useState({
    field: "date",
    direction: "desc",
  });
  //console.log(selectedIds);

  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [recurringFilter, setRecurringFilter] = useState("");
  const [deletedIdsForToast, setDeletedIdsForToast] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);

  const filteredAndSortedTransactions = useMemo(() => {
    let result = [...transactions];

    // apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter((transaction) =>
        transaction.description?.toLowerCase().includes(searchLower)
      ); // If transaction.description exists (is not null or undefined), then call .toLowerCase().
    }

    // apply type filter
    if (typeFilter) {
      result = result.filter((transaction) => transaction.type === typeFilter);
    }
    // apply reccuring filter
    if (recurringFilter) {
      result = result.filter((transaction) => {
        if (recurringFilter === "recurring") return transaction.isRecurring;
        return !transaction.isRecurring;
      });
    }
    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortConfig.field) {
        case "date":
          comparison = new Date(a.date) - new Date(b.date);
          break;
        case "category":
          comparison = a.category.localeCompare(b.category);
          break;
        case "amount":
          comparison = a.amount - b.amount;
          break;
        default:
          comparison = 0;
      }
      return sortConfig.direction === "asc" ? comparison : -comparison;
    });
    return result;
  }, [transactions, searchTerm, typeFilter, recurringFilter, sortConfig]);

  // Pagination calculations
  const totalPages = Math.ceil(
    filteredAndSortedTransactions.length / ITEMS_PER_PAGE
  );
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAndSortedTransactions.slice(
      startIndex,
      startIndex + ITEMS_PER_PAGE
    );
  }, [filteredAndSortedTransactions, currentPage]);

  const handleSort = (field) => {
    setSortConfig((current) => ({
      field,
      direction:
        current.field == field && current.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleSelect = (id) => {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item != id)
        : [...current, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedIds((current) =>
      current.length === paginatedTransactions.length
        ? []
        : paginatedTransactions.map((t) => t.id)
    );
  };

  const {
    data: deleted,
    loading: deleteLoading,
    fn: deleteFn,
    error: deleteError,
  } = useFetch(bulkDeleteTransaction);
  // console.log(
  //   "deleted data coming from usefetch hook which used bullkdeletetransactions",
  //   deleted
  // );s
  const handleBulkDelete = async () => {
    if (
      !window.confirm(
        `Are you sure you want to delete ${selectedIds.length} transactions?`
      )
    ) {
      return;
    }
    setDeletedIdsForToast(selectedIds); // only for toast
    deleteFn(selectedIds);
  };

  useEffect(() => {
    if (!deleteLoading && deleted && deletedIdsForToast.length > 0) {
      toast.success(
        deletedIdsForToast.length === 1
          ? "Transaction deleted successfully"
          : `${deletedIdsForToast.length} transactions deleted successfully`
      );
      setDeletedIdsForToast([]); // reset after showing toast

      // Remove deleted IDs from selectedIds
      setSelectedIds((current) =>
        current.filter((id) => !deletedIdsForToast.includes(id))
      );
    }

    if (!deleteLoading && deleteError) {
      toast.error(deleteError.message || "Failed to delete transaction(s)");
    }
  }, [deleted, deleteLoading, deleteError, deletedIdsForToast]);

  const handleClearFilters = () => {
    setSearchTerm("");
    setTypeFilter("");
    setRecurringFilter("");
    setSelectedIds([]);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    setSelectedIds([]);
  };

  return (
    <div className="space-y-4">
      {/* Filters  */}

      {deleteLoading && (
        <BarLoader className="mt-4" width={"100%"} color="#9333ea" />
      )}

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select
          value={typeFilter}
          onValueChange={(value) => setTypeFilter(value)}
        >
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="INCOME">Income</SelectItem>
            <SelectItem value="EXPENSE">Expense</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={recurringFilter}
          onValueChange={(value) => setRecurringFilter(value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Transactions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recurring">Recurring Only</SelectItem>
            <SelectItem value="non-recurring">Non-recurring Only</SelectItem>
          </SelectContent>
        </Select>
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2">
            <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
              <Trash className="h-4 w-4 mr-2" />
              Delete Selected ({selectedIds.length})
            </Button>
          </div>
        )}
        {(searchTerm || typeFilter || recurringFilter) && (
          <Button
            variant="outline"
            size="icon"
            onClick={handleClearFilters}
            title="Clear Filters"
          >
            <X className="h-4 w-5" />
          </Button>
        )}
      </div>
      {/* Transactions */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  onCheckedChange={handleSelectAll}
                  checked={
                    selectedIds.length === paginatedTransactions.length
                      ? true
                      : selectedIds.length === 0
                      ? false
                      : "indeterminate"
                  }
                />
              </TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("date")}
              >
                <div className="flex items-center">
                  Date
                  {sortConfig.field === "date" &&
                    (sortConfig.direction === "asc" ? (
                      <ChevronUp className="ml-1 h-4 w-4" />
                    ) : (
                      <ChevronDown className="ml-1 h-4 w-4" />
                    ))}
                </div>
              </TableHead>
              <TableHead>Description</TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("category")}
              >
                <div className="flex items-center">
                  Category
                  {sortConfig.field === "category" &&
                    (sortConfig.direction === "asc" ? (
                      <ChevronUp className="ml-1 h-4 w-4" />
                    ) : (
                      <ChevronDown className="ml-1 h-4 w-4" />
                    ))}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("amount")}
              >
                <div className="flex items-center justify-end">
                  Amount
                  {sortConfig.field === "amount" &&
                    (sortConfig.direction === "asc" ? (
                      <ChevronUp className="ml-1 h-4 w-4" />
                    ) : (
                      <ChevronDown className="ml-1 h-4 w-4" />
                    ))}
                </div>
              </TableHead>
              <TableHead>Recurring</TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedTransactions === 0 ? (
              <TableRow>
                <TableCell
                  colspan={7}
                  className="text-center text-muted-foreground"
                >
                  No Transactions Found
                </TableCell>
              </TableRow>
            ) : (
              paginatedTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    <Checkbox
                      onCheckedChange={() => handleSelect(transaction.id)}
                      checked={selectedIds.includes(transaction.id)}
                    />
                  </TableCell>
                  <TableCell>
                    {format(new Date(transaction.date), "PP")}
                  </TableCell>
                  <TableCell>{transaction.description}</TableCell>
                  <TableCell className="capitalize">
                    <span
                      style={{
                        background: categoryColors[transaction.category],
                      }}
                      className="px-2 py-1 rounded text-white text-sm"
                    >
                      {transaction.category}
                    </span>
                  </TableCell>
                  <TableCell
                    className="text-right font-medium"
                    style={{
                      color: transaction.type === "EXPENSE" ? "red" : "green",
                    }}
                  >
                    {transaction.type === "EXPENSE" ? "-" : "+"}$
                    {transaction.amount.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    {transaction.isRecurring ? (
                      <Tooltip>
                        <TooltipTrigger>
                          <Badge
                            variant="secondary"
                            className="gap-1 bg-purple-100 text-purple-700 hover:bg-purple-200"
                          >
                            <RefreshCcw className="h-3 w-3" />
                            {RECURRING_INTERVALS[transaction.recurringInterval]}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent className="p-2 text-xs max-w-[200px] rounded-md shadow-md bg-gray-900 text-white">
                          <div className="font-medium">Next Date:</div>
                          <div>
                            {format(
                              new Date(transaction.nextRecurringDate),
                              "PP"
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <Badge variant="outline" className="gap-1">
                        <Clock className="h-3 w-3" /> One-time
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            router.push(
                              `/transaction/create?edit=${transaction.id}`
                            );
                          }}
                        >
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={async () => {
                            setDeletedIdsForToast([transaction.id]);
                            deleteFn([transaction.id]);
                          }}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default TransactionTable;

// In JSX, the first { ... } means:
// 👉 “I’m writing JavaScript, not plain text.”

// Inside that, React expects a JavaScript object for style.
// 👉 CSS in React is applied via an object ({ key: value }).

// So you end up with:

// style={{ background: "red" }}

// First { ... } → JSX expression

// Second { background: "red" } → the actual JS object with CSS properties

//{
/* <DropdownMenuTrigger asChild>
  <Button variant="ghost" className="h-8 w-8 p-0">
    <MoreHorizontal className="h-4 w-4" />
  </Button>
</DropdownMenuTrigger>
DropdownMenuTrigger passes its trigger behavior onto the Button.

The Button becomes the clickable trigger that opens the dropdown.

Without asChild, you’d get an extra wrapper element and potentially invalid markup.

👉 You only need asChild when you want your custom component (like Button, Link, or div) to be the trigger itself instead of wrapping it. */
//}

//u ser clicks on this header.

// That calls handleSort("amount").

// 2️⃣ handleSort runs
// const handleSort = (field) => {
//   setSortConfig((current) => ({
//     field,
//     direction:
//       current.field == field && current.direction === "asc" ? "desc" : "asc",
//   }));
// };

// If you click a new column, it sets:

// field = "amount"

// direction = "asc" (default first time).

// If you click the same column again:

// It toggles direction (asc → desc → asc …).

// 👉 Example:

// Before click: sortConfig = { field: "date", direction: "desc" }

// Click “Amount” → becomes { field: "amount", direction: "asc" }

// 3️⃣ Component re-renders

// Because sortConfig is state, React re-renders.
// Now useMemo runs again:

// const filteredAndSortedTransactions = useMemo(() => {
//   let result = [...transactions];
//   ...
//   // Apply sorting
//   result.sort((a, b) => { ... });
//   return result;
// }, [transactions, searchTerm, typeFilter, recurringFilter, sortConfig]);

// Since sortConfig changed, this whole block recalculates.

// Now we reach the .sort() part.

// 4️⃣ Inside result.sort

// Suppose transactions =

// [
//   { id: 1, date: "2025-09-20", amount: 50, category: "Food" },
//   { id: 2, date: "2025-09-21", amount: 20, category: "Bills" },
//   { id: 3, date: "2025-09-22", amount: 100, category: "Shopping" }
// ]

// And now:

// sortConfig = { field: "amount", direction: "asc" }

// Step-by-step sorting:
// Call 1: Compare (a=50, b=20)
// comparison = a.amount - b.amount;
// comparison = 50 - 20 = 30;

// Since direction = asc, return 30.
// 👉 Positive → means a (50) should go after b (20).

// Now order: [20, 50, 100].

// Call 2: Compare (a=50, b=100)
// comparison = 50 - 100 = -50;

// Return -50.
// 👉 Negative → a (50) stays before b (100).

// Order remains: [20, 50, 100].

// ✅ Final sorted array = [20, 50, 100].

// Perfect 👌 let’s dry run descending sort in detail.
// We’ll go step by step from the click to the final sorted array.

// 🟢 Setup

// Suppose we have these transactions:

// transactions = [
//   { id: 1, date: "2025-09-20", amount: 50, category: "Food" },
//   { id: 2, date: "2025-09-21", amount: 20, category: "Bills" },
//   { id: 3, date: "2025-09-22", amount: 100, category: "Shopping" }
// ]

// Current state before click:

// sortConfig = { field: "amount", direction: "asc" }

// 🟡 Step 1: User clicks “Amount” again

// That calls:

// handleSort("amount")

// Inside handleSort
// setSortConfig((current) => ({
//   field,
//   direction:
//     current.field == field && current.direction === "asc" ? "desc" : "asc",
// }));

// current = { field: "amount", direction: "asc" }

// field = "amount" (param from click)

// Check condition:

// current.field == field && current.direction === "asc"
// → "amount" == "amount" && "asc" === "asc"
// → true

// So new state:

// sortConfig = { field: "amount", direction: "desc" }

// 🟡 Step 2: React re-renders, useMemo runs
// result.sort((a, b) => { ... });

// 🟡 Step 3: Inside result.sort

// We now have:

// sortConfig = { field: "amount", direction: "desc" }

// First comparison: (a=50, b=20)
// comparison = a.amount - b.amount;
// comparison = 50 - 20 = 30;

// At the end:

// return sortConfig.direction === "asc" ? comparison : -comparison;

// Since direction = "desc", we negate:

// return -30;

// 👉 Negative means a comes before b in descending order.
// So 50 stays before 20.

// Second comparison: (a=20, b=100)
// comparison = 20 - 100 = -80;

// Negated:

// return 80;

// 👉 Positive means a comes after b.
// So 20 goes after 100.

// Third comparison: (a=50, b=100)
// comparison = 50 - 100 = -50;

// Negated:

// return 50;

// 👉 Positive → 50 goes after 100.

// 🟡 Step 4: Final order

// [100, 50, 20]

// ✅ Summary

// Asc order (first click): [20, 50, 100]

// Desc order (second click): [100, 50, 20]
