import { AuthController } from "../Controller/Auth";
import { Router } from "express";

export const AuthRouter = (): Router => {
    const router = Router();
    router.get('/login', AuthController.login);
    router.post('/register', AuthController.register);
    return router;
}