import { notFound } from "next/navigation";
import Link from "next/link";
import { Comparison } from "@/components/research/comparison";

export default async function ComparisonPreview() {
  if (process.env.NODE_ENV !== "development") notFound();
  const { fixtures } = await import("@/components/research/catalog-fixtures");
  return (
    <>
      <p className="research-notice">
        Development preview. Boat names and specifications are fictional.
        Financial results use your inputs.
      </p>
      <div className="research-block">
        <Link href="/research-preview/model">Back to model preview</Link>
        <h1>Compare boats</h1>
        <p>
          Compare two or three demo boats. Use the cost assumptions under each
          column to compare monthly cash flow and five-year spending.
        </p>
      </div>
      <Comparison records={[fixtures[0], fixtures[1], fixtures[2]]} />
    </>
  );
}
