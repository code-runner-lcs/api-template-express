import { Request, Response } from 'express';

abstract class Controller {
    static home(req: Request, res: Response) {
        res.send('API template');
    }
}

export default Controller;