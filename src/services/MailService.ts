import nodemailer, { Transporter } from 'nodemailer';

export interface MailOptions {
    to: string | string[];
    subject: string;
    html: string;
    text?: string;
}

export class MailService {
    private transporter: Transporter;
    private from: string;

    constructor() {
        // SMTP configuration from environment variables
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD,
            },
        });

        this.from = process.env.SMTP_USER || '';
    }

    /**
     * Checks if the SMTP connection is working
     * @returns A boolean indicating if the SMTP connection was verified successfully
     */
    async verifyConnection(): Promise<boolean> {
        try {
            await this.transporter.verify();
            return true;
        } catch (error) {
            console.error('SMTP connection error:', error);
            return false;
        }
    }

    /**
     * Sends an email
     * @param options - The options for the email
     * @returns A boolean indicating if the email was sent successfully
     */
    async sendMail(options: MailOptions): Promise<boolean> {
        try {
            const mailOptions = {
                from: this.from,
                to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
                subject: options.subject,
                html: options.html,
                text: options.text || this.stripHtml(options.html),
            };

            const info = await this.transporter.sendMail(mailOptions);
            console.log('Email sent successfully:', info.messageId);
            return true;
        } catch (error) {
            console.error('Error sending email:', error);
            return false;
        }
    }

    /**
     * Sends a welcome email
     * @param to - The email address of the recipient
     * @param name - The name of the user
     * @returns A boolean indicating if the email was sent successfully
     */
    async sendWelcomeEmail(to: string, name: string): Promise<boolean> {
        const html = this.getWelcomeTemplate(name);
        return this.sendMail({
            to,
            subject: 'Bienvenue sur notre plateforme !',
            html,
        });
    }

    /**
     * Sends a password reset email
     * @param to - The email address of the recipient
     * @param name - The name of the user
     * @param resetToken - The reset token
     * @returns A boolean indicating if the email was sent successfully
     */
    async sendPasswordResetEmail(to: string, resetToken: string): Promise<boolean> {
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
        const html = this.getPasswordResetTemplate(resetUrl);
        return this.sendMail({
            to,
            subject: 'Réinitialisation de votre mot de passe',
            html,
        });
    }

    /**
     * Sends a confirmation email
     * @param to - The email address of the recipient
     * @param name - The name of the user
     * @param confirmationToken - The confirmation token
     * @returns A boolean indicating if the email was sent successfully
     */
    async sendConfirmationEmail(to: string, name: string, confirmationToken: string): Promise<boolean> {
        const confirmationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/confirm-email?token=${confirmationToken}`;
        const html = this.getConfirmationTemplate(name, confirmationUrl);
        return this.sendMail({
            to,
            subject: 'Confirmez votre adresse email',
            html,
        });
    }

    /**
     * HTML template for welcome email
     * @param name - The name of the user
     * @returns The HTML template
     */
    private getWelcomeTemplate(name: string): string {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; background-color: #f9f9f9; }
                    .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Welcome!</h1>
                    </div>
                    <div class="content">
                        <p>Hello ${name},</p>
                        <p>We are happy to welcome you on our platform!</p>
                        <p>Your account has been created successfully. You can now start using all our services.</p>
                        <p>If you have any questions, please contact us.</p>
                        <p>Best regards,<br>The team</p>
                    </div>
                    <div class="footer">
                        <p>© ${new Date().getFullYear()} All rights reserved</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    /**
     * HTML template for password reset email
     * @param name - The name of the user
     * @param resetUrl - The reset URL
     * @returns The HTML template
     */
    private getPasswordResetTemplate(resetUrl: string): string {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #2196F3; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; background-color: #f9f9f9; }
                    .button { display: inline-block; padding: 12px 24px; background-color: #2196F3; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                    .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
                    .warning { color: #ff5722; font-size: 12px; margin-top: 20px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Password reset</h1>
                    </div>
                    <div class="content">
                        <p>Hello,</p>
                        <p>You have requested to reset your password.</p>
                        <p>Click the button below to reset your password:</p>
                        <p style="text-align: center;">
                            <a href="${resetUrl}" class="button">Reset your password</a>
                        </p>
                        <p>Or copy this link into your browser:</p>
                        <p style="word-break: break-all; color: #2196F3;">${resetUrl}</p>
                        <p class="warning">⚠️ This link is valid for 1 hour. If you did not request this reset, ignore this email.</p>
                        <p>Best regards,<br>The team</p>
                    </div>
                    <div class="footer">
                            <p>© ${new Date().getFullYear()} All rights reserved</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    /**
     * HTML template for confirmation email
     * @param name - The name of the user
     * @param confirmationUrl - The confirmation URL
     * @returns The HTML template
     */
    private getConfirmationTemplate(name: string, confirmationUrl: string): string {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; background-color: #f9f9f9; }
                    .button { display: inline-block; padding: 12px 24px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                    .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Confirmation d'email</h1>
                    </div>
                    <div class="content">
                        <p>Bonjour ${name},</p>
                        <p>Merci de vous être inscrit ! Veuillez confirmer votre adresse email en cliquant sur le bouton ci-dessous :</p>
                        <p style="text-align: center;">
                            <a href="${confirmationUrl}" class="button">Confirmer mon email</a>
                        </p>
                        <p>Ou copiez ce lien dans votre navigateur :</p>
                        <p style="word-break: break-all; color: #4CAF50;">${confirmationUrl}</p>
                        <p>Cordialement,<br>L'équipe</p>
                    </div>
                    <div class="footer">
                        <p>© ${new Date().getFullYear()} Tous droits réservés</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    /**
     * Extracts plain text from HTML
     * @param html - The HTML to strip
     * @returns The plain text
     */
    private stripHtml(html: string): string {
        return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    }
}

// Singleton instance
export const mailService = new MailService();
