const defaultTheme = require('tailwindcss/defaultTheme');
const plugin = require('tailwindcss/plugin');

module.exports = {
  content: ["content/**/*.md", "layouts/**/*.html", "./tailwindcss.whitelist.txt"],
  theme: {
    extend: {
      fontFamily: {
				sans: [ 'Space Grotesk', ...defaultTheme.fontFamily.sans ],
				mono: [ 'Space Mono', 'SF Mono', ...defaultTheme.fontFamily.mono ],
				geist: [ 'Geist', ...defaultTheme.fontFamily.sans ],
				monogeist: ['Geist Mono', ...defaultTheme.fontFamily.mono ],
				trailers: [ 'TT Trailers', ...defaultTheme.fontFamily.sans ],
      },
			colors: {
				midnight: {
					700: '#161F31',
					},
				neutral: {
					150: '#F0F0F0'
				},
				'redis-red': {
					500: '#FF4438',
					600: '#D52D1F'
				},
				'redis-yellow': {
					100: '#FBFFE8',
					300: '#EDFF8E',
					500: '#DCFF1E',
				},
				'redis-indigo': {
					500: '#5961ff',
					600: '#454CD5'
				},
				'redis-pen': {
					200: '#E8EBEC',
					300: '#B9C2C6',
					400: '#8A99A0',
					600: '#5C707A',
					700: '#2D4754',
					800: '#163341'
				},
				'redis-pencil': {
					200: '#E5E5E5',

					250: '#D9D9D9',

					300: '#B2B2B2',
					500: '#808080',
					600: '#4C4C4C',

					700: '#444444',

					900: '#191919',
					950: '#000000'
				},
				'redis-ink': {
					900: '#091A23'
				},
				'redis-neutral': {
					200: '#F9F9F9',
					600: '#bfc2c4',
					800: '#4E545B'
				},
				'blue-bubble': '#80DBFF',
        		'yellow-bubble': '#DCFF1E',
        		'purple-bubble': '#C795E3',
        		'gray-bubble': '#8A99A0',
        		'red-bubble': '#FD4439'
			},
      typography: (theme) => (  {
        DEFAULT: {
          css: {
						maxWidth: '100%',
            color: theme('colors.redis-ink.900'),
            a: {
              transition: '.2s all',
			  			textDecoration: 'underline',
							fontWeight: '400',
            },
            code: {
              fontWeight: '500',
							fontSize: '1em',
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
