import { memo, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Streamdown } from 'streamdown';

import { CITATION_TAG_REGEX } from '@nao/shared';
import type { ReactNode } from 'react';

import { CitationPopover } from '@/components/citation-popover';
import { ImageLightbox } from '@/components/image-lightbox';
import { MarkdownTable } from '@/components/chat-messages/markdown-table';
import { ContextPdfViewer } from '@/components/side-panel/context-pdf-viewer';
import { useSidePanel } from '@/contexts/side-panel';
import { markdownPlugins } from '@/lib/markdown';

const CLOBBER_PREFIX = 'user-content-';
const CONTEXT_ASSET_URL_REGEX = /\/context-assets\/[0-9a-fA-F-]{8,}/g;
const MARKDOWN_CONTEXT_ASSET_IMAGE_REGEX = /!\[[^\]\n]*\]\(\s*<?(\/context-assets\/[0-9a-fA-F-]{8,})>?(?:\s+["'][^)\n]*["'])?\s*\)/g;
const LOCAL_PDF_PAGE_REFERENCE_REGEX = /^\/?(.+?\.pdf)#page=(\d+)$/i;

function stripClobberPrefix(value: string): string {
	return value.startsWith(CLOBBER_PREFIX) ? value.slice(CLOBBER_PREFIX.length) : value;
}

export const AssistantTextWithCitation = memo(({ text, isStreaming }: { text: string; isStreaming: boolean }) => {
	const imageUrls = useMemo(() => extractStandaloneContextAssetUrls(text), [text]);
	const sidePanel = useSidePanel();
	const streamdownComponents = useMemo(
		() => ({
			table: ({ node, className }: any) => <MarkdownTable node={node} className={className} />,
			inlineCode: ({ children, className }: any) => (
				<ContextPdfInlineReference
					value={String(children ?? '')}
					className={className}
					chatId={sidePanel.chatId}
					openSidePanel={sidePanel.open}
				/>
			),
			a: ({ href, children, ...props }: any) => (
				<ContextPdfAnchor
					href={String(href ?? '')}
					chatId={sidePanel.chatId}
					openSidePanel={sidePanel.open}
					{...props}
				>
					{children}
				</ContextPdfAnchor>
			),
			'citation-number': ({ id, column, children }: any) => {
				return (
					<span className='inline-block align-baseline mx-1'>
						<CitationPopover
							value={String(children)}
							queryId={stripClobberPrefix(String(id))}
							column={String(column)}
						/>
					</span>
				);
			},
		}),
		[sidePanel.chatId, sidePanel.open],
	);

	if (isStreaming) {
		const strippedText = text.replace(CITATION_TAG_REGEX, '');
		return (
			<>
				<Streamdown
					isAnimating
					mode='streaming'
					plugins={markdownPlugins}
					components={streamdownComponents}
				>
					{strippedText}
				</Streamdown>
				<ContextAssetImages imageUrls={imageUrls} />
			</>
		);
	}

	return (
		<>
			<Streamdown
				plugins={markdownPlugins}
				allowedTags={{
					'citation-number': ['id', 'column'],
				}}
				literalTagContent={['citation-number']}
				components={streamdownComponents}
			>
				{text}
			</Streamdown>
			<ContextAssetImages imageUrls={imageUrls} />
		</>
	);
});

function ContextPdfInlineReference({
	value,
	className,
	chatId,
	openSidePanel,
}: {
	value: string;
	className?: string;
	chatId: string | null;
	openSidePanel: (content: ReactNode, storySlug?: string) => void;
}) {
	const pdf = parseLocalPdfReference(value);
	if (!pdf || !chatId) {
		return <code className={className}>{value}</code>;
	}

	return (
		<button
			type='button'
			className='rounded bg-muted px-1.5 py-0.5 font-mono text-sm underline decoration-dotted underline-offset-2 transition-colors hover:text-primary'
			onClick={() => openSidePanel(<ContextPdfViewer chatId={chatId} filePath={pdf.filePath} page={pdf.page} />)}
		>
			{value}
		</button>
	);
}

function ContextPdfAnchor({
	href,
	chatId,
	openSidePanel,
	children,
	...props
}: {
	href: string;
	chatId: string | null;
	openSidePanel: (content: ReactNode, storySlug?: string) => void;
	children: ReactNode;
}) {
	const pdf = parseLocalPdfReference(href);
	if (!pdf || !chatId) {
		return (
			<a href={href} {...props}>
				{children}
			</a>
		);
	}

	return (
		<button
			type='button'
			className='text-primary underline underline-offset-2'
			onClick={() => openSidePanel(<ContextPdfViewer chatId={chatId} filePath={pdf.filePath} page={pdf.page} />)}
		>
			{children}
		</button>
	);
}

function parseLocalPdfReference(value: string): { filePath: string; page?: number } | null {
	const trimmed = value.trim();
	if (!trimmed || /^[a-z][a-z0-9+.-]*:/i.test(trimmed) || trimmed.startsWith('//')) {
		return null;
	}

	const match = trimmed.match(LOCAL_PDF_PAGE_REFERENCE_REGEX);
	if (!match) {
		return null;
	}

	const page = match[2] ? Number.parseInt(match[2], 10) : undefined;
	return {
		filePath: match[1],
		page: page && page > 0 ? page : undefined,
	};
}

function extractStandaloneContextAssetUrls(text: string): string[] {
	const urls = new Set<string>();
	const markdownImageUrls = new Set(
		[...text.matchAll(MARKDOWN_CONTEXT_ASSET_IMAGE_REGEX)].map((match) => match[1]),
	);

	for (const match of text.matchAll(CONTEXT_ASSET_URL_REGEX)) {
		const url = match[0];
		if (markdownImageUrls.has(url)) {
			continue;
		}
		urls.add(url);
	}
	return [...urls];
}

function ContextAssetImages({ imageUrls }: { imageUrls: string[] }) {
	const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

	if (imageUrls.length === 0) {
		return null;
	}

	return (
		<>
			<div className='mt-3 flex flex-wrap gap-2'>
				{imageUrls.map((url) => (
					<button key={url} type='button' className='cursor-pointer' onClick={() => setLightboxSrc(url)}>
						<img
							src={url}
							alt=''
							className='max-h-72 max-w-full rounded-md border object-contain'
							loading='lazy'
						/>
					</button>
				))}
			</div>
			{lightboxSrc &&
				createPortal(<ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />, document.body)}
		</>
	);
}
