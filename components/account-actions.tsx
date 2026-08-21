"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const CONTACT_EMAIL = "gculatam@gmail.com";

export function AccountActions({ email }: { email: string }) {
  const router = useRouter();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setDeleting(true);
    setError(null);

    const res = await fetch("/api/account/delete", { method: "POST" });

    if (!res.ok) {
      setDeleting(false);
      setError("Something went wrong. Try again.");
      return;
    }

    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-24">
      <div className="w-full max-w-sm">
        <p className="text-xs uppercase tracking-widest text-neutral-400">GCU</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">{email}</h1>

        {!confirmingDelete ? (
          <div className="mt-8 space-y-2">
            <Link
              href="/questionnaire"
              className="block rounded-md border border-neutral-300 px-4 py-3 text-sm font-medium text-neutral-900"
            >
              Edit your answers
            </Link>
            <Link
              href="/referral"
              className="block rounded-md border border-neutral-300 px-4 py-3 text-sm font-medium text-neutral-900"
            >
              Referral info
            </Link>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="block rounded-md border border-neutral-300 px-4 py-3 text-sm font-medium text-neutral-900"
            >
              Contact GCU Collective
            </a>
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              className="block w-full rounded-md border border-neutral-300 px-4 py-3 text-left text-sm font-medium text-red-600"
            >
              Delete my profile
            </button>
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            <p className="text-sm text-neutral-500">
              This permanently deletes your profile, questionnaire answers, and photos. This
              can&apos;t be undone.
            </p>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmingDelete(false)}
                disabled={deleting}
                className="flex-1 rounded-md border border-neutral-300 px-4 py-3 text-sm font-medium text-neutral-900 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 rounded-md bg-red-600 px-4 py-3 text-sm font-medium text-white disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Yes, delete everything"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
