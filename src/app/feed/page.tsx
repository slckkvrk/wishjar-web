"use client";

import { useEffect } from "react";

export default function FeedRedirect() {
  useEffect(() => {
    window.location.href = "/jars";
  }, []);
  return <div className="min-h-screen bg-wj-cream" />;
}
