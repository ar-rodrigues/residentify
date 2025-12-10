export const getApprovalEmailTemplate = async (
  firstName,
  lastName,
  organizationName,
  baseUrl,
  locale = "es"
) => {
  const genericLogo =
    "https://upload.wikimedia.org/wikipedia/commons/a/ac/No_image_available.svg";

  // Load translations based on locale
  const messages = await import(`../../../messages/${locale}.json`);
  const t = (key) => {
    const keys = key.split(".");
    let value = messages.default;
    for (const k of keys) {
      value = value?.[k];
    }
    return value || key;
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${t("emails.approval.title")}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #fafafa; color: #333; line-height: 1.6;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f0f0f0;">
            <!-- Header con logo genérico centrado -->
            <div style="text-align: center; margin-bottom: 20px;">
                <img src="${genericLogo}" alt="Logo" style="width: 64px; height: 44px; vertical-align: middle; margin-right: 0;">
            </div>
            
            <!-- Contenido Principal -->
            <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
                <h2 style="text-align: center; color: #2d2d2d; margin-top: 0; font-weight: 400; margin-bottom: 20px;">${t(
                  "emails.approval.title"
                )}!</h2>
                
                <p style="margin-bottom: 25px;">${t(
                  "emails.approval.greeting"
                )} <strong>${firstName} ${lastName}</strong>,</p>
                
                <p style="margin-bottom: 25px;">
                    ${t("emails.approval.approvalMessage")} 
                    <strong>${organizationName}</strong>.
                </p>
                
                <!-- Información de la Aprobación -->
                <div style="background-color: #f6ffed; border: 1px solid #b7eb8f; padding: 20px; border-radius: 6px; margin-bottom: 25px;">
                    <h3 style="margin-top: 0; color: #389e0d; font-size: 16px; font-weight: 500;">${t(
                      "emails.approval.welcomeTo"
                    )} ${organizationName}!</h3>
                    <p style="margin-bottom: 0; color: #389e0d;">
                        ${t("emails.approval.accessMessage")}
                    </p>
                </div>
                
                <!-- Botón de Acceso -->
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${baseUrl}/login" style="display: inline-block; background-color: #52c41a; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: 500; letter-spacing: 0.5px;">${t(
    "emails.approval.loginButton"
  )}</a>
                </div>
                
                <p style="color: #777; font-size: 14px;">${t(
                  "emails.approval.loginInstructions"
                )}</p>
                <p style="word-break: break-all; font-size: 14px; color: #4A90E2;">${baseUrl}/login</p>
            </div>
            
            <!-- Footer -->
            <div style="text-align: center; margin-top: 30px; color: #999; font-size: 13px;">
                <p>&copy; ${new Date().getFullYear()} ${t(
    "emails.approval.companyName"
  )}. ${t("emails.approval.allRightsReserved")}</p>
            </div>
        </div>
    </body>
    </html>
  `;
};
