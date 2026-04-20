# LED Mirror B2B Website — Full Requirements Document

> **Purpose**: This document serves as a complete specification for an LLM (or developer) to build a B2B product showcase website for **JIAXING CHENGTAI MIRROR CO., LTD**, including a full employee CMS (Content Management System) with authentication.

---

## 1. Project Overview

- **Company**: JIAXING CHENGTAI MIRROR CO., LTD
- **Brand Slogan**: "To be a global leader in the smart home mirror industry"
- **Industry**: LED Mirror / Smart Home Mirror Manufacturing
- **Website Type**: B2B foreign trade / export promotional website
- **Target Customers**: North American retailers, European brand owners, global wholesalers
- **Core Product Lines**: Bathroom Mirrors, LED Mirrors, Full-Length / Dressing Mirrors, Mirror Cabinets

---

## 2. Site Architecture — Pages & Sections

### 2.1 Public-Facing Pages

#### Home Page

The homepage should include the following sections, in order:

1. **Full-Screen Banner / Hero**: Large rotating image carousel with overlaid text and CTA buttons. Images and text should be manageable from the CMS.
2. **Brand Highlights**: 3–4 core selling points displayed as icon + title + short description cards (e.g., "21 Years of Manufacturing", "CE/UL/SAA Certified", "OEM/ODM Supported", "Fast Delivery & Safe Packaging").
3. **Featured Products**: A curated grid of hot/popular products (pulled from the product database, flagged as "featured" in CMS).
4. **Factory & Certification Overview**: A brief section showcasing factory scale and certifications with images (factory photos, cert badges).
5. **Inquiry CTA**: A prominent call-to-action block encouraging visitors to send an inquiry (links to the inquiry/contact form).

#### Products Page

- Display all products organized by **categories** (e.g., Bathroom Mirrors, LED Mirrors, Full-Length Mirrors, Mirror Cabinets).
- Support **category filtering** and **keyword search**.
- Product grid layout: **3-column card grid** on desktop, responsive to 2-column on tablet, 1-column on mobile.
- Each product card shows: thumbnail image, product name, brief description/specs, and a "Send Inquiry" or "View Details" button.

#### Product Detail Page

- Large product image gallery (multiple images per product, with zoom/lightbox).
- Product name, model number, description, specifications (as key-value table).
- Related products section at the bottom.
- "Send Inquiry" button that pre-fills the product name in the inquiry form.

#### About Us Page

- Company introduction text (provided below in Section 7).
- Factory scale: 35,000㎡ facility, 200+ employees, 500,000 units annual capacity.
- Timeline / milestones (optional, if data available).
- Factory and workshop photos gallery.
- Certifications display: CE, CB, SAA, ETL, IP44, IP54, RoHS, ISO9001 (show cert images).

#### Contact / Inquiry Page

- **Online inquiry form** with fields: Name, Email, Phone (optional), Company Name, Country, Product of Interest (dropdown from product categories), Message.
- On submission, send email notification to: `bolen5@cnjxctm.com`
- Display company contact information:
  - Email: bolen5@cnjxctm.com
  - WhatsApp: 86 17860567239
  - Address: No.768, Xinda Road, Xinfeng Town, Nanhu District, Jiaxing, Zhejiang, China
- Optional: Embedded Google Map showing factory location.

---

## 3. Design & Visual Style

### 3.1 Overall Aesthetic

- **Style**: Premium minimalist — clean, high-end feel suitable for luxury LED mirrors.
- **Tone**: NOT flashy, NOT too dark. Elegant and spacious.
- **Reference Sites**:
  - Layout reference: https://jungiklis.lt/
  - Style reference: https://massi.pl/

### 3.2 Color Palette

| Role            | Value                                                    |
| --------------- | -------------------------------------------------------- |
| Primary BG      | White / Light Gray (`#FFFFFF`, `#F5F5F5`)                |
| Secondary BG    | Soft warm gray (`#EEEEEE`, `#E8E8E8`)                   |
| Text Primary    | Dark charcoal (`#222222` or `#333333`)                   |
| Text Secondary  | Medium gray (`#666666`)                                  |
| Accent          | Subtle metallic / champagne gold for highlights (optional) |
| CTA Buttons     | A clean accent color (dark navy, soft gold, or brand color if provided) |

