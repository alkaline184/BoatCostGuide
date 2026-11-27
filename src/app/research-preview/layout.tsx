import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function PrototypeLayout({ children }: { children: ReactNode }) {
  if (process.env.NODE_ENV !== "development") notFound();
  return (
    <div className="container research-preview">
      <p className="research-notice">
        Development preview. Boat names and specifications are fictional.
        Financial results use your inputs.
      </p>
      {children}
    </div>
  );
}
