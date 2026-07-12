/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'bg-primary': 'var(--color-bg-primary)',
        'bg-surface': 'var(--color-bg-surface)',
        'bg-elevated': 'var(--color-bg-elevated)',
        'border-subtle': 'var(--color-border-subtle)',
        'accent-ashna': 'var(--color-accent-ashna)',
        'accent-ashna-tint': 'var(--color-accent-ashna-tint)',
        'accent-custom': 'var(--color-accent-custom)',
        'accent-custom-tint': 'var(--color-accent-custom-tint)',
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        success: 'var(--color-success)',
        'success-tint': 'var(--color-success-tint)',
        warning: 'var(--color-warning)',
        'warning-tint': 'var(--color-warning-tint)',
        danger: 'var(--color-danger)',
        'danger-tint': 'var(--color-danger-tint)',
        'contest-badge': 'var(--color-contest-badge)',
        'contest-badge-tint': 'var(--color-contest-badge-tint)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        pill: 'var(--radius-pill)',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        elevated: 'var(--shadow-elevated)',
      },
    },
  },
  plugins: [],
};