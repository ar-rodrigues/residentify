import BillingPageClient from "./BillingPageClient";

export default async function BillingPage({ params }) {
  const { id } = await params;
  return <BillingPageClient organizationId={id} />;
}
