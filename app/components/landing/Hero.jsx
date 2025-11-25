"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import AuthForm from "../AuthForm"; // <-- Ensure this path is correct
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/app/stores/authStore";
import { useEffect, useState } from "react";
// Updated icons to reflect new features: Forms, Charting, Management, Future Scheduling
import { FileSignature, ClipboardList, BarChart, HardHat } from "lucide-react";

// Define the clinic benefits with the new features
const benefits = [
  {
    icon: FileSignature,
    title: "E-Consent Forms & E-Sign",
    description:
      "Create and manage HIPAA-compliant consent forms with secure electronic signatures.",
  },
  {
    icon: ClipboardList,
    title: "Advanced Dental Charting",
    description:
      "Visualize and document patient conditions with detailed, easy-to-use dental charting.",
  },
  {
    icon: BarChart,
    title: "Performance Analytics",
    description:
      "Gain insights with powerful reports on popular services and practice flow.",
  },
  {
    icon: HardHat,
    title: "Future: Task Scheduling",
    description:
      "Ready for growth? Future updates will include staff task management and internal workflows.",
  },
];

export default function Hero() {
  const { login, register, getCurrentUser, current, loading } = useAuthStore(
    (state) => state
  );
  const [isSignUp, setIsSignUp] = useState(true); // Default to Sign Up for higher conversion
  const router = useRouter();

  // Redirect if user is already logged in
  useEffect(() => {
    getCurrentUser();
    if (current && !loading) {
      router.push("/");
    }
  }, [getCurrentUser, current, loading, router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    const user = await login(form.get("email"), form.get("password"));
    if (user) router.push("/"); // ✅ safe navigation
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    const user = await register(form.get("email"), form.get("password"));
    if (user) router.push("/"); // ✅ safe navigation
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <section className="relative min-h-screen flex flex-col items-center bg-white overflow-hidden">
      {/* Clinic/Service Banner - Now focused on core management features */}
      <div className="w-full bg-[var(--theme-color)] text-white py-3 px-6 text-center text-sm md:text-base font-medium flex flex-wrap justify-center gap-x-4 drop-shadow-lg">
        <span>✍️ E-Sign Forms</span>
        <span>•</span>
        <span>🦷 Digital Charting</span>
        <span>•</span>
        <span>📁 Patient Records</span>
        <span>•</span>
        <span>📊 Analytics</span>
      </div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row items-center justify-between w-full max-w-7xl px-6 md:px-12 py-16 lg:py-24 z-10 gap-12">
        {/* Left Section - Value Proposition */}
        <div className="flex-1 text-center lg:text-left">
          {/* Main Heading/Value - New tagline to reflect comprehensive tools */}
          <motion.h1
            className="text-5xl md:text-7xl font-extrabold text-gray-900 leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Digital Charting &{" "}
            <span className="text-[var(--theme-color)] block md:inline">
              Paperless Consent.
            </span>
          </motion.h1>

          {/* Subtext */}
          <motion.p
            className="mt-6 text-xl text-gray-600 max-w-2xl mx-auto lg:mx-0"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            Arc Tech Solutions's Demo App is built for modern practices.
            Streamline patient records, consent, billing, and get **dental
            charting** all in one place.
          </motion.p>

          {/* Key Benefits Grid */}
          <motion.div
            className="mt-12 grid grid-cols-2 gap-6 max-w-3xl mx-auto lg:mx-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="flex flex-col items-center lg:items-start p-4 bg-green-50 rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <benefit.icon className="w-8 h-8 text-[var(--theme-color)] mb-3" />
                <h3 className="text-lg font-semibold text-gray-800">
                  {benefit.title}
                </h3>
                <p className="mt-1 text-sm text-gray-500 text-center lg:text-left">
                  {benefit.description}
                </p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Right Section - Auth Form (The primary CTA) */}
        <div className="w-full lg:w-96 mt-12 lg:mt-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={isSignUp ? "signup" : "login"}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="w-full max-w-md bg-white p-8 rounded-xl shadow-2xl border-t-4 border-[var(--theme-color)] mx-auto"
            >
              <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
                Start Your Free Demo
              </h2>
              <AuthForm
                handleSubmit={isSignUp ? handleRegister : handleLogin}
                submitType={isSignUp ? "Get Instant Access" : "Log In"}
                onToggle={() => setIsSignUp(!isSignUp)}
              />
              <p className="text-xs text-center text-gray-500 mt-4">
                Unlock charting, e-consent, and patient file management today.
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Background/Visual Accent */}
      <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-[var(--theme-color)] opacity-10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-1/4 h-1/4 bg-green-500 opacity-5 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2 pointer-events-none"></div>

      {/* Optional: Add a subtle logo back */}
      <div className="absolute bottom-4 left-6 opacity-30">
        <Image
          src="/Seneto Dental Logo.png" // <-- replace with your actual image
          alt="Senoto Dental Care Logo"
          width={100}
          height={75}
        />
      </div>
    </section>
  );
}
