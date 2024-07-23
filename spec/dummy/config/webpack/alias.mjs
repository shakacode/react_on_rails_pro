import { fileURLToPath } from 'url';
import { resolve } from 'path';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

const aliasConfig = {
  resolve: {
    alias: {
      Assets: resolve(__dirname, '..', '..', 'client', 'app', 'assets'),
    },
  },
};

export default aliasConfig;
