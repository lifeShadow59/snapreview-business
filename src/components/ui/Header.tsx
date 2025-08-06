import Link from "next/link";
import React from "react";

export const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/50 animate-fadeIn">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center space-x-2 animate-slideInLeft">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg animate-float flex items-center justify-center">
            <span className="text-white font-bold text-sm">QR</span>
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            ReviewQR
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-8 animate-fadeInUp">
          <a
            href="#features"
            className="text-gray-600 hover:text-blue-600 transition-all duration-300 hover:scale-105"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="text-gray-600 hover:text-blue-600 transition-all duration-300 hover:scale-105"
          >
            How It Works
          </a>
          <a
            href="#pricing"
            className="text-gray-600 hover:text-blue-600 transition-all duration-300 hover:scale-105"
          >
            Pricing
          </a>
          <a
            href="#testimonials"
            className="text-gray-600 hover:text-blue-600 transition-all duration-300 hover:scale-105"
          >
            Reviews
          </a>
          <a
            href="#contact"
            className="text-gray-600 hover:text-blue-600 transition-all duration-300 hover:scale-105"
          >
            Contact
          </a>
        </nav>

        <div className="flex items-center gap-4 animate-slideInRight">
          <Link
            href="/auth/login"
            className="hidden md:inline-flex text-sm text-gray-600 hover:text-gray-800 transition-all duration-300"
          >
            Sign In
          </Link>
          <Link
            href="/auth/register"
            className="inline-flex h-9 items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-4 text-sm font-medium text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105"
          >
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
};
