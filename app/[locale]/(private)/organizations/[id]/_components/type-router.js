"use client";

import { useTranslations } from "next-intl";
import { Card } from "antd";
import AdminView from "./views/residential/AdminView";
import ResidentView from "./views/residential/ResidentView";
import SecurityView from "./views/residential/SecurityView";

/**
 * TypeRouter component routes to the correct type-specific view
 * based on organization type and user role
 *
 * @param {Object} props
 * @param {string} props.organizationType - The type of organization (e.g., 'residential', 'commercial', 'office')
 * @param {string} props.userRole - The user's role in the organization (e.g., 'admin', 'resident', 'security')
 * @param {string} props.organizationId - The organization ID
 */
export default function TypeRouter({
  organizationType,
  userRole,
  organizationId,
}) {
  const t = useTranslations();
  
  // Handle missing organization type or user role
  if (!organizationType || !userRole) {
    return (
      <Card title={t("organizations.typeRouter.infoTitle")}>
        <p className="text-gray-500">
          {!organizationType && !userRole
            ? t("organizations.typeRouter.errors.cannotDetermineTypeOrRole")
            : !organizationType
            ? t("organizations.typeRouter.errors.cannotDetermineType")
            : t("organizations.typeRouter.errors.noRoleAssigned")}
        </p>
      </Card>
    );
  }

  // Route based on organization type
  switch (organizationType) {
    case "residential":
      return routeResidentialView(userRole, organizationId, t);

    // Future organization types can be added here:
    // case "commercial":
    //   return routeCommercialView(userRole, organizationId);
    // case "office":
    //   return routeOfficeView(userRole, organizationId);

    default:
      return (
        <Card title={t("organizations.typeRouter.infoTitle")}>
          <p className="text-gray-500">
            {t("organizations.typeRouter.errors.unknownType", { type: organizationType })}
          </p>
        </Card>
      );
  }
}

/**
 * Routes to the appropriate residential view based on user role
 */
function routeResidentialView(userRole, organizationId, t) {
  switch (userRole) {
    case "admin":
      return <AdminView organizationId={organizationId} />;
    case "resident":
      return <ResidentView organizationId={organizationId} />;
    case "security":
      return <SecurityView organizationId={organizationId} />;
    default:
      return (
        <Card title={t("organizations.typeRouter.infoTitle")}>
          <p className="text-gray-500">
            {t("organizations.typeRouter.errors.unknownResidentialRole", { role: userRole })}
          </p>
        </Card>
      );
  }
}

