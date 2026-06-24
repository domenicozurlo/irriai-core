import { eq } from 'drizzle-orm';

import s, { NewContextAsset } from '../db/abstractSchema';
import { db } from '../db/db';

export const saveContextAsset = async (asset: NewContextAsset): Promise<{ id: string }> => {
	const [row] = await db
		.insert(s.contextAsset)
		.values(asset)
		.onConflictDoUpdate({
			target: [s.contextAsset.projectId, s.contextAsset.virtualPath, s.contextAsset.contentHash],
			set: {
				data: asset.data,
				mediaType: asset.mediaType,
			},
		})
		.returning({ id: s.contextAsset.id })
		.execute();
	return row;
};

export const getContextAssetById = async (id: string): Promise<{ data: string; mediaType: string } | undefined> => {
	const [row] = await db
		.select({ data: s.contextAsset.data, mediaType: s.contextAsset.mediaType })
		.from(s.contextAsset)
		.where(eq(s.contextAsset.id, id))
		.execute();
	return row;
};
