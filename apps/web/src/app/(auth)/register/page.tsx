"use client";

import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Input, Paragraph, Text, YStack } from "tamagui";

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
    <YStack gap="$3" width="100%">
      <Text fontSize="$8" fontWeight="700">
        Create account
      </Text>
      <Paragraph color="$color10" fontSize="$3">
        Already have an account?{" "}
        <Link href="/login">
          <Text color="$blue10" textDecorationLine="underline">
            Sign in
          </Text>
        </Link>
      </Paragraph>
      <YStack gap="$3">
        <YStack gap="$2">
          <Text fontWeight="600">Name</Text>
          <Input
            autoComplete="name"
            placeholder="Your name"
            value={name}
            onChangeText={setName}
            size="$4"
          />
        </YStack>
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
            autoComplete="new-password"
            placeholder="At least 8 characters"
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
        <Button size="$4" disabled={pending} onPress={() => void handleRegister()}>
          {pending ? "Creating account…" : "Register"}
        </Button>
      </YStack>
    </YStack>
  );
}
