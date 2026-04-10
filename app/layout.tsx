import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'QuestTitan AI - Learn Python & ML Through Quests',
  description: 'Personalized AI Tutor with live code execution and gamified quests. Master Python, Machine Learning and more.',
  icons: {
    icon: '/favicon.ico',
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