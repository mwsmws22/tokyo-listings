"use client";

import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import { useState } from "react";
import { Button, Input, Paragraph, Text, YStack } from "tamagui";

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
      <YStack gap="$3" width="100%">
        <Text fontSize="$8" fontWeight="700">
          Check your email
        </Text>
        <Paragraph color="$color10">
          If an account exists for that address, we sent a link to reset your password.
        </Paragraph>
        <Link href="/login">
          <Text color="$blue10" textDecorationLine="underline">
            Back to sign in
          </Text>
        </Link>
      </YStack>
    );
  }

  return (
    <YStack gap="$3" width="100%">
      <Text fontSize="$8" fontWeight="700">
        Forgot password
      </Text>
      <Paragraph color="$color10" fontSize="$3">
        Enter your email and we&apos;ll send a reset link.{" "}
        <Link href="/login">
          <Text color="$blue10" textDecorationLine="underline">
            Sign in
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
        {error ? (
          <Paragraph color="$red10" role="alert">
            {error}
          </Paragraph>
        ) : null}
        <Button size="$4" disabled={pending} onPress={() => void handleRequest()}>
          {pending ? "Sending…" : "Send reset link"}
        </Button>
      </YStack>
    </YStack>
  );
}
