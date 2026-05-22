import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailtrapClient } from 'mailtrap';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly client: MailtrapClient | null = null;
  private readonly senderEmail: string;
  private readonly senderName: string;

  constructor(private readonly configService: ConfigService) {
    const token = this.configService.get<string>('MAILTRAP_TOKEN');
    this.senderEmail =
      this.configService.get<string>('MAILTRAP_SENDER_EMAIL') ??
      'noreply@acadia.com';
    this.senderName =
      this.configService.get<string>('MAILTRAP_SENDER_NAME') ?? 'Acadia';

    if (token) {
      this.client = new MailtrapClient({ token });
    } else {
      this.logger.warn(
        'MAILTRAP_TOKEN not configured — emails will be logged to console',
      );
    }
  }

  async sendPasswordResetEmail(
    to: string,
    resetToken: string,
  ): Promise<void> {
    const resetUrl = `${this.configService.get<string>('FRONTEND_URL', 'http://localhost:4200')}/auth/reset-password?token=${resetToken}`;

    const html = `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #0f0f0f; color: #e0e0e0; border-radius: 16px; overflow: hidden;">
        <div style="padding: 32px 24px; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);">
          <h1 style="color: #ffffff; font-size: 24px; margin: 0 0 8px;">Recuperación de contraseña</h1>
          <p style="color: #a0a0b0; margin: 0;">Solicitaste restablecer tu contraseña en Acadia</p>
        </div>
        <div style="padding: 32px 24px;">
          <p style="margin: 0 0 20px; line-height: 1.6;">Haz clic en el botón de abajo para crear una nueva contraseña. Este enlace expira en <strong style="color: #4fc3f7;">1 hora</strong>.</p>
          <a href="${resetUrl}" style="display: inline-block; padding: 14px 32px; background: #4fc3f7; color: #0f0f0f; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">
            Restablecer contraseña
          </a>
          <p style="margin: 24px 0 0; color: #707080; font-size: 13px;">Si no solicitaste este cambio, ignora este mensaje.</p>
          <p style="margin: 8px 0 0; color: #505060; font-size: 12px;">O copia este enlace en tu navegador:<br/>${resetUrl}</p>
        </div>
      </div>
    `;

    if (this.client) {
      try {
        await this.client.send({
          from: { email: this.senderEmail, name: this.senderName },
          to: [{ email: to }],
          subject: 'Recuperación de contraseña — Acadia',
          html,
          category: 'Password Reset',
        });
        this.logger.log(`Password reset email sent to ${to}`);
      } catch (error) {
        this.logger.error(
          `Failed to send password reset email to ${to}`,
          error,
        );
        throw error;
      }
    } else {
      this.logger.log(`[EMAIL TO ${to}] Subject: Recuperación de contraseña`);
      this.logger.log(`[EMAIL BODY] Reset URL: ${resetUrl}`);
    }
  }
}
