import { ExternalLink } from 'lucide-react';

import { SidePanelHeader } from '@/components/side-panel/side-panel-header';
import { Button } from '@/components/ui/button';

interface ContextPdfViewerProps {
	chatId: string;
	filePath: string;
	page?: number;
}

export function ContextPdfViewer({ chatId, filePath, page }: ContextPdfViewerProps) {
	const src = buildContextPdfUrl({ chatId, filePath, page });
	const title = filePath.split('/').pop() ?? filePath;

	return (
		<div className='flex h-full flex-col'>
			<SidePanelHeader title={title} label={page ? `PDF page ${page}` : 'PDF'} />
			<div className='flex items-center gap-2 border-b px-4 py-2 text-xs text-muted-foreground'>
				<span className='min-w-0 flex-1 truncate font-mono' title={filePath}>
					{filePath}
				</span>
				<Button asChild variant='ghost' size='icon-sm' className='hover:rounded-full' aria-label='Open PDF'>
					<a href={src} target='_blank' rel='noreferrer'>
						<ExternalLink className='size-3.5' />
					</a>
				</Button>
			</div>
			<iframe title={title} src={src} className='h-full min-h-0 w-full flex-1 border-0 bg-background' />
		</div>
	);
}

function buildContextPdfUrl({ chatId, filePath, page }: ContextPdfViewerProps): string {
	const query = new URLSearchParams({ chatId, path: filePath });
	const hash = page ? `#page=${page}` : '';
	return `/context-files/pdf?${query.toString()}${hash}`;
}
