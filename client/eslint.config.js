import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // Regulile de React Compiler din eslint-plugin-react-hooks 7 semnalează ca EROARE
      // `setLoading(true)` la începutul unui efect de încărcare de date — tiparul folosit
      // consecvent în tot proiectul pentru stările loading/error. Efectul secundar real este
      // o randare suplimentară, nu un bug, așa că le păstrăm ca avertismente: rămân vizibile
      // (candidate pentru un hook `useAsyncData` comun), fără să blocheze `npm run lint`.
      'react-hooks/set-state-in-effect': 'warn',
      // react-hook-form expune `watch()`, o funcție pe care compilatorul nu o poate memoiza.
      'react-hooks/incompatible-library': 'warn',
    },
  },
])
