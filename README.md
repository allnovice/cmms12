# CMMS12  
![Vercel Deploy](https://deploy-badge.vercel.app/vercel/cmms12?st)

This is a [Next.js](https://nextjs.org) project bootstrapped with create-next-app.

---

## 🧩 Basic Server Run

Servers are in separate repos:  
- [req2serv](https://github.com/allnovice/req2serv.git)  
- [notifsrv](https://github.com/allnovice/notifsrv.git)  

# Run servers (from each repo)
node notify-server.js
node cmms-server.js

---

## 📂 Using `scrpt/` Scripts

Before using scripts, install dependencies:

cd scrpt
npm install

### Example: Add a user via Gmail

# Set the Gmail address (one-time)
echo 'export GMAIL_USER="example@gmail.com"' >> ~/.bashrc

# Set the 16-character app password (one-time)
echo 'export GMAIL_APP_PASS="your16charapppassword"' >> ~/.bashrc

# Reload your shell environment
source ~/.bashrc

# Run the addUser script
node addUser.js example@example.com

---

## 📱 Termux Setup

pkg update && pkg upgrade -y
pkg install git gh -y
git --version
gh --version
git config --list
gh auth login

---

## 🌿 Git Init and Push

git init
git branch -m main
git config --global init.defaultBranch main
git add .
git commit -m "Initial commit"
git branch -M main
gh repo create your-repo-name --public --source=. --remote=origin
git push --set-upstream origin main
git push origin main

---

## 🔁 Git Repo Maintenance

git pull origin main
git fetch
git diff
git log --oneline

---

## 💻 Debian Setup

apt update && apt upgrade -y
apt install -y git curl
curl -LO https://github.com/cli/cli/releases/download/v2.44.1/gh_2.44.1_linux_amd64.deb
dpkg -i gh_2.44.1_linux_amd64.deb
gh auth login
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs build-essential
node -v
npm -v

---

## ⚙️ Node / Next.js Dependencies

npm install

> Note: Running `npm install` reads package.json and installs all required dependencies automatically. You do not need to list each dependency manually.

---

## ▲ Vercel CLI & Integration

npm install -g vercel
vercel login
vercel
npm run build
npm start

---

## 🟢 Neon (Edge Database)

Create project in [Neon.tech](https://neon.tech)  
Copy connection string → add to `.env`  
DATABASE_URL=postgresql://user:password@ep-xxxx.ap-southeast-1.aws.neon.tech/dbname

---

## 🔥 Firebase Integration

npm install firebase

**.env.local**
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

---

## 🌐 Nginx + Ngrok Setup

apt install nginx
systemctl start nginx
systemctl enable nginx
# Example:
nano /etc/nginx/sites-available/cmms.conf

Ngrok:

wget https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz
tar xvzf ngrok-v3-stable-linux-amd64.tgz
chmod +x ngrok
mv ngrok /usr/local/bin/
ngrok authtoken <your_token>
ngrok http 80
systemctl status nginx

---

## 🧠 PM2 Process Manager

npm install -g pm2
pm2 start npm --name "cmms-dev" -- run dev
pm2 list
pm2 logs cmms-dev
pm2 stop cmms-dev
pm2 restart cmms-dev
pm2 delete cmms-dev
pm2 startup systemd
pm2 save

---

## 🧱 Build & Deploy Commands

# Local
npm run build
npm start

# Render
npm install && npm start

# Vercel
Handled automatically via Git integration

---

## 🧾 Notes

git add .
git commit -m "update"
git push origin main

# Before running scripts in `scrpt/`, install dependencies:
cd scrpt
npm install
