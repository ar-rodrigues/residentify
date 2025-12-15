"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Modal, Space } from "antd";
import { RiUserAddLine, RiLinksLine, RiMailLine } from "react-icons/ri";
import { useIsMobile } from "@/hooks/useMediaQuery";
import Button from "@/components/ui/Button";
import CreateGeneralInviteLinkForm from "./CreateGeneralInviteLinkForm";

export default function AddMemberFAB({
  organizationId,
  onSwitchToInvitations = null,
}) {
  const t = useTranslations();
  const router = useRouter();
  const isMobile = useIsMobile();
  const [modalOpen, setModalOpen] = useState(false);
  const [showLinkForm, setShowLinkForm] = useState(false);

  const handleClick = () => {
    setModalOpen(true);
    setShowLinkForm(false);
  };

  const handleInviteUser = () => {
    setModalOpen(false);
    router.push(`/organizations/${organizationId}/invite`);
  };

  const handleCreateLink = () => {
    setShowLinkForm(true);
  };

  const handleLinkCreated = (linkData) => {
    setModalOpen(false);
    setShowLinkForm(false);
    if (onSwitchToInvitations) {
      onSwitchToInvitations();
    }
  };

  const handleCancel = () => {
    setModalOpen(false);
    setShowLinkForm(false);
  };

  return (
    <>
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
        aria-label={t("organizations.addMember.ariaLabel")}
      />
      <Modal
        open={modalOpen}
        onCancel={handleCancel}
        footer={null}
        title={
          showLinkForm
            ? t("organizations.addMember.createLinkTitle")
            : t("organizations.addMember.modalTitle")
        }
        width={isMobile ? "90%" : 500}
        centered
        styles={{
          body: {
            maxHeight: isMobile ? "calc(100vh - 200px)" : "none",
            overflowY: "auto",
          },
        }}
        style={{
          maxWidth: isMobile ? "95vw" : "500px",
        }}
      >
        {showLinkForm ? (
          <CreateGeneralInviteLinkForm
            organizationId={organizationId}
            onSuccess={handleLinkCreated}
          />
        ) : (
          <Space orientation="vertical" size="large" className="w-full">
            <Button
              type="primary"
              icon={<RiMailLine />}
              onClick={handleInviteUser}
              size="large"
              className="w-full"
              block
            >
              {t("organizations.addMember.inviteUser")}
            </Button>
            <Button
              type="default"
              icon={<RiLinksLine />}
              onClick={handleCreateLink}
              size="large"
              className="w-full"
              block
            >
              {t("organizations.addMember.createLink")}
            </Button>
          </Space>
        )}
      </Modal>
    </>
  );
}
