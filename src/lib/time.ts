export function completedLabel(completedAt?: string | null): string {
  if (!completedAt) return "Completed";
  const then = new Date(completedAt);
  const thenDay = new Date(then.getFullYear(), then.getMonth(), then.getDate()).getTime();
  const todayDay = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()).getTime();
  const diffDays = Math.round((todayDay - thenDay) / 86400000);
  if (diffDays === 0) return "Completed today";
  if (diffDays === 1) return "Completed yesterday";
  return "Completed on " + then.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
