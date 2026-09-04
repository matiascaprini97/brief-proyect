// lib/mail.ts
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

// NOTA: Mientras no tengas un dominio propio verificado en Resend,
// el remite DEBE ser "onboarding@resend.dev" y solo podés enviar mails
// a la casilla con la que te creaste la cuenta de Resend.
const FROM_EMAIL = "onboarding@resend.dev"

export async function sendWelcomeEmail(to: string, username: string, tempPass: string) {
  try {
    await resend.emails.send({
      from: `Sistema <${FROM_EMAIL}>`,
      to,
      subject: "¡Bienvenido a la plataforma!",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>¡Hola, ${username}! 👋</h2>
          <p>Te damos la bienvenida a nuestro sistema. Tu cuenta ha sido creada exitosamente.</p>
          <div style="background-color: #f4f4f5; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0 0 8px 0;"><strong>Tus credenciales de acceso:</strong></p>
            <p style="margin: 0;"><strong>Usuario:</strong> ${username}</p>
            <p style="margin: 0;"><strong>Contraseña temporal:</strong> ${tempPass}</p>
          </div>
          <p>Te recomendamos cambiar tu contraseña una vez que ingreses en la sección de perfil.</p>
        </div>
      `,
    })
    return { success: true }
  } catch (error) {
    console.error("❌ Error enviando mail de bienvenida:", error)
    return { success: false, error }
  }
}

export async function sendResetPasswordEmail(to: string, resetLink: string) {
  try {
    await resend.emails.send({
      from: `Seguridad <${FROM_EMAIL}>`,
      to,
      subject: "Restablecer contraseña",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Recuperación de Contraseña</h2>
          <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta.</p>
          <p>Hacé clic en el siguiente botón para crear una nueva contraseña. El enlace vence en 1 hora:</p>
          <a href="${resetLink}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 16px 0;">
            Restablecer Contraseña
          </a>
          <p style="color: #6b7280; font-size: 14px;">Si no solicitaste este cambio, podés ignorar este correo.</p>
        </div>
      `,
    })
    return { success: true }
  } catch (error) {
    console.error("❌ Error enviando mail de recuperación:", error)
    return { success: false, error }
  }
}