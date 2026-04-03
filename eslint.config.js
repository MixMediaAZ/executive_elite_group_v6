/** @type {import('eslint').Linter.FlatConfig[]} */
module.exports = [
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'build/**',
      '.vercel/**',
      'dist/**',
      '.git/**',
      'coverage/**',
      '.prisma/**',
    ],
  },
]
