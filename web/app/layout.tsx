import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/nav/Navbar";
import { Footer } from "@/components/nav/Footer";

export const metadata: Metadata = {
  title: "Suvidha Setu — सुविधा सेतु",
  description:
    "Find the right Indian government scheme for you. 4,669 schemes intelligently filtered and ranked based on your eligibility.",
  keywords: [
    "government schemes",
    "suvidhasetu",
    "India",
    "welfare",
    "eligibility",
    "scholarship",
    "सरकारी योजना",
  ],
  openGraph: {
    title: "Suvidha Setu — सुविधा सेतु",
    description: "4,669 सरकारी योजनाएँ, आपके लिए सही एक।",
    locale: "en_IN",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className="flex flex-col min-h-screen antialiased"
        style={{ fontFamily: "var(--font-sans)" }}
      >
        <div className="flag-stripe" />
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
