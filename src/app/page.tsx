import { redirect } from "next/navigation";

// Metadata
export const metadata = {
  title: "Backlink Bazaar - Redirecting...",
};

export default function HomePage() {
  // Mock: Varsayılan olarak publisher dashboard'a yönlendir
  redirect("/publisher/inventory");
}

