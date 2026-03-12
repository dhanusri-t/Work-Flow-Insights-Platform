import { validationResult } from "express-validator";

/**
 * Reusable middleware to check express-validator results.
 * Place this AFTER your validation rules in any route.
 *
 * Usage:
 *   router.post("/login", loginRules, validate, authController.login);
 */
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      error: "Validation failed",
      details: errors.array().map((e) => ({
        field: e.path,
        message: e.msg,
      })),
    });
  }
  next();
};