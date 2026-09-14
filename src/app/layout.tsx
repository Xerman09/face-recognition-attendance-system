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
    <html lang="en" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500/30">
        {children}
        <Toaster
          theme="dark"
          position="top-right"
          richColors
          toastOptions={{
            style: {
              background: "#0f172a",
              borderColor: "rgba(255, 255, 255, 0.1)",
              color: "#f8fafc",
            },
          }}
        />
      </body>
    </html>
  );
}
