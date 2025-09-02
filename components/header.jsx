import Image from "next/image";
import Link from "next/link";

import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import { Button } from "./ui/button";
import { LayoutDashboard, PenBox } from "lucide-react";
import { checkUser } from "@/lib/checkUser";
const header = async () => {
  await checkUser();
  return (
    <div className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b">
      {/* // fixed	Positions the element fixed relative to the viewport, not to its parent. It stays in place when scrolling.
top-0	Aligns the element to the top edge of the screen (0 units from the top). */}
      <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/">
          <Image
            src="/logo_finxpert.png"
            alt="Finxpert Logo"
            width={200}
            height={60}
            className="h-14 w-auto object-contain"
          ></Image>
        </Link>
        <div className="flex items-center space-x-4">
          <SignedIn>
            <Link href={"/dashboard"}>
              <Button
                variant="outline"
                className="text-gray-600 hover:text-blue-600 flex items-center gap-2"
              >
                <LayoutDashboard size={18} />
                <span className="hidden md:inline">Dashboard</span>
              </Button>
            </Link>
            <Link href={"/transaction/create"}>
              <Button className="flex items-center gap-2">
                <PenBox size={18} />
                <span className="hidden md:inline">Add Transaction</span>
              </Button>
            </Link>
          </SignedIn>
          <SignedOut>
            <SignInButton forceRedirectUrl="/dashboard">
              <Button variant="outline"> Login </Button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-12 h-12",
                },
              }}
            />
          </SignedIn>
        </div>
      </nav>
    </div>
  );
};

export default header;
