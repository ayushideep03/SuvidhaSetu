"use client";

import { useEffect, useState } from "react";
import { Eye } from "lucide-react";

export function VisitorCounter() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/visit", { method: "POST" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setCount(typeof d?.count === "number" ? d.count : null))
      .catch(() => null);
  }, []);

  if (count === null) return null;

  return (
    <div className="inline-flex items-center gap-2 text-neutral-500 text-xs">
      <Eye size={13} className="text-saffron" />
      <span>
        <span className="font-bold text-neutral-700">{count.toLocaleString("en-IN")}</span>
        {" "}total visits
      </span>
    </div>
  );
}
