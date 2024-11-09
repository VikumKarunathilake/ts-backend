import mysql from 'mysql2/promise';
import jwt from 'jsonwebtoken';
import { config } from './config';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface GeneratedImage extends RowDataPacket {
  id: number;
  generation_prompt: string;
  generation_timestamp: Date;
  imgbb_display_url: string;
  imgbb_title: string;
  imgbb_width: number;
  imgbb_height: number;
  imgbb_size: number;
}

interface PaginatedResponse {
  images: GeneratedImage[];
  total: number;
}

const pool = mysql.createPool(config.db);

export async function authenticateUser(username: string, password: string) {
  try {
    const [rows]: any = await pool.query(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );

    const user = rows[0];
    if (!user || password !== user.password) {
      return null;
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, is_admin: user.is_admin },
      config.jwtSecret,
      { expiresIn: '24h' }
    );

    return {
      user: {
        id: user.id,
        username: user.username,
        is_admin: user.is_admin,
      },
      token,
    };
  } catch (error) {
    console.error('Authentication error:', error);
    throw error;
  }
}

export async function getImages(page: number = 1, limit: number = 10): Promise<PaginatedResponse> {
  try {
    // Calculate offset
    const offset = (page - 1) * limit;

    // Get total count
    const [countResult] = await pool.query<GeneratedImage[]>(
      'SELECT COUNT(*) as total FROM generated_images'
    );
    const total = (countResult[0] as any).total;

    // Get paginated results
    const [images] = await pool.query<GeneratedImage[]>(`
      SELECT id, generation_prompt, generation_timestamp, 
             imgbb_display_url, imgbb_title, imgbb_width, 
             imgbb_height, imgbb_size
      FROM generated_images 
      ORDER BY generation_timestamp DESC
      LIMIT ? OFFSET ?
    `, [limit, offset]);

    return {
      images: images,
      total
    };
  } catch (error) {
    console.error('Database error:', error);
    throw error;
  }
}

export async function deleteImage(id: number) {
  try {
    const [result] = await pool.query(
      'INSERT INTO deletion_logs (image_id, deleted_at, image_url) SELECT id, NOW(), imgbb_display_url FROM generated_images WHERE id = ?',
      [id]
    );
    
    await pool.query('DELETE FROM generated_images WHERE id = ?', [id]);
    return result;
  } catch (error) {
    console.error('Database error:', error);
    throw error;
  }
}