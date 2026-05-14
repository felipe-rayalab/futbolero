import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Agentation } from "agentation";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter"
});

export const metadata: Metadata = {
  title: "El Futbolero - Mundial 2026",
  description: "Predice los resultados del Mundial 2026 y compite con tus amigos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
        {process.env.NODE_ENV === "development" && <Agentation serverUrl="http://localhost:4747" />}
      </body>
    </html>
  );
}
