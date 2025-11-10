import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";

/**
 * DashboardHeader Component
 * Displays a greeting for the user and a dropdown with user info and logout
 */
export default function DashboardHeader({ user }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Toggle dropdown open/close
  const handleToggle = useCallback(() => {
    setShowDropdown((prev) => !prev);
  }, []);

  // Logout handler
  const handleLogout = useCallback(() => {
    // Clear session data if needed
    navigate("/");
  }, [navigate]);

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) return null;

  // Dropdown animation classes
  const dropdownClasses = showDropdown
    ? "opacity-100 translate-y-0"
    : "opacity-0 -translate-y-2 pointer-events-none";

  return (
    <div className="flex justify-between gap-2 items-center p-4 rounded-2xl bg-gray-800 text-white">
      {/* Greeting */}
      <h2 className="text-xl font-semibold">
        Welcome, {user?.firstName || user?.name || "User"}
      </h2>

      {/* User dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={handleToggle}
          className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center hover:bg-gray-700 transition-colors cursor-pointer"
          tabIndex={0}
          aria-expanded={showDropdown}
        >
          <span className="text-white text-lg">👤</span>
        </button>

        <div
          className={`absolute -right-6 mt-2 w-72 bg-gray-700 rounded-xl shadow-xl p-6 text-base space-y-4 z-50 transform transition-all duration-300 ${dropdownClasses}`}
        >
          {/* Info rows stacked */}
          {[
            ["Name", user?.name || "-"],
            ["IBAN", user?.iban || "-"],
            ["City", user?.city || "-"],
            ["DOB", user?.dateOfBirth || "-"],
            ["Phone", user?.phoneNumber || "-"],
            ["Gender", user?.gender || "-"],
          ].map(([label, value]) => (
            <div
              key={label}
              className="flex flex-col px-2 py-1 rounded hover:bg-gray-600 transition-colors"
            >
              <span className="font-semibold text-gray-300">{label}:</span>
              <span className="font-medium text-white mt-1">{value}</span>
            </div>
          ))}

          <hr className="border-gray-600 my-3" />

          <button
            onClick={handleLogout}
            className="w-full text-center px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold transition-transform transform hover:scale-105"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
