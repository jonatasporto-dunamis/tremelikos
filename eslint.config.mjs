import nextVitals from 'eslint-config-next/core-web-vitals';

export default [
  ...nextVitals,
  {
    ignores: ['.kilo/**', 'node_modules/**', '.next/**'],
  },
];
