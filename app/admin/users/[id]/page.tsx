import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { QUESTIONNAIRE_SECTIONS } from "@/lib/questions";
import { EligibilityOverride } from "@/components/eligibility-override";
import { computeUserStatus } from "@/lib/user-status";

export const dynamic = "force-dynamic";

function AnswerValue({ type, answer }: { type: string; answer: unknown }) {
  if (answer === null || answer === undefined || answer === "") {
    return <span className="text-neutral-400">—</span>;
  }

  if (type === "photo_upload" && Array.isArray(answer)) {
    return (
      <div className="flex flex-wrap gap-2">
        {answer.map((url) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={url as string} src={url as string} alt="" className="h-20 w-20 rounded-md object-cover" />
        ))}
      </div>
    );
  }

  if (type === "ranked_select" && Array.isArray(answer)) {
    return (
      <ol className="list-decimal space-y-0.5 pl-4">
        {answer.map((item) => (
          <li key={item as string}>{item as string}</li>
        ))}
      </ol>
    );
  }

  if (Array.isArray(answer)) {
    return <span>{answer.join(", ")}</span>;
  }

  return <span>{String(answer)}</span>;
}

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const admin = createAdminClient();

  const [{ data: profile, error }, { data: responses }] = await Promise.all([
    admin.from("profiles").select("*").eq("id", id).single(),
    admin.from("questionnaire_responses").select("question_key, answer").eq("profile_id", id),
  ]);

  if (error || !profile) {
    return (
      <div className="flex-1 px-6 py-10">
        <Link href="/admin" className="text-sm text-neutral-400 underline">
          &larr; Back to users
        </Link>
        <p className="mt-4 text-sm text-red-600">User not found.</p>
      </div>
    );
  }

  const answerByKey = new Map((responses ?? []).map((r) => [r.question_key, r.answer]));

  return (
    <div className="flex-1 px-6 py-10">
      <Link href="/admin" className="text-sm text-neutral-400 underline">
        &larr; Back to users
      </Link>

      <div className="mt-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">{profile.full_name ?? profile.email}</h1>
        <EligibilityOverride profileId={profile.id} eligibilityStatus={profile.eligibility_status} />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
        <div>
          <p className="text-neutral-400">Email</p>
          <p>{profile.email}</p>
        </div>
        <div>
          <p className="text-neutral-400">Status</p>
          <p>{computeUserStatus(profile)}</p>
        </div>
        <div>
          <p className="text-neutral-400">School</p>
          <p>{profile.school ?? "—"}</p>
        </div>
        <div>
          <p className="text-neutral-400">Based in</p>
          <p>{profile.based_in ?? "—"}</p>
        </div>
        <div>
          <p className="text-neutral-400">Referral code</p>
          <p className="font-mono">{profile.referral_code}</p>
        </div>
        <div>
          <p className="text-neutral-400">Referred by</p>
          <p className="font-mono">{profile.referred_by ?? "—"}</p>
        </div>
        <div>
          <p className="text-neutral-400">Referrals / Activated</p>
          <p>
            {profile.referral_count} · {profile.activated ? "Yes" : "No"}
          </p>
        </div>
        <div>
          <p className="text-neutral-400">Onboarding / Questionnaire</p>
          <p>
            {profile.onboarding_completed ? "Complete" : "Incomplete"} ·{" "}
            {profile.questionnaire_completed ? "Complete" : "Incomplete"}
          </p>
        </div>
        <div>
          <p className="text-neutral-400">Created</p>
          <p>{new Date(profile.created_at).toLocaleString()}</p>
        </div>
      </div>

      <div className="mt-10 space-y-8">
        {QUESTIONNAIRE_SECTIONS.map((section) => (
          <div key={section.title}>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400">
              {section.title}
            </h2>
            <div className="mt-3 space-y-4">
              {section.questions.map((q) => (
                <div key={q.key}>
                  <p className="text-sm font-medium">{q.label}</p>
                  <div className="mt-1 text-sm text-neutral-700">
                    <AnswerValue type={q.type} answer={answerByKey.get(q.key)} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
