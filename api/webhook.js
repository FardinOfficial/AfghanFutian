import webhookHandler from '../server/handlers/webhook.js'

/**
 * POST /api/schedule/webhook → rewritten here by `vercel.json`.
 *
 * The public URL is unchanged. Keeping the handler in `server/` means it is
 * shared code, not an extra entry point in Vercel's function budget.
 */
export default webhookHandler
