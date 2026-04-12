const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://bm-build-manage-web.vercel.app',
  process.env.FRONTEND_URL,
].filter(Boolean);

export const appCorsConfig = {
  origin: ALLOWED_ORIGINS,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

export const validationPipeConfig = {
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
};
