const fs = require('fs');
const path = require('path');

console.log("====================================================");
console.log("DEBUG: Iniciando generación de environment.ts");

console.log("DEBUG: NODE_ENV actual:", process.env.NODE_ENV);
console.log("DEBUG: process.env.BACKEND_URL detectado como:", process.env.BACKEND_URL);

const isProduction = process.env.NODE_ENV === 'production';
const backendUrl = process.env.BACKEND_URL || 'http://localhost:8080';

const dir = './src/environments';
const targetPath = './src/environments/environment.ts';

console.log("DEBUG: Directorio objetivo:", path.resolve(dir));
console.log("DEBUG: Archivo objetivo:", path.resolve(targetPath));

const envConfigFile = `export const environment = {
  production: ${isProduction},
  apiUrl: '${backendUrl}/api',
  wsUrl: '${backendUrl.replace('https://', 'wss://').replace('http://', 'ws://')}/ws-restaiurante'
};
`;

if (!fs.existsSync(dir)) {
    console.log("DEBUG: El directorio no existe. Creándolo...");
    fs.mkdirSync(dir, { recursive: true });
} else {
    console.log("DEBUG: El directorio ya existe.");
}

try {
    fs.writeFileSync(targetPath, envConfigFile);
    console.log("✅ ÉXITO: Archivo environment.ts generado correctamente.");
    
    const contenidoReal = fs.readFileSync(targetPath, 'utf8');
    console.log("DEBUG: Contenido real escrito en el disco:");
    console.log("------------------------------------------");
    console.log(contenidoReal);
    console.log("------------------------------------------");

} catch (err) {
    console.error("❌ ERROR CRÍTICO escribiendo environment.ts:", err);
    process.exit(1);
}

console.log("DEBUG: Finalizó set-env.js");
console.log("====================================================");