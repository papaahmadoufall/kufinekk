import type { Config } from 'tailwindcss'
import forms from '@tailwindcss/forms'
import plugin from 'tailwindcss/plugin'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans:    ['var(--font-body)', 'Manrope', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'Barlow Condensed', 'Impact', 'sans-serif'],
        heading: ['var(--font-display)', 'Barlow Condensed', 'Impact', 'sans-serif'],
        stat:    ['var(--font-mono-sans)', 'Space Grotesk', 'sans-serif'],
        mono:    ['var(--font-mono)', 'JetBrains Mono', 'monospace'],
      },
      colors: {
        // ── Kufinekk palette ───────────────────────────
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

        // ── Shadcn semantic tokens (via CSS vars in globals.css) ──
        border:      'hsl(var(--border))',
        input:       'hsl(var(--input))',
        ring:        'hsl(var(--ring))',
        background:  'hsl(var(--background))',
        foreground:  'hsl(var(--foreground))',
        primary: {
          DEFAULT:    'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT:    'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT:    'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT:    'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT:    'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT:    'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT:    'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
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
        // shadcn radii
        lg:     'var(--radius)',
        md:     'calc(var(--radius) - 2px)',
        sm:     'calc(var(--radius) - 4px)',
        '4xl':  '2rem',
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
        'fade-in':   { from: { opacity: '0' }, to: { opacity: '1' } },
        'fade-out':  { from: { opacity: '1' }, to: { opacity: '0' } },
        'zoom-in':   { from: { opacity: '0', transform: 'scale(0.95)' }, to: { opacity: '1', transform: 'scale(1)' } },
        'zoom-out':  { from: { opacity: '1', transform: 'scale(1)' }, to: { opacity: '0', transform: 'scale(0.95)' } },
      },
      animation: {
        'slide-up': 'slide-up 200ms ease-out',
        'fade-in':  'fade-in 150ms ease-out',
        'fade-out': 'fade-out 100ms ease-in',
        'zoom-in':  'zoom-in 150ms ease-out',
        'zoom-out': 'zoom-out 100ms ease-in',
      },
    },
  },
  plugins: [
    forms,
    // Custom variants for shadcn Radix data-state / data-* attributes
    plugin(({ addVariant }) => {
      addVariant('data-open',     ['&[data-state=open]',     '&[data-open]:not([data-open=false])'])
      addVariant('data-closed',   ['&[data-state=closed]',   '&[data-closed]:not([data-closed=false])'])
      addVariant('data-checked',  ['&[data-state=checked]',  '&[data-checked]:not([data-checked=false])'])
      addVariant('data-unchecked',['&[data-state=unchecked]','&[data-unchecked]:not([data-unchecked=false])'])
      addVariant('data-selected', ['&[data-selected=true]'])
      addVariant('data-disabled', ['&[data-disabled=true]',  '&[data-disabled]:not([data-disabled=false])'])
      addVariant('data-active',   ['&[data-state=active]',   '&[data-active]:not([data-active=false])'])
    }),
  ],
}

export default config
