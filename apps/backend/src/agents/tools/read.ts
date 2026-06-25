import { readFile } from '@nao/shared/tools';
import { createHash } from 'crypto';
import fs from 'fs/promises';
import path from 'path';

import { ReadOutput, renderToModelOutput } from '../../components/tool-outputs';
import { resolveMarkdownImageAssets, resolveTextImageAssets } from '../../services/context-assets.service';
import { toRealPath, toVirtualPath } from '../../utils/tools';
import { createTool } from '../../utils/tools';

const MARKDOWN_EXTENSIONS = new Set(['md', 'mdx', 'markdown']);
const JSON_EXTENSIONS = new Set(['json']);
const MAX_CONTEXT_ASSET_BYTES = 5 * 1024 * 1024;
const IMAGE_MEDIA_TYPES: Record<string, string> = {
	'.gif': 'image/gif',
	'.jpeg': 'image/jpeg',
	'.jpg': 'image/jpeg',
	'.png': 'image/png',
	'.svg': 'image/svg+xml',
	'.webp': 'image/webp',
};

export default createTool<readFile.Input, readFile.Output>({
	description:
		'Read the contents of a file at the specified path. When reading markdown, local image links are converted into displayable context asset URLs. When reading an image, the output is a displayable markdown image link.',
	inputSchema: readFile.InputSchema,
	outputSchema: readFile.OutputSchema,
	execute: async ({ file_path }, context) => {
		const projectFolder = context.projectFolder;
		const realPath = toRealPath(file_path, projectFolder);

		if (isImagePath(file_path)) {
			const content = await renderImageAsMarkdown({
				realPath,
				filePath: file_path,
				projectFolder,
				projectId: context.projectId,
			});
			return {
				_version: '1' as const,
				content,
				numberOfTotalLines: 1,
			};
		}

		let content = await fs.readFile(realPath, 'utf-8');
		if (isMarkdownPath(file_path)) {
			content = await resolveMarkdownImageAssets({
				content,
				projectId: context.projectId,
				projectFolder,
				sourceFilePath: file_path,
			});
		} else if (isJsonPath(file_path)) {
			content = await resolveTextImageAssets({
				content,
				projectId: context.projectId,
				projectFolder,
				sourceFilePath: file_path,
			});
		}
		const numberOfTotalLines = content.split('\n').length;

		return {
			_version: '1' as const,
			content,
			numberOfTotalLines,
		};
	},

	toModelOutput: ({ output }) => renderToModelOutput(ReadOutput({ output }), output),
});

function isMarkdownPath(filePath: string): boolean {
	const extension = filePath.split('.').pop()?.toLowerCase();
	return extension ? MARKDOWN_EXTENSIONS.has(extension) : false;
}

function isJsonPath(filePath: string): boolean {
	const extension = filePath.split('.').pop()?.toLowerCase();
	return extension ? JSON_EXTENSIONS.has(extension) : false;
}

function isImagePath(filePath: string): boolean {
	return getImageMediaType(filePath) !== null;
}

function getImageMediaType(filePath: string): string | null {
	const extension = path.extname(filePath).toLowerCase();
	return IMAGE_MEDIA_TYPES[extension] ?? null;
}

async function renderImageAsMarkdown({
	realPath,
	filePath,
	projectFolder,
	projectId,
}: {
	realPath: string;
	filePath: string;
	projectFolder: string;
	projectId: string;
}): Promise<string> {
	const mediaType = getImageMediaType(filePath);
	if (!mediaType) {
		throw new Error('Unsupported image type');
	}

	const stat = await fs.stat(realPath);
	if (!stat.isFile()) {
		throw new Error('Path is not a file');
	}
	if (stat.size > MAX_CONTEXT_ASSET_BYTES) {
		throw new Error(`Image is too large to display (${stat.size} bytes)`);
	}

	const buffer = await fs.readFile(realPath);
	const contentHash = createHash('sha256').update(buffer).digest('hex');
	const assetVirtualPath = toVirtualPath(realPath, projectFolder);

	const { saveContextAsset } = await import('../../queries/context-asset.queries');
	const { id } = await saveContextAsset({
		projectId,
		virtualPath: assetVirtualPath,
		contentHash,
		data: buffer.toString('base64'),
		mediaType,
	});

	const altText = path.basename(filePath).replaceAll(/[_-]+/g, ' ');
	return `![${altText}](/context-assets/${id})`;
}
