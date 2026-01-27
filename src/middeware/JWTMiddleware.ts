import { Request, Response, NextFunction } from "express";
import { UtilsAuthentication } from "../utils/auth.util";
import { publicRoutes } from "./public";
import { getRepo } from "../data-source";
import { User } from "../entities/User";
import { JwtPayload } from "jsonwebtoken";

export class JWTMiddleware {
  /**
   * Checks if the bearer token is valid
   * @param req - The request object
   * @param res - The response object
   * @param next - The next function
   * @returns A JSON object with the user data or an error
   */
  static async checkBearerToken(req: Request, res: Response, next: NextFunction) {
    // Allow all OPTIONS requests (CORS preflight)
    if (req.method === "OPTIONS") {
      return next();
    }

    if (JWTMiddleware.isPublic(req.method, req.path)) {
      return next();
    }

    const token = UtilsAuthentication.getBearerToken(req);

    if (!token) {
      return res.status(401).json({ error: "missing token" });
    }

    const tokenResult = UtilsAuthentication.checkToken(token) as JwtPayload;

    try {
      const user = await getRepo(User).findOne({ where: { email: tokenResult.email } });
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      // Check that the token is valid (object with id and email) 
      if (tokenResult && typeof tokenResult === 'object' && 'id' in tokenResult && 'email' in tokenResult) {
        res.locals.user = {
          id: user.id,
          email: user.email,
          name: user.name,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        };

        return next();
      } else {
        return res.status(401).json({ error: "Token invalid or expired" });
      }
    } catch (error) {
      return res.status(401).json({ error: "Token invalid or expired" });
    }

  }

  /**
   * Checks if the route is public
   * @param method - The method of the request
   * @param path - The path of the request
   * @returns A boolean indicating if the route is public
   */
  static isPublic(method: string, path: string) {
    return publicRoutes.some((route) => {
      if (route.method !== method) return false;

      // Normalize paths (remove trailing slash)
      const normalizedRoutePath = route.path.replace(/\/$/, '');
      const normalizedPath = path.replace(/\/$/, '');

      // If the route contains dynamic parameters (with :)
      if (normalizedRoutePath.includes(':')) {
        // Convert the route to regex to match parameters
        const routePattern = normalizedRoutePath
          .replace(/:[^/]+/g, '[^/]+') // Replace :param with [^/]+
          .replace(/\//g, '\\/'); // Escape slashes
        const regex = new RegExp(`^${routePattern}$`);
        return regex.test(normalizedPath);
      } else {
        // For static routes, use exact comparison
        return normalizedRoutePath === normalizedPath;
      }
    });
  }
}
