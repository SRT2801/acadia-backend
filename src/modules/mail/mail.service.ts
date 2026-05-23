import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport } from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter | null = null;
  private readonly fromEmail: string;
  private readonly fromName: string;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = this.configService.get<number>('SMTP_PORT', 587);
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');
    this.fromEmail =
      this.configService.get<string>('SMTP_FROM') ??
      user ??
      'noreply@acadia.com';
    this.fromName =
      this.configService.get<string>('SMTP_FROM_NAME') ?? 'Acadia';

    if (host && user && pass) {
      this.transporter = createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
      this.logger.log(
        `Mail transporter configured: ${host}:${port} as ${user}`,
      );
    } else {
      this.logger.warn(
        'SMTP not configured — emails will be logged to console',
      );
    }
  }

  private async sendEmail(
    to: string,
    subject: string,
    html: string,
  ): Promise<void> {
    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: `"${this.fromName}" <${this.fromEmail}>`,
          to,
          subject,
          html,
        });
        this.logger.log(`Email sent to ${to}: "${subject}"`);
      } catch (error) {
        this.logger.error(
          `Failed to send email to ${to} — falling back to console log`,
          error instanceof Error ? error.message : error,
        );
        this.logger.log(`[EMAIL FALLBACK] To: ${to} | Subject: ${subject}`);
        this.logger.log(`[EMAIL FALLBACK] HTML: ${html}`);
      }
      return;
    }

    this.logger.log(`[EMAIL TO ${to}] Subject: ${subject}`);
    this.logger.log(`[EMAIL BODY] ${html}`);
  }

  async sendPasswordResetEmail(to: string, resetToken: string): Promise<void> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const resetUrl = `${frontendUrl}/auth/reset-password?token=${resetToken}`;

    const html = `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #0f0f0f; color: #e0e0e0; border-radius: 16px; overflow: hidden;">
        <div style="padding: 32px 24px; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);">
          <h1 style="color: #ffffff; font-size: 24px; margin: 0 0 8px;">Recuperaci\u00f3n de contrase\u00f1a</h1>
          <p style="color: #a0a0b0; margin: 0;">Solicitaste restablecer tu contrase\u00f1a en Acadia</p>
        </div>
        <div style="padding: 32px 24px;">
          <p style="margin: 0 0 20px; line-height: 1.6;">Haz clic en el bot\u00f3n de abajo para crear una nueva contrase\u00f1a. Este enlace expira en <strong style="color: #4fc3f7;">1 hora</strong>.</p>
          <a href="${resetUrl}" style="display: inline-block; padding: 14px 32px; background: #4fc3f7; color: #0f0f0f; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">
            Restablecer contrase\u00f1a
          </a>
          <p style="margin: 24px 0 0; color: #707080; font-size: 13px;">Si no solicitaste este cambio, ignora este mensaje.</p>
          <p style="margin: 8px 0 0; color: #505060; font-size: 12px;">O copia este enlace en tu navegador:<br/>${resetUrl}</p>
        </div>
      </div>
    `;

    await this.sendEmail(
      to,
      'Recuperaci\u00f3n de contrase\u00f1a \u2014 Acadia',
      html,
    );
  }

  async sendVerificationEmail(
    to: string,
    verificationToken: string,
  ): Promise<void> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const verifyUrl = `${frontendUrl}/verify-email?token=${verificationToken}`;

    const html = `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #0f0f0f; color: #e0e0e0; border-radius: 16px; overflow: hidden;">
        <div style="padding: 32px 24px; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);">
          <h1 style="color: #ffffff; font-size: 24px; margin: 0 0 8px;">Verifica tu correo electr\u00f3nico</h1>
          <p style="color: #a0a0b0; margin: 0;">Bienvenido a Acadia</p>
        </div>
        <div style="padding: 32px 24px;">
          <p style="margin: 0 0 20px; line-height: 1.6;">Gracias por registrarte. Haz clic en el bot\u00f3n de abajo para verificar tu direcci\u00f3n de correo. Este enlace expira en <strong style="color: #4fc3f7;">24 horas</strong>.</p>
          <a href="${verifyUrl}" style="display: inline-block; padding: 14px 32px; background: #4fc3f7; color: #0f0f0f; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">
            Verificar correo
          </a>
          <p style="margin: 24px 0 0; color: #707080; font-size: 13px;">Si no creaste una cuenta en Acadia, ignora este mensaje.</p>
          <p style="margin: 8px 0 0; color: #505060; font-size: 12px;">O copia este enlace en tu navegador:<br/>${verifyUrl}</p>
        </div>
      </div>
    `;

    await this.sendEmail(
      to,
      'Verifica tu correo electr\u00f3nico \u2014 Acadia',
      html,
    );
  }
}
