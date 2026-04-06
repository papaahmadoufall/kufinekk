import type { Config } from 'tailwindcss'
import forms from '@tailwindcss/forms'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans:    ['var(--font-body)', 'Manrope', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'Barlow Condensed', 'Impact', 'sans-serif'],
        stat:    ['var(--font-mono-sans)', 'Space Grotesk', 'sans-serif'],
        mono:    ['var(--font-mono)', 'JetBrains Mono', 'monospace'],
      },
      colors: {
        brand: {
          50:  '#fff9ed',
          100: '#ffdbcf',
          200: '#ffb59a',
          300: '#fdc39a',
          400: '#ce4700',
          500: '#a83900',
          600: '#a43700',
          700: '#802900',
          800: '#653d1e',
          900: '#380d00',
        },
        surface: {
          app:   '#fff9ed',
          card:  '#ffffff',
          muted: '#f5edd9',
          soft:  '#eae2ce',
          dot:   '#e3bfb3',
        },
        dark: {
          DEFAULT: '#343023',
          deep:    '#1a1410',
          text:    '#1f1c0f',
        },
        ink: {
          DEFAULT: '#1f1c0f',
          muted:   '#5a4138',
          faint:   '#8e7066',
          onbrand: '#ffffff',
        },
        entree: {
          DEFAULT: '#186940',
          light:   '#f6fff5',
          subtle:  '#a5f4bf',
          text:    '#186940',
          deep:    '#00522e',
        },
        sortie: {
          DEFAULT: '#2d7a4f',
          light:   '#f6fff5',
          text:    '#2d7a4f',
        },
        encours: {
          DEFAULT: '#856404',
          light:   '#fbf3df',
          text:    '#856404',
        },
        absent: {
          DEFAULT: '#ba1a1a',
          light:   '#ffdad6',
          text:    '#93000a',
        },
        provisoire: {
          DEFAULT: '#805533',
          light:   '#ffdbcf',
          text:    '#653d1e',
        },
      },
      fontSize: {
        'display-xl': ['3rem',      { lineHeight: '1',   fontWeight: '800', letterSpacing: '-0.01em' }],
        'display-lg': ['2.25rem',   { lineHeight: '1',   fontWeight: '700', letterSpacing: '-0.01em' }],
        'display-md': ['1.75rem',   { lineHeight: '1.1', fontWeight: '700' }],
        'stat-xl':    ['2.5rem',    { lineHeight: '1',   fontWeight: '700' }],
        'stat-lg':    ['2rem',      { lineHeight: '1',   fontWeight: '700' }],
        'stat-md':    ['1.5rem',    { lineHeight: '1.1', fontWeight: '700' }],
        'action':     ['1.0625rem', { lineHeight: '1.2', fontWeight: '700' }],
        'meta':       ['0.8125rem', { lineHeight: '1.4', fontWeight: '400' }],
        'label':      ['0.6875rem', { lineHeight: '1.2', fontWeight: '700', letterSpacing: '0.06em' }],
      },
      height: {
        'btn-primary':   '56px',
        'btn-secondary': '48px',
        'btn-sm':        '40px',
      },
      minHeight: {
        'card': '64px',
      },
      borderRadius: {
        'btn':  '14px',
        'card': '20px',
        'chip': '100px',
        'icon': '12px',
      },
      boxShadow: {
        'card':  '0 2px 12px rgba(31,28,15,0.06)',
        'float': '0 8px 32px rgba(164,55,0,0.18)',
      },
      keyframes: {
        'slide-up': {
          from: { transform: 'translateY(12px)', opacity: '0' },
          to:   { transform: 'translateY(0)',    opacity: '1' },
        },
      },
      animation: {
        'slide-up': 'slide-up 200ms ease-out',
      },
    },
  },
  plugins: [forms],
}

export default config
