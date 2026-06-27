"use client";

import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { supabase } from "@/lib/supabase";

type CompletionEvent = {
  jar_title: string;
  username: string;
};

export default function ConfettiListener() {
  const [toast, setToast] = useState<CompletionEvent | null>(null);

  useEffect(() => {
    const channel = supabase.channel("jar-completions");

    channel
      .on("broadcast", { event: "jar_completed" }, (payload) => {
        const data = payload.payload as CompletionEvent;
        setToast(data);

        confetti({
          particleCount: 180,
          spread: 100,
          origin: { y: 0.5 },
          colors: ["#9B6CFF", "#4F32C8", "#ffffff", "#fbbf24", "#34d399"],
        });

        setTimeout(() => {
          confetti({
            particleCount: 80,
            angle: 60,
            spread: 70,
            origin: { x: 0, y: 0.6 },
            colors: ["#9B6CFF", "#ffffff"],
          });
          confetti({
            particleCount: 80,
            angle: 120,
            spread: 70,
            origin: { x: 1, y: 0.6 },
            colors: ["#4F32C8", "#fbbf24"],
          });
        }, 300);

        setTimeout(() => setToast(null), 6000);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (!toast) return null;

  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-bounce-in">
      <div className="flex items-center gap-3 rounded-2xl bg-white px-6 py-4 shadow-2xl ring-2 ring-violet-300">
        <span className="text-2xl">🎉</span>
        <div>
          <p className="font-bold text-gray-900">Jar completed!</p>
          <p className="text-sm text-gray-500">
            <span className="font-semibold text-violet-700">@{toast.username}</span>
            {" "}just completed{" "}
            <span className="font-semibold">"{toast.jar_title}"</span>
          </p>
        </div>
      </div>
    </div>
  );
}
