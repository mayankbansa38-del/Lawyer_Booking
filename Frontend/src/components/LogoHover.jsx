import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import NyayBookerLogo from './NyayBookerLogo';

const LogoHover = ({ theme = 'light' }) => {
    const isDark = theme === 'dark';
    const textColor = isDark ? 'text-white' : 'text-[#0c1f3f]';
    const accentColor = isDark ? 'text-blue-400' : 'text-[#cfa052]';
    const buttonBg = isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900';

    return (
        <div className="relative shrink-0 w-[180px] h-[44px]">
            {/* Layer 1: Logo (Fades out on hover) */}
            <Link
                to="/"
                className="absolute inset-0 flex items-center gap-2 transition-opacity duration-300 hover:opacity-0 z-10"
            >
                <NyayBookerLogo
                    size={36}
                    primaryColor={isDark ? '#ffffff' : undefined}
                    accentColor={isDark ? '#60a5fa' : undefined}
                />
                <div className="flex flex-col">
                    <span className={`text-lg font-bold ${textColor} leading-tight`}>
                        Nyay<span className={accentColor}>Booker</span>
                    </span>
                </div>
            </Link>

            {/* Layer 2: Homepage Button (Fades in on hover) */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 hover:opacity-100 z-20 pointer-events-auto">
                {/* We need the parent to trigger hover, but this element catches clicks. 
            To make it work like the example:
            The Example uses "peer" classes or a parent group. 
            Let's use the parent div as the trigger area.
        */}
                <Link
                    to="/"
                    className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all shadow-sm ${buttonBg}`}
                >
                    <Home className="w-4 h-4" />
                    <span>Homepage</span>
                </Link>
            </div>

            {/* 
        Correction to match the exact "hover on logo" behavior from the user snippet:
        The snippet has:
        <div class="relative"><div class="peer ... hover:opacity-0">Logo</div><div class="... peer-hover:opacity-100">Button</div></div>
        
        Refactoring to use Peer pattern for cleaner CSS-only state
      */}
        </div>
    );
};

// Re-implementation using proper Peer pattern for robust hover state
export default function LogoHoverPattern({ theme = 'light' }) {
    const isDark = theme === 'dark';
    const textColor = isDark ? 'text-white' : 'text-[#0c1f3f]';
    const accentColor = isDark ? 'text-blue-400' : 'text-[#cfa052]';
    const subTextColor = isDark ? 'text-gray-400' : 'text-gray-500';

    return (
        <div className="relative shrink-0 h-[44px] min-w-[180px] flex items-center group">
            {/* 1. Normal State: Logo */}
            {/* We use group-hover on the parent to control both states simultaneously */}
            <Link to="/" className="absolute inset-0 flex items-center gap-2 transition-opacity duration-300 group-hover:opacity-0">
                <NyayBookerLogo
                    size={40}
                    primaryColor={isDark ? '#ffffff' : undefined}
                    accentColor={isDark ? '#60a5fa' : undefined}
                />
                <div className="flex flex-col">
                    <span className={`text-lg font-bold ${textColor} leading-tight`}>
                        Nyay<span className={accentColor}>Booker</span>
                    </span>
                </div>
            </Link>

            {/* 2. Hover State: Homepage Button */}
            <div className="absolute inset-0 flex items-center justify-start opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto">
                <Link
                    to="/"
                    className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm transition-transform duration-200 active:scale-95 shadow-sm ${isDark
                        ? 'bg-white/10 hover:bg-white/20 text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                        }`}
                >
                    <Home className="w-4 h-4" />
                    <span>Homepage</span>
                </Link>
            </div>
        </div>
    );
}