### 3.3 Typography

- Use clean, modern sans-serif fonts (e.g., Inter, Montserrat, or similar Google Fonts).
- Headings: bold, generous sizing with ample letter-spacing.
- Body: regular weight, comfortable line-height (~1.6–1.8).

### 3.4 Layout Principles

- **Navigation**: Fixed top navigation bar (sticky on scroll).
- **Page Rhythm**: Spacious — generous whitespace / padding between sections.
- **Product Grid**: 3-column card layout on desktop.
- **Responsive**: Fully responsive — mobile-first approach.
- **Imagery**: High-quality product images with consistent aspect ratios; use subtle hover effects on product cards.

### 3.5 Design Restrictions

- Do NOT use overly flashy animations or transitions.
- Do NOT use dark/moody backgrounds as the primary theme.
- Keep the visual feeling clean, bright, and professional.

---

## 4. Functional Requirements

### 4.1 Multi-Language Support

The website must support the following languages with a language switcher in the navigation:

1. English (default)
2. Spanish (Español)
3. Portuguese (Português)
4. French (Français)
5. Italian (Italiano)
6. German (Deutsch)

Implementation approach: Use i18n framework. All static UI text should be translatable. Product content should support per-language fields in the CMS (at minimum: product name, description, and specifications).

### 4.2 Online Inquiry Form

- Form fields: Name, Email, Phone, Company, Country, Product Interest, Message.
- On submission:
  - Save inquiry to database.
  - Send email notification to `bolen5@cnjxctm.com`.
  - Show success confirmation to the visitor.
- Basic spam protection (honeypot field or simple CAPTCHA).

### 4.3 Product Search & Category Filtering

- Full-text search bar on the Products page.
- Filter by product category (sidebar or top filter bar).
- Sort options: newest first, alphabetical (optional).

### 4.4 SEO Basics

- Semantic HTML (`<h1>`, `<h2>`, `<article>`, etc.).
- Meta titles and descriptions per page (editable from CMS).
- Clean URL slugs (e.g., `/products/led-bathroom-mirror-model-x`).
- Image alt text support.
- Sitemap.xml and robots.txt generation.

---

## 5. Employee CMS & Authentication System

### 5.1 Authentication

#### Registration

- Employees can register with: **Username, Email, Password, Full Name**.
- **Email verification is NOT required** — accounts are created immediately upon registration.
- After registration, the account status is set to **"Pending Approval"**.
- Pending users see a message: "Your account is pending admin approval. Please contact an administrator."

#### Login

- Standard email/username + password login.
- Password hashing (bcrypt or argon2).
- Session-based or JWT-based authentication.
- "Forgot Password" flow (sends reset link to email — optional for MVP).

#### Roles

| Role       | Permissions                                                                                   |
| ---------- | --------------------------------------------------------------------------------------------- |
| **Admin**  | Full access: manage all content, approve/reject user registrations, manage user roles, delete users |
| **Editor** | Can add/edit/delete banners, products, product categories, about page content, and inquiry records |

#### Initial Admin Account

On first deployment (database seed / migration), automatically create the following admin account:

- **Username**: `admin`
- **Email**: `admin@chengtai.com`
- **Password**: `Chengtai@2025` (must be changed on first login — enforce this)
- **Role**: Admin
- **Status**: Approved

#### User Approval Workflow

1. New user registers → account created with status `pending`.
2. Admin sees pending users listed in the CMS dashboard under "User Management".
3. Admin can **Approve** or **Reject** each pending user.
4. Approved users can log in and access the CMS.
5. Rejected users see a message: "Your registration has been declined."

### 5.2 CMS Dashboard

After login, employees see a CMS dashboard with sidebar navigation to manage:

#### Banner Management

- View all banners in a sortable list.
- Add new banner: upload image, set title text (per language), subtitle text, CTA button text, CTA link, display order, active/inactive toggle.
- Edit / Delete existing banners.
- Drag-and-drop reorder banners.

#### Product Category Management

- CRUD operations on product categories.
- Fields: category name (per language), category image/icon, display order, active/inactive.
- Categories are hierarchical (support parent-child, e.g., "Bathroom Mirrors" > "Round Bathroom Mirrors").

#### Product Management

