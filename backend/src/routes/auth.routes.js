import express         from "express";
import jwt             from "jsonwebtoken";
import passport        from "passport";
import { login }       from "../controllers/auth.controller.js";
import { loginRules }  from "../middleware/rules.middleware.js";
import { validate }    from "../middleware/validate.middleware.js";

const router = express.Router();

// ── Email / Password login (unchanged) ────────────────────────────────────────
router.post("/login", loginRules, validate, login);

// ── Google OAuth — Step 1: redirect user to Google ────────────────────────────
router.get("/auth/google",
  passport.authenticate("google", {
    scope:   ["profile", "email"],
    session: false,
  })
);

// ── Google OAuth — Step 2: Google redirects back here ────────────────────────
router.get("/auth/google/callback",
  passport.authenticate("google", {
    session:         false,
    failureRedirect: `${process.env.CLIENT_URL}/login?error=google_failed`,
  }),
  (req, res) => {
    const user = req.user;

    const token = jwt.sign(
      { id: user.id, role: user.role, companyId: user.company_id },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    const userPayload = encodeURIComponent(JSON.stringify({
      id:     user.id,
      name:   user.name,
      email:  user.email,
      role:   user.role,
      avatar: user.avatar_url || null,
    }));

    // Redirect to frontend callback page with token + user in URL
    res.redirect(
      `${process.env.CLIENT_URL}/auth/callback?token=${token}&user=${userPayload}`
    );
  }
);

export default router;