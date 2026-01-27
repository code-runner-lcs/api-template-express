import { Request, Response } from 'express';
import * as fs from 'fs';

abstract class Controller {

    /**
     * Sends a home message
     * @route GET /
     * @param req - The request object
     * @param res - The response object
     * @returns A JSON object with the home message
     */
    static home(req: Request, res: Response) {
        res.send('API template');
    }

    /**
     * Logs an error to the console or file
     * @param error - The error to log
     */
    static logError(error: any) {
        if (process.env.NODE_ENV && process.env.NODE_ENV === 'production') {
            this.writeErrorToFile(error);
        } else {
            console.error(error);
        }
    }

    /**
     * Writes an error to a file
     * @param error - The error to write
     */
    private static writeErrorToFile(error: any) {
        fs.appendFileSync('error.log', `${new Date().toISOString()} - ${error.message}\n`);
    }
}

export default Controller;