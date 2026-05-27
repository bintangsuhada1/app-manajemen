# Deployment Singkat

## Server minimum
- VPS 2 vCPU, 4 GB RAM, 80 GB SSD
- Ubuntu LTS
- Nginx reverse proxy
- Node.js LTS
- MySQL 8+
- SSL Let's Encrypt

## Domain
Frontend: https://ptjurtiagungmulia.com
API: https://api.ptjurtiagungmulia.com

## Keamanan
- Ganti JWT_SECRET
- Gunakan password MySQL kuat
- Aktifkan HTTPS
- Batasi CORS ke domain produksi
- Simpan upload di folder non-public atau object storage
- Backup database harian
