import Controller from "../controller/Controller";
import { Express, Router as ExpressRouter } from "express";
import * as fs from "fs";
import * as path from "path";
import { JWTMiddleware } from "../middeware/JWTMiddleware";

export default class Router {
    private app: Express;

    constructor(app: Express) {
        this.app = app;
    }

    /**
     * Initializes the router
     */
    public async init() {
        this.app.get('/', Controller.home);

        this.app.use(JWTMiddleware.checkBearerToken);
        await this.loadRoutes();
    }

    /**
     * Loads the routes
     */
    private async loadRoutes() {
        const routerDir = __dirname;
        const files = fs.readdirSync(routerDir);

        for (const file of files) {
            // Ignore Router.ts and non-TypeScript files
            if (file === "Router.ts" || !file.endsWith(".ts")) {
                continue;
            }

            const filePath = path.join(routerDir, file);
            const routeName = file.replace(".ts", "").toLowerCase();

            // Dynamic import of the file
            const module = await import(filePath);

            // Find a function that returns a Router (convention: NameRouter)
            const routerFnName = Object.keys(module).find(key =>
                typeof module[key] === "function" && key.endsWith("Router")
            );

            if (routerFnName) {
                const router: ExpressRouter = module[routerFnName]();
                this.app.use(`/${routeName}`, router);
                console.log(`Route /${routeName} load from ${file}`);
            }
        }
    }
}