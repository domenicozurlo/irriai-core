import fs from 'fs/promises';
import path from 'path';
import { z } from 'zod/v4';

import type { App } from '../app';
import { authMiddleware } from '../middleware/auth';
import * as chatQueries from '../queries/chat.queries';
import * as projectQueries from '../queries/project.queries';
import { HandlerError } from '../utils/error';
import { toRealPath } from '../utils/tools';

const pdfQuerySchema = z.object({
	chatId: z.string().uuid(),
	path: z.string().min(1),
});

export const contextFileRoutes = async (app: App) => {
	app.addHook('preHandler', authMiddleware);

	app.get('/pdf', { schema: { querystring: pdfQuerySchema } }, async (request, reply) => {
		const { chatId, path: virtualPath } = request.query;
		const chat = await chatQueries.getChatInfo(chatId);
		if (!chat) {
			throw new HandlerError('NOT_FOUND', 'Chat not found');
		}

		const userRole = await projectQueries.getUserRoleInProject(chat.projectId, request.user.id);
		if (!userRole) {
			throw new HandlerError('FORBIDDEN', 'You do not have access to this project');
		}

		const project = await projectQueries.retrieveProjectById(chat.projectId);
		if (!project.path) {
			throw new HandlerError('BAD_REQUEST', 'Project path not configured');
		}
		if (path.extname(virtualPath).toLowerCase() !== '.pdf') {
			throw new HandlerError('BAD_REQUEST', 'Only PDF files can be viewed');
		}

		const realPath = toRealPath(virtualPath, project.path);
		const stat = await fs.stat(realPath);
		if (!stat.isFile()) {
			throw new HandlerError('NOT_FOUND', 'PDF file not found');
		}

		const buffer = await fs.readFile(realPath);
		return reply
			.header('Content-Type', 'application/pdf')
			.header('Content-Disposition', `inline; filename="${path.basename(realPath).replaceAll('"', '')}"`)
			.header('Cache-Control', 'private, max-age=300')
			.send(buffer);
	});
};
