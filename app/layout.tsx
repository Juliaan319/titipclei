import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: "Titip Clei | Jastip manis, belanja praktis",
  description: "Titip Clei membantu belanja titip luar negeri dengan mudah dan aman.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col"><Toaster>{children}</Toaster></body>
    </html>
  );
}
