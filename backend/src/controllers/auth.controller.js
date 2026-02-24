import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { db } from "../config/db.js";

/**
 * POST /api/login
 * Body: { email, password }
 */
export const login = async (req, res) => {
  const { email, password } = req.body;

  // 1️⃣ Basic validation
  if (!email || !password) {
    return res.status(400).json({
      message: "Email and password are required",
    });
  }

  try {
    // 2️⃣ Fetch user + company
    const [rows] = await db.query(
      `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.password_hash,
        u.role,
        u.company_id,
        c.name AS company_name
      FROM users u
      JOIN companies c ON u.company_id = c.id
      WHERE u.email = ?
      `,
      [email]
    );

    // 3️⃣ User not found
    if (rows.length === 0) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const user = rows[0];

    // 4️⃣ Compare password
    const passwordMatch = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // 5️⃣ Create JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
        companyId: user.company_id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "8h",
      }
    );

    // 6️⃣ Send response (NO password!)
    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        company: {
          id: user.company_id,
          name: user.company_name,
        },
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};