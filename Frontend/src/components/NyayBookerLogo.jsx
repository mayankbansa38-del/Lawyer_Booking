/**
 * NyayBooker Logo - Vector React Component
 * Minimal geometric design: Stylized "L" with gold accent circle
 */

const NyayBookerLogo = ({
    size = 40,
    showText = false,
    className = "",
    primaryColor = "#0c1f3f",
    accentColor = "#cfa052"
}) => {
    // Maintain aspect ratio
    const width = showText ? size * 4 : size;
    const height = size;

    return (
        <svg
            viewBox={showText ? "0 0 160 50" : "0 0 50 50"}
            width={width}
            height={height}
            className={className}
            aria-label="NyayBooker Logo"
        >
            {/* Main "L" shape - vertical bar */}
            <rect
                x="8"
                y="4"
                width="12"
                height="36"
                rx="1"
                fill={primaryColor}
            />
            {/* Main "L" shape - horizontal bar */}
            <rect
                x="8"
                y="40"
                width="28"
                height="8"
                rx="1"
                fill={primaryColor}
            />
            {/* Gold accent circle */}
            <circle
                cx="32"
                cy="30"
                r="8"
                fill={accentColor}
            />
            {/* Text (optional) */}
            {showText && (
                <g>
                    <text
                        x="55"
                        y="34"
                        fontFamily="Inter, system-ui, sans-serif"
                        fontSize="20"
                        fontWeight="500"
                        fill={primaryColor}
                    >
                        Nyay
                    </text>
                    <text
                        x="100"
                        y="34"
                        fontFamily="Inter, system-ui, sans-serif"
                        fontSize="20"
                        fontWeight="700"
                        fill={primaryColor}
                    >
                        Booker
                    </text>
                </g>
            )}
        </svg>
    );
};

export default NyayBookerLogo;
