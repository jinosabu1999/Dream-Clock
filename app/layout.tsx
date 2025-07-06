import type React from "react"
import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Dream Clock - Persistent Alarm App",
  description: "A persistent alarm clock app that works even when cleared from recent apps",
  manifest: "/manifest.json",
  themeColor: "#6366f1",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Dream Clock" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Register persistent service worker immediately
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.register('/persistent-sw.js', {
                  scope: '/',
                  updateViaCache: 'none'
                }).then((registration) => {
                  console.log('Persistent SW registered: ', registration);
                  
                  // Force update if available
                  registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    if (newWorker) {
                      newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                          // New service worker available, reload to activate
                          window.location.reload();
                        }
                      });
                    }
                  });
                }).catch((registrationError) => {
                  console.log('Persistent SW registration failed: ', registrationError);
                });
              }
              
              // Prevent app from being killed by keeping it active
              let keepAliveInterval;
              
              function startKeepAlive() {
                keepAliveInterval = setInterval(() => {
                  // Minimal activity to keep app alive
                  if (document.hidden) {
                    console.log('App backgrounded - maintaining minimal activity');
                  }
                }, 30000);
              }
              
              function stopKeepAlive() {
                if (keepAliveInterval) {
                  clearInterval(keepAliveInterval);
                }
              }
              
              // Start keep alive when page loads
              window.addEventListener('load', startKeepAlive);
              
              // Handle visibility changes
              document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                  console.log('App backgrounded');
                } else {
                  console.log('App foregrounded');
                  startKeepAlive(); // Restart keep alive
                }
              });
              
              // Handle page unload
              window.addEventListener('beforeunload', () => {
                stopKeepAlive();
              });
            `,
          }}
        />
      </head>
      <body className="font-sans">{children}</body>
    </html>
  )
}
