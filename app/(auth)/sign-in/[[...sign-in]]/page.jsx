import { SignIn } from "@clerk/nextjs";
import React from "react";
// routes are created in next js automatically by folder in app
// (auth) – Route Group (Not Rendered in URL)
// This is a Route Group in the new App Router (Next.js 13+).

// The name (auth) does not affect the route URL — it’s just a folder used for organizing code.

// This is useful for grouping related UI pieces like layouts or components for "auth" pages (e.g., login, register), but it doesn't change the actual route.

// [[...sign-in]] – Catch-all Route (Optional)
// This is a catch-all optional route in Next.js.

// The double brackets [[...slug]] mean the route matches:

// /sign-in

// /sign-in/anything

// /sign-in/a/b/c — and also

// / (when nothing is passed).
const Page = () => {
  return <SignIn />;
};

export default Page;
