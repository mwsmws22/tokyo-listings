"use client";

import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

const inputClass =
  "rounded-lg border border-rose-pine-highlight-med bg-rose-pine-surface px-3 py-3 text-rose-pine-text";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleReset() {
    setError(null);
    if (!token) {
      setError("Missing reset token. Open the link from your email.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setPending(true);
    const { error: err } = await authClient.resetPassword({
      newPassword: password,
      token,
    });
    setPending(false);
    if (err) {
      setError(err.message ?? "Could not reset password");
      return;
    }
    router.replace("/login");
    router.refresh();
  }

  if (!token) {
    return (
      <View className="w-full gap-3">
        <Text className="text-3xl font-bold text-rose-pine-text">Invalid link</Text>
        <Text className="text-rose-pine-muted">
          This reset link is missing a token. Request a new link from the forgot password page.
        </Text>
        <Link href="/forgot-password">
          <Text className="text-rose-pine-foam underline">Forgot password</Text>
        </Link>
      </View>
    );
  }

  return (
    <View className="w-full gap-3">
      <Text className="text-3xl font-bold text-rose-pine-text">Set a new password</Text>
      <Text className="text-sm text-rose-pine-muted">Choose a new password for your account.</Text>
      <View className="gap-3">
        <View className="gap-2">
          <Text className="font-semibold text-rose-pine-text">New password</Text>
          <TextInput
            autoComplete="new-password"
            className={inputClass}
            placeholder="At least 8 characters"
            placeholderTextColor="var(--color-rose-pine-muted)"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>
        <View className="gap-2">
          <Text className="font-semibold text-rose-pine-text">Confirm password</Text>
          <TextInput
            autoComplete="new-password"
            className={inputClass}
            placeholder="Repeat password"
            placeholderTextColor="var(--color-rose-pine-muted)"
            secureTextEntry
            value={confirm}
            onChangeText={setConfirm}
          />
        </View>
        {error ? (
          <Text className="text-rose-pine-love" role="alert">
            {error}
          </Text>
        ) : null}
        <Pressable
          className="items-center rounded-lg bg-rose-pine-highlight-med px-4 py-3 active:opacity-80 disabled:opacity-50"
          disabled={pending}
          onPress={() => void handleReset()}
        >
          <Text className="font-semibold text-rose-pine-text">
            {pending ? "Updating…" : "Update password"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <View className="p-4">
          <Text className="text-rose-pine-muted">Loading…</Text>
        </View>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
