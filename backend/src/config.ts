export const config = {
  ocr: {
    minimumConfidence: 70, // Minimum confidence level for OCR results (0-100)
    languages: ['fra', 'eng'], // Languages to recognize (fra=French, eng=English)
    temporary_path: './temp_uploads', // Path for temporarily storing uploaded images
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: 'gpt-4o', // OpenAI model to use for prescription analysis
    temperature: 0.2, // Lower temperature for more deterministic results
    maxTokens: 500, // Maximum tokens for response
  },
  security: {
    jwt: {
      secret: process.env.JWT_SECRET || 'default-jwt-secret-do-not-use-in-production',
      expiresIn: '1d', // Token expiration time
    },
    throttle: {
      ttl: 60, // Time to live in seconds for rate limiting
      limit: 30, // Number of requests allowed in ttl period
    },
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
  database: {
    connectionString: process.env.DATABASE_URL,
  },
  payment: {
    stripe: {
      secretKey: process.env.STRIPE_SECRET_KEY || '',
      publicKey: process.env.VITE_STRIPE_PUBLIC_KEY || '',
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    },
    mobileMoney: {
      enabled: process.env.MOBILE_MONEY_ENABLED === 'true',
      providers: [
        { name: 'Orange Money', code: 'ORANGE', enabled: true },
        { name: 'MTN Mobile Money', code: 'MTN', enabled: true },
        { name: 'Moov Money', code: 'MOOV', enabled: true },
        { name: 'Wave', code: 'WAVE', enabled: true },
      ],
    },
  },
  // Demo mode for development without external services
  demoMode: process.env.DEMO_MODE === 'true' || true,
};