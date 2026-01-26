import { Request, Response } from "express";
import Controller from "./Controller";
import z from "zod";
import { getRepo } from "../data-source";
import { User } from "../entities/User";
import { UtilsAuthentication } from "../utils/auth.util";
import { mailService } from "../services/MailService";
import { JwtPayload } from "jsonwebtoken";

const registerSchema = z.object({
    name: z.string().min(1),
    email: z.email(),
    password: z.string().min(8),
});

const loginSchema = z.object({
    email: z.email(),
    password: z.string().min(8),
});

const confirmEmailSchema = z.object({
    token: z.string().min(1),
});

export class AuthController extends Controller {
    static async login(req: Request, res: Response) {
        const { email, password } = req.body;
        const validation = loginSchema.safeParse({ email, password });
        if (!validation.success) {
            return res.status(400).json({ error: validation.error.message });
        }
        try {
            const user = await getRepo(User).findOne({ where: { email: validation.data.email } });
            if (!user) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }
            const isPasswordValid = await UtilsAuthentication.check(validation.data.password, user.password);
            if (!isPasswordValid) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }
            const token = UtilsAuthentication.generateToken({ email: user.email, id: user.id });
            return res.status(200).json({ token });
        } catch (error) {
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    static async register(req: Request, res: Response) {
        const { name, email, password } = req.body;
        const validation = registerSchema.safeParse({ name, email, password });

        if (!validation.success) {
            return res.status(400).json({ error: validation.error.message });
        }
        try {
            const userExists = await getRepo(User).findOne({ where: { email: validation.data.email } });
            if (userExists) {
                return res.status(400).json({ error: 'User already exists' });
            }
            const user = await getRepo(User).create({
                name: validation.data.name,
                email: validation.data.email,
                password: await UtilsAuthentication.hash(validation.data.password)
            });

            const mailErrors = [];
            const successWelcom = await mailService.sendWelcomeEmail(
                validation.data.email,
                validation.data.name
            );

            const confirmationToken = UtilsAuthentication.generateToken({ email: user.email, id: user.id });
            const successConfirmation = await mailService.sendConfirmationEmail(
                validation.data.email,
                validation.data.name,
                confirmationToken
            );

            if (!successConfirmation) {
                mailErrors.push('Confirmation email doesnt sent');
            }

            if (!successWelcom) {
                mailErrors.push('Welcome email doesnt sent');
            }

            await getRepo(User).save(user);
            const token = UtilsAuthentication.generateToken({ email: user.email, id: user.id });
            return res.status(200).json({ message: 'User created successfully', token, mailErrors });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal server error' });
        }

    }

    static async me(req: Request, res: Response) {
        return res.status(200).json({ ...res.locals.user });
    }

    static async confirmEmail(req: Request, res: Response) {
        const { token } = req.query;
        const validation = confirmEmailSchema.safeParse({ token });
        if (!validation.success) {
            return res.status(400).json({ error: validation.error.message });
        }
        const tokenResult = UtilsAuthentication.checkToken(validation.data.token) as JwtPayload;
        if (!tokenResult) {
            return res.status(400).json({ error: 'Invalid token' });
        }

        try {
            const user = await getRepo(User).findOne({ where: { email: tokenResult.email } });
            if (!user) {
                return res.status(400).json({ error: 'User not found' });
            }
            user.isEmailConfirmed = true;
            await getRepo(User).save(user);
            return res.status(200).json({ message: 'Email confirmed successfully' });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
}