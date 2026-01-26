import { Request, Response } from "express";
import Controller from "./Controller";
import z from "zod";
import { mailService } from "../services/MailService";

const sendEmailSchema = z.object({
    to: z.union([z.string().email(), z.array(z.string().email())]),
    subject: z.string().min(1),
    html: z.string().min(1),
    text: z.string().optional(),
});

const sendPasswordResetSchema = z.object({
    to: z.string().email(),
    name: z.string().min(1),
    resetToken: z.string().min(1),
});

const sendConfirmationSchema = z.object({
    to: z.string().email(),
    name: z.string().min(1),
    confirmationToken: z.string().min(1),
});

export class MailController extends Controller {
    /**
     * Sends a custom email
     */
    static async sendEmail(req: Request, res: Response) {
        const validation = sendEmailSchema.safeParse(req.body);

        if (!validation.success) {
            return res.status(400).json({ error: validation.error.message });
        }

        try {
            const success = await mailService.sendMail(validation.data);
            if (success) {
                return res.status(200).json({ message: 'Email sent successfully' });
            } else {
                return res.status(500).json({ error: 'Failed to send email' });
            }
        } catch (error) {
            this.logError(error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * Sends a password reset email
     */
    static async sendPasswordResetEmail(req: Request, res: Response) {
        const validation = sendPasswordResetSchema.safeParse(req.body);

        if (!validation.success) {
            return res.status(400).json({ error: validation.error.message });
        }

        try {
            const success = await mailService.sendPasswordResetEmail(
                validation.data.to,
                validation.data.name,
                validation.data.resetToken
            );

            if (success) {
                return res.status(200).json({ message: 'Password reset email sent successfully' });
            } else {
                return res.status(500).json({ error: 'Failed to send password reset email' });
            }
        } catch (error) {
            this.logError(error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * Sends a confirmation email
     */
    static async sendConfirmationEmail(req: Request, res: Response) {
        const validation = sendConfirmationSchema.safeParse(req.body);

        if (!validation.success) {
            return res.status(400).json({ error: validation.error.message });
        }

        try {
            const success = await mailService.sendConfirmationEmail(
                validation.data.to,
                validation.data.name,
                validation.data.confirmationToken
            );

            if (success) {
                return res.status(200).json({ message: 'Confirmation email sent successfully' });
            } else {
                return res.status(500).json({ error: 'Failed to send confirmation email' });
            }
        } catch (error) {
            this.logError(error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
}
