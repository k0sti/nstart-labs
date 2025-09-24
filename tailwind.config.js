/** @type {import('tailwindcss').Config} */
export default {
	darkMode: 'class', // enable dark mode via class strategy
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			fontSize: {
				sm: ['16px', '18px'],
				base: ['18px', '20px'],
				lg: ['20px', '22px'],
				xl: ['22px', '24px']
			},
			colors: {
				accent: 'var(--accent-color)'
			},
			animation: {
				fade1: 'fadeIn 0.5s ease-in-out forwards',
				fade2: 'fadeIn 1s ease-in-out forwards',
				fade1delayed: 'fadeIn 0.5s ease-in-out 1s both',
				down: 'down 1s ease-in-out forwards',
				fade2down: 'fadeIn 1s ease-in-out, down 1s ease-in-out forwards',
				shake: 'shake 0.5s ease-in-out',
				fadeShake: 'fadeIn 1s ease-in-out 1s both, shake 1s ease-in-out 1s'
			},
			keyframes: {
				fadeIn: {
					'0%': { opacity: 0 },
					'100%': { opacity: 1 }
				},
				down: {
					'0%': { transform: 'translateY(-100px)' },
					'100%': { transform: 'translateY(0px)' }
				},
				shake: {
					'0%': { transform: 'rotate(5deg)' },
					'10%': { transform: 'rotate(-5deg)' },
					'20%': { transform: 'rotate(15deg)' },
					'30%': { transform: 'rotate(-5deg)' },
					'40%': { transform: 'rotate(12deg)' },
					'50%': { transform: 'rotate(-3deg)' },
					'60%': { transform: 'rotate(8deg)' },
					'70%': { transform: 'rotate(-2deg)' },
					'80%': { transform: 'rotate(6deg)' },
					'100%': { transform: 'rotate(-5deg)' }
				}
			}
		}
	},
	plugins: []
};
