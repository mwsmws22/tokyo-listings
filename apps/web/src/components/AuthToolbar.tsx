"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Button, Paragraph, XStack } from "tamagui";

type Props = {
  email: string;
};

export function AuthToolbar({ email }: Props) {
  const router = useRouter();

  async function onSignOut() {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.replace("/login");
          router.refresh();
        },
      },
    });
  }

  return (
    <XStack
      paddingHorizontal="$4"
      paddingVertical="$3"
      borderBottomWidth={1}
      borderColor="$borderColor"
      justifyContent="space-between"
      alignItems="center"
      backgroundColor="$background"
    >
      <Paragraph size="$3" fontWeight="600">
        {email}
      </Paragraph>
      <Button size="$3" chromeless onPress={onSignOut}>
        Sign out
      </Button>
    </XStack>
  );
}
