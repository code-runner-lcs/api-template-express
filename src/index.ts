import express, { Request, Response } from 'express';
import { AppDataSource } from './data-source';

import "reflect-metadata";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

AppDataSource.initialize()
    .then(() => {
        console.log('BDD Connexion OK');

        app.use('/', (req: Request, res: Response) => {
            res.send('API template');
        });

        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    })
    .catch((error) => {
        console.error('Error connecting to the database:', error);
        process.exit(1);
    });
