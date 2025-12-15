import messagesEs from "../../../messages/es.json";
import messagesPt from "../../../messages/pt.json";

const SUPPORTED_LOCALES = ["es", "pt"];
const DEFAULT_LOCALE = "es";

/**
 * Safely load messages for a given locale
 * @param {string} locale - The locale code
 * @returns {Object} The messages object
 */
function loadMessages(locale = DEFAULT_LOCALE) {
  const normalizedLocale =
    locale && typeof locale === "string" && SUPPORTED_LOCALES.includes(locale)
      ? locale
      : DEFAULT_LOCALE;

  switch (normalizedLocale) {
    case "pt":
      return messagesPt;
    case "es":
    default:
      return messagesEs;
  }
}

/**
 * Create a translation function from messages
 * @param {Object} messages - The messages object
 * @returns {Function} Translation function
 */
function createTranslator(messages) {
  return (key) => {
    const keys = key.split(".");
    let value = messages;
    for (const k of keys) {
      value = value?.[k];
    }
    return value || key;
  };
}

export const getWelcomeEmailTemplate = async (
  name,
  email,
  password,
  baseUrl,
  locale = "es"
) => {
  // Puedes cambiar este logo por el de tu organización si lo deseas
  const genericLogo =
    "https://upload.wikimedia.org/wikipedia/commons/a/ac/No_image_available.svg";

  // Load translations based on locale using safe loader
  const messages = loadMessages(locale);
  const t = createTranslator(messages);

  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${t("emails.welcome.title")}</title>
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
                  "emails.welcome.greeting"
                )} ${name}!</h2>
                
                <p style="margin-bottom: 25px;">${t(
                  "emails.welcome.welcomeMessage"
                )}</p>
                
                <!-- Datos de Acceso -->
                <div style="background-color: #f5f7fa; padding: 20px; border-radius: 6px; margin-bottom: 25px;">
                    <h3 style="margin-top: 0; color: #2d2d2d; font-size: 16px; font-weight: 500;">${t(
                      "emails.welcome.credentialsTitle"
                    )}</h3>
                    <p style="margin-bottom: 5px;"><strong>${t(
                      "emails.welcome.email"
                    )}:</strong> ${email}</p>
                    <p style="margin-bottom: 0;"><strong>${t(
                      "emails.welcome.password"
                    )}:</strong> ${password}</p>
                </div>
                
                <!-- Botón de Confirmación -->
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${baseUrl}" style="display: inline-block; background-color: #4A90E2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: 500; letter-spacing: 0.5px;">${t(
    "emails.welcome.loginButton"
  )}</a>
                </div>
                
                <p style="color: #777; font-size: 14px;">${t(
                  "emails.welcome.loginInstructions"
                )}</p>
                <p style="word-break: break-all; font-size: 14px; color: #4A90E2;">${baseUrl}</p>
            </div>
            
            <!-- Footer -->
            <div style="text-align: center; margin-top: 30px; color: #999; font-size: 13px;">
                <p>${t("emails.welcome.changePasswordNote")}</p>
                <p style="margin-top: 20px;">&copy; ${new Date().getFullYear()} ${t(
    "emails.welcome.companyName"
  )}. ${t("emails.welcome.allRightsReserved")}</p>
            </div>
        </div>
    </body>
    </html>
  `;
};
