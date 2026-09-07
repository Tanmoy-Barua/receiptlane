import type { Metadata } from "next";
import { IBM_Plex_Mono, Share_Tech_Mono } from "next/font/google";
import "./globals.css";

const shareTech = Share_Tech_Mono({
  variable: "--font-share-tech",
  subsets: ["latin"],
  weight: "400",
});

const ibmMono = IBM_Plex_Mono({
  variable: "--font-ibm-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "ReceiptLane — USCIS Any-Case Tracker",
  description:
    "Track any USCIS case by receipt number. Supports EAC, WAC, LIN, SRC, MSC, NBC, IOE, YSC and more.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${shareTech.variable} ${ibmMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
