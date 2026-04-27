import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EvasãoZero",
  description: "Previsão de evasão acadêmica com IA",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
