# Kosha — Professional Invoice Management

> A modern, open-source, full-stack invoice management web application built with HTML5, CSS3, JavaScript, Bootstrap 5, and Supabase.

---

## ✨ Features

| Feature | Details |
|---|---|
| 📄 **Invoices** | Create, edit, download, print — 5 premium templates |
| 👥 **Customers** | Full CRUD, detail panel, invoice history |
| 📦 **Products** | Catalog with low-stock alerts, table/card view |
| 📊 **Reports** | Revenue charts, GST summary, top customers, overdue tracking |
| ⚙️ **Settings** | Business profile, logo, bank details, invoice defaults |
| 🌙 **Dark Mode** | System/manual toggle |
| 🔒 **Auth** | Supabase Auth — email/password |
| 🗄️ **Database** | Supabase Postgres with Row Level Security |
| 📱 **Responsive** | Works on all screen sizes |
| 🖨️ **PDF/Print** | html2pdf.js — full A4 print output |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3, ES6 (ESM), Bootstrap 5 |
| Icons | Font Awesome 6 |
| Charts | Chart.js 4 |
| Date Picker | Flatpickr |
| PDF | html2pdf.js |
| Backend | Supabase (Auth + Postgres + Storage) |
| Hosting | Vercel / GitHub Pages |

---

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/kosha.git
cd kosha
```

### 2. Set Up Supabase

1. Go to [https://supabase.com](https://supabase.com) and create a **new project**.
2. After the project is ready, open the **SQL Editor**.
3. Run the following files **in order**:
   - `supabase/schema.sql` — creates all tables and functions
   - `supabase/policies.sql` — enables Row Level Security policies
   - `supabase/seed.sql` — (optional) inserts demo data

### 3. Configure Supabase Credentials

Open `assets/js/supabase.js` and replace the placeholder values:

```js
const SUPABASE_URL = 'https://your-project-id.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key-here';
```

Find these in your Supabase dashboard → **Settings → API**.

### 4. Enable Supabase Storage (for logos)

1. In Supabase Dashboard → **Storage**
2. Create a new bucket named `business`
3. Make it **public** (or configure as private and add RLS policy)

### 5. Run Locally

Since this is a pure HTML/JS project with ES modules, you need a local server:

```bash
# Option 1: VS Code Live Server extension
# Right-click index.html → Open with Live Server

# Option 2: Python
python -m http.server 8080

# Option 3: npx serve
npx serve .
```

Then open [http://localhost:8080/login.html](http://localhost:8080/login.html)

---

## 📦 Deploy to Vercel

1. Push your code to GitHub:

```bash
git init
git add .
git commit -m "Initial Kosha setup"
git remote add origin https://github.com/YOUR_USERNAME/kosha.git
git push -u origin main
```

2. Go to [vercel.com](https://vercel.com) → **New Project**
3. Import your GitHub repository
4. Framework: **Other** (static HTML)
5. Root Directory: `/`
6. Click **Deploy**

> ⚠️ Important: After deploy, set your Supabase **Site URL** and **Redirect URLs** in:
> Supabase Dashboard → Authentication → URL Configuration

Add:
```
https://your-kosha-app.vercel.app
https://your-kosha-app.vercel.app/dashboard.html
https://your-kosha-app.vercel.app/settings.html
```

---

## 📁 Project Structure

```
kosha/
├── login.html              # Auth page
├── dashboard.html          # Main dashboard
├── invoices.html           # Invoice list
├── invoice.html            # Create/edit invoice
├── customers.html          # Customer management
├── products.html           # Product catalog
├── reports.html            # Analytics & reports
├── settings.html           # Settings
│
├── assets/
│   ├── css/
│   │   ├── style.css       # Master design system (1000+ lines)
│   │   ├── login.css
│   │   ├── dashboard.css
│   │   ├── invoice.css
│   │   ├── customers.css
│   │   ├── reports.css
│   │   └── settings.css
│   │
│   └── js/
│       ├── supabase.js     # Supabase client + all API wrappers
│       ├── app.js          # Shared utilities (Toast, Pagination, formatters)
│       ├── layout.js       # Shared sidebar/topbar injector
│       ├── login.js
│       ├── dashboard.js
│       ├── invoice.js
│       ├── invoices.js
│       ├── customers.js
│       ├── products.js
│       ├── reports.js
│       └── settings.js
│
└── supabase/
    ├── schema.sql          # Database tables + functions
    ├── policies.sql        # Row Level Security policies
    └── seed.sql            # Optional demo data
```

---

## 🗄️ Database Schema

| Table | Purpose |
|---|---|
| `business_profile` | Business info, defaults |
| `customers` | Customer records |
| `products` | Product/service catalog |
| `invoices` | Invoice headers |
| `invoice_items` | Line items per invoice |
| `payments` | Payment records |
| `activity_logs` | Audit trail |

All tables use **Row Level Security (RLS)** — each user only sees their own data.

---

## 🧾 Invoice Templates

| Template | Style |
|---|---|
| **Modern** | Gradient header, full color |
| **Professional** | Corporate, bold blue accent |
| **Minimal** | Clean whitespace, typography-first |
| **Classic** | Traditional bordered layout |
| **Bold** | Dark header, high contrast |

---

## 🔒 Security

- All database access is gated by **Supabase Row Level Security (RLS)**
- No server-side code — frontend only, all data gated via JWT
- Supabase Auth handles session management
- Never expose `service_role` key in frontend code

---

## 🤝 Contributing

Pull requests are welcome! Please:

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit changes (`git commit -m 'Add my feature'`)
4. Push to branch (`git push origin feature/my-feature`)
5. Open a Pull Request

---

## 📄 License

MIT License — free for personal and commercial use.

---

## 🙏 Acknowledgements

- [Supabase](https://supabase.com) — open-source Firebase alternative
- [Bootstrap 5](https://getbootstrap.com)
- [Chart.js](https://www.chartjs.org)
- [Font Awesome](https://fontawesome.com)
- [Flatpickr](https://flatpickr.js.org)
- [html2pdf.js](https://github.com/eKoopmans/html2pdf.js)

---

<div align="center">
  Built with ❤️ · Open Source · MIT License
</div>
