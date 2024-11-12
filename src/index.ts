import express, { Request, Response, NextFunction } from 'express';
import { getImages, deleteImage, authenticateWithGoogle } from './api';
import { OAuth2Client, TokenPayload } from 'google-auth-library';
import { config } from './config';
import cors from 'cors';

interface UserRequest extends Request {
  user?: {
    id: number;
    username: string;
    email: string;
    profile_picture: string;
    is_admin: boolean;
  };
}

interface ExtendedTokenPayload extends TokenPayload {
  admin?: string;
  picture?: string;
  name?: string;
}

const app = express();
const port = process.env.PORT || 3000;

// Configure CORS to allow requests only from http://localhost:5173
app.use(cors({
  origin: 'http://localhost:5173', // Allow only frontend origin during development
  methods: ['GET', 'POST', 'DELETE'], // Specify allowed methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Specify allowed headers
  credentials: true // Include credentials if needed for secure cookies or headers
}));

app.use(express.json());

const oauth2Client = new OAuth2Client(config.google.clientId);

const authenticateToken = async (req: UserRequest, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers['authorization'];
  const idToken = authHeader && authHeader.split(' ')[1];

  if (!idToken) {
    res.status(401).json({ error: 'Access denied' });
    return;
  }

  try {
    const ticket = await oauth2Client.verifyIdToken({
      idToken: idToken,
      audience: config.google.clientId,
    });
    const payload = ticket.getPayload() as ExtendedTokenPayload;
    if (!payload) {
      throw new Error('Invalid token');
    }
    req.user = {
      id: parseInt(payload.sub),
      username: payload.name || '',
      email: payload.email || '',
      profile_picture: payload.picture || '',
      is_admin: payload.admin === 'true',
    };
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid token' });
  }
};

const isAdmin = (req: UserRequest, res: Response, next: NextFunction): void => {
  if (!req.user?.is_admin) {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }
  next();
};

// Google OAuth login endpoint
app.post('/api/auth/google', async (req: Request, res: Response): Promise<void> => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      res.status(400).json({ error: 'Google ID token is required' });
      return;
    }

    const result = await authenticateWithGoogle(idToken);
    res.json(result);
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Get images endpoint
app.get('/api/images', async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const images = await getImages(page, limit);
    res.json(images);
  } catch (error) {
    console.error('Error fetching images:', error);
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

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
