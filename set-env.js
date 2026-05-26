const fs = require('fs');

const backendUrl = process.env.BACKEND_URL || 'http://localhost:8080';
const isProduction = !!process.env.BACKEND_URL;
const googleClientId = (process.env.GOOGLE_CLIENT_ID || '').replace(/'/g, "\\'");

const envConfigFile = `export const environment = {
  production: ${isProduction},
  apiUrl: '${backendUrl}/api',
  wsUrl: '${backendUrl}/ws-restaiurante',
  googleClientId: '${googleClientId}'
};
`;

const paths = [
  './src/environments/environment.ts',
  './src/environments/environment.prod.ts'
];

if (!fs.existsSync('./src/environments')) {
    fs.mkdirSync('./src/environments', { recursive: true });
}

paths.forEach(p => {
  fs.writeFileSync(p, envConfigFile);
  console.log(`Archivo generado en: ${p}`);
});

console.log(`MODO: ${isProduction ? 'PRODUCCIÓN' : 'LOCAL'}`);
console.log(`API: ${backendUrl}/api`);
console.log(`WS: ${backendUrl}/ws-restaiurante`);
console.log(`Google Client ID: ${googleClientId ? '(configurado)' : '(no configurado)'}`);
