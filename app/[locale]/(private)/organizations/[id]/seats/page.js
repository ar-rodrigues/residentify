import SeatsPageClient from "./SeatsPageClient";

export default async function SeatsPage({ params }) {
  const { id } = await params;
  return <SeatsPageClient organizationId={id} />;
}
