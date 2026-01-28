import { Request, Response } from "express";
import Controller from "./Controller";
import z from "zod";
import { mailService } from "../services/MailService";
import { UtilsAuthentication } from "../utils/auth.util";
import { getRepo } from "../data-source";
import { User } from "../entities/User";

const sendEmailSchema = z.object({
    to: z.union([z.string().email(), z.array(z.string().email())]),
    subject: z.string().min(1),
    html: z.string().min(1),
    text: z.string().optional(),
});

const sendPasswordResetSchema = z.object({
    to: z.email(),
});

const sendConfirmationSchema = z.object({
    to: z.email(),
    name: z.string().min(1),
});

export class MailController extends Controller {
    /**
     * Sends a custom email
     * @route POST /api/mail/send
     * @param req - The request object
     * @param res - The response object
     * @returns A JSON object with the message
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
     * Sends a password reset email with a token
     * @route POST /api/mail/password-reset
     * @param req - The request object
     * @param res - The response object
     * @returns A JSON object with the message
     */
    static async sendPasswordResetEmail(req: Request, res: Response) {
        const validation = sendPasswordResetSchema.safeParse(req.body);

        if (!validation.success) {
            return res.status(400).json({ error: validation.error.message });
        }

        try {
            const user = await getRepo(User).findOne({ where: { email: validation.data.to } });
            if (!user) {
                return res.status(400).json({ error: 'User not found' });
            }
            const token = UtilsAuthentication.generateToken({ email: validation.data.to, id: user.id }, "1h");
            const success = await mailService.sendPasswordResetEmail(
                validation.data.to,
                token
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
     * @route POST /api/mail/confirmation
     * @param req - The request object
     * @param res - The response object
     * @returns A JSON object with the message
     */
    static async sendConfirmationEmail(req: Request, res: Response) {
        const validation = sendConfirmationSchema.safeParse(req.body);

        if (!validation.success) {
            return res.status(400).json({ error: validation.error.message });
        }

        try {
            const user = await getRepo(User).findOne({ where: { email: validation.data.to } });
            if (!user) {
                return res.status(400).json({ error: 'User not found' });
            }
            const token = UtilsAuthentication.generateToken({ email: validation.data.to, id: user.id }, "1h");
            const success = await mailService.sendConfirmationEmail(
                validation.data.to,
                validation.data.name,
                token
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
