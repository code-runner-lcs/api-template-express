import express, { Request, Response } from 'express';
import { AppDataSource } from './data-source';

import "reflect-metadata";
import Router from './router/Router';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

AppDataSource.initialize()
    .then(async () => {
        console.log('BDD Connexion OK');

        const router = new Router(app);
        await router.init();

        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    })
    .catch((error) => {
        console.error('Error connecting to the database:', error);
        process.exit(1);
    });
