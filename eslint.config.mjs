import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


const eslintConfig = [
  {
    ignores: [
      "node_modules/**",
      ".tanstack/**",
      "out/**",
      "build/**",
      "dist/**",
    ],
  },
];

export default eslintConfig;
