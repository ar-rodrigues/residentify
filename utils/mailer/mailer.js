"use server";
import nodemailer from "nodemailer";
import { getWelcomeEmailTemplate } from "./templates/welcomeEmail";
import { getInvitationEmailTemplate } from "./templates/invitationEmail";
import { getApprovalEmailTemplate } from "./templates/approvalEmail";
import messagesEs from "../../messages/es.json";
import messagesPt from "../../messages/pt.json";

// Supported locales
const SUPPORTED_LOCALES = ["es", "pt"];
const DEFAULT_LOCALE = "es";

/**
 * Safely load messages for a given locale
 * @param {string} locale - The locale code
 * @returns {Promise<Object>} The messages object
 */
async function loadMessages(locale = DEFAULT_LOCALE) {
  // Validate and normalize locale
  const normalizedLocale =
    locale && typeof locale === "string" && SUPPORTED_LOCALES.includes(locale)
      ? locale
      : DEFAULT_LOCALE;

  // Use static imports for known locales
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

export async function sendEmail(email, name, password, subject, body) {
  try {
    const port = process.env.EMAIL_PORT || "587";
    const secure = port === "465";

    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE,
      host: process.env.EMAIL_HOST,
      port,
      secure,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    // Verify transporter configuration
    try {
      await transporter.verify();
      console.log("Email transporter verified successfully");
    } catch (verifyError) {
      console.error("Email transporter verification failed:", verifyError);
      throw verifyError;
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: subject || "Bienvenido",
      html: body,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", {
      messageId: info.messageId,
      response: info.response,
      accepted: info.accepted,
      rejected: info.rejected,
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Detailed error sending email:", {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code,
    });
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

export async function sendWelcomeEmail(
  email,
  name,
  password,
  baseUrl,
  locale = "es"
) {
  if (!baseUrl) {
    throw new Error("baseUrl is required for sending welcome email");
  }

  try {
    // Load translations for subject using safe loader
    const messages = await loadMessages(locale);
    const t = createTranslator(messages);

    const subject = t("emails.welcome.title");
    const body = await getWelcomeEmailTemplate(
      name,
      email,
      password,
      baseUrl,
      locale
    );

    console.log("Welcome email template generated successfully");
    return await sendEmail(email, name, password, subject, body);
  } catch (error) {
    console.error("Error in sendWelcomeEmail:", {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
    throw error;
  }
}

export async function sendInvitationEmail(
  email,
  firstName,
  lastName,
  organizationName,
  roleName,
  inviterName,
  invitationLink,
  locale = "es"
) {
  if (!invitationLink) {
    throw new Error("invitationLink is required for sending invitation email");
  }

  try {
    // Load translations for subject using safe loader
    const messages = await loadMessages(locale);
    const normalizedLocale =
      locale && typeof locale === "string" && SUPPORTED_LOCALES.includes(locale)
        ? locale
        : DEFAULT_LOCALE;

    const subject =
      normalizedLocale === "pt"
        ? `Convite para ${organizationName}`
        : `Invitación a ${organizationName}`;
    const body = await getInvitationEmailTemplate(
      firstName,
      lastName,
      organizationName,
      roleName,
      inviterName,
      invitationLink,
      normalizedLocale
    );

    console.log("Invitation email template generated successfully");
    return await sendEmail(
      email,
      `${firstName} ${lastName}`,
      null,
      subject,
      body
    );
  } catch (error) {
    console.error("Error in sendInvitationEmail:", {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
    throw error;
  }
}

export async function sendApprovalEmail(
  email,
  firstName,
  lastName,
  organizationName,
  baseUrl,
  locale = "es"
) {
  if (!baseUrl) {
    throw new Error("baseUrl is required for sending approval email");
  }

  try {
    // Load translations for subject using safe loader
    const messages = await loadMessages(locale);
    const t = createTranslator(messages);

    const subject = `${t("emails.approval.title")} - ${organizationName}`;
    const body = await getApprovalEmailTemplate(
      firstName,
      lastName,
      organizationName,
      baseUrl,
      locale
    );

    console.log("Approval email template generated successfully");
    return await sendEmail(
      email,
      `${firstName} ${lastName}`,
      null,
      subject,
      body
    );
  } catch (error) {
    console.error("Error in sendApprovalEmail:", {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
    throw error;
  }
}
