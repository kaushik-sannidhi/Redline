import Link from "next/link";
import { SignOutButton } from "@/components/SignOutButton";
import { getAuthenticatedUser } from "@/lib/auth";

export async function SiteHeader() {
  const user = await getAuthenticatedUser();

  return (
    <header className="border-b border-line bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="grid h-8 w-8 place-items-center rounded bg-ink text-sm text-white">R</span>
          <span>Redline</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm text-gray-600">
          <Link href="/demo" className="hover:text-ink">
            Demo app
          </Link>
          {user ? (
            <>
              <Link href="/dashboard" className="hover:text-ink">
                Dashboard
              </Link>
              <SignOutButton />
            </>
          ) : (
            <>
              <Link href="/sign-in" className="hover:text-ink">
                Sign in
              </Link>
              <Link href="/sign-up" className="rounded bg-ink px-3 py-2 font-semibold text-white">
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
