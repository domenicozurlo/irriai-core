import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { resolveMarkdownImageAssets, rewriteMarkdownImageLinks } from '../src/services/context-assets.service';

const saveContextAsset = vi.fn(async () => ({ id: '00000000-0000-4000-8000-000000000001' }));

vi.mock('../src/queries/context-asset.queries', () => ({
	saveContextAsset,
}));

const tempDirs: string[] = [];

afterEach(async () => {
	saveContextAsset.mockClear();
	await Promise.all(tempDirs.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true })));
});

describe('rewriteMarkdownImageLinks', () => {
	it('rewrites local markdown image destinations and preserves titles', async () => {
		const input = [
			'![Reset](images/reset.png)',
			'![Lamp](../assets/lamp.jpg "red lamp")',
			'![Remote](https://example.com/image.png)',
			'![Data](data:image/png;base64,abc)',
		].join('\n');

		const result = await rewriteMarkdownImageLinks(input, async (destination) =>
			destination.startsWith('http') || destination.startsWith('data:')
				? null
				: `/context-assets/${destination.replaceAll('/', '-')}`,
		);

		expect(result).toBe(
			[
				'![Reset](/context-assets/images-reset.png)',
				'![Lamp](/context-assets/..-assets-lamp.jpg "red lamp")',
				'![Remote](https://example.com/image.png)',
				'![Data](data:image/png;base64,abc)',
			].join('\n'),
		);
	});

	it('resolves project-root relative image paths from nested markdown files', async () => {
		const projectFolder = await fs.mkdtemp(path.join(os.tmpdir(), 'nao-context-assets-'));
		tempDirs.push(projectFolder);
		await fs.mkdir(path.join(projectFolder, 'docs/wiki/raw/pages/page-8'), { recursive: true });
		await fs.writeFile(path.join(projectFolder, 'docs/wiki/raw/pages/page-8/img-24.jpeg'), 'image-bytes');

		const result = await resolveMarkdownImageAssets({
			content: '![Reset IQOS 3 DUO](docs/wiki/raw/pages/page-8/img-24.jpeg)',
			projectId: 'project-1',
			projectFolder,
			sourceFilePath: '/docs/wiki/topics/reset.md',
		});

		expect(result).toBe('![Reset IQOS 3 DUO](/context-assets/00000000-0000-4000-8000-000000000001)');
		expect(saveContextAsset).toHaveBeenCalledWith(
			expect.objectContaining({
				mediaType: 'image/jpeg',
				projectId: 'project-1',
				virtualPath: '/docs/wiki/raw/pages/page-8/img-24.jpeg',
			}),
		);
	});
});
