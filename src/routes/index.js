// src/routes/index.js
import { Router } from 'express';
import authRoutes from './auth.routes.js';
import categoriesRoutes from './categories.routes.js';
import complaintsRoutes from './complaints.routes.js';
import ordersRoutes from './orders.routes.js';
import paymentsRoutes from './payments.routes.js';
import productsRoutes from './products.routes.js';
import profileRoutes from './profile.routes.js';
import reviewsRoutes from './reviews.routes.js';
import sellerOrdersRoutes from './seller-orders.routes.js';
import storesRoutes from './stores.routes.js';

const routes = Router();

routes.use(authRoutes);
routes.use(profileRoutes);
routes.use(storesRoutes);
routes.use(categoriesRoutes);
routes.use(productsRoutes);
routes.use(ordersRoutes);
routes.use(paymentsRoutes);
routes.use(sellerOrdersRoutes);
routes.use(reviewsRoutes);
routes.use(complaintsRoutes);

export default routes;