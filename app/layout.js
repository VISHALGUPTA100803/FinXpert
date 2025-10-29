import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/header";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "FinXpert",
  description: "One stop Finance Platform",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${inter.className}`}>
          {/* <header> */}
          <Header />
          <main className="min-h-screen"> {children} </main>
          <Toaster richColors />

          {/* <footer> */}
          <footer className="bg-blue-50 py-12">
            <div className="container mx-auto px-4 text-center text-gray-600">
              <p>Made with ❤️ by Vishal Gupta </p>
            </div>
          </footer>
        </body>
      </html>
    </ClerkProvider>
  );
}

// The page.js file defines the home page component (Home), which returns a <Button> component.
// The Next.js framework automatically wraps page.js inside layout.js, passing the content of page.js (<Button variant="destructive">Hello world !</Button>) as the children prop of RootLayout.
// In RootLayout, {children} is placed inside the <main> tag, which means the content from page.js gets rendered inside it.
