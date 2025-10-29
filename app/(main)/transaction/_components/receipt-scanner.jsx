"use client";
import { scanReceipt } from "@/actions/transaction";
import useFetch from "@/hooks/use-fetch";
import React, { useEffect, useRef } from "react";
import { Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const ReceiptScanner = ({ onScanComplete }) => {
  const fileInputRef = useRef(null);

  const {
    loading: scanReceiptLoading,
    fn: scanReceiptfn,
    data: scannedData,
  } = useFetch(scanReceipt);

  const handleReceiptScan = async (file) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size should be less than 5MB");
      return;
    }

    await scanReceiptfn(file);
  };

  useEffect(() => {
    if (scannedData && !scanReceiptLoading) {
      onScanComplete(scannedData);
      toast.success("Receipt scanned successfully");
    }
  }, [scannedData, scanReceiptLoading]);

  return (
    <div className="flex items-center gap-4">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        capture="environment"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleReceiptScan(file);
        }}
      />
      <Button  
        type="button"
        variant="outline"
        className="w-full h-10 bg-gradient-to-br from-orange-500 via-pink-500 to-purple-500 animate-gradient hover:opacity-90 transition-opacity text-white hover:text-white"
        onClick={() => fileInputRef.current?.click()}
        disabled={scanReceiptLoading}
      >
        {scanReceiptLoading ? (
          <>
            <Loader2 className="mr-2 animate-spin" />
            <span>Scanning Receipt...</span>
          </>
        ) : (
          <>
            <Camera className="mr-2" />
            <span>Scan Receipt with AI</span>
          </>
        )}
      </Button>
    </div>
  );
};

export default ReceiptScanner;


// 🧩 Code setup

// You have something like this:

// <ReceiptScanner onScanComplete={handleScanComplete} />


// and inside ReceiptScanner, somewhere you call:

// onScanComplete(scannedData);

// 🧠 What’s happening conceptually

// This is React props passing + callback function in action.

// You’re passing a function (handleScanComplete) as a prop to a child component (ReceiptScanner).
// Then the child calls that function whenever it finishes scanning.

// 🧾 Step-by-step dry run
// 1️⃣ Parent defines a function
// function handleScanComplete(scannedData) {
//   console.log("Scan completed:", scannedData);
// }


// This is a normal function that expects one argument — scannedData.

// 2️⃣ Parent passes it to child
// <ReceiptScanner onScanComplete={handleScanComplete} />


// Now ReceiptScanner receives this as a prop:

// props.onScanComplete === handleScanComplete


// So they both point to the same function in memory.

// 3️⃣ Inside child (ReceiptScanner)

// Imagine the scanner extracts some data:

// const scannedData = {
//   amount: 22.11,
//   date: "2018-12-14",
//   merchantName: "BURRITO BAR",
// };


// Then it calls:

// onScanComplete(scannedData);

// 4️⃣ What happens when it calls it?

// Because onScanComplete is actually your handleScanComplete function,
// this line:

// onScanComplete(scannedData);


// is equivalent to:

// handleScanComplete(scannedData);


// So the function defined in the parent component gets executed from inside the child component — and it receives the scannedData as its argument.

// 1️⃣ <input type="file" />

// This makes the input a file picker.

// Users can select files from their device.

// type="file" is what tells the browser: “I want to choose files.”

// 2️⃣ ref={fileInputRef}

// ref gives direct access to the input element from your React code.

// Example:

// fileInputRef.current.click();


// This lets you programmatically open the file picker without the user clicking the input.

// 3️⃣ className="hidden"

// Makes the input invisible on the page.

// Often used when you want to trigger the file picker with a custom button instead of the default file input UI.

// 4️⃣ accept="image/*"

// Limits what the user can select.

// "image/*" → only allows images (.jpg, .png, .jpeg, etc.)

// Prevents the user from picking PDFs, videos, or other files.

// 5️⃣ capture="environment"

// Suggests the camera should be used, if available.

// "environment" → usually the back camera (main camera on a phone).

// "user" → would use the front camera.

// Only relevant on mobile devices that have cameras.

// 6️⃣ onChange={(e) => { ... }}

// Triggered when the user selects a file.

// e = the event object.

// Inside:

// const file = e.target.files?.[0];


// e.target.files is a FileList (array-like object of selected files).

// ?.[0] → gets the first file safely (since you only allow one file at a time).

// if (file) handleReceiptScan(file);


// If a file exists, call handleReceiptScan(file).

// This is your custom function that handles reading or sending the file to the server/AI model.

// The input is hidden (className="hidden").

// Users cannot click it directly.

// But we still need a way to open the file picker programmatically when they click the Button.

// That’s where useRef comes in.

// 3️⃣ How it works with the button
// <Button
//   onClick={() => fileInputRef.current?.click()}
// >


// When the user clicks the button, you manually trigger a click on the hidden input.

// fileInputRef.current is the actual <input> DOM node, so .click() opens the file picker.

// This is a common trick in React for custom file upload buttons.

// 4️⃣ Step-by-step flow

// Component renders → fileInputRef is created and attached to <input>.

// <input> is hidden from view.

// User clicks the “Scan Receipt with AI” button.

// onClick={() => fileInputRef.current?.click()} fires → triggers hidden <input> click.

// File picker opens → user selects a file.

// onChange fires → handleReceiptScan(file) is called → scanning starts.

// AI model processes the file → updates the parent via onScanComplete.