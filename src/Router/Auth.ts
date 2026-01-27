import { AuthController } from "../controller/Auth";
import { Router } from "express";
import { MailController } from "../controller/MailController";

export const AuthRouter = (): Router => {
    const router = Router();
    router.post('/login', AuthController.login);
    router.post('/register', AuthController.register);
    router.get('/me', AuthController.me);

    router.post('/ask-password-reset', MailController.sendPasswordResetEmail);
    router.post('/reset-password', AuthController.resetPassword);
    router.post('/confirmation', MailController.sendConfirmationEmail);
    router.get('/confirm-email', AuthController.confirmEmail);
    return router;
}