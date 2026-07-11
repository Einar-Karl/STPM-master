"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requiredString } from "@/lib/forms";

function errorRedirect(message: string): never {
  redirect(`/signup?error=${encodeURIComponent(message)}`);
}

export async function signup(formData: FormData) {
  const fullName = requiredString(formData.get("full_name"));
  const email = requiredString(formData.get("email")).toLowerCase();
  const password = requiredString(formData.get("password"));
  const confirmPassword = requiredString(formData.get("confirm_password"));

  if (!fullName || !email || !password) {
    errorRedirect("Fill in your name, email, and a password.");
  }
  if (password.length < 8) {
    errorRedirect("Password must be at least 8 characters.");
  }
  if (password !== confirmPassword) {
    errorRedirect("Passwords don't match.");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });

  if (error) {
    errorRedirect(error.message);
  }

  // Email confirmations may be on for the project; if so there's no
  // session yet and the user needs to click the link first.
  if (!data.session) {
    redirect("/signup/check-email");
  }

  redirect("/pending-approval");
}
