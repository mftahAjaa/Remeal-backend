// src/utils/pagination.js
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function parsePositiveInteger(value, fallback) {
	const parsed = Number(value);
	return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function parsePage(query = {}) {
	const page = parsePositiveInteger(query.page, DEFAULT_PAGE);
	const limit = Math.min(parsePositiveInteger(query.limit, DEFAULT_LIMIT), MAX_LIMIT);
	const from = (page - 1) * limit;

	return { page, limit, from, to: from + limit - 1 };
}

export function buildMeta(page, limit, total) {
	const safeTotal = Number.isSafeInteger(Number(total))
		? Math.max(0, Number(total))
		: 0;

	return { page, limit, total: safeTotal };
}
