/* @license Enterprise */

import { useEffect } from 'react';

import { useBrandAssets } from '@/hooks/use-branding';

/**
 * Sync the browser tab (title + favicon) with the active white-label branding.
 * Restores defaults whenever the feature is disabled or no override is set so
 * an admin toggling the license off does not strand the page with stale chrome.
 */
export function BrandingHead() {
	const { appName, branding, faviconUrl } = useBrandAssets();

	useEffect(() => {
		const title = branding.enabled && branding.tabTitle ? branding.tabTitle : appName;
		document.title = title;
	}, [appName, branding.enabled, branding.tabTitle]);

	useEffect(() => {
		setFaviconHref(faviconUrl);
		return () => setFaviconHref(faviconUrl);
	}, [faviconUrl]);

	return null;
}

function setFaviconHref(href: string) {
	let link = document.querySelector<HTMLLinkElement>('link[rel~="icon"]');
	if (!link) {
		link = document.createElement('link');
		link.rel = 'icon';
		document.head.appendChild(link);
	}
	if (link.getAttribute('href') !== href) {
		link.setAttribute('href', href);
	}
}
