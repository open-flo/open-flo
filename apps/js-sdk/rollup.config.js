import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
import terser from '@rollup/plugin-terser';
import { config as dotenvConfig } from 'dotenv';

// Load environment variables from .env file
dotenvConfig();

const isProduction = process.env.NODE_ENV === 'production';

// Environment configuration for build-time replacement
const getApiBaseUrl = () => {
  return process.env.API_BASE_URL || (isProduction ? 'https://api.flowvana.tech' : 'http://localhost:8090');
};

const getApiEndpoints = () => {
  const baseUrl = getApiBaseUrl();
  
  return {
    search: `${baseUrl}/flow/search`,
    query: `${baseUrl}/query`,
    flowDetails: `${baseUrl}/flow`,
    chat: `${baseUrl}/query/chat`
  };
};

const config = {
  input: 'src/index.js',
  external: ['react', 'react-dom'],
  output: [
    {
      file: 'dist/flowlight.esm.js',
      format: 'es',
      sourcemap: !isProduction
    },
    {
      file: 'dist/flowlight.umd.js',
      format: 'umd',
      name: 'FlowLight',
      sourcemap: !isProduction,
      globals: {
        react: 'React',
        'react-dom': 'ReactDOM'
      }
    }
  ],
  plugins: [
    replace({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
      'process.env.API_BASE_URL': JSON.stringify(getApiBaseUrl()),
      'process.env.API_ENDPOINTS': JSON.stringify(getApiEndpoints()),
      preventAssignment: true
    }),
    resolve({
      browser: true,
      preferBuiltins: false
    }),
    commonjs(),
    ...(isProduction ? [terser()] : [])
  ]
};

export default config;
