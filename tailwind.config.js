/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./pages/**/*.{js,ts,jsx,tsx}",
        "./*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['"Instrument Sans"', 'sans-serif'],
                display: ['"Space Grotesque"', 'sans-serif'],
            },
            colors: {
                black: '#000000',
                white: '#ffffff',
                'brand-primary': '#000000',
                'premium-bg': '#062016',
                'brand-secondary': '#f0fdf4',
                'brand-accent': '#3f6212',
                zinc: {
                    950: '#09090b',
                    900: '#18181b',
                    800: '#27272a',
                    700: '#3f3f46',
                    600: '#71717a',
                    500: '#a1a1aa',
                    400: '#d4d4d8',
                    300: '#e4e4e7',
                    200: '#f4f4f5',
                    100: '#fafafa',
                    50: '#f9f9f9',
                }
            },
            animation: {
                'fade-in': 'fadeIn 0.5s ease-out forwards',
                'slide-up': 'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                'slide-in-right': 'slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                slideInRight: {
                    '0%': { transform: 'translateX(100%)' },
                    '100%': { transform: 'translateX(0%)' },
                }
            }
        },
    },
    plugins: [],
}
