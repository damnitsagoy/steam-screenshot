import type { Metadata } from "next";
import { JetBrains_Mono, VT323 } from "next/font/google";
import "./globals.css";

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});
const vt323 = VT323({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-vt323",
  display: "swap",
});

export const metadata: Metadata = {
  title: "STEAM://REPLAY — your gaming receipt",
  description:
    "Generate a retro-terminal receipt of your recently played Steam games. Shareable as a PNG.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${jetbrains.variable} ${vt323.variable}`}>
      <body className="min-h-screen bg-bg text-phosphor antialiased">
        {children}
      </body>
    </html>
  );
}
