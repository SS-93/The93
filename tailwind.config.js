/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          bg: '#000000',
          secondary: '#111111',
          tertiary: '#1A1A1A',
        },
        accent: {
          yellow: '#FFC600',
          green: '#1DB954',
          red: '#FF4500',
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
        }
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
    },
  },
  plugins: [],
}