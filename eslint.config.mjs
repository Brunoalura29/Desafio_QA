import babelParser from '@babel/eslint-parser';
import js from '@eslint/js';
import jsdoc from 'eslint-plugin-jsdoc';
import perfectionist from 'eslint-plugin-perfectionist';
import eslintPluginPlaywright from 'eslint-plugin-playwright';
import eslintPluginPrettier from 'eslint-plugin-prettier';
import sonarjs from 'eslint-plugin-sonarjs';
import globals from 'globals';

export default [
  js.configs.recommended, // Regras recomendadas para JavaScript
  jsdoc.configs['flat/recommended'], // Regras recomendadas para JSDoc
  sonarjs.configs.recommended,
  {
    ignores: [
      'node_modules/**', // Ignora a pasta `node_modules` em qualquer lugar
      'playwright-report/**', // Ignora relatórios do Playwright
      'test-results/**', // Ignora os resultados de testes
      'package.json', // Ignora o arquivo package.json
      'package-lock.json', // Ignora o arquivo package-lock.json
    ],
  },
  {
    languageOptions: {
      ecmaVersion: 'latest', // Define a versão mais recente do ECMAScript
      sourceType: 'module', // Código como módulo ECMAScript
      parser: babelParser,
      parserOptions: {
        ecmaVersion: 12, // Versão do ECMAScript
        requireConfigFile: false, // Não requer arquivo de configuração do Babel
        allowImportExportEverywhere: true, // Permite import/export em qualquer lugar
        sourceType: 'module', // Garante que o código será tratado como módulo
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      prettier: eslintPluginPrettier,
      playwright: eslintPluginPlaywright,
      perfectionist,
      jsdoc,
    },
    files: ['**/*.js'], // Define quais arquivos serão analisados
    rules: {
      ...eslintPluginPrettier.configs.recommended.rules, // Integra o ESLint com o Prettier
      ...eslintPluginPlaywright.configs['playwright-test'].rules, // Regras recomendadas para testes do Playwright
      'prettier/prettier': [
        'error',
        {
          printWidth: 150, // Define a largura máxima da linha
          tabWidth: 2, // Define a largura da tabulação como 2 espaços
          singleQuote: true, // Usa aspas simples
          trailingComma: 'all', // Adiciona vírgula ao final de listas
          arrowParens: 'always', // Inclui parênteses em torno de parâmetros de arrow functions
          semi: true, // Usa ponto e vírgula no final das declarações
          endOfLine: 'auto', // Ajusta automaticamente o fim de linha conforme o SO
        },
      ],
      // Regras do JSDoc
      'jsdoc/require-jsdoc': [
        'error',
        {
          require: {
            FunctionDeclaration: true, // Verifica funções declaradas
            MethodDefinition: true, // Verifica métodos
            ClassDeclaration: false, // Verifica classes
            ArrowFunctionExpression: true, // Verifica funções de seta
            FunctionExpression: true, // Verifica funções em expressões
          },
        },
      ],
      'jsdoc/require-description': 'error', // Descrição obrigatória no JSDoc
      'jsdoc/require-param-description': 'error', // Descrição obrigatória para parâmetros
      'jsdoc/require-param-type': 'error', // Tipo obrigatório para parâmetros
      'jsdoc/require-returns': 0, // JSDoc para retorno não obrigatório
      'jsdoc/require-returns-check': 0, // Verificar se o retorno está documentado
      'jsdoc/require-returns-description': 0, // Descrição do retorno obrigatória
      'jsdoc/require-returns-type': 0, // Tipo do retorno obrigatório
      'jsdoc/no-undefined-types': 'error', // Evitar tipos indefinidos no JSDoc
      'jsdoc/check-alignment': 'error', // Verifica alinhamento de JSDoc
      'jsdoc/check-param-names': 'error', // Checa os nomes dos parâmetros no JSDoc
      'jsdoc/check-tag-names': 'error', // Valida nomes de tags no JSDoc
      'jsdoc/check-types': 'error', // Valida os tipos no JSDoc

      // Regras ativas com erro
      'sonarjs/no-duplicate-string': 'error',
      'sonarjs/no-identical-functions': 'error',
      'sonarjs/no-identical-expressions': 'error',
      'sonarjs/cognitive-complexity': ['error', 15],
      'sonarjs/no-nested-template-literals': 'error',
      'sonarjs/no-redundant-boolean': 'error',
      'sonarjs/no-useless-catch': 'error',
      'sonarjs/prefer-immediate-return': 'error',
      'sonarjs/no-inverted-boolean-check': 'error',
      'sonarjs/no-collapsible-if': 'error',
      'sonarjs/no-duplicated-branches': 'error',
      'sonarjs/no-gratuitous-expressions': 'error',
      'sonarjs/no-nested-switch': 'error',
      'sonarjs/no-redundant-jump': 'error',
      'sonarjs/no-small-switch': 'error',
      'sonarjs/no-unused-collection': 'error',
      'sonarjs/prefer-object-literal': 'error',
      'sonarjs/prefer-single-boolean-return': 'error',
      // Regras desativadas
      'sonarjs/no-hardcoded-credentials': 'off',
      'sonarjs/slow-regex': 'off',
      'sonarjs/no-dead-store': 'off',
      'sonarjs/no-same-line-conditional': 'off',
      'sonarjs/prefer-while': 'off',
      'sonarjs/constructor-for-side-effects': 'off',

      'sort-vars': ['error', { ignoreCase: true }],
      'sort-imports': 'off',
      'perfectionist/sort-imports': [
        'error',
        {
          type: 'alphabetical', // Ordenação alfabética
          order: 'asc', // Ordem ascendente
          ignoreCase: true, // Ignorar maiúsculas/minúsculas
          specialCharacters: 'keep', // Manter caracteres especiais como estão
          internalPattern: ['^~/.+'], // Padrão para imports internos
          newlinesBetween: 'always', // Sempre adicionar uma linha em branco entre grupos
          maxLineLength: undefined, // Não limitar o comprimento da linha
          groups: [
            'type', // Para imports de tipos (TypeScript)
            ['builtin', 'external'], // Bibliotecas externas (e.g., 'es6-promise')
            'internal-type', // Imports internos de tipos (TypeScript)
            'internal', // Imports internos (e.g., 'src/utils')
            ['parent-type', 'sibling-type', 'index-type'], // Imports internos de tipos (TypeScript)
            ['parent', 'sibling', 'index'], // Imports internos (e.g., 'src/utils')
            'object', // Imports de objetos (e.g., 'src/utils/obj')
            'unknown', // Imports desconhecidos
          ],
        },
      ],
      'linebreak-style': 0,
      quotes: ['error', 'single'],
      semi: ['error', 'always'],
      'comma-spacing': ['error'],
      'no-use-before-define': ['error', { functions: true, classes: true, variables: false }],
      'prefer-const': ['error', { destructuring: 'all' }],
      'no-new-object': 'error',
      'no-array-constructor': 'error',
      'max-len': 'off',
      'no-confusing-arrow': ['error', { allowParens: false }],
      'no-mixed-operators': 'error',
      'no-tabs': ['error', { allowIndentationTabs: true }],
      'no-var': 'error',
      'no-unused-vars': 'error',
      'new-cap': 0,
      'playwright/expect-expect': 'error',
      'playwright/no-useless-await': 'error',
      'playwright/no-raw-locators': 'off',
      'playwright/no-page-pause': 'error',
      'playwright/no-duplicate-hooks': 'error',
      'playwright/no-nth-methods': 'warn',
      'playwright/no-restricted-matchers': 'error',
      'playwright/prefer-comparison-matcher': 'error',
      'playwright/prefer-equality-matcher': 'error',
      'playwright/prefer-hooks-in-order': 'error',
      'playwright/prefer-hooks-on-top': 'error',
      'playwright/prefer-lowercase-title': 'error',
      'playwright/prefer-strict-equal': 'error',
      'playwright/prefer-to-be': 'error',
      'playwright/prefer-to-contain': 'error',
      'playwright/prefer-to-have-count': 'error',
      'playwright/prefer-to-have-length': 'error',
      'playwright/require-to-throw-message': 'error',
      'playwright/require-top-level-describe': 'error',
    },
  },
];
