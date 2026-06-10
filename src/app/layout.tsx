import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { AppwritePing } from "@/components/AppwritePing";
import { env } from "@/lib/env";

export const metadata: Metadata = {
  title: "Redline",
  description: "Pre-launch security checks for AI-built apps."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {env.NEXT_PUBLIC_NOVUS_APP_ID ? (
          <Script
            id="novus-loader"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `window.novus=window.novus||{track:function(){(window.novus.q=window.novus.q||[]).push(arguments)}};window.novusAppId="${env.NEXT_PUBLIC_NOVUS_APP_ID}";`
            }}
          />
        ) : null}
        <AppwritePing />
        {children}
      </body>
    </html>
  );
}
