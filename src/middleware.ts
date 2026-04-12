import jwt from "jsonwebtoken";

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
