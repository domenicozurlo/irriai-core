import { useMemo } from 'react';

import { cn } from '@/lib/utils';

const DEFAULT_WORDS = ['Crunching', 'Analyzing', 'Thinking'];

export const TextShimmer = ({
	className,
	text,
	showLogo = false,
}: {
	className?: string;
	text?: string;
	showLogo?: boolean;
}) => {
	const randomWord = useMemo(() => DEFAULT_WORDS[Math.floor(Math.random() * DEFAULT_WORDS.length)], []);
	const label = text ?? randomWord;

	return (
		<div className={cn('flex items-center gap-2', className)}>
			{showLogo && <ThinkingSpinner />}
			<span className='text-sm text-foreground font-medium'>{label}</span>
		</div>
	);
};

function ThinkingSpinner() {
	return (
		<span className='relative inline-flex size-4 items-center justify-center' role='status' aria-label='Loading'>
			<span className='absolute inset-0 rounded-full border-2 border-muted-foreground/20' />
			<span className='absolute inset-0 rounded-full border-2 border-transparent border-t-primary border-r-primary/70 animate-spin' />
			<span className='size-1 rounded-full bg-primary/70' />
		</span>
	);
}
