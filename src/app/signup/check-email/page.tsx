import Link from "next/link";

export default function CheckEmailPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 dark:bg-neutral-950">
      <div className="w-full max-w-sm space-y-4 rounded-lg border border-neutral-200 bg-white p-8 text-center shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Check your email</h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          We&apos;ve sent a confirmation link to the address you signed up with. Click it, then sign
          in — an admin will still need to approve your account before you see any data.
        </p>
        <Link href="/login" className="inline-block text-sm font-medium text-neutral-900 hover:underline dark:text-neutral-100">
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
