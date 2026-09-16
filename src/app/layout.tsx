import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Face Attendance Terminal | Unified HR System",
  description: "Next-generation biometric access control and face recognition attendance kiosk with anti-spoofing liveness verification.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const storedTheme = localStorage.getItem('theme');
                if (storedTheme === 'light') {
                  document.documentElement.classList.remove('dark');
                  document.documentElement.classList.add('light');
                } else {
                  document.documentElement.classList.add('dark');
                  document.documentElement.classList.remove('light');
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-slate-950 text-slate-100 light:bg-slate-50 light:text-slate-900 selection:bg-emerald-500/30 transition-colors duration-200">
        {children}
        <Toaster
          position="top-right"
          richColors
        />
      </body>
    </html>
  );
}
