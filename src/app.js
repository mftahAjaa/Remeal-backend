// src/app.js
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { errorHandler, notFound } from './middleware/error.js';
import routes from './routes/index.js';
import swaggerUi from 'swagger-ui-express';
import { parse as parseYaml } from 'yaml';

const openApiSpecPath = fileURLToPath(new URL('../docs/openapi.yaml', import.meta.url));
const openApiSpec = parseYaml(readFileSync(openApiSpecPath, 'utf8'));

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

app.get('/api-docs.json', (req, res) => {
	return res.status(200).json(openApiSpec);
});
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiSpec, { explorer: true }));

app.use('/api/v1', routes);

app.use(notFound);
app.use(errorHandler);

export default app;