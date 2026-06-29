import { useEffect, useState } from 'react';

import { useBrandAssets } from '@/hooks/use-branding';
import { cn } from '@/lib/utils';

type BrandLogoProps = {
	className?: string;
	alt?: string;
};

export function BrandLogo({ className, alt }: BrandLogoProps) {
	const { appName, logoUrl } = useBrandAssets();
	return <img src={logoUrl} alt={alt ?? appName} className={cn('object-contain', className)} />;
}

type BrandLogoAnimatedProps = {
	className?: string;
	imageClassName?: string;
	durationSeconds?: number;
	title?: string;
};

export function BrandLogoAnimated({ className, imageClassName, durationSeconds = 2.2, title }: BrandLogoAnimatedProps) {
	const { appName, logoUrl } = useBrandAssets();
	const reducedMotion = usePrefersReducedMotion();
	const animationStyle = { animationDuration: `${durationSeconds}s` };

	return (
		<div
			className={cn('relative inline-flex size-5 items-center justify-center', className)}
			role='img'
			aria-label={title ?? appName}
		>
			{!reducedMotion && (
				<>
					<span
						className='absolute inset-0 rounded-full border border-primary/30 border-t-primary/80 animate-spin'
						style={animationStyle}
					/>
					<span className='absolute inset-1 rounded-full bg-primary/10 animate-pulse' />
				</>
			)}
			<img
				src={logoUrl}
				alt=''
				aria-hidden
				className={cn('relative size-3.5 object-contain', reducedMotion ? '' : 'animate-pulse', imageClassName)}
				style={reducedMotion ? undefined : animationStyle}
			/>
		</div>
	);
}

function usePrefersReducedMotion(): boolean {
	const [reduced, setReduced] = useState(false);
	useEffect(() => {
		if (typeof window === 'undefined' || !window.matchMedia) {
			return;
		}
		const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
		setReduced(mql.matches);
		const onChange = () => setReduced(mql.matches);
		mql.addEventListener('change', onChange);
		return () => mql.removeEventListener('change', onChange);
	}, []);
	return reduced;
}
