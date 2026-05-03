const fs = require('fs');

const isProduction = !!process.env.BACKEND_URL;
const backendUrl = process.env.BACKEND_URL || 'http://localhost:8080';

const envConfigFile = `
export const environment = {
  production: ${isProduction},
  apiUrl: '${backendUrl}/api',
  wsUrl: '${backendUrl}/ws-restaiurante'
};
`;

const targetPath = './src/environments/environment.ts';

if (!fs.existsSync('./src/environments')) {
    fs.mkdirSync('./src/environments', { recursive: true });
}

fs.writeFileSync(targetPath, envConfigFile);

console.log(`[${isProduction ? 'PROD' : 'DEV'}] environment.ts generado con URL: ${backendUrl}`);