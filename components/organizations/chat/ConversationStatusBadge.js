"use client";

import { Tag } from "antd";

export default function ConversationStatusBadge({ status }) {
  if (!status || status === "active") {
    return null;
  }

  const statusConfig = {
    archived: {
      color: "default",
      text: "Archivada",
    },
  };

  const config = statusConfig[status];

  if (!config) {
    return null;
  }

  return (
    <Tag color={config.color} className="m-0" size="small">
      {config.text}
    </Tag>
  );
}









