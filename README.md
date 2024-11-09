Create a responsive image gallery with authentication using React and TypeScript. Features:

1. Gallery
- Grid layout with lazy loading
- Image preview modal
- Real-time updates via AJAX
- Pagination (400+ images)
- Display metadata (prompt, dimensions, timestamp)

2. Auth
- JWT-based login/logout
- Protected admin routes
- Secure token storage

3. Admin
- Image deletion with confirmation
- Audit logging
- Status feedback

API:
```ts
POST /api/auth/login { username, password }
GET /api/images
DELETE /api/images/:id (admin)
```

```sql
CREATE TABLE `generated_images` (
  `id` int NOT NULL AUTO_INCREMENT,
  `generation_prompt` text COLLATE utf8mb4_unicode_ci,
  `generation_timestamp` datetime DEFAULT NULL,
  `generation_width` int DEFAULT NULL,
  `generation_height` int DEFAULT NULL,
  `generation_steps` int DEFAULT NULL,
  `imgbb_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `imgbb_title` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `imgbb_url_viewer` text COLLATE utf8mb4_unicode_ci,
  `imgbb_url` text COLLATE utf8mb4_unicode_ci,
  `imgbb_display_url` text COLLATE utf8mb4_unicode_ci,
  `imgbb_width` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `imgbb_height` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `imgbb_size` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `imgbb_time` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `imgbb_expiration` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delete_url` text COLLATE utf8mb4_unicode_ci,
  `raw_response` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=600 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci

CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(20) NOT NULL,
  `password` varchar(255) NOT NULL,
  `is_admin` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL,
  `last_login` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci

CREATE TABLE `deletion_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `image_id` int NOT NULL,
  `deleted_at` datetime NOT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
```
Tech stack:
- React + TypeScript
- TanStack Query for data fetching
- Shadcn UI components
- Zod validation
- React Query Dev Tools

Focus on:
- Type safety
- Error handling
- Loading states
- Responsive design
- Performance optimization