import "./globals.css";

import type { Metadata } from "next";

export const metadata: Metadata = {
  // without a title, warpcast won't validate your frame
  title: "FrameQuest",
  description: "FrameQuest: Dive into an immersive Frames-based text adventure where your imagination sets the boundaries. Choose from an array of genres and embark on a journey limited only by your choices. Fully interoperable with the Open Frames Standard and powered by OpenAI's cutting-edge technology, FrameQuest offers a uniquely flexible and dynamic adventure experience, all seamlessly integrated with Next.js for smooth and responsive gameplay. Start your quest today and shape your destiny in the world of FrameQuest!",
  openGraph: {},
  other: {
    'of:version': "vNext",
    'of:accepts:$protocol_identifier': 'vNext',
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
