const fs = require('fs');
const path = require('path');

const iconDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconDir)) {
  fs.mkdirSync(iconDir, { recursive: true });
}

// Generate an SVG icon
const svgIcon = `
<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="128" fill="#0B0F19"/>
  <circle cx="256" cy="256" r="210" fill="url(#grad1)" stroke="#E30613" stroke-width="8"/>
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1E293B" />
      <stop offset="100%" stop-color="#0F172A" />
    </linearGradient>
  </defs>
  
  <!-- Bus Shape -->
  <rect x="140" y="110" width="232" height="260" rx="36" fill="#E30613" />
  
  <!-- Bus Windshield -->
  <rect x="160" y="140" width="192" height="90" rx="14" fill="#0F172A" />
  
  <!-- Headlights -->
  <circle cx="178" cy="290" r="16" fill="#FFD700" />
  <circle cx="334" cy="290" r="16" fill="#FFD700" />
  
  <!-- Grille -->
  <line x1="220" y1="290" x2="292" y2="290" stroke="#FFFFFF" stroke-width="8" stroke-linecap="round" />
  <line x1="226" y1="310" x2="286" y2="310" stroke="#FFFFFF" stroke-width="6" stroke-linecap="round" />
  
  <!-- Wheels -->
  <rect x="155" y="360" width="36" height="34" rx="8" fill="#1E293B" />
  <rect x="321" y="360" width="36" height="34" rx="8" fill="#1E293B" />
  
  <!-- SP Badge Text -->
  <text x="256" y="440" text-anchor="middle" fill="#FFFFFF" font-family="system-ui, sans-serif" font-weight="900" font-size="34" letter-spacing="4">BUSAÍ SP</text>
</svg>
`;

fs.writeFileSync(path.join(iconDir, 'icon.svg'), svgIcon.trim());
console.log('SVG Icon created at public/icons/icon.svg');
