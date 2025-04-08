import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

// Initialize the connection pool

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || "5432", 10),
  ssl: true,
});

export const query = (text: string, params?: any[]): Promise<any> =>
  pool.query(text, params);
