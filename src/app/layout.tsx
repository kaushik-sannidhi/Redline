import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { AppwritePing } from "@/components/AppwritePing";
import { env } from "@/lib/env";

const NOVUS_PENDO_API_KEY = env.NEXT_PUBLIC_NOVUS_APP_ID || "0af03862-123b-43f8-88dc-d85142de7226";

export const metadata: Metadata = {
  title: "Redline",
  description: "Pre-launch security checks for AI-built apps."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Script
          id="novus-pendo-loader"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
(function(apiKey){
  (function(p,e,n,d,o){var v,w,x,y,z;o=p[d]=p[d]||{};o._q=o._q||[];
  v=['initialize','identify','updateOptions','pageLoad','track','trackAgent'];for(w=0,x=v.length;w<x;++w)(function(m){
  o[m]=o[m]||function(){o._q[m===v[0]?'unshift':'push']([m].concat([].slice.call(arguments,0)));};})(v[w]);
  y=e.createElement(n);y.async=!0;y.src='https://cdn.pendo.io/agent/static/'+apiKey+'/pendo.js';
  z=e.getElementsByTagName(n)[0];z.parentNode.insertBefore(y,z);})(window,document,'script','pendo');
})('${NOVUS_PENDO_API_KEY}');

pendo.initialize({
  visitor: {
    id: ''
  }
});
`
          }}
        />
        <AppwritePing />
        {children}
      </body>
    </html>
  );
}
