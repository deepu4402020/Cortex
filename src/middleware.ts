import jwt from "jsonwebtoken";
import APIKeyModel from "./models/apiKeyModel";

// Use environment variable or default for fallback
const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_for_local_dev";

export const authenticate = (req: any, res: any, next: any) => {
  try {
    const authHeader = req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Access denied. No token provided." });
    }

    const token = authHeader.replace("Bearer ", "");
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Attach the decoded payload (e.g., { id: "..." }) to req.user
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token." });
  }
};

export const authenticateApiKey = async (req: any, res: any, next: any) => {
  try {
    const apiKey = req.header("x-api-key");
    if (!apiKey) {
      return res.status(401).json({ error: "Access denied. Missing x-api-key header." });
    }

    const keyRecord = await APIKeyModel.findOne({ key: apiKey }).populate("userId");
    if (!keyRecord || !keyRecord.userId) {
      return res.status(401).json({ error: "Invalid API Key." });
    }

    // Emulate standard req.user payload so following route handlers work transparency
    req.user = { id: keyRecord.userId._id.toString(), username: (keyRecord.userId as any).user_name, email: (keyRecord.userId as any).email };
    next();
  } catch (err) {
    res.status(500).json({ error: "Gateway authentication error." });
  }
};
