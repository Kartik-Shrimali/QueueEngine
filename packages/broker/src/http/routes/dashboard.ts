import express from "express";
import { requireScope } from "../middleware/auth.js";
import { getSnapshot } from "../../events/stats.js";
import { AppError } from "@queueengine/shared";
import { getJobsPage } from "../../store/pg/jobs.js";

const dashboardRouter: express.Router = express.Router();

function asText(value: unknown): string | undefined {
    if (typeof value === "string") {
        return value;
    }
    return undefined;
}

function decodeCursor(cursorText: string) {
    const decodedcursor = Buffer.from(cursorText, 'base64url');
    try {
        const cursor = JSON.parse(decodedcursor.toString());
        if (typeof cursor.u !== 'string' || typeof cursor.i !== 'string') {
            throw new AppError('validation_failed', "Cursor is not valid")
        }

        return { updatedAt: cursor.u, id: cursor.i }

    } catch (error: any) {
        throw new AppError('validation_failed', "Cursor is not valid");
    }


}

dashboardRouter.get('/stats', requireScope('admin'), (req, res) => {
    const snapshot = getSnapshot();

    return res.status(200).json(snapshot);
})

dashboardRouter.get('/jobs', requireScope('admin'), async (req, res) => {
    const rawLimit = req.query.limit;
    let limit: number | null = null;

    if (rawLimit === undefined) limit = 50;
    else { limit = Number(rawLimit) };

    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
        throw new AppError('validation_failed', "Limit should be a whole number between 1 and 100")
    }

    const rawStatus = req.query.status;
    const rawType = req.query.type;
    const rawPriority = req.query.priority;
    const rawDeadReason = req.query.deadReason;
    const rawCursor = req.query.cursor;

    const status = asText(rawStatus);
    const type = asText(rawType);
    const priority = asText(rawPriority);
    const deadReason = asText(rawDeadReason);
    const cursor = asText(rawCursor);

    let decodedCursor = undefined;
    if (cursor) decodedCursor = decodeCursor(cursor);

    try {
        const result = await getJobsPage({ status, type, priority, deadReason, limit, cursor: decodedCursor });

        const jobs = result.rows.map((row) => {
            return {
                id: row.id,
                type: row.type,
                status: row.status,
                priority: row.priority,
                attempts: row.attempts,
                maxAttempts: row.max_attempts,
                runAfter: row.run_after,
                deadReason: row.dead_reason,
                replayedFrom: row.replayed_from,
                enqueuedAt: row.enqueued_at,
                firstStartedAt: row.first_started_at,
                finishedAt: row.finished_at,
                updatedAt: row.updated_at
            }
        })

        let nextCursor: string | null = null;

        if (result.hasMore === true) {
            const lastRow = result.rows[result.rows.length - 1];
            nextCursor = Buffer.from(JSON.stringify({ u: lastRow.updated_at_text, i: lastRow.id })).toString('base64url');
        }

        res.status(200).json({ jobs, nextCursor });

    } catch (error: any) {
        if (error.code === '22007' || error.code === '22008' || error.code === '22P02') throw new AppError('validation_failed', "Cursor is not valid");

        throw error;
    }
})

export { dashboardRouter }