import { readFile } from '@nao/shared/tools';
import fs from 'fs/promises';

import { ReadOutput, renderToModelOutput } from '../../components/tool-outputs';
import { resolveMarkdownImageAssets } from '../../services/context-assets.service';
import { toRealPath } from '../../utils/tools';
import { createTool } from '../../utils/tools';

const MARKDOWN_EXTENSIONS = new Set(['md', 'mdx', 'markdown']);

export default createTool<readFile.Input, readFile.Output>({
	description:
		'Read the contents of a file at the specified path. When reading markdown, local image links are converted into displayable context asset URLs.',
	inputSchema: readFile.InputSchema,
	outputSchema: readFile.OutputSchema,
	execute: async ({ file_path }, context) => {
		const projectFolder = context.projectFolder;
		const realPath = toRealPath(file_path, projectFolder);

		let content = await fs.readFile(realPath, 'utf-8');
		if (isMarkdownPath(file_path)) {
			content = await resolveMarkdownImageAssets({
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
