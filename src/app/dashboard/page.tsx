"use client";

import { useEffect } from "react";

export default function DashboardRedirect() {
  useEffect(() => {
    window.location.href = "/";
  }, []);
  return <div className="min-h-screen bg-wj-cream" />;
}
