"use client";

import "./globals.css";
import { useInitTheme } from "./components/layout/ThemeProvider";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import { Toaster } from "react-hot-toast";
import { useAuthStore } from "./stores/authStore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function RootLayout({ children }) {
  useInitTheme();

  const { login, register, getCurrentUser, current, loading } = useAuthStore(
    (state) => state
  );
  const [isSignUp, setIsSignUp] = useState(false);
  const router = useRouter();

  useEffect(() => {
    getCurrentUser();
  }, [getCurrentUser]);

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="transition-colors duration-300 ">
        {/* ✅ Show header + footer only if no user */}
        {/* {!current && <Header />} */}
        <main className="min-h-screen">{children}</main>
        {/* {!current && <Footer />} */}

        <div
          className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none"
          style={{
            backgroundImage: "url('/BDC-Logo.png')",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
            backgroundSize: "400px",
          }}
        ></div>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              borderRadius: "8px",
              padding: "12px 16px",
            },
          }}
        />
      </body>
    </html>
  );
}
