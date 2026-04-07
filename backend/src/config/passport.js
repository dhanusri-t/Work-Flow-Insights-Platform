import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { db } from "./db.js";

passport.use(new GoogleStrategy({
    clientID:     process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL:  process.env.GOOGLE_CALLBACK_URL,
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email    = profile.emails[0].value;
      const googleId = profile.id;
      const name     = profile.displayName;
      const avatar   = profile.photos?.[0]?.value || null;

      // Check if user already exists by google_id or email
      const [existing] = await db.query(
        "SELECT * FROM users WHERE google_id = ? OR email = ?",
        [googleId, email]
      );

      if (existing.length > 0) {
        const user = existing[0];
        // Link google_id if they previously signed up with email
        if (!user.google_id) {
          await db.query(
            "UPDATE users SET google_id = ?, avatar_url = ? WHERE id = ?",
            [googleId, avatar, user.id]
          );
        }
        return done(null, user);
      }

      // New user — but in Flowcraft only existing company members 
      // should be able to log in. Block unknown emails.
      return done(null, false, { message: "No account found. Ask your admin to invite you." });

    } catch (err) {
      return done(err);
    }
  }
));

export default passport;