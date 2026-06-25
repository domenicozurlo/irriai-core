import { describe, expect, it } from 'vitest';

import { convertDBPartToUIPart, mapUIPartsToDBParts } from '../src/utils/chat-message-part-mappings';

describe('chat message part mappings', () => {
	it('persists file parts using UUID image ids from server-relative image URLs', () => {
		const parts = [
			{
				type: 'file' as const,
				mediaType: 'image/png',
				url: '/i/123e4567-e89b-12d3-a456-426614174000',
			},
		];

		const dbParts = mapUIPartsToDBParts(parts, 'message-1');

		expect(dbParts).toEqual([
			{
				messageId: 'message-1',
				order: 0,
				type: 'file',
				mediaType: 'image/png',
				imageId: '123e4567-e89b-12d3-a456-426614174000',
			},
		]);
	});

	it('rebuilds file parts from persisted image ids', () => {
		const dbPart = {
			id: 'part-1',
			messageId: 'message-1',
			order: 0,
			type: 'file' as const,
			mediaType: 'image/png',
			imageId: '123e4567-e89b-12d3-a456-426614174000',
			text: null,
			reasoningText: null,
			providerMetadata: null,
			toolName: null,
			toolCallId: null,
			toolState: null,
			toolInput: null,
			toolRawInput: null,
			toolOutput: null,
			toolErrorText: null,
			toolApprovalApproved: null,
			toolApprovalReason: null,
			toolApprovalId: null,
			toolProviderMetadata: null,
		};

		const uiPart = convertDBPartToUIPart(dbPart as never);

		expect(uiPart).toEqual({
			type: 'file',
			mediaType: 'image/png',
			url: '/i/123e4567-e89b-12d3-a456-426614174000',
		});
	});
});