- View all products in a paginated table with search and filter by category.
- Add new product:
  - Product name (per language)
  - Model number / SKU
  - Category (select from existing categories)
  - Short description (per language)
  - Full description / rich text (per language)
  - Specifications (dynamic key-value pairs, e.g., Size: 600×800mm, Power: 20W)
  - Multiple image upload (with drag-and-drop reorder, set primary/thumbnail image)
  - Tags (e.g., "new arrival", "best seller")
  - Featured flag (to show on homepage)
  - Active/Inactive toggle
- Edit / Delete products.
- Bulk actions: activate, deactivate, delete selected.

#### About Page Management

- Edit company introduction text (rich text editor, per language).
- Manage factory/workshop photo gallery (upload, reorder, delete).
- Manage certification images (upload, reorder, delete).
- Edit factory statistics (employee count, facility size, annual capacity).

#### Inquiry Management

- View all received inquiries in a table (date, name, email, company, product interest, message).
- Mark inquiries as read/unread.
- Mark inquiries as replied/pending.
- Delete inquiries.
- Export inquiries to CSV.

#### User Management (Admin Only)

- View all registered users with status (approved, pending, rejected).
- Approve / Reject pending registrations.
- Change user roles (Admin, Editor).
- Deactivate or delete user accounts.

#### Site Settings (Admin Only)

- Edit general site settings: company name, slogan, contact email, WhatsApp number, address.
- Upload/change company logo.
- Edit SEO meta titles and descriptions for each page.
- Manage footer content (copyright text, social media links if any).

---

## 6. Technical Recommendations

### 6.1 Suggested Tech Stack

| Layer            | Technology                                                          |
| ---------------- | ------------------------------------------------------------------- |
| Frontend         | Next.js (React) with App Router for SSR/SSG + SEO benefits          |
| Styling          | Tailwind CSS                                                        |
| Backend/API      | Next.js API routes (or Cloudflare Workers for edge functions)       |
| Database         | **Cloudflare D1** (serverless SQLite at the edge)                   |
| ORM              | **Drizzle ORM** (lightweight, D1-compatible) or Prisma with D1 adapter |
| Auth             | Custom JWT stored in HTTP-only cookies, or Lucia Auth (D1-compatible) |
| File/Image Storage | **Cloudflare R2** (S3-compatible object storage, no egress fees)  |
| CDN / Images     | **Cloudflare Images** or R2 + Cloudflare CDN for optimized delivery |
| Email            | Resend API or SendGrid (called from Workers/API routes)             |
| i18n             | next-intl (Next.js)                                                 |
| Rich Text Editor | TipTap or Quill for CMS content editing                            |
| Deployment       | **Cloudflare Pages** (with Workers for API) or Vercel (with R2/D1 bindings) |

### 6.2 Cloudflare R2 — File & Image Storage

All user-uploaded files (product images, banner images, factory photos, certification images, company logo) must be stored in **Cloudflare R2**.

#### R2 Bucket Structure

```
chengtai-website-assets/          ← R2 bucket name
├── banners/
│   ├── banner-{id}-{timestamp}.webp
│   └── ...
├── products/
│   ├── {product-id}/
│   │   ├── primary.webp
│   │   ├── gallery-1.webp
│   │   ├── gallery-2.webp
│   │   └── ...
├── categories/
│   ├── category-{id}.webp
│   └── ...
├── about/
│   ├── factory/
│   │   ├── factory-1.webp
│   │   └── ...
│   └── certifications/
│       ├── ce-cert.webp
│       └── ...
├── logo/
│   ├── logo.png
│   └── logo.svg
└── misc/
```

#### R2 Integration Rules

- **Upload flow**: CMS upload → API route/Worker → R2 `PUT` → store the R2 object key in D1 database.
- **Serving files**: Use a **Cloudflare R2 public bucket** or a **custom domain** pointed to the R2 bucket for public image URLs (e.g., `https://assets.chengtai-mirror.com/products/123/primary.webp`).
- **Image optimization**: On upload, resize/compress images to WebP format. Generate thumbnails (e.g., 400px width for cards, full-size for detail view). Store both versions in R2.
- **Allowed file types**: `.jpg`, `.jpeg`, `.png`, `.webp`, `.svg`, `.gif` (max 10MB per file).
- **File naming**: Use sanitized, unique names: `{entity}-{id}-{timestamp}.{ext}` to avoid collisions.
- **Deletion**: When a product/banner is deleted from the CMS, also delete associated R2 objects (cleanup).

