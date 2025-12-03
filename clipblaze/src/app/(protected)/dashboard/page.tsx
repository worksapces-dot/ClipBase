import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ZapIcon } from "@/components/icons";
import { DashboardContent } from "./dashboard-content";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch user's videos
  const { data: videos } = await supabase
    .from("videos")
    .select(`*, clips (*)`)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const avatarUrl =
    user.user_metadata?.avatar_url ||
    user.user_metadata?.picture ||
    `https://avatar.iran.liara.run/public?username=${user.email}`;

  const displayName =
    user.user_metadata?.full_name || user.email?.split("@")[0];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
              <ZapIcon className="w-5 h-5 text-black" />
            </div>
            <span className="text-xl font-bold">ClipBlaze</span>
          </Link>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <img
                src={avatarUrl}
                alt="Avatar"
                className="w-9 h-9 rounded-full border border-white/20"
              />
              <div className="hidden sm:block">
                <p className="text-sm font-medium">{displayName}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="text-sm text-muted-foreground hover:text-white transition-colors"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <DashboardContent 
        displayName={displayName || "there"} 
        initialVideos={videos || []} 
      />
    </div>
  );
}
