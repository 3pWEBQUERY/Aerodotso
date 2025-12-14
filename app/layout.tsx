import type { Metadata } from "next";
import { Oswald } from "next/font/google";
import { AuthProvider } from "@/components/providers/session-provider";
import { UploadProvider } from "@/components/providers/upload-provider";
import "./globals.css";

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Aera - Where everything comes together.",
  description: "Where everything comes together.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${oswald.variable} antialiased font-oswald`}
        suppressHydrationWarning
      >
        <AuthProvider>
          <UploadProvider>{children}</UploadProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
