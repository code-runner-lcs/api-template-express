import { AuthController } from "../controller/Auth";
import { Router } from "express";

export const AuthRouter = (): Router => {
    const router = Router();
    router.post('/login', AuthController.login);
    router.post('/register', AuthController.register);
    router.get('/me', AuthController.me);
    return router;
}