/* @license Enterprise */

import { useQuery } from '@tanstack/react-query';

import { trpc } from '@/main';

export interface BrandingState {
	enabled: boolean;
	appName: string | null;
	tabTitle: string | null;
	hasLogo: boolean;
	hasFavicon: boolean;
	updatedAt: number | null;
}

export const DEFAULT_APP_NAME = 'IRRI AI';
export const DEFAULT_LOGO = '/icon_irri_ai.png';
export const DEFAULT_FAVICON = '/icon_irri_ai.png';

export function useBranding(): BrandingState {
	const { data } = useQuery({
		...trpc.branding.getPublic.queryOptions(),
		staleTime: 60_000,
	});
	return (
		data ?? {
			enabled: false,
			appName: null,
			tabTitle: null,
			hasLogo: false,
			hasFavicon: false,
			updatedAt: null,
		}
	);
}

export function useBrandAssets() {
	const branding = useBranding();
	return {
		branding,
		appName: branding.appName ?? DEFAULT_APP_NAME,
		logoUrl: getBrandLogoUrl(branding),
		faviconUrl: getBrandFaviconUrl(branding),
	};
}

export function brandingAssetUrl(kind: 'logo' | 'favicon', version: number | null): string {
	const v = version ?? 0;
	return `/branding/${kind}?v=${v}`;
}

export function getBrandLogoUrl(branding: BrandingState): string {
	return branding.enabled && branding.hasLogo ? brandingAssetUrl('logo', branding.updatedAt) : DEFAULT_LOGO;
}

export function getBrandFaviconUrl(branding: BrandingState): string {
	return branding.enabled && branding.hasFavicon ? brandingAssetUrl('favicon', branding.updatedAt) : DEFAULT_FAVICON;
}
