const fs = require('fs');
const path = require('path');

const backendUrl = process.env.BACKEND_URL;

if (!backendUrl) {
  console.warn("⚠️ ADVERTENCIA: BACKEND_URL no está definida. Usando valor por defecto vacío.");
}

const url = backendUrl || '';
const wsUrl = url
  .replace('https://', 'wss://')
  .replace('http://', 'ws://');

const targetPath = path.join(__dirname, 'src', 'environments', 'environment.ts');

const envConfigFile = `export const environment = {
  production: true,
  apiUrl: '${url}/api',
  wsUrl: '${wsUrl}/ws-restaiurante'
};
`;

console.log("🛠️ Generando environment.ts...");
console.log("🔗 API URL:", `${url}/api`);
console.log("🔗 WS URL:", `${wsUrl}/ws-restaiurante`);

if (!fs.existsSync(path.join(__dirname, 'src', 'environments'))) {
  fs.mkdirSync(path.join(__dirname, 'src', 'environments'), { recursive: true });
}

fs.writeFileSync(targetPath, envConfigFile);
console.log("✅ environment.ts generado.");