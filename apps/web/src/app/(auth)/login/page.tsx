"use client";

import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

const inputClass =
  "rounded-lg border border-rose-pine-highlight-med bg-rose-pine-surface px-3 py-3 text-rose-pine-text";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSignIn() {
    setError(null);
    setPending(true);
    const { error: err } = await authClient.signIn.email({ email, password });
    setPending(false);
    if (err) {
      setError(err.message ?? "Sign in failed");
      return;
    }
    router.replace("/");
    router.refresh();
  }

  return (
    <View className="w-full gap-3">
      <Text className="text-4xl font-bold text-rose-pine-text">Sign in</Text>
      <View className="flex-row items-center gap-1">
        <Text className="text-sm leading-5 text-rose-pine-muted">Use your email and password.</Text>
        <Text className="text-sm leading-5 text-rose-pine-muted">No account?</Text>
        <Link href="/register">
          <Text className="text-sm leading-5 text-rose-pine-foam underline">Register</Text>
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
        <View className="gap-2">
          <Text className="font-semibold text-rose-pine-text">Password</Text>
          <TextInput
            autoComplete="password"
            className={inputClass}
            placeholder="Password"
            placeholderTextColor="var(--color-rose-pine-muted)"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>
        {error ? (
          <Text className="text-rose-pine-love" role="alert">
            {error}
          </Text>
        ) : null}
        <Pressable
          className="items-center rounded-lg bg-rose-pine-foam px-4 py-3 active:opacity-80 disabled:opacity-50"
          disabled={pending}
          onPress={() => void handleSignIn()}
        >
          <Text className="font-semibold text-rose-pine-base">
            {pending ? "Signing in…" : "Sign in"}
          </Text>
        </Pressable>
      </View>
      <Link href="/forgot-password">
        <Text className="text-sm text-rose-pine-foam underline">Forgot password?</Text>
      </Link>
    </View>
  );
}
