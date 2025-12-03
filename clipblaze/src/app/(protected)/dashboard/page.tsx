import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ZapIcon } from "@/components/icons";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

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

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {displayName}!
          </h1>
          <p className="text-muted-foreground">
            Start creating viral clips from your videos.
          </p>
        </div>

        {/* Upload area */}
        <div className="bg-neutral-900 border border-white/10 border-dashed rounded-2xl p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-white/40"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">Upload your video</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Drag and drop or click to upload. MP4, MOV up to 2GB.
          </p>
          <button className="bg-white text-black font-semibold px-6 py-2 rounded-lg hover:bg-white/90 transition-colors">
            Choose file
          </button>
        </div>
      </main>
    </div>
  );
}
