import type { Metadata } from "next";
import { LoginForm } from "@/components/ops/login-form";

export const metadata: Metadata = { title: "Admin sign in", robots: { index: false } };

export default async function LoginPage(props: PageProps<"/ops/login">) {
  const { next } = await props.searchParams;
  return <LoginForm next={typeof next === "string" ? next : "/ops"} />;
}
