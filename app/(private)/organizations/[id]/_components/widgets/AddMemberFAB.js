"use client";

import { useRouter } from "next/navigation";
import { RiUserAddLine } from "react-icons/ri";
import { useIsMobile } from "@/hooks/useMediaQuery";
import Button from "@/components/ui/Button";

export default function AddMemberFAB({ organizationId }) {
  const router = useRouter();
  const isMobile = useIsMobile();

  const handleClick = () => {
    router.push(`/organizations/${organizationId}/invite`);
  };

  return (
    <Button
      type="primary"
      shape="circle"
      icon={<RiUserAddLine className="text-xl" />}
      onClick={handleClick}
      className="!fixed !z-50 shadow-lg"
      style={{
        width: isMobile ? "56px" : "64px",
        height: isMobile ? "56px" : "64px",
        bottom: isMobile ? "80px" : "24px",
        right: isMobile ? "16px" : "24px",
      }}
      aria-label="Agregar miembro"
    />
  );
}

