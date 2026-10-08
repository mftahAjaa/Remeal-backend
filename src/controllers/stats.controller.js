import * as statsService from '../services/stats.service.js';

export async function getPublicStats(req, res) {
  const result = await statsService.getPublicStats();
  return res.status(200).json(result);
}
