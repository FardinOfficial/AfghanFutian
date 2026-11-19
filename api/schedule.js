import { scheduleHandler } from '../server/scheduleRouter.js'

/**
 * POST/GET /api/schedule/* — one Vercel Function for all schedule endpoints.
 *
 * `vercel.json` rewrites each public schedule URL here before the React SPA
 * fallback; `server/scheduleRouter.js` dispatches to the preserved handlers.
 */
export default scheduleHandler
