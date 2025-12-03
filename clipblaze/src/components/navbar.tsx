"use client";

import { Button } from "@/components/ui/button";
import { ZapIcon } from "./icons";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import type { User } from "@supabase/supabase-js";

export function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Get avatar URL - use Google avatar or fallback to random avatar API
  const getAvatarUrl = (user: User) => {
    return (
      user.user_metadata?.avatar_url ||
      user.user_metadata?.picture ||
      `https://avatar.iran.liara.run/public?username=${user.email}`
    );
  };

  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-6xl">
      <div className="glass-card rounded-2xl px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
            <ZapIcon className="w-5 h-5 text-black" />
          </div>
          <span className="text-xl font-bold tracking-tight">ClipBlaze</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <a
            href="#features"
            className="text-sm text-muted-foreground hover:text-white transition-colors"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="text-sm text-muted-foreground hover:text-white transition-colors"
          >
            How it works
          </a>
          <a
            href="#pricing"
            className="text-sm text-muted-foreground hover:text-white transition-colors"
          >
            Pricing
          </a>
        </div>

        <div className="flex items-center gap-3">
          {loading ? (
            <div className="w-20 h-9" />
          ) : user ? (
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <img
                  src={getAvatarUrl(user)}
                  alt="Avatar"
                  className="w-8 h-8 rounded-full border border-white/20"
                />
                <span className="text-sm hidden sm:block">
                  {user.user_metadata?.full_name ||
                    user.email?.split("@")[0]}
                </span>
              </Link>
              <form action="/auth/signout" method="post">
                <Button
                  type="submit"
                  variant="ghost"
                  className="text-sm text-muted-foreground hover:text-white"
                >
                  Sign out
                </Button>
              </form>
            </div>
          ) : (
            <>
              <Button variant="ghost" className="text-sm" asChild>
                <Link href="/login">Sign in</Link>
              </Button>
              <Button
                className="text-sm bg-white text-black hover:bg-white/90"
                asChild
              >
                <Link href="/login">Get Started Free</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
