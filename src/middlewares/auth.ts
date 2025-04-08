import jwt, { JwtPayload } from "jsonwebtoken";
import { Response, NextFunction } from "express";
import { query } from "../config/db";
import { AuthenticatedRequest } from "./ahthenticatedRequest";
import { UserDTO } from "../dtos/user/userDto";

const mapUser = (dbResults: any): UserDTO => {
  const user: UserDTO = {
    id: dbResults.id,
    first_name: dbResults.first_name,
    last_name: dbResults.last_name,
    email: dbResults.email,
    biography: dbResults.biography,
    fame_rating: dbResults.fame_rating,
    age: dbResults.age,
    profile_completed: dbResults.profile_completed,
    gender: dbResults.gender,
    sexual_preferences: dbResults.sexual_preferences,
    profile_picture: dbResults.profile_picture,
    email_verified: dbResults.email_verified,
  };

  return user;
};

export const protectRoutes = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // const token = req.cookies?.jwt;
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      res.status(401).json({
        success: false,
        message: "You are not authorized",
      });
      return;
    }

    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(
        token,
        process.env.JWT_SECRET as string
      ) as JwtPayload;
    } catch (error) {
      res.status(401).json({
        success: false,
        message: "You are not authorized",
      });
      return;
    }

    if (!decoded || !decoded.id) {
      res.status(401).json({
        success: false,
        message: "You are not authorized",
      });
      return;
    }

    const getUserQuery = `SELECT id, first_name, last_name, profile_picture, email, biography, fame_rating, age, profile_completed, email_verified, gender, sexual_preferences FROM users WHERE id = $1;`;
    const { rows } = await query(getUserQuery, [decoded.id]);

    if (rows.length === 0) {
      res.status(401).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    const user: UserDTO = mapUser(rows[0]);
    req.user = user;

    next();
  } catch (error) {
    console.error("Error from authMiddleware:", error);
    res.status(500).json({
      success: false,
      message: "Error from authentication",
    });
  }
};
