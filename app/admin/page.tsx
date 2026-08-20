import { createAdminClient } from "@/lib/supabase/admin";
import { EligibilityOverride } from "@/components/eligibility-override";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const admin = createAdminClient();

  const { data: profiles, error } = await admin
    .from("profiles")
    .select(
      "id, email, full_name, school, based_in, eligibility_status, referral_code, referral_count, activated, questionnaire_completed, created_at"
    )
    .order("created_at", { ascending: false });

  return (
    <div className="flex-1 px-6 py-10">
      <h1 className="text-xl font-semibold tracking-tight">Users</h1>
      <p className="mt-1 text-sm text-neutral-500">
        {profiles?.length ?? 0} total
      </p>

      {error && <p className="mt-4 text-sm text-red-600">{error.message}</p>}

      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-left text-neutral-500">
              <th className="py-2 pr-4">Email</th>
              <th className="py-2 pr-4">Name</th>
              <th className="py-2 pr-4">School</th>
              <th className="py-2 pr-4">Based in</th>
              <th className="py-2 pr-4">Eligibility</th>
              <th className="py-2 pr-4">Referral code</th>
              <th className="py-2 pr-4">Referrals</th>
              <th className="py-2 pr-4">Activated</th>
              <th className="py-2 pr-4">Questionnaire</th>
              <th className="py-2 pr-4">Created</th>
            </tr>
          </thead>
          <tbody>
            {profiles?.map((p) => (
              <tr key={p.id} className="border-b border-neutral-100">
                <td className="py-2 pr-4">{p.email}</td>
                <td className="py-2 pr-4">{p.full_name ?? "—"}</td>
                <td className="py-2 pr-4">{p.school ?? "—"}</td>
                <td className="py-2 pr-4">{p.based_in ?? "—"}</td>
                <td className="py-2 pr-4">
                  <EligibilityOverride profileId={p.id} eligibilityStatus={p.eligibility_status} />
                </td>
                <td className="py-2 pr-4 font-mono">{p.referral_code}</td>
                <td className="py-2 pr-4">{p.referral_count}</td>
                <td className="py-2 pr-4">{p.activated ? "Yes" : "No"}</td>
                <td className="py-2 pr-4">
                  {p.questionnaire_completed ? "Complete" : "Incomplete"}
                </td>
                <td className="py-2 pr-4">
                  {new Date(p.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
