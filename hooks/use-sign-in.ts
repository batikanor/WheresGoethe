import { MESSAGE_EXPIRATION_TIME } from "@/lib/constants";
import { NeynarUser } from "@/lib/neynar";
import { useAuthenticate, useMiniKit } from "@coinbase/onchainkit/minikit";
import { useCallback, useEffect, useState } from "react";

export const useSignIn = ({ autoSignIn = false }: { autoSignIn?: boolean }) => {
  const { context } = useMiniKit();
  // this method allows for Sign in with Farcaster (SIWF)
  const { signIn } = useAuthenticate();
  const [user, setUser] = useState<NeynarUser | null>(null);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!context) {
        throw new Error("No context found");
      }
      let referrerFid: number | null = null;
      const result = await signIn({
        nonce: Math.random().toString(36).substring(2),
        notBefore: new Date().toISOString(),
        expirationTime: new Date(
          Date.now() + MESSAGE_EXPIRATION_TIME
        ).toISOString(),
      });
      if (!result) {
        throw new Error("Sign in failed");
      }
      referrerFid =
        context.location?.type === "cast_embed"
          ? context.location.cast.fid
          : null;

      const res = await fetch("/api/auth/sign-in", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          signature: result.signature,
          message: result.message,
          fid: context.user.fid,
          referrerFid,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error(errorData);
        throw new Error(errorData.message || "Sign in failed");
      }

      const data = await res.json();
      console.log("data", data);
      setUser(data.user);
      setIsSignedIn(true);
      return data;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Sign in failed";
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [context, signIn]);

  const mockSignIn = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch("/api/auth/mock", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Mock sign in failed");
      }
      const data = await res.json();
      setUser(data.user);
      setIsSignedIn(true);
      return data;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Mock sign in failed";
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // if autoSignIn is true, sign in automatically on mount
    if (autoSignIn) {
      handleSignIn();
    }
  }, [autoSignIn, handleSignIn]);

  return {
    signIn: handleSignIn,
    mockSignIn,
    isSignedIn,
    isLoading,
    error,
    user,
  };
};
