export const getInvitationEmailTemplate = (
  firstName,
  lastName,
  organizationName,
  roleName,
  inviterName,
  invitationLink
) => {
  const genericLogo =
    "https://upload.wikimedia.org/wikipedia/commons/a/ac/No_image_available.svg";

  // Map role names to Spanish
  const roleNames = {
    admin: "Administrador",
    resident: "Residente",
    security_personnel: "Personal de Seguridad",
  };

  const roleDisplayName = roleNames[roleName] || roleName;

  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invitación a Organización</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #fafafa; color: #333; line-height: 1.6;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f0f0f0;">
            <!-- Header con logo genérico centrado -->
            <div style="text-align: center; margin-bottom: 20px;">
                <img src="${genericLogo}" alt="Logo" style="width: 64px; height: 44px; vertical-align: middle; margin-right: 0;">
            </div>
            
            <!-- Contenido Principal -->
            <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
                <h2 style="text-align: center; color: #2d2d2d; margin-top: 0; font-weight: 400; margin-bottom: 20px;">¡Has sido invitado!</h2>
                
                <p style="margin-bottom: 25px;">Hola <strong>${firstName} ${lastName}</strong>,</p>
                
                <p style="margin-bottom: 25px;">
                    <strong>${inviterName}</strong> te ha invitado a unirte a la organización 
                    <strong>${organizationName}</strong> con el rol de <strong>${roleDisplayName}</strong>.
                </p>
                
                <!-- Información de la Invitación -->
                <div style="background-color: #f5f7fa; padding: 20px; border-radius: 6px; margin-bottom: 25px;">
                    <h3 style="margin-top: 0; color: #2d2d2d; font-size: 16px; font-weight: 500;">Detalles de la Invitación</h3>
                    <p style="margin-bottom: 5px;"><strong>Organización:</strong> ${organizationName}</p>
                    <p style="margin-bottom: 5px;"><strong>Rol:</strong> ${roleDisplayName}</p>
                    <p style="margin-bottom: 0;"><strong>Invitado por:</strong> ${inviterName}</p>
                </div>
                
                <!-- Botón de Aceptación -->
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${invitationLink}" style="display: inline-block; background-color: #4A90E2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: 500; letter-spacing: 0.5px;">Aceptar Invitación</a>
                </div>
                
                <p style="color: #777; font-size: 14px; margin-bottom: 10px;">
                    Al hacer clic en el botón, serás redirigido a una página donde podrás completar tu registro 
                    y unirte a la organización.
                </p>
                
                <p style="color: #777; font-size: 14px;">Si el botón no funciona, puedes copiar y pegar este enlace en tu navegador:</p>
                <p style="word-break: break-all; font-size: 14px; color: #4A90E2;">${invitationLink}</p>
                
                <p style="color: #999; font-size: 12px; margin-top: 25px; padding-top: 20px; border-top: 1px solid #eee;">
                    <strong>Nota:</strong> Esta invitación expirará en 7 días. Si no aceptas la invitación antes de esa fecha, 
                    deberás solicitar una nueva invitación.
                </p>
            </div>
            
            <!-- Footer -->
            <div style="text-align: center; margin-top: 30px; color: #999; font-size: 13px;">
                <p>Si no esperabas esta invitación, puedes ignorar este correo.</p>
                <p style="margin-top: 20px;">&copy; ${new Date().getFullYear()} Tu Organización. Todos los derechos reservados.</p>
            </div>
        </div>
    </body>
    </html>
  `;
};





