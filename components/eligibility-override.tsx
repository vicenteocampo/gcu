"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function EligibilityOverride({
  profileId,
  eligibilityStatus,
}: {
  profileId: string;
  eligibilityStatus: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function setStatus(status: "eligible" | "not_eligible") {
    setLoading(true);
    await fetch("/api/admin/eligibility", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileId, eligibilityStatus: status }),
    });
    setLoading(false);
    router.refresh();
  }

  if (eligibilityStatus !== "on_hold") {
    return <span>{eligibilityStatus}</span>;
  }

  return (
    <div className="flex items-center gap-2">
      <span>on_hold</span>
      <button
        type="button"
        disabled={loading}
        onClick={() => setStatus("eligible")}
        className="rounded border border-neutral-300 px-2 py-0.5 text-xs hover:border-neutral-900 disabled:opacity-50"
      >
        Approve
      </button>
      <button
        type="button"
        disabled={loading}
        onClick={() => setStatus("not_eligible")}
        className="rounded border border-neutral-300 px-2 py-0.5 text-xs hover:border-neutral-900 disabled:opacity-50"
      >
        Reject
      </button>
    </div>
  );
}
