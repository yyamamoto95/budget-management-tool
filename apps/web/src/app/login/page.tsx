import type { Metadata } from "next";
import { LoginForm } from "@/components/login/LoginForm";

export const metadata: Metadata = {
  title: "ログイン | 家計管理",
};

type Props = {
  searchParams: Promise<{ expired?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const { expired } = await searchParams;
  return <LoginForm sessionExpired={expired === "1"} />;
}
