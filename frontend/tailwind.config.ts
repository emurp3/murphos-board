import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Cinematic dark palette
        space: {
          DEFAULT: '#050810',
          900: '#050810',
          800: '#080d1a',
          700: '#0c1225',
          600: '#111827',
          500: '#1a2438',
        },
        // Primary — electric cyan
        cyan: {
          DEFAULT: '#00D4FF',
          dim: '#00a8cc',
          glow: '#00D4FF33',
        },
        // Accent — deep purple
        purple: {
          DEFAULT: '#7B2FBE',
          dim: '#5c2490',
          glow: '#7B2FBE33',
        },
        // Status
        success: {
          DEFAULT: '#00FF88',
          dim: '#00cc6a',
          glow: '#00FF8833',
        },
        warning: {
          DEFAULT: '#FF6B35',
          dim: '#cc5529',
          glow: '#FF6B3533',
        },
        danger: {
          DEFAULT: '#FF0054',
          dim: '#cc0043',
          glow: '#FF005433',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'glow-cyan':    '0 0 20px rgba(0, 212, 255, 0.3)',
        'glow-purple':  '0 0 20px rgba(123, 47, 190, 0.3)',
        'glow-success': '0 0 20px rgba(0, 255, 136, 0.3)',
        'glow-warning': '0 0 20px rgba(255, 107, 53, 0.3)',
        'glow-danger':  '0 0 20px rgba(255, 0, 84, 0.3)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ping-slow':  'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
        'gradient':   'gradient 8s ease infinite',
      },
      keyframes: {
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%':       { backgroundPosition: '100% 50%' },
        },
      },
      backgroundImage: {
        'grid-pattern':
          'linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)',
      },
      backgroundSize: {
        'grid': '40px 40px',
      },
    },
  },
  plugins: [],
}

export default config
