import { requireRouteAccess } from "@/utils/auth/organization";
import ChatWidget from "@/components/organizations/ChatWidget";

export default async function ChatPage({ params }) {
  const { id } = await params;

  // Server-side authorization check - redirects if unauthorized
  await requireRouteAccess(id, "/chat");

  return (
    <div className="w-full">
      <div className="h-[600px]">
        <ChatWidget organizationId={id} />
      </div>
    </div>
  );
}
