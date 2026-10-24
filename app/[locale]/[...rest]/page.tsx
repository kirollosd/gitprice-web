import { notFound } from "next/navigation";

// Unmatched paths land here so the localized [locale]/not-found renders inside the layout.
export default function CatchAll() {
  notFound();
}
