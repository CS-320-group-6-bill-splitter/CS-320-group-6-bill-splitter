import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { AuthProvider } from "@/context/auth-context";
import { Header } from "@/components/layout/header";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Splitseas",
  description: "Split bills with your groups",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col m-0 p-0 font-sans">
        <AuthProvider>
          <Header />
          <main className="flex-1">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