#### R2 Configuration (wrangler.toml)

```toml
[[r2_buckets]]
binding = "ASSETS_BUCKET"
bucket_name = "chengtai-website-assets"
```

#### R2 Upload Example (Worker / API Route)

```typescript
// Example: uploading to R2 in a Cloudflare Worker or Next.js API route
export async function uploadToR2(
  bucket: R2Bucket,
  file: File,
  path: string
): Promise<string> {
  const key = `${path}/${Date.now()}-${file.name}`;
  await bucket.put(key, file.stream(), {
    httpMetadata: { contentType: file.type },
  });
  return key; // Store this key in D1 database
}
```

### 6.3 Cloudflare D1 — Database

Use **Cloudflare D1** as the primary database. D1 is serverless SQLite that runs at the edge with zero cold starts.

#### D1 Configuration (wrangler.toml)

```toml
[[d1_databases]]
binding = "DB"
database_name = "chengtai-website"
database_id = "<your-database-id>"
```

#### D1 Considerations

- D1 uses **SQLite syntax** — no `ENUM` type; use `TEXT` with `CHECK` constraints instead.
- Max database size: 10GB (more than sufficient for this use case).
- Use **Drizzle ORM** for type-safe queries with D1. Drizzle has first-class D1 support.
- Migrations: Use `wrangler d1 migrations` or Drizzle Kit for schema migrations.
- The `image_url` fields in all tables store the **R2 object key** (e.g., `products/123/primary.webp`), which is resolved to a full URL at render time using the R2 public domain.

#### D1 Schema Adaptations (SQLite-compatible)

```sql
-- Users: use TEXT + CHECK instead of ENUM
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('admin', 'editor')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('approved', 'pending', 'rejected')),
  must_change_password INTEGER NOT NULL DEFAULT 0,  -- SQLite: 0=false, 1=true
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Product images: image_url stores R2 object key
CREATE TABLE product_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_key TEXT NOT NULL,        -- R2 key, e.g., "products/42/gallery-1.webp"
  is_primary INTEGER NOT NULL DEFAULT 0,
  display_order INTEGER NOT NULL DEFAULT 0
);
```

> Apply the same pattern (INTEGER for booleans, TEXT with CHECK for enums, TEXT for timestamps) to all other tables defined in Section 6.4.

### 6.4 Database Schema (Key Entities)

```
users
  - id (PK)
  - username (unique)
  - email (unique)
  - password_hash
  - full_name
  - role (enum: admin, editor)
  - status (enum: approved, pending, rejected)
  - must_change_password (boolean, default false)
  - created_at
  - updated_at

banners
  - id (PK)
  - image_url
  - display_order
  - is_active (boolean)
  - cta_link
  - created_by (FK → users)
  - created_at
  - updated_at

banner_translations
  - id (PK)
  - banner_id (FK → banners)
  - locale (e.g., "en", "es", "fr")
  - title
  - subtitle
  - cta_text

product_categories
  - id (PK)
  - parent_id (FK → product_categories, nullable)
  - image_url
  - display_order
  - is_active (boolean)
  - created_at

category_translations
  - id (PK)
  - category_id (FK → product_categories)
  - locale
  - name
  - slug (URL-friendly)

products
  - id (PK)
  - category_id (FK → product_categories)
  - model_number
  - is_featured (boolean)
  - is_active (boolean)
  - tags (JSON array or separate join table)
  - created_by (FK → users)
  - created_at
  - updated_at

product_translations
  - id (PK)
  - product_id (FK → products)
  - locale
  - name
  - slug
  - short_description
  - full_description (rich text / HTML)

product_specifications
  - id (PK)
  - product_id (FK → products)
  - locale
  - spec_key (e.g., "Size", "Power", "Weight")
  - spec_value (e.g., "600×800mm", "20W", "8kg")

product_images
  - id (PK)
  - product_id (FK → products)
  - image_url
  - is_primary (boolean)
  - display_order

inquiries
  - id (PK)
  - name
  - email
  - phone
  - company
  - country
  - product_interest
  - message
  - is_read (boolean)
  - is_replied (boolean)
  - created_at

site_settings
  - id (PK)
  - key (unique, e.g., "company_name", "slogan", "contact_email")
  - value
  - updated_at

about_page
  - id (PK)
  - locale
  - content (rich text)
  - factory_size
  - employee_count
  - annual_capacity
  - updated_at

about_gallery
  - id (PK)
  - image_url
  - image_type (enum: factory, certification)
  - display_order

page_seo
  - id (PK)
  - page_slug (e.g., "home", "about", "products", "contact")
  - locale
  - meta_title
  - meta_description
```

