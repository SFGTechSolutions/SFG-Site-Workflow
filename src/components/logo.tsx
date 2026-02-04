interface LogoProps {
    size?: 'sm' | 'md' | 'lg';
    variant?: 'icon' | 'full';
    className?: string;
}

export function Logo({ size = 'md', variant = 'full', className = '' }: LogoProps) {
    const sizeClasses = {
        sm: 'h-8',
        md: 'h-12',
        lg: 'h-16',
    };

    return (
        <a
            href="https://agent-6982dbe2550252d2d721c5c--sfg-site-workflow.netlify.app/"
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-3 ${className}`}
        >
            <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
                Built and Powered by
            </span>
            <img
                src="https://i.postimg.cc/SsWD6tff/Untitled-design-(67).png"
                alt="Site Buddy Logo"
                className={`${sizeClasses[size]} w-auto object-contain`}
            />
        </a>
    );
}
