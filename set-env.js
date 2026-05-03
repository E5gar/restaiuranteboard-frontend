const fs = require('fs');
const path = require('path');

const backendUrl = process.env.BACKEND_URL;

if (!backendUrl) {
  console.error("❌ ERROR: La variable BACKEND_URL no está definida en Vercel.");
  process.exit(1); 
}

const isProduction = true;
const targetPath = './src/environments/environment.ts';

const envConfigFile = `export const environment = {
  production: ${isProduction},
  apiUrl: '${backendUrl}/api',
  wsUrl: '${backendUrl.replace('https://', 'wss://').replace('http://', 'ws://')}/ws-restaiurante'
};
`;

console.log("🛠️ Generando environment.ts para Producción...");
console.log("🔗 Usando API URL:", `${backendUrl}/api`);

if (!fs.existsSync('./src/environments')) {
  fs.mkdirSync('./src/environments', { recursive: true });
}

fs.writeFileSync(targetPath, envConfigFile);
console.log("✅ Archivo generado con éxito.");