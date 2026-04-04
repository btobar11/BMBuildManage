export const appCorsConfig = {
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

export const validationPipeConfig = {
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
};
