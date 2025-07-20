
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				success: {
					DEFAULT: 'hsl(var(--success))',
					foreground: 'hsl(var(--success-foreground))'
				},
				warning: {
					DEFAULT: 'hsl(var(--warning))',
					foreground: 'hsl(var(--warning-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				'aj-navy-deep': 'hsl(var(--aj-navy-deep))',
				'aj-navy-light': 'hsl(var(--aj-navy-light))',
				'aj-yellow': 'hsl(var(--aj-yellow))',
				'aj-yellow-bright': 'hsl(var(--aj-yellow-bright))',
				'aj-yellow-deep': 'hsl(var(--aj-yellow-deep))',
				'aj-blue-calm': 'hsl(var(--aj-blue-calm))',
				'aj-blue-accent': 'hsl(var(--aj-blue-accent))',
				'contractor-bg': 'hsl(var(--contractor-bg))',
				'contractor-accent': 'hsl(var(--contractor-accent))',
				'contractor-alert-bg': 'hsl(var(--contractor-alert-bg))',
				'button-primary': 'hsl(var(--button-primary))',
				'button-primary-hover': 'hsl(var(--button-primary-hover))',
				'button-primary-active': 'hsl(var(--button-primary-active))',
				'button-primary-text': 'hsl(var(--button-primary-text))',
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			backgroundImage: {
				'gradient-brand': 'var(--gradient-brand)',
				'gradient-subtle': 'var(--gradient-subtle)',
				'gradient-ai': 'linear-gradient(135deg, hsl(var(--aj-blue-accent)) 0%, hsl(var(--aj-yellow)) 100%)',
				'gradient-sparkle': 'linear-gradient(135deg, hsl(var(--accent)) 0%, hsl(var(--aj-yellow-bright)) 100%)',
				'gradient-dark-glow': 'linear-gradient(135deg, hsl(var(--aj-navy-deep)) 0%, hsl(var(--aj-navy-light)) 100%)',
				'gradient-yellow-premium': 'var(--gradient-yellow-premium)',
				'gradient-yellow-metallic': 'var(--gradient-yellow-metallic)',
			},
			boxShadow: {
				'brand': 'var(--shadow-brand)',
				'card': 'var(--shadow-card)',
				'elevated': 'var(--shadow-elevated)',
				'ai': '0 8px 32px rgba(77, 166, 255, 0.15), 0 4px 16px rgba(77, 166, 255, 0.1)',
				'sparkline': '0 4px 16px rgba(255, 204, 0, 0.1), 0 2px 8px rgba(255, 204, 0, 0.05)',
				'glow': '0 0 20px rgba(77, 166, 255, 0.3), 0 0 40px rgba(77, 166, 255, 0.1)',
				'button-3d': 'var(--shadow-button-3d)',
				'button-glow': 'var(--shadow-button-glow)',
				'button-pressed': 'var(--shadow-button-pressed)',
			},
			transitionProperty: {
				'aj': 'all',
			},
			transitionDuration: {
				'aj-base': '200ms',
				'aj-smooth': '300ms',
			},
			transitionTimingFunction: {
				'aj-ease': 'ease',
			},
			fontFamily: {
				'sans': ['Poppins', 'system-ui', 'sans-serif'],
				'poppins': ['Poppins', 'sans-serif'],
			},
			fontSize: {
				'header': 'var(--font-size-header)',
				'body': 'var(--font-size-body)',
				'label': 'var(--font-size-label)',
			},
			spacing: {
				'xs': 'var(--spacing-xs)',
				'sm': 'var(--spacing-sm)',
				'md': 'var(--spacing-md)',
				'lg': 'var(--spacing-lg)',
				'xl': 'var(--spacing-xl)',
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'pulse-glow': {
					'0%, 100%': {
						opacity: '1',
						transform: 'scale(1)'
					},
					'50%': {
						opacity: '0.8',
						transform: 'scale(1.02)'
					}
				},
				'sparkle': {
					'0%, 100%': {
						opacity: '0.8',
						transform: 'rotate(0deg) scale(1)'
					},
					'50%': {
						opacity: '1',
						transform: 'rotate(180deg) scale(1.1)'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
				'sparkle': 'sparkle 3s ease-in-out infinite'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
