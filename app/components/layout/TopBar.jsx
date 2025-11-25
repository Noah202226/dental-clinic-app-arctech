import { useAuthStore } from "@/app/stores/authStore";
import { usePersonalizationStore } from "@/app/stores/usePersonalizationStore";
import React, { useState, useEffect } from "react";
import { FiLogOut, FiMenu, FiSettings, FiUser } from "react-icons/fi";

function TopBar() {
  const { current, logout } = useAuthStore();

  const { personalization } = usePersonalizationStore();

  const [dateTime, setDateTime] = useState(new Date().toLocaleString());

  useEffect(() => {
    const timer = setInterval(() => {
      setDateTime(new Date().toLocaleString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full navbar bg-white border-b border-green-100 shadow-sm px-4 sticky top-0 z-30">
      {/* Mobile drawer toggle */}
      <div className="flex-none lg:hidden">
        <label
          htmlFor="dashboard-drawer"
          className="btn btn-square btn-ghost text-[var(--theme-color)] hover:bg-green-50"
        >
          <FiMenu size={22} />
        </label>
      </div>

      {/* Title */}
      <div className="flex-1">
        <h1 className="text-lg md:text-xl font-bold text-gray-700">
          Welcome,{" "}
          <span className="text-[var(--theme-color)]">{current.email}</span>
        </h1>
      </div>

      {/* Right Section */}
      <div className="flex-none flex items-center gap-4">
        <span className="text-xs md:text-sm text-gray-500 hidden md:block animate-pulse">
          {dateTime}
        </span>

        {/* User Dropdown */}
        <div className="dropdown dropdown-end">
          <div
            tabIndex={0}
            role="button"
            className="btn btn-circle avatar placeholder ring ring-green-400 ring-offset-2 ring-offset-white"
          >
            <div className="bg-[var(--theme-color)] text-white rounded-full w-10 flex items-center justify-center font-semibold">
              <span>{personalization?.initial}</span>
            </div>
          </div>
          <ul
            tabIndex={0}
            className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow-lg bg-white border border-green-100 rounded-xl w-56"
          >
            <li className="menu-title text-xs text-gray-500">
              {current.email}
            </li>
            <li>
              <a className="flex items-center gap-2 text-gray-700 hover:text-[var(--theme-color)]">
                <FiUser /> Profile
              </a>
            </li>
            <li>
              <a className="flex items-center gap-2 text-gray-700 hover:text-[var(--theme-color)]">
                <FiSettings /> Settings
              </a>
            </li>
            <li>
              <a
                onClick={logout}
                className="flex items-center gap-2 text-red-500 font-semibold hover:text-red-600"
              >
                <FiLogOut /> Logout
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default TopBar;