---

## 7. Content — Pre-loaded Company Information

### Company Profile (English)

> Established in 2005, Jiaxing Chengtai Mirror Co., Ltd. is a premier manufacturer specializing in high-end mirror solutions, including LED, bathroom, and full-body mirrors. Our state-of-the-art, self-owned facility spans 35,000 square meters in Jiaxing, Zhejiang — strategically located just 60km from Shanghai Port for efficient global logistics.
>
> Driven by our municipal-level R&D center and advanced laboratory, we deliver constant innovation and uncompromising quality. As a National High-Tech Enterprise, safety and sustainability are at our core. Our products are fully certified with CE, SAA, UL, CCC, IP44, IP66, and RoHS, supported by an ISO9001 quality management system.
>
> With a vast portfolio of over 100,000 SKUs, we provide exceptional flexibility through OBM, OEM, and ODM services. We are proud to serve a global clientele across Europe, the Americas, Australia, ASEAN, and the Middle East. At Chengtai, "Customer First" is more than a slogan — it is the foundation of our partnership.

### Key Selling Points

1. **21 Years of Manufacturing Excellence** — Established 2005, deep industry expertise
2. **Globally Certified** — CE, CB, SAA, ETL, IP44, IP54, RoHS, ISO9001
3. **Full OEM/ODM Support** — 100,000+ SKUs, complete customization capability
4. **Fast Delivery** — Efficient production with reliable timelines
5. **Safe Packaging** — Professional export-grade packaging for global shipping

### Contact Information

| Field      | Value                                                                  |
| ---------- | ---------------------------------------------------------------------- |
| Email      | bolen5@cnjxctm.com                                                     |
| WhatsApp   | +86 17860567239                                                        |
| Address    | No.768, Xinda Road, Xinfeng Town, Nanhu District, Jiaxing, Zhejiang, China |

### Initial Admin Account (Seed Data)

| Field    | Value              |
| -------- | ------------------ |
| Username | `admin`            |
| Email    | `admin@chengtai.com` |
| Password | `Chengtai@2025`    |
| Role     | Admin              |
| Status   | Approved           |

> ⚠️ The system must enforce a password change on first login for this account.

---

## 8. Non-Functional Requirements

- **Performance**: Pages should load in under 3 seconds. Use image optimization (WebP, lazy loading).
- **Security**: CSRF protection, XSS prevention, SQL injection prevention, rate limiting on login and inquiry form.
- **Accessibility**: Basic WCAG 2.1 AA compliance (alt text, keyboard navigation, color contrast).
- **Browser Support**: Chrome, Firefox, Safari, Edge (latest 2 versions).
- **Mobile**: Fully responsive — test on iPhone SE, iPhone 14, iPad, Android common sizes.

---

## 9. Deployment Checklist

- [ ] Cloudflare D1 database created and migrations run successfully
- [ ] Cloudflare R2 bucket created (`chengtai-website-assets`) with public access configured
- [ ] R2 custom domain configured (e.g., `assets.chengtai-mirror.com`)
- [ ] Initial admin account seeded into D1
- [ ] Email sending configured and tested (inquiry notifications via Resend/SendGrid)
- [ ] All 6 languages have base UI translations
- [ ] SSL/HTTPS configured (automatic via Cloudflare)
- [ ] Image upload → R2 pipeline tested end-to-end
- [ ] Environment variables / secrets set in Cloudflare dashboard (JWT secret, SMTP credentials)
- [ ] `wrangler.toml` configured with D1 and R2 bindings
- [ ] robots.txt and sitemap.xml generated
- [ ] Favicon and Open Graph meta images uploaded to R2
- [ ] 404 and error pages styled
- [ ] Cloudflare Pages project linked to Git repository for CI/CD
