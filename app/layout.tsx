import "./globals.css";

import type { Metadata } from "next";

export const metadata: Metadata = {
  // without a title, warpcast won't validate your frame
  title: "frames.js starter",
  description: "...",
  openGraph: {/*Your frame metadata*/},
  other: {
    'of:accepts:xmtp': '2024-02-01', // Ensure this line is added or updated
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
