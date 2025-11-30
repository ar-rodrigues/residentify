"use client";

import { RiQrCodeLine } from "react-icons/ri";
import { useIsMobile } from "@/hooks/useMediaQuery";
import Button from "@/components/ui/Button";

export default function GenerateInviteFAB({ organizationId, onClick, loading = false }) {
  const isMobile = useIsMobile();

  return (
    <Button
      type="primary"
      shape="circle"
      icon={<RiQrCodeLine className="text-xl" />}
      onClick={onClick}
      loading={loading}
      className="!fixed !z-50 shadow-lg"
      style={{
        width: isMobile ? "56px" : "64px",
        height: isMobile ? "56px" : "64px",
        bottom: isMobile ? "80px" : "24px",
        right: isMobile ? "16px" : "24px",
      }}
      aria-label="Generar invitación"
    />
  );
}

