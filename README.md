# CMMS12  
![Vercel Deploy](https://deploy-badge.vercel.app/vercel/cmms12?st)

This is a [Next.js](https://nextjs.org) project bootstrapped with create-next-app.

---

## 🧩 Basic Server Run
```bash
node notify-server.js
npm install express cors dotenv
```

## 📱 Termux Setup
```bash
pkg update && pkg upgrade -y
pkg install git gh -y
git --version
gh --version
git config --list
gh auth login
```

## 🌿 Git Init and Push
```bash
git init
git branch -m main
git config --global init.defaultBranch main
git add .
git commit -m "Initial commit"
git branch -M main
gh repo create your-repo-name --public --source=. --remote=origin
git push --set-upstream origin main
git push origin main
```

## 🔁 Git Repo Maintenance
```bash
git pull origin main
git fetch
git diff
git log --oneline
```

## 💻 Debian Setup
```bash
apt update && apt upgrade -y
apt install -y git curl
curl -LO https://github.com/cli/cli/releases/download/v2.44.1/gh_2.44.1_linux_amd64.deb
dpkg -i gh_2.44.1_linux_amd64.deb
gh auth login
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs build-essential
node -v
npm -v
```

## ☁️ Cloudinary Setup
```bash
npm install cloudinary
```
**.env**
```
CLOUDINARY_URL=cloudinary://<your_api_key>:<your_api_secret>@<cloud_name>
```
**Test upload**
```bash
curl -u "782992386246832:KxvlSNQ50CDtItxpzYnxzGJ-HWY" \
https://api.cloudinary.com/v1_1/dvch94glx/resources/raw/upload
```

## ⚙️ Node / Next.js Dependencies
```bash
npm install
npm install next react react-dom firebase xlsx axios
npm install handsontable @handsontable/react
```

## ▲ Vercel CLI & Integration
```bash
npm install -g vercel
vercel login
vercel
npm run build
npm start
```
Integrate Git repo to Vercel Dashboard → Import Project → Set Environment Variables

## 🟣 Render Deployment
- Connect GitHub repo from Render Dashboard  
- Build Command:  
  ```bash
  npm install && npm run build
  ```
- Start Command:  
  ```bash
  npm start
  ```

## 🟢 Neon (Edge Database)
- Create project in [Neon.tech](https://neon.tech)  
- Copy connection string → add to `.env`  
```
DATABASE_URL=postgresql://user:password@ep-xxxx.ap-southeast-1.aws.neon.tech/dbname
```

## 🔥 Firebase Integration
```bash
npm install firebase
```
Features Used:
- Authentication  
- Firestore (FS)  
- Realtime Database (RTDB)
**.env.local**
```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

## 🌐 Nginx + Ngrok Setup
```bash
apt install nginx
systemctl start nginx
systemctl enable nginx
nano /etc/nginx/sites-available/cmms.conf
```
Ngrok:
```bash
wget https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz
tar xvzf ngrok-v3-stable-linux-amd64.tgz
chmod +x ngrok
mv ngrok /usr/local/bin/
ngrok authtoken <your_token>
ngrok http 80
systemctl status nginx
```

## 🧠 PM2 Process Manager
```bash
npm install -g pm2
pm2 start npm --name "cmms-dev" -- run dev
pm2 list
pm2 logs cmms-dev
pm2 stop cmms-dev
pm2 restart cmms-dev
pm2 delete cmms-dev
pm2 startup systemd
pm2 save
```

## 🧱 Build & Deploy Commands
```bash
# Local
npm run build
npm start

# Render
npm install && npm start

# Vercel
Handled automatically via Git integration
```

## 🧾 Notes
```bash
git add .
git commit -m "update"
git push origin main
```
Check build logs in Vercel / Render dashboards.

✅ **Ready to Deploy!**
