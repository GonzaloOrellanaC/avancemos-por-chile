import 'dotenv/config'
import { connectDB } from './src/lib/db.ts';
import { createApp } from './src/server/app.ts';

async function startServer() {
  await connectDB();
  const app = createApp();
  const PORT = Number(process.env.PORT) || 3000;

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
