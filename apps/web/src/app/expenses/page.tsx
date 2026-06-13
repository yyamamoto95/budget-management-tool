import { redirect } from "next/navigation";

/** /expenses → /records へリダイレクト */
export default function ExpensesRedirect() {
  redirect("/records");
}
