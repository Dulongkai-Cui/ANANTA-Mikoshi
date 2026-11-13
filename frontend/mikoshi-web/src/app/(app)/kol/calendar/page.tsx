import { redirect } from "next/navigation";
import { kolStudioHref } from "@/features/kol-studio/modules";

/** Retired navigation entry; underlying KOL records remain intact. */
export default function RetiredKolPage() {
  redirect(kolStudioHref());
}
