import dotenv from 'dotenv';

dotenv.config();

export const config = {
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_REDIRECT_URI,
  },
  postgres: {
    url: process.env.POSTGRES_URL,
    prismaUrl: process.env.POSTGRES_PRISMA_URL,
    noSslUrl: process.env.POSTGRES_URL_NO_SSL,
    nonPoolingUrl: process.env.POSTGRES_URL_NON_POOLING,
    user: process.env.POSTGRES_USER,
    host: process.env.POSTGRES_HOST,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DATABASE,
  },
};
