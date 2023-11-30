const { red } = require('tailwindcss/colors');
const defaultTheme = require('tailwindcss/defaultTheme');
const plugin = require('tailwindcss/plugin');

module.exports = {
  content: ["content/**/*.md", "layouts/**/*.html", "./tailwindcss.whitelist.txt"],
  theme: {
    extend: {
      fontFamily: {
				sans: [ 'Inter', ...defaultTheme.fontFamily.sans ],
				mono: [ 'Fira Code', 'SF Mono', ...defaultTheme.fontFamily.mono ],
				display: [ 'Inter Display', ...defaultTheme.fontFamily.sans ],
      },
	  colors: {
		midnight: {
			700: '#161F31',
		  },
		'redis-indigo': {
			500: '#5961ff',
			600: '#454CD5'
		},
        'redis-neutral': {
			800: '#4E545B'
		}
	  },
      typography: (theme) => (  {
        DEFAULT: {
          css: {
            color: theme('colors.slate.600'),
            a: {
              transition: '.2s all',
              color: theme('colors.redis-indigo.500'),
              textDecorationColor: theme('colors.indigo.300'),
			  textDecoration: 'none',
              '&:hover': {
                color: theme('colors.redis-indigo.600'),
              },
            },
            code: {
              fontWeight: '500',
            },
            pre: {
              padding: '1.25rem',
            },
          },
        },
        lg: {
          css: {
            lineHeight: '1.6',
          },
        },
      }),
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    plugin(function({ addComponents, theme }) {
			const buttons = {
				'.button-xs, .button-sm, .button, .button-lg, .button-xl, .button-2xl': {
					display: 'inline-flex',
					alignItems: 'center',
					justifyContent: 'center',
					fontWeight: '600',
					letterSpacing: theme('letterSpacing.normal'),
					borderRadius: theme('borderRadius.sm'),
					whiteSpace: 'nowrap',
					transition: '.2s all',
				},
				'.button-xs': {
					fontSize: theme('fontSize.sm'),
					paddingLeft: theme('spacing.1'),
					paddingRight: theme('spacing.1'),
					height: '30px'
				},
				'.button-sm': {
					fontSize: theme('fontSize.sm'),
					paddingLeft: theme('spacing.3'),
					paddingRight: theme('spacing.3'),
					height: '34px'
				},
				'.button': {
					fontSize: theme('fontSize.sm'),
					paddingLeft: theme('spacing.3'),
					paddingRight: theme('spacing.3'),
					height: '38px'
				},
				'.button-lg': {
					fontSize: theme('fontSize.sm'),
					paddingLeft: theme('spacing.4'),
					paddingRight: theme('spacing.4'),
					height: '42px'
				},
				'.button-xl': {
					fontSize: theme('fontSize.base'),
					paddingLeft: theme('spacing.5'),
					paddingRight: theme('spacing.5'),
					height: '48px'
				},
				'.button-2xl': {
					fontSize: theme('fontSize.lg'),
					paddingLeft: theme('spacing.6'),
					paddingRight: theme('spacing.6'),
					height: '60px'
				}
      };
      addComponents([ buttons ]);
		})
  ],
};