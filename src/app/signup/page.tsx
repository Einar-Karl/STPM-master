import Link from "next/link";
import { signup } from "./actions";
import { Button, ErrorBanner, Field, Input } from "@/components/ui";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 dark:bg-neutral-950">
      <form
        action={signup}
        className="w-full max-w-sm space-y-5 rounded-lg border border-neutral-200 bg-white p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
      >
        <div>
          <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">STPM Master</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Request staff access. An admin reviews and approves new accounts before you can see any
            data.
          </p>
        </div>
        <ErrorBanner message={error} />
        <Field label="Full name" name="full_name" required>
          <Input id="full_name" name="full_name" autoComplete="name" required />
        </Field>
        <Field label="Email" name="email" required>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </Field>
        <Field label="Password" name="password" required>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </Field>
        <Field label="Confirm password" name="confirm_password" required>
          <Input
            id="confirm_password"
            name="confirm_password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </Field>
        <Button type="submit" className="w-full">
          Request access
        </Button>
        <p className="text-center text-sm text-neutral-500 dark:text-neutral-400">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-neutral-900 hover:underline dark:text-neutral-100">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
