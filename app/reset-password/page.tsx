"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const initializeRecovery = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");

      if (code) {
        const { error: exchangeError } =
          await supabase.auth.exchangeCodeForSession(code);

        if (exchangeError) {
          console.error("Recovery code exchange error:", exchangeError);
          alert(
            "This password reset link is invalid or has expired. Please request a new one.",
          );
          return;
        }

        // Remove the one-time code from the browser URL.
        window.history.replaceState({}, "", "/reset-password");
        setReady(true);
        return;
      }

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.error("Recovery session error:", sessionError);
        return;
      }

      if (session) {
        setReady(true);
      }
    };

    initializeRecovery();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "PASSWORD_RECOVERY" || session) {
          setReady(true);
        }
      },
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  const handleResetPassword = async () => {
    if (password.length < 8) {
      alert("Your password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      alert("The passwords do not match.");
      return;
    }

    setSaving(true);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      console.error("Password update error:", error);
      alert(error.message);
      setSaving(false);
      return;
    }

    alert(
      "Your password has been updated successfully ✨\n\nYou can now sign in with your new password.",
    );

    await supabase.auth.signOut();
    router.replace("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top,#ffffff_0%,#F8F4EE_48%,#EEE4D4_100%)] p-6">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="w-full max-w-[410px]"
      >
        <Card className="rounded-[32px] border border-[#D9C59D]/60 bg-white/90 p-8 text-center shadow-[0_24px_70px_rgba(55,42,23,0.14)] backdrop-blur-xl">
          <img
            src="/logo.png"
            alt="Essence Beauty & Wellness"
            className="mx-auto mb-5 h-auto w-36"
          />

          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#9B7B3E]">
            Essence Beauty & Wellness
          </p>

          <h1 className="mt-3 text-3xl font-semibold text-[#171717]">
            Reset Password
          </h1>

          <p className="mt-2 mb-7 text-sm leading-6 text-[#6F675D]">
            Create a secure new password for your Essence VIP account.
          </p>

          {!ready ? (
            <div className="rounded-2xl border border-[#E4D8C3] bg-[#FBF8F2] p-5">
              <p className="animate-pulse text-sm font-medium text-[#9B7B3E]">
                Verifying your reset link...
              </p>

              <p className="mt-2 text-xs leading-5 text-[#756D63]">
                Open this page using the password reset link sent to your email.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <Input
                type="password"
                placeholder="New password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-12 rounded-xl border-[#DCCBAA] bg-white text-[#171717] focus-visible:ring-[#C6A86B]"
              />

              <Input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    handleResetPassword();
                  }
                }}
                className="h-12 rounded-xl border-[#DCCBAA] bg-white text-[#171717] focus-visible:ring-[#C6A86B]"
              />

              <Button
                onClick={handleResetPassword}
                disabled={saving}
                className="h-12 w-full rounded-xl bg-[#171717] text-white hover:bg-[#2B2B2B]"
              >
                {saving ? "Updating Password..." : "Update Password"}
              </Button>
            </div>
          )}

          <button
            type="button"
            onClick={() => router.replace("/")}
            className="mt-6 text-sm font-medium text-[#8A6A32] underline-offset-4 hover:underline"
          >
            Return to Sign In
          </button>
        </Card>
      </motion.div>
    </div>
  );
}
