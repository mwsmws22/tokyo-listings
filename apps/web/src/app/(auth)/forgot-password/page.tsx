"use client";

import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

const inputClass =
  "rounded-lg border border-rose-pine-highlight-med bg-rose-pine-surface px-3 py-3 text-rose-pine-text";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleRequest() {
    setError(null);
    setPending(true);
    const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    const { error: err } = await authClient.requestPasswordReset({
      email,
      redirectTo: `${origin}/reset-password`,
    });
    setPending(false);
    if (err) {
      setError(err.message ?? "Request failed");
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <View className="w-full gap-3">
        <Text className="text-3xl font-bold text-rose-pine-text">Check your email</Text>
        <Text className="text-rose-pine-muted">
          If an account exists for that address, we sent a link to reset your password.
        </Text>
        <Link href="/login">
          <Text className="text-rose-pine-foam underline">Back to sign in</Text>
        </Link>
      </View>
    );
  }

  return (
    <View className="w-full gap-3">
      <Text className="text-3xl font-bold text-rose-pine-text">Forgot password</Text>
      <View className="flex-row flex-wrap gap-1">
        <Text className="text-sm text-rose-pine-muted">
          Enter your email and we&apos;ll send a reset link.
        </Text>
        <Link href="/login">
          <Text className="text-sm text-rose-pine-foam underline">Sign in</Text>
        </Link>
      </View>
      <View className="gap-3">
        <View className="gap-2">
          <Text className="font-semibold text-rose-pine-text">Email</Text>
          <TextInput
            autoCapitalize="none"
            autoComplete="email"
            className={inputClass}
            inputMode="email"
            keyboardType="email-address"
            placeholder="you@example.com"
            placeholderTextColor="var(--color-rose-pine-muted)"
            value={email}
            onChangeText={setEmail}
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
          onPress={() => void handleRequest()}
        >
          <Text className="font-semibold text-rose-pine-text">
            {pending ? "Sending…" : "Send reset link"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
