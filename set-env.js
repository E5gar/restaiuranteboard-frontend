const fs = require('fs');

const backendUrl = process.env.BACKEND_URL;

if (!backendUrl) {
  console.error("❌ ERROR: La variable BACKEND_URL no está definida en Vercel.");
  process.exit(1); 
}

const envConfigFile = `export const environment = {
  production: true,
  apiUrl: '${backendUrl}/api',
  wsUrl: '${backendUrl.replace('https://', 'wss://').replace('http://', 'ws://')}/ws-restaiurante'
};
`;

const targetPath = './src/environments/environment.ts';

console.log("🛠️ GENERANDO ENTORNO DINÁMICO...");
console.log(`🔗 Backend: ${backendUrl}`);

if (!fs.existsSync('./src/environments')) {
  fs.mkdirSync('./src/environments', { recursive: true });
}

try {
  fs.writeFileSync(targetPath, envConfigFile);
  console.log(`✅ Archivo generado exitosamente en ${targetPath}`);
} catch (err) {
  console.error("❌ No se pudo escribir el archivo:", err);
  process.exit(1);
}