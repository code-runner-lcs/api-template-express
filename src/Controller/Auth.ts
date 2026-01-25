import { Request, Response } from "express";
import Controller from "./Controller";
import z from "zod";
import { getRepo } from "../data-source";
import { User } from "../entities/User";
import { UtilsAuthentication } from "../utils/auth.util";

const registerSchema = z.object({
    name: z.string().min(1),
    email: z.email(),
    password: z.string().min(8),
});

const loginSchema = z.object({
    email: z.email(),
    password: z.string().min(8),
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
            await getRepo(User).save(user);
            const token = UtilsAuthentication.generateToken({ email: user.email, id: user.id });
            return res.status(200).json({ message: 'User created successfully', token });
        } catch (error) {
            return res.status(500).json({ error: 'Internal server error' });
        }

    }
}