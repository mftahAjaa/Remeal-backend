// src/app.js
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorHandler, notFound } from './middleware/error.js';
import authRoutes from './routes/auth.routes.js';
import complaintsRoutes from './routes/complaints.routes.js';
import paymentsRoutes from './routes/payments.routes.js';
import profileRoutes from './routes/profile.routes.js';
import reviewsRoutes from './routes/reviews.routes.js';
import sellerOrdersRoutes from './routes/seller-orders.routes.js';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({
	limit: '1mb',
	verify(req, res, buffer) {
		req.rawBody = Buffer.from(buffer);
	},
}));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.get('/health', (req, res) => {
	res.status(200).json({ status: 'ok' });
});

app.use('/api/v1', authRoutes);
app.use('/api/v1', paymentsRoutes);
app.use('/api/v1', profileRoutes);
app.use('/api/v1', sellerOrdersRoutes);
app.use('/api/v1', reviewsRoutes);
app.use('/api/v1', complaintsRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;