"use client";

import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Input, Paragraph, Text, YStack } from "tamagui";

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
    <YStack gap="$3" width="100%">
      <Text fontSize="$8" fontWeight="700">
        Sign in
      </Text>
      <Paragraph color="$color10" fontSize="$3">
        Use your email and password. No account?{" "}
        <Link href="/register">
          <Text color="$blue10" textDecorationLine="underline">
            Register
          </Text>
        </Link>
      </Paragraph>
      <YStack gap="$3">
        <YStack gap="$2">
          <Text fontWeight="600">Email</Text>
          <Input
            autoComplete="email"
            inputMode="email"
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
            size="$4"
          />
        </YStack>
        <YStack gap="$2">
          <Text fontWeight="600">Password</Text>
          <Input
            autoComplete="current-password"
            placeholder="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            size="$4"
          />
        </YStack>
        {error ? (
          <Paragraph color="$red10" role="alert">
            {error}
          </Paragraph>
        ) : null}
        <Button size="$4" disabled={pending} onPress={() => void handleSignIn()}>
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </YStack>
      <Link href="/forgot-password">
        <Text color="$blue10" fontSize="$3" textDecorationLine="underline">
          Forgot password?
        </Text>
      </Link>
    </YStack>
  );
}
