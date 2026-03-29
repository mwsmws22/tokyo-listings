"use client";

import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Button, Input, Paragraph, Text, YStack } from "tamagui";

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
      <YStack gap="$3" width="100%">
        <Text fontSize="$8" fontWeight="700">
          Invalid link
        </Text>
        <Paragraph color="$color10">
          This reset link is missing a token. Request a new link from the forgot password page.
        </Paragraph>
        <Link href="/forgot-password">
          <Text color="$blue10" textDecorationLine="underline">
            Forgot password
          </Text>
        </Link>
      </YStack>
    );
  }

  return (
    <YStack gap="$3" width="100%">
      <Text fontSize="$8" fontWeight="700">
        Set a new password
      </Text>
      <Paragraph color="$color10" fontSize="$3">
        Choose a new password for your account.
      </Paragraph>
      <YStack gap="$3">
        <YStack gap="$2">
          <Text fontWeight="600">New password</Text>
          <Input
            autoComplete="new-password"
            placeholder="At least 8 characters"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            size="$4"
          />
        </YStack>
        <YStack gap="$2">
          <Text fontWeight="600">Confirm password</Text>
          <Input
            autoComplete="new-password"
            placeholder="Repeat password"
            secureTextEntry
            value={confirm}
            onChangeText={setConfirm}
            size="$4"
          />
        </YStack>
        {error ? (
          <Paragraph color="$red10" role="alert">
            {error}
          </Paragraph>
        ) : null}
        <Button size="$4" disabled={pending} onPress={() => void handleReset()}>
          {pending ? "Updating…" : "Update password"}
        </Button>
      </YStack>
    </YStack>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <Text color="$color10" padding="$4">
          Loading…
        </Text>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
