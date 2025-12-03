import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import serverInfoRoutes from './routes/serverInfo.routes';
import storeRoutes from './routes/store.routes';
import tebexRoutes from './routes/tebex.routes';

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', serverInfoRoutes);
app.use('/api/store', storeRoutes);
app.use('/api/tebex', tebexRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
