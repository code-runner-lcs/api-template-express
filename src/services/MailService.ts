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
     * Verifies SMTP configuration
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
     */
    async sendPasswordResetEmail(to: string, name: string, resetToken: string): Promise<boolean> {
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
        const html = this.getPasswordResetTemplate(name, resetUrl);
        return this.sendMail({
            to,
            subject: 'Réinitialisation de votre mot de passe',
            html,
        });
    }

    /**
     * Sends a confirmation email
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
                        <h1>Bienvenue !</h1>
                    </div>
                    <div class="content">
                        <p>Bonjour ${name},</p>
                        <p>Nous sommes ravis de vous accueillir sur notre plateforme !</p>
                        <p>Votre compte a été créé avec succès. Vous pouvez maintenant commencer à utiliser tous nos services.</p>
                        <p>Si vous avez des questions, n'hésitez pas à nous contacter.</p>
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
     * HTML template for password reset email
     */
    private getPasswordResetTemplate(name: string, resetUrl: string): string {
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
                        <h1>Réinitialisation de mot de passe</h1>
                    </div>
                    <div class="content">
                        <p>Bonjour ${name},</p>
                        <p>Vous avez demandé à réinitialiser votre mot de passe.</p>
                        <p>Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>
                        <p style="text-align: center;">
                            <a href="${resetUrl}" class="button">Réinitialiser mon mot de passe</a>
                        </p>
                        <p>Ou copiez ce lien dans votre navigateur :</p>
                        <p style="word-break: break-all; color: #2196F3;">${resetUrl}</p>
                        <p class="warning">⚠️ Ce lien est valide pendant 1 heure. Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
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
     * HTML template for confirmation email
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
     */
    private stripHtml(html: string): string {
        return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    }
}

// Singleton instance
export const mailService = new MailService();
