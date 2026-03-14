import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Friends",
  description: "Connect with friends and see what they're reading and watching.",
};

export default function FriendsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
