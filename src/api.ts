import { sql } from '@vercel/postgres';
import { config } from './config';
import { OAuth2Client } from 'google-auth-library';

const oauth2Client = new OAuth2Client(
  config.google.clientId,
  config.google.clientSecret,
  config.google.redirectUri
);

export async function authenticateWithGoogle(idToken: string) {
  try {
    const ticket = await oauth2Client.verifyIdToken({
      idToken: idToken,
      audience: config.google.clientId,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      throw new Error('Invalid Google token');
    }

    const { sub: googleId, email, name, picture } = payload;

    // Check if user exists in database
    const { rows } = await sql`
      SELECT * FROM users WHERE google_id = ${googleId}
    `;

    let user = rows[0];

    if (!user) {
      // If user doesn't exist, create a new one
      const result = await sql`
        INSERT INTO users (google_id, email, username, profile_picture, is_admin)
        VALUES (${googleId}, ${email}, ${name}, ${picture}, false)
        RETURNING *
      `;
      user = result.rows[0];
    } else {
      // If user exists, update their information
      const result = await sql`
        UPDATE users
        SET email = ${email}, username = ${name}, profile_picture = ${picture}
        WHERE id = ${user.id}
        RETURNING *
      `;
      user = result.rows[0];
    }

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        profile_picture: user.profile_picture,
        is_admin: user.is_admin,
      },
    };
  } catch (error) {
    console.error('Google authentication error:', error);
    throw error;
  }
}

export async function getImages(page?: number, limit?: number) {
  try {
    // If page or limit is not provided, fetch all data (no pagination)
    if (page === undefined || limit === undefined) {
      const { rows } = await sql`
        SELECT id, generation_prompt, generation_timestamp, 
               imgbb_display_url, imgbb_title, imgbb_width, 
               imgbb_height, imgbb_size
        FROM generated_images 
        ORDER BY generation_timestamp DESC
      `;
      return rows;
    }

    // Otherwise, fetch paginated data
    const offset = (page - 1) * limit;
    const { rows } = await sql`
      SELECT id, generation_prompt, generation_timestamp, 
             imgbb_display_url, imgbb_title, imgbb_width, 
             imgbb_height, imgbb_size
      FROM generated_images 
      ORDER BY generation_timestamp DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    return rows;
  } catch (error) {
    console.error('Database error:', error);
    throw error;
  }
}

export async function deleteImage(id: number) {
  try {
    await sql`
      INSERT INTO deletion_logs (image_id, deleted_at, image_url)
      SELECT id, NOW(), imgbb_display_url
      FROM generated_images
      WHERE id = ${id}
    `;
    
    await sql`DELETE FROM generated_images WHERE id = ${id}`;
    return { success: true };
  } catch (error) {
    console.error('Database error:', error);
    throw error;
  }
}