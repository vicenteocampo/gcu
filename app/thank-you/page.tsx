import Link from "next/link";

export default function ThankYouPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold tracking-tight">You&apos;re in the pool</h1>
        <p className="mt-3 text-neutral-500">
          Thanks for finishing the questionnaire. One more step before matches start.
        </p>
        <Link
          href="/referral"
          className="mt-8 inline-block rounded-md bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white"
        >
          Continue
        </Link>
      </div>
    </div>
  );
}
