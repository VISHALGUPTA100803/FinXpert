"use client";
import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "./ui/button";
import Image from "next/image";

const HeroSection = () => {
  const imageRef = useRef();
  useEffect(() => {
    const imageElement = imageRef.current;
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const scrollThreshold = 100;
      if (scrollPosition > scrollThreshold) {
        imageElement.classList.add("scrolled");
      } else {
        imageElement.classList.remove("scrolled");
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="pb-20 px-4">
      <div className="container mx-auto text-center">
        <h1 className="text-5xl md:text-8xl lg:text-[105px] gradient gradient-title">
          Manage Your Wealth <br /> with Intelligence
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          An intelligent financial management platform that leverages AI to
          monitor, evaluate, and enhance your spending habits with instant,
          real-time insights.
        </p>
        <div className="flex justify-center space-x-4">
          <Link href="/dashboard">
            <Button size="lg" className="px-8">
              Get Started
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button size="lg" variant="outline" className="px-8">
              Watch Demo
            </Button>
          </Link>
        </div>
        <div className="hero-image-wrapper">
          <div ref={imageRef} className="hero-image">
            <Image
              src="/banner.png"
              width={1280}
              height={720}
              alt="Dashboard Preview"
              className="rounded-lg shadow-2xl border mx-auto max-w-6xl h-auto"
              priority
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
// scroll functionality of image
// 1. ref={imageRef}

// When you write:

// <div ref={imageRef} className="hero-image">

// imageRef is created with useRef(null) in React.

// React will store the actual DOM node (<div class="hero-image">) inside imageRef.current.

// So after render:

// imageRef.current === <div class="hero-image"></div>

// 2. Adding the class with JS

// When you scroll, you’re probably doing something like:

// const imageElement = imageRef.current;
// imageElement.classList.add("scrolled");

// That means the DOM node now looks like this:

// <div class="hero-image scrolled"></div>

// What happens in plain English:

// imageRef is created → empty box to hold the <img>.

// React renders → <img ref={imageRef} /> attaches the <img> into that box.
// Now imageRef.current points to the image in the browser.

// useEffect runs → sets up a scroll listener on the page.

// Whenever you scroll:

// It checks how much you’ve scrolled (window.scrollY).

// If you scroll more than 100px → it adds a CSS class "scrolled" to the image.

// If you scroll back up → it removes that class.

// The CSS class (.scrolled) can then be styled, e.g. shrink image, fade it, etc.

// When component is destroyed → it cleans up the scroll listener

// Why does it still listen on every scroll?

// The useEffect hook itself runs only once (when the component mounts) because of the empty [].

// Inside that effect, you add a scroll event listener to the window.

// Event listeners stay active until they are explicitly removed.
// That’s why it "feels" like it’s running every time — but actually it’s the listener reacting to scroll events, not useEffect re-running.

// 🛠 What happens step by step:

// Component mounts → useEffect runs once → adds "scroll" listener.

// Every time you scroll → handleScroll fires because the listener is active.

// Component unmounts → cleanup runs (removeEventListener) → listener is removed.
