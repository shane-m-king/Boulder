import type { Config } from "jest";

const isFrontend = process.env.JEST_ENV === "jsdom";

const config: Config = {
  // Environment: node for backend, jsdom for frontend
  testEnvironment: isFrontend ? "jsdom" : "node",

  roots: ["<rootDir>/tests"],

  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    // Handle static assets & CSS imports in Next components
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
  },

  transform: {
    "^.+\\.(ts|tsx|js|jsx)$": ["babel-jest", { configFile: "./babel.config.js" }],
  },

  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],

  testMatch: [
    // Backend tests
    "<rootDir>/tests/backend/**/*.test.(ts|tsx|js)",
    // Frontend tests
    "<rootDir>/tests/frontend/**/*.test.(ts|tsx|js)",
  ],

  extensionsToTreatAsEsm: [".ts", ".tsx"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
};

export default config;
