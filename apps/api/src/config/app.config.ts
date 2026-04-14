const ALLOWED_ORIGINS = [
  'https://bm-build-manage-web.vercel.app',
  'https://bmbuildmanage.vercel.app',
  'https://bm-build-manage-api.vercel.app',
  process.env.FRONTEND_URL,
];

if (process.env.NODE_ENV !== 'production') {
  ALLOWED_ORIGINS.push('http://localhost:5173', 'http://localhost:3000');
}

export const appCorsConfig = {
  origin: ALLOWED_ORIGINS.filter(Boolean),
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

export const validationPipeConfig = {
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  transformOptions: {
    enableImplicitConversion: true,
  },
};
