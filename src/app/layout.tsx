import { RootErrorBoundary } from '@/components/root-error-boundary';
import { cn } from '@/lib/utils';
import Providers from '@/providers/provider';
import type { Metadata } from 'next';
import { Caveat, Space_Grotesk } from 'next/font/google';

import './globals.css';

const space_grotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  weight: ['300', '400', '500'],
});

const caveat = Caveat({
  subsets: ['latin'],
  variable: '--font-caveat',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Social Media',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en' className='dark' suppressHydrationWarning>
      <head>
        <link rel='preload' as='image' href='/1.png' fetchPriority='high' />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.__webpackRecovery = function(msg) {
                if (/reading 'call'|ChunkLoadError|Loading chunk \\d+ failed|dynamically imported/.test(msg || '')) {
                  document.body.innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;padding:24px;font-family:system-ui;background:#0a0a0a;color:#fff;text-align:center;gap:16px">' +
                    '<p style="font-size:1.125rem">Something went wrong loading the page.</p>' +
                    '<p style="font-size:0.875rem;color:#888">Try refreshing. If it continues, clear your browser cache.</p>' +
                    '<button onclick="location.reload()" style="padding:12px 24px;border-radius:9999px;background:#CCFF00;color:#000;font-weight:500;border:none;cursor:pointer">Refresh page</button>' +
                    '</div>';
                  return true;
                }
                return false;
              };
              window.onerror = function(msg, src, line, col, err) {
                if (window.__webpackRecovery && window.__webpackRecovery(msg || (err && err.message))) return true;
                return false;
              };
              window.addEventListener('unhandledrejection', function(e) {
                var msg = e.reason && (e.reason.message || String(e.reason));
                if (window.__webpackRecovery && window.__webpackRecovery(msg)) e.preventDefault();
              });
            `,
          }}
        />
      </head>
      <body
        className={cn(
          space_grotesk.variable,
          space_grotesk.className,
          caveat.variable,
          'antialiased'
        )}
      >
        <Providers>
          <RootErrorBoundary>
            <div className='bg-gradient-image fixed inset-0'>
              <div className='relative h-screen overflow-y-auto'>
                {children}
              </div>
            </div>
          </RootErrorBoundary>
        </Providers>
      </body>
    </html>
  );
}
