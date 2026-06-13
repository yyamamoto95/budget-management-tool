import { redirect } from "next/navigation";

/** /calendar → /records へリダイレクト */
export default function CalendarRedirect() {
  redirect("/records");
}
