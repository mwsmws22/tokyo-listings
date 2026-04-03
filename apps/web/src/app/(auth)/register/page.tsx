"use client";

import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

const inputClass =
  "rounded-lg border border-rose-pine-highlight-med bg-rose-pine-surface px-3 py-3 text-rose-pine-text";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleRegister() {
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setPending(true);
    const { error: err } = await authClient.signUp.email({
      name,
      email,
      password,
      callbackURL: "/",
    });
    setPending(false);
    if (err) {
      setError(err.message ?? "Could not create account");
      return;
    }
    router.replace("/");
    router.refresh();
  }

  return (
    <View className="w-full gap-3">
      <Text className="text-3xl font-bold text-rose-pine-text">Create account</Text>
      <View className="flex-row flex-wrap gap-1">
        <Text className="text-sm text-rose-pine-muted">Already have an account?</Text>
        <Link href="/login">
          <Text className="text-sm text-rose-pine-foam underline">Sign in</Text>
        </Link>
      </View>
      <View className="gap-3">
        <View className="gap-2">
          <Text className="font-semibold text-rose-pine-text">Name</Text>
          <TextInput
            autoComplete="name"
            className={inputClass}
            placeholder="Your name"
            placeholderTextColor="var(--color-rose-pine-muted)"
            value={name}
            onChangeText={setName}
          />
        </View>
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
            autoComplete="new-password"
            className={inputClass}
            placeholder="At least 8 characters"
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
          className="items-center rounded-lg bg-rose-pine-highlight-med px-4 py-3 active:opacity-80 disabled:opacity-50"
          disabled={pending}
          onPress={() => void handleRegister()}
        >
          <Text className="font-semibold text-rose-pine-text">
            {pending ? "Creating account…" : "Register"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
