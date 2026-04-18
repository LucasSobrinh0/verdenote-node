export const env = {
  port: Number(process.env.PORT || 4000),
  coreUrl: process.env.VERDENOTE_CORE_URL || 'http://localhost:8080',
  corsOrigin: process.env.VERDENOTE_NODE_CORS_ORIGIN || 'http://localhost:3000',
  realtimeServiceSecret: process.env.VERDENOTE_REALTIME_SERVICE_SECRET || 'dev-realtime-secret-change-me',
};
