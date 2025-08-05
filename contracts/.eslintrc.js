module.exports = {
  env: {
    browser: false,
    es6: true,
    mocha: true,
    node: true,
  },
  plugins: ["@typescript-eslint", "prettier"],
  extends: ["eslint:recommended", "prettier"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
  },
  rules: {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "warn",
    "prefer-const": "error",
    "no-var": "error",
    "object-shorthand": "error",
    "prefer-template": "error",
    "no-console": "off", // Allow console.log in scripts
    "prettier/prettier": "error",
  },
  ignorePatterns: [
    "node_modules/",
    "artifacts/",
    "cache/",
    "typechain-types/",
    "dist/",
    "deployments/",
  ],
};
