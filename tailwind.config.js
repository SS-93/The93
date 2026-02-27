/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // shadcn CSS variable tokens
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          // existing project tokens
          bg: '#000000',
          secondary: '#111111',
          tertiary: '#1A1A1A',
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
          // existing project tokens
          yellow: '#FFC600',
          green: '#1DB954',
          red: '#FF4500',
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        glass: 'rgba(255, 255, 255, 0.05)',
        // Enhanced semantic colors
        semantic: {
          // Text hierarchy
          'text-primary': '#FFFFFF',
          'text-secondary': '#A1A1AA', // zinc-400
          'text-tertiary': '#71717A',  // zinc-500
          'text-accent': '#FFC600',

          // Surface colors
          'surface-primary': '#000000',
          'surface-secondary': '#0A0A0A',
          'surface-tertiary': '#171717',
          'surface-elevated': 'rgba(255, 255, 255, 0.05)',

          // Border colors
          'border-primary': 'rgba(255, 255, 255, 0.1)',
          'border-secondary': 'rgba(255, 255, 255, 0.05)',
          'border-accent': 'rgba(255, 198, 0, 0.3)',
        },
        // Coliseum-specific design tokens
        coliseum: {
          // Backgrounds
          'bg-primary': '#0A0A0A',
          'bg-secondary': '#1A1A1A',
          'bg-tertiary': '#2A2A2A',
          'bg-elevated': '#333333',

          // Accents & Brand
          'accent-neon': '#00FFB3',
          'accent-gold': '#FFD700',
          'accent-purple': '#B794F4',
          'accent-cyan': '#4FD1C5',

          // Text
          'text-primary': '#FFFFFF',
          'text-secondary': '#A0AEC0',
          'text-tertiary': '#718096',
          'text-inverse': '#000000',

          // Data Visualization
          'data-positive': '#48BB78',
          'data-negative': '#F56565',
          'data-neutral': '#CBD5E0',
          'data-warning': '#ED8936',

          // Domain Colors (A/T/G/C)
          'domain-a': '#4FD1C5',  // Cyan - Cultural
          'domain-t': '#B794F4',  // Purple - Behavioral
          'domain-g': '#FFD700',  // Gold - Economic
          'domain-c': '#F56565',  // Red - Geographic

          // Borders
          'border-default': '#2D3748',
          'border-hover': '#4A5568',
          'border-focus': '#00FFB3',
        }
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      // Professional Typography System
      fontSize: {
        // Display (Hero titles)
        'display-2xl': ['4.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '900' }], // 72px
        'display-xl': ['3.75rem', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '800' }], // 60px
        'display-lg': ['3rem', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '700' }],     // 48px

        // Headings
        'heading-xl': ['2.25rem', { lineHeight: '1.25', letterSpacing: '-0.01em', fontWeight: '700' }], // 36px
        'heading-lg': ['1.875rem', { lineHeight: '1.3', letterSpacing: '-0.005em', fontWeight: '600' }], // 30px
        'heading-md': ['1.5rem', { lineHeight: '1.35', fontWeight: '600' }],    // 24px
        'heading-sm': ['1.25rem', { lineHeight: '1.4', fontWeight: '600' }],    // 20px
        'heading-xs': ['1.125rem', { lineHeight: '1.45', fontWeight: '600' }],  // 18px

        // Body text
        'body-xl': ['1.125rem', { lineHeight: '1.6', fontWeight: '400' }],      // 18px
        'body-lg': ['1rem', { lineHeight: '1.6', fontWeight: '400' }],          // 16px
        'body-md': ['0.875rem', { lineHeight: '1.5', fontWeight: '400' }],      // 14px
        'body-sm': ['0.75rem', { lineHeight: '1.5', fontWeight: '400' }],       // 12px

        // UI/Interface
        'ui-lg': ['1rem', { lineHeight: '1.5', fontWeight: '500' }],            // 16px - buttons, tabs
        'ui-md': ['0.875rem', { lineHeight: '1.4', fontWeight: '500' }],        // 14px - forms, labels
        'ui-sm': ['0.75rem', { lineHeight: '1.4', fontWeight: '500' }],         // 12px - badges, micro copy

        // Caption/Meta
        'caption-lg': ['0.875rem', { lineHeight: '1.4', fontWeight: '400' }],   // 14px
        'caption-md': ['0.75rem', { lineHeight: '1.4', fontWeight: '400' }],    // 12px
        'caption-sm': ['0.625rem', { lineHeight: '1.3', fontWeight: '400' }],   // 10px
      },
      // Enhanced spacing system
      spacing: {
        '18': '4.5rem',   // 72px
        '22': '5.5rem',   // 88px
        '26': '6.5rem',   // 104px
        '30': '7.5rem',   // 120px
        '34': '8.5rem',   // 136px
      },
      backdropBlur: {
        'glass': '10px',
      },
      // Coliseum box shadows
      boxShadow: {
        'coliseum-sm': '0 2px 8px rgba(0, 0, 0, 0.5)',
        'coliseum-md': '0 4px 16px rgba(0, 0, 0, 0.6)',
        'coliseum-lg': '0 8px 24px rgba(0, 0, 0, 0.7)',
        'coliseum-xl': '0 12px 32px rgba(0, 0, 0, 0.8)',
        'coliseum-neon': '0 0 20px rgba(0, 255, 179, 0.3)',
        'coliseum-gold': '0 0 20px rgba(255, 215, 0, 0.3)',
      },
      // Coliseum animation durations
      transitionDuration: {
        'coliseum-fast': '150ms',
        'coliseum-base': '250ms',
        'coliseum-slow': '350ms',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "star-movement-bottom": {
          "0%": { transform: "translate(0%, 0%)", opacity: "1" },
          "100%": { transform: "translate(-100%, 0%)", opacity: "0" },
        },
        "star-movement-top": {
          "0%": { transform: "translate(0%, 0%)", opacity: "1" },
          "100%": { transform: "translate(100%, 0%)", opacity: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "star-movement-bottom": "star-movement-bottom linear infinite alternate",
        "star-movement-top": "star-movement-top linear infinite alternate",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
