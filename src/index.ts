// src\index.ts
import express, { Request, Response, NextFunction } from 'express';
import { getImages, deleteImage, authenticateUser } from './api'; // Assumes registerUser is implemented in api.ts
import jwt from 'jsonwebtoken';

// Extend the Request interface to include user information
interface UserRequest extends Request {
  user?: { id: number; username: string; is_admin: boolean };
}

const app = express();
const port = 3000;

app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const authenticateToken = (req: UserRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Access denied' });
    return; // Ensure to return after sending response
  }

  try {
    const user = jwt.verify(token, JWT_SECRET) as { id: number; username: string; is_admin: boolean };
    req.user = user; // Now TypeScript recognizes req.user
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid token' });
  }
};

// Middleware to check for admin access
const isAdmin = (req: UserRequest, res: Response, next: NextFunction): void => {
  if (!req.user?.is_admin) {
    res.status(403).json({ error: 'Admin access required' });
    return; // Ensure to return after sending response
  }
  next();
};

// Login endpoint
app.post('/api/auth/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: 'Username and password are required' });
      return; // Ensure to return after sending response
    }

    const result = await authenticateUser(username, password);
    if (!result) {
      res.status(401).json({ error: 'Invalid credentials' });
      return; // Ensure to return after sending response
    }

    res.json(result);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Get images endpoint
app.get('/api/images', async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      res.status(400).json({ error: 'Invalid pagination parameters' });
      return;
    }

    const result = await getImages(page, limit);
    res.json(result);
  } catch (error) {
    console.error('Failed to fetch images:', error);
    res.status(500).json({ error: 'Failed to fetch images' });
  }
});

// Delete image endpoint
app.delete('/api/images/:id', authenticateToken, isAdmin, async (req: UserRequest, res: Response): Promise<void> => {
  try {
    await deleteImage(parseInt(req.params.id));
    res.json({ message: 'Image deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete image' });
  }
});


// Start server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
