import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_EMAIL = "contact@phiit-equipments.com"

// 1. Mail de Bienvenida y Creación de Usuario (con credenciales)
export async function sendWelcomeEmail(to: string, username: string, tempPass: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: `PHiiT <${FROM_EMAIL}>`,
      to,
      subject: "¡Bienvenido a PHiiT!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6;">
          <h2 style="color: #111; margin-bottom: 20px;">¡Bienvenido a PHiiT! 👋</h2>
          
          <p>Desde ahora vas a tener acceso a toda la información de tus equipos en un solo lugar: manual de uso, garantía, documentación de compra y seguimiento de cada reformer.</p>

          <p>Además, vas a poder consultar el estado y las revisiones recomendadas de sus principales componentes.</p>

          <div style="background-color: #f4f4f5; border-left: 4px solid #000; padding: 16px; border-radius: 6px; margin: 24px 0;">
            <p style="margin: 0 0 8px 0; font-weight: bold; color: #111;">Tus credenciales de acceso:</p>
            <p style="margin: 0 0 4px 0;"><strong>Usuario:</strong> ${username}</p>
            <p style="margin: 0;"><strong>Contraseña temporal:</strong> ${tempPass}</p>
          </div>

          <p><strong>Gracias por elegir PHiiT.</strong></p>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="font-size: 13px; color: #6b7280; margin: 0;">
            Te recomendamos cambiar tu contraseña una vez que ingreses en la sección de perfil.
          </p>
        </div>
      `,
    })

    if (error) {
      console.error("❌ Error de Resend:", error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (error) {
    console.error("❌ Error inesperado enviando mail de bienvenida:", error)
    return { success: false, error }
  }
}

// 2. Mail de Restablecer Contraseña
export async function sendResetPasswordEmail(to: string, resetLink: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: `Seguridad PHiiT <${FROM_EMAIL}>`,
      to,
      subject: "Restablecer contraseña - PHiiT",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6;">
          <h2 style="color: #111;">Recuperación de Contraseña</h2>
          <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en PHiiT.</p>
          <p>Hacé clic en el siguiente botón para crear una nueva contraseña. El enlace vence en 1 hora:</p>
          <a href="${resetLink}" style="display: inline-block; background-color: #000; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 16px 0;">
            Restablecer Contraseña
          </a>
          <p style="color: #6b7280; font-size: 14px;">Si no solicitaste este cambio, podés ignorar este correo.</p>
        </div>
      `,
    })

    if (error) {
      console.error("❌ Error de Resend:", error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (error) {
    console.error("❌ Error inesperado enviando mail de recuperación:", error)
    return { success: false, error }
  }
}

// 3. Mail de Confirmación de Compra
export async function sendPurchaseConfirmationEmail(to: string, productName: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: `PHiiT <${FROM_EMAIL}>`,
      to,
      subject: "¡Gracias por tu compra en PHiiT!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6;">
          <h2 style="color: #111;">¡Gracias por tu compra en PHiiT!</h2>
          <p>Tu solicitud para el producto <strong>${productName}</strong> ha sido procesada con éxito.</p>
          <p>Podés consultar toda la información detallada de tu compra, manuales y seguimiento escaneando el <strong>código QR</strong> que se encuentra en tu producto o ingresando directamente a nuestro sitio web:</p>
          <p><a href="https://phiit-equipments.com" style="color: #2563eb; font-weight: bold; text-decoration: none;">phiit-equipments.com</a></p>
          <br />
          <p>El equipo de PHiiT.</p>
        </div>
      `,
    })

    if (error) {
      console.error("❌ Error de Resend:", error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (error) {
    console.error("❌ Error inesperado enviando mail de confirmación de compra:", error)
    return { success: false, error }
  }
}