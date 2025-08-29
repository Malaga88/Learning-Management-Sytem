import express from "express";
import { Router } from "express";
import { registerUser } from "../controllers/authController.mjs";
import { loginUser } from "../controllers/authController.mjs";


const authRouter = Router();

authRouter.post("/register", registerUser);
authRouter.post("/login", loginUser);

export default authRouter;
