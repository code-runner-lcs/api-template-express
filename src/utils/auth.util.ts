import jwt, { TokenExpiredError } from "jsonwebtoken";
import { Request } from "express";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

dotenv.config();

export type UserTokenInformationType = {
  email: string;
  id: number;
};

export class UtilsAuthentication {
  static saltRound = 10;
  static secret = process.env.JWT_PRIVATE as string;

  /**
   * Hashes a password
   * @param password - The password to hash
   * @returns The hashed password
   */
  static async hash(password: string) {
    return await bcrypt.hash(password, this.saltRound);
  }

  /**
   * Checks if a password is correct
   * @param password - The password to check
   * @param hashedPassword - The hashed password
   * @returns A boolean indicating if the password is correct
   */
  static async check(password: string, hashedPassword: string) {
    return await bcrypt.compare(password, hashedPassword);
  }

  /**
   * Generates a JWT token
   * @param user - The user information
   * @returns The JWT token
   */
  static generateToken(user: UserTokenInformationType) {
    return jwt.sign(user, this.secret, { expiresIn: "30d" });
  }

  /**
   * Checks if a JWT token is valid
   * @param token - The JWT token
   * @returns The user information or a boolean indicating if the token is valid
   */
  static checkToken(token: string) {
    try {
      return jwt.verify(token, this.secret);
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        return "Token expired";
      }
      return false;
    }
  }

  /**
   * Gets the bearer token from the request
   * @param req - The request object
   * @returns The bearer token
   */
  static getBearerToken(req: Request): string {
    return req.headers.authorization?.split(" ")[1] ?? "";
  }
}
