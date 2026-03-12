import express from "express";
import { login } from "../controllers/auth.controller.js";
import { loginRules } from "../middleware/rules.middleware.js";
import { validate } from "../middleware/validate.middleware.js";

const router = express.Router();

router.post("/login", loginRules, validate, login);

export default router;