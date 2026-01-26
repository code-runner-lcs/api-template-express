import { Request, Response } from 'express';
import * as fs from 'fs';

abstract class Controller {
    static home(req: Request, res: Response) {
        res.send('API template');
    }

    static logError(error: any) {
        if (process.env.NODE_ENV && process.env.NODE_ENV === 'production') {
            this.writeErrorToFile(error);
        } else {
            console.error(error);
        }
    }

    private static writeErrorToFile(error: any) {
        fs.appendFileSync('error.log', `${new Date().toISOString()} - ${error.message}\n`);
    }
}

export default Controller;