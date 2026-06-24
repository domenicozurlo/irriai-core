import { z } from 'zod/v4';

import type { App } from '../app';
import { getContextAssetById } from '../queries/context-asset.queries';
import { HandlerError } from '../utils/error';

const paramsSchema = z.object({
	assetId: z.string().uuid(),
});

export const contextAssetRoutes = async (app: App) => {
	app.get('/:assetId', { schema: { params: paramsSchema } }, async (request, reply) => {
		const { assetId } = request.params;

		const asset = await getContextAssetById(assetId);
		if (!asset) {
			throw new HandlerError('NOT_FOUND', 'Context asset not found');
		}

		if (!asset.mediaType.startsWith('image/')) {
			throw new HandlerError('BAD_REQUEST', 'Invalid media type');
		}

		const buffer = Buffer.from(asset.data, 'base64');
		return reply
			.header('Content-Type', asset.mediaType)
			.header('Cache-Control', 'public, max-age=31536000, immutable')
			.send(buffer);
	});
};
