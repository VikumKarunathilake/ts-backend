import mysql from 'mysql2/promise';
import jwt from 'jsonwebtoken';
import { config } from './config';

const pool = mysql.createPool(config.db);

export async function authenticateUser(username: string, password: string) {
  try {
    const [rows]: any = await pool.query(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );

    const user = rows[0];
    // Check if user exists and passwords match (using plaintext comparison)
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

export async function getImages(page?: number, limit?: number) {
  try {
    // If page or limit is not provided, fetch all data (no pagination)
    if (page === undefined || limit === undefined) {
      const [rows] = await pool.query(`
        SELECT id, generation_prompt, generation_timestamp, 
               imgbb_display_url, imgbb_title, imgbb_width, 
               imgbb_height, imgbb_size
        FROM generated_images 
        ORDER BY generation_timestamp DESC
      `);
      return rows;
    }

    // Otherwise, fetch paginated data
    const offset = (page - 1) * limit;
    const [rows] = await pool.query(`
      SELECT id, generation_prompt, generation_timestamp, 
             imgbb_display_url, imgbb_title, imgbb_width, 
             imgbb_height, imgbb_size
      FROM generated_images 
      ORDER BY generation_timestamp DESC
      LIMIT ? OFFSET ?
    `, [limit, offset]);

    return rows;
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
