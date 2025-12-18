import { requireRouteAccess } from "@/utils/auth/organization";
import ChatWidget from "@/components/organizations/ChatWidget";

export default async function ChatPage({ params }) {
  const { id } = await params;

  // Server-side authorization check - redirects if unauthorized
  await requireRouteAccess(id, "/chat");

  return (
    <div className="w-full h-full flex flex-col" style={{ minHeight: "100%" }}>
      <div className="h-full w-full flex-1">
        <ChatWidget organizationId={id} />
      </div>
    </div>
  );
}
