import Link from "next/link";
import { SignOutButton } from "@/components/SignOutButton";
import { getAuthenticatedUser } from "@/lib/auth";

export async function SiteHeader({ variant = "light" }: { variant?: "light" | "dark" }) {
  const user = await getAuthenticatedUser();
  const isDark = variant === "dark";

  return (
    <header className={isDark ? "border-b border-white/10 bg-[#0a0a0a]/90 backdrop-blur" : "border-b border-line bg-white/80 backdrop-blur"}>
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className={isDark ? "grid h-8 w-8 place-items-center rounded bg-red-500 text-sm text-white" : "grid h-8 w-8 place-items-center rounded bg-ink text-sm text-white"}>R</span>
          <span className={isDark ? "text-white" : undefined}>Redline</span>
        </Link>
        <nav className={isDark ? "flex items-center gap-4 text-sm text-zinc-400" : "flex items-center gap-4 text-sm text-gray-600"}>
          <Link href="/demo" className={isDark ? "hover:text-white" : "hover:text-ink"}>
            Demo app
          </Link>
          {user ? (
            <>
              <Link href="/dashboard" className={isDark ? "hover:text-white" : "hover:text-ink"}>
                Dashboard
              </Link>
              <SignOutButton />
            </>
          ) : (
            <>
              <Link href="/sign-in" className={isDark ? "hover:text-white" : "hover:text-ink"}>
                Sign in
              </Link>
              <Link href="/sign-up" className={isDark ? "rounded bg-white px-3 py-2 font-semibold text-zinc-950" : "rounded bg-ink px-3 py-2 font-semibold text-white"}>
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
