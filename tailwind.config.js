/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Modern Primary Brand Colors
        'primary': {
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#6366F1', // Main brand color
          600: '#4F46E5',
          700: '#3730A3',
          800: '#312E81',
          900: '#1E1B4B',
          950: '#0F0D1F'
        },
        
        // Secondary Accent Colors
        'accent': {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B', // Main accent color
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
          950: '#451A03'
        },
        
        // Success Colors
        'success': {
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#10B981', // Main success color
          600: '#059669',
          700: '#047857',
          800: '#065F46',
          900: '#064E3B',
          950: '#022C22'
        },
        
        // Warning Colors
        'warning': {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B', // Main warning color
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
          950: '#451A03'
        },
        
        // Error Colors
        'error': {
          50: '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          300: '#FCA5A5',
          400: '#F87171',
          500: '#EF4444', // Main error color
          600: '#DC2626',
          700: '#B91C1C',
          800: '#991B1B',
          900: '#7F1D1D',
          950: '#450A0A'
        },
        
        // Enhanced Neutral Palette
        'neutral': {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
          950: '#020617'
        }
      },
      
      // Modern Gradients
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'modern-gradient': 'linear-gradient(135deg, var(--tw-gradient-stops))',
        'glass-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
      },
      
      // Enhanced Shadows
      boxShadow: {
        'glass': '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        'glass-lg': '0 12px 40px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        'glow': '0 0 20px rgba(99, 102, 241, 0.3)',
        'glow-lg': '0 0 40px rgba(99, 102, 241, 0.4)',
        'modern': '0 4px 16px rgba(0, 0, 0, 0.1)',
        'modern-lg': '0 8px 32px rgba(0, 0, 0, 0.15)',
      },
      
      // Enhanced Backdrop Blur
      backdropBlur: {
        'xs': '2px',
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '24px',
        '3xl': '32px',
      },
      
      // Modern Border Radius
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      
      // Enhanced Animations
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'modern-spin': 'modernSpin 1s linear infinite',
        'gradient-shift': 'gradientShift 3s ease infinite',
      },
      
      // Custom Keyframes
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        pulseGlow: {
          '0%, 100%': { 
            opacity: '1',
            boxShadow: '0 0 8px rgba(99, 102, 241, 0.5)'
          },
          '50%': { 
            opacity: '0.7',
            boxShadow: '0 0 24px rgba(99, 102, 241, 0.8)'
          },
        },
        modernSpin: {
          'from': { transform: 'rotate(0deg)' },
          'to': { transform: 'rotate(360deg)' },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
      
      // Modern Typography
      fontFamily: {
        'display': ['Inter', 'system-ui', 'sans-serif'],
        'body': ['Inter', 'system-ui', 'sans-serif'],
        'mono': ['SF Mono', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
      },
      
      // Enhanced Spacing
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '92': '23rem',
        '96': '24rem',
        '128': '32rem',
      },
      
      // Modern Z-Index Scale
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      }
    },
  },
  plugins: [
    // Add any additional plugins here
    function({ addUtilities }) {
      const newUtilities = {
        // Glass morphism utilities
        '.glass': {
          'background': 'rgba(255, 255, 255, 0.03)',
          'backdrop-filter': 'blur(16px)',
          'border': '1px solid rgba(255, 255, 255, 0.1)',
          'box-shadow': '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        },
        '.glass-dark': {
          'background': 'rgba(15, 23, 42, 0.4)',
          'backdrop-filter': 'blur(16px)',
          'border': '1px solid rgba(99, 102, 241, 0.2)',
          'box-shadow': '0 8px 32px rgba(99, 102, 241, 0.1)',
        },
        
        // Modern button styles
        '.btn-primary': {
          'background': 'linear-gradient(135deg, #6366F1, #818CF8)',
          'border': '1px solid rgba(99, 102, 241, 0.3)',
          'box-shadow': '0 4px 16px rgba(99, 102, 241, 0.3)',
          'transition': 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            'background': 'linear-gradient(135deg, #4F46E5, #6366F1)',
            'box-shadow': '0 8px 32px rgba(99, 102, 241, 0.4)',
            'transform': 'translateY(-2px)',
          }
        },
        '.btn-secondary': {
          'background': 'linear-gradient(135deg, #F59E0B, #FCD34D)',
          'border': '1px solid rgba(245, 158, 11, 0.3)',
          'box-shadow': '0 4px 16px rgba(245, 158, 11, 0.3)',
          'transition': 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            'background': 'linear-gradient(135deg, #D97706, #F59E0B)',
            'box-shadow': '0 8px 32px rgba(245, 158, 11, 0.4)',
            'transform': 'translateY(-2px)',
          }
        },
        '.btn-success': {
          'background': 'linear-gradient(135deg, #10B981, #34D399)',
          'border': '1px solid rgba(16, 185, 129, 0.3)',
          'box-shadow': '0 4px 16px rgba(16, 185, 129, 0.3)',
          'transition': 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            'background': 'linear-gradient(135deg, #059669, #10B981)',
            'box-shadow': '0 8px 32px rgba(16, 185, 129, 0.4)',
            'transform': 'translateY(-2px)',
          }
        },
        
        // Status indicator styles
        '.status-online': {
          'background': 'linear-gradient(135deg, #10B981, #34D399)',
          'box-shadow': '0 0 12px rgba(16, 185, 129, 0.4)',
        },
        '.status-offline': {
          'background': 'linear-gradient(135deg, #64748B, #94A3B8)',
          'box-shadow': '0 0 12px rgba(100, 116, 139, 0.3)',
        },
        '.status-warning': {
          'background': 'linear-gradient(135deg, #F59E0B, #FCD34D)',
          'box-shadow': '0 0 12px rgba(245, 158, 11, 0.4)',
        },
        '.status-error': {
          'background': 'linear-gradient(135deg, #EF4444, #F87171)',
          'box-shadow': '0 0 12px rgba(239, 68, 68, 0.4)',
        },
        
        // Card component styles
        '.card': {
          'background': 'linear-gradient(135deg, rgba(248, 250, 252, 0.03), rgba(248, 250, 252, 0.01))',
          'backdrop-filter': 'blur(16px)',
          'border': '1px solid rgba(248, 250, 252, 0.1)',
          'border-radius': '1rem',
          'box-shadow': '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(248, 250, 252, 0.1)',
          'transition': 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            'border-color': 'rgba(99, 102, 241, 0.2)',
            'box-shadow': '0 12px 40px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(99, 102, 241, 0.1), inset 0 1px 0 rgba(248, 250, 252, 0.1)',
            'transform': 'translateY(-2px)',
          }
        }
      }
      
      addUtilities(newUtilities)
    }
  ],
}