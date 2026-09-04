/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Marca
        brand: {
          DEFAULT: '#F47500',
          hover: '#FF930A',
          active: '#CC5902',
          text: '#CC5902',
          contrast: '#461B04',
          soft: '#FFF3D3',
          badge: '#87400E',
        },
        // Aplicação
        app: {
          bg: '#F6F7F8',
          surface: '#FFFFFF',
          border: '#E5E7EB',
        },
        // Texto
        ink: {
          DEFAULT: '#171717',
          muted: '#5F6368',
        },
        // Estados
        success: '#18794E',
        warning: '#A15C00',
        danger:  '#AE2929',
        info:    '#1F4FA0',
      },
      fontFamily: {
        sans: ['var(--font-montserrat)', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      fontSize: {
        // Escala tipográfica da vitrine
        'display': ['2.25rem', { lineHeight: '2.5rem', fontWeight: '800' }],  // 36/40
        'h1':      ['1.75rem', { lineHeight: '2rem',    fontWeight: '700' }],  // 28/32
        'h2':      ['1.25rem', { lineHeight: '1.75rem', fontWeight: '700' }],  // 20/28
        'h3':      ['1.125rem',{ lineHeight: '1.5rem',  fontWeight: '600' }],  // 18/24
        'body':    ['0.875rem',{ lineHeight: '1.25rem', fontWeight: '400' }],  // 14/20
        'small':   ['0.75rem', { lineHeight: '1rem',    fontWeight: '400' }],  // 12/16
      },
      spacing: {
        // Grade 8px (valores base já são múltiplos de 4, 16)
        0.5: '2px',
        1: '4px',
        1.5: '6px',
        2: '8px',
        3: '12px',
        4: '16px',
        5: '20px',
        6: '24px',
        7: '28px',
        8: '32px',
        10: '40px',
        12: '48px',
        14: '56px',
        16: '64px',
        18: '72px',
        20: '80px',
        22: '88px',
        24: '96px',
      },
      borderRadius: {
        sm: '6px',
        DEFAULT: '10px',
        md: '10px',
        lg: '14px',
        xl: '20px',
        '2xl': '24px',
      },
      boxShadow: {
        'card':     '0 1px 2px rgba(16,24,40,0.06), 0 1px 3px rgba(16,24,40,0.04)',
        'card-hover': '0 4px 8px rgba(16,24,40,0.08), 0 2px 4px rgba(16,24,40,0.06)',
        'sticky':   '0 1px 3px rgba(16,24,40,0.08)',
        'modal':    '0 24px 48px rgba(16,24,40,0.18), 0 8px 16px rgba(16,24,40,0.10)',
        'cartbar':  '0 -4px 16px rgba(16,24,40,0.08)',
      },
      maxWidth: {
        'container-store': '1080px',
        'container-admin': '1280px',
        'prose-tremeliko': '68ch',
      },
      minHeight: {
        // Touch target
        'touch': '44px',
        'touch-lg': '48px',
      },
      ringColor: {
        brand: '#F47500',
      },
      keyframes: {
        'fade-in':   { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        'slide-up':  { '0%': { transform: 'translateY(8px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        'pulse-soft':{ '0%,100%': { opacity: '1' }, '50%': { opacity: '0.6' } },
      },
      animation: {
        'fade-in':   'fade-in 150ms ease-out',
        'slide-up':  'slide-up 200ms ease-out',
        'pulse-soft':'pulse-soft 1.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
