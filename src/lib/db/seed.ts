import { config } from 'dotenv';
config({ path: '.env.local' });

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { hashSync } from 'bcryptjs';
import * as schema from './schema';

const client = postgres(process.env.DATABASE_URL!, {
  ssl: { rejectUnauthorized: false },
  prepare: false,
});
const db = drizzle(client, { schema });

async function seed() {
  console.log('Seeding database...');

  // Create admin user
  const passwordHash = hashSync('Chengtai@2025', 12);
  await db.insert(schema.users).values({
    username: 'admin',
    email: 'admin@chengtai.com',
    passwordHash,
    fullName: 'System Administrator',
    role: 'admin',
    status: 'approved',
    mustChangePassword: true,
  }).onConflictDoNothing();

  // Seed product categories
  const categories = [
    { nameEn: 'Bathroom Mirrors', slug: 'bathroom-mirrors' },
    { nameEn: 'LED Mirrors', slug: 'led-mirrors' },
    { nameEn: 'Full-Length Mirrors', slug: 'full-length-mirrors' },
    { nameEn: 'Mirror Cabinets', slug: 'mirror-cabinets' },
  ];

  for (let i = 0; i < categories.length; i++) {
    const cat = categories[i];
    const [result] = await db.insert(schema.productCategories).values({
      displayOrder: i,
      isActive: true,
    }).returning();

    if (result) {
      const locales = ['en', 'es', 'pt', 'fr', 'it', 'de'];
      const translations: Record<string, Record<string, string>> = {
        'bathroom-mirrors': { en: 'Bathroom Mirrors', es: 'Espejos de Baño', pt: 'Espelhos de Banheiro', fr: 'Miroirs de Salle de Bain', it: 'Specchi da Bagno', de: 'Badezimmerspiegel' },
        'led-mirrors': { en: 'LED Mirrors', es: 'Espejos LED', pt: 'Espelhos LED', fr: 'Miroirs LED', it: 'Specchi LED', de: 'LED-Spiegel' },
        'full-length-mirrors': { en: 'Full-Length Mirrors', es: 'Espejos de Cuerpo Entero', pt: 'Espelhos de Corpo Inteiro', fr: 'Miroirs Plein Pied', it: 'Specchi a Figura Intera', de: 'Ganzkörperspiegel' },
        'mirror-cabinets': { en: 'Mirror Cabinets', es: 'Armarios con Espejo', pt: 'Armários com Espelho', fr: 'Armoires à Miroir', it: 'Armadietti a Specchio', de: 'Spiegelschränke' },
      };

      for (const locale of locales) {
        await db.insert(schema.categoryTranslations).values({
          categoryId: result.id,
          locale,
          name: translations[cat.slug][locale],
          slug: cat.slug,
        });
      }
    }
  }

  // Seed site settings
  const settings = [
    { key: 'company_name', value: 'JIAXING CHENGTAI MIRROR CO., LTD' },
    { key: 'slogan', value: 'To be a global leader in the smart home mirror industry' },
    { key: 'contact_email', value: 'bolen5@cnjxctm.com' },
    { key: 'whatsapp', value: '+86 17860567239' },
    { key: 'address', value: 'No.768, Xinda Road, Xinfeng Town, Nanhu District, Jiaxing, Zhejiang, China' },
    { key: 'copyright', value: '© 2025 Jiaxing Chengtai Mirror Co., Ltd. All rights reserved.' },
  ];

  for (const s of settings) {
    await db.insert(schema.siteSettings).values(s).onConflictDoNothing();
  }

  // Seed about page content
  const aboutContent = `<p>Established in 2005, Jiaxing Chengtai Mirror Co., Ltd. is a premier manufacturer specializing in high-end mirror solutions, including LED, bathroom, and full-body mirrors. Our state-of-the-art, self-owned facility spans 35,000 square meters in Jiaxing, Zhejiang — strategically located just 60km from Shanghai Port for efficient global logistics.</p>
<p>Driven by our municipal-level R&D center and advanced laboratory, we deliver constant innovation and uncompromising quality. As a National High-Tech Enterprise, safety and sustainability are at our core. Our products are fully certified with CE, SAA, UL, CCC, IP44, IP66, and RoHS, supported by an ISO9001 quality management system.</p>
<p>With a vast portfolio of over 100,000 SKUs, we provide exceptional flexibility through OBM, OEM, and ODM services. We are proud to serve a global clientele across Europe, the Americas, Australia, ASEAN, and the Middle East. At Chengtai, "Customer First" is more than a slogan — it is the foundation of our partnership.</p>`;

  await db.insert(schema.aboutPage).values({
    locale: 'en',
    content: aboutContent,
    factorySize: '35,000㎡',
    employeeCount: '200+',
    annualCapacity: '500,000 units',
  }).onConflictDoNothing();

  // Seed SEO defaults
  const seoDefaults = [
    { pageSlug: 'home', locale: 'en', metaTitle: 'Chengtai Mirror - Premium LED & Bathroom Mirrors Manufacturer', metaDescription: 'JIAXING CHENGTAI MIRROR CO., LTD - 21 years of manufacturing excellence in LED mirrors, bathroom mirrors, and mirror cabinets. CE/UL/SAA certified. OEM/ODM supported.' },
    { pageSlug: 'products', locale: 'en', metaTitle: 'Products - LED Mirrors, Bathroom Mirrors, Mirror Cabinets | Chengtai', metaDescription: 'Browse our complete range of LED mirrors, bathroom mirrors, full-length mirrors, and mirror cabinets. Over 100,000 SKUs available with full OEM/ODM support.' },
    { pageSlug: 'about', locale: 'en', metaTitle: 'About Us - Chengtai Mirror | 21 Years of Manufacturing Excellence', metaDescription: 'Learn about Jiaxing Chengtai Mirror Co., Ltd. - 35,000㎡ facility, 200+ employees, globally certified manufacturer serving clients across Europe, Americas, and Asia.' },
    { pageSlug: 'contact', locale: 'en', metaTitle: 'Contact Us - Get a Quote | Chengtai Mirror', metaDescription: 'Contact Jiaxing Chengtai Mirror Co., Ltd. for inquiries, quotes, and OEM/ODM partnerships. Email: bolen5@cnjxctm.com | WhatsApp: +86 17860567239' },
  ];

  for (const seo of seoDefaults) {
    await db.insert(schema.pageSeo).values(seo);
  }

  // Seed sample products
  const sampleProducts = [
    { modelNumber: 'CT-BM-001', categorySlug: 'bathroom-mirrors', nameEn: 'Round LED Bathroom Mirror', descEn: 'Elegant round bathroom mirror with integrated LED lighting, anti-fog function, and touch sensor switch.', specs: [{ key: 'Size', value: 'Ø600mm' }, { key: 'Power', value: '18W' }, { key: 'Color Temp', value: '3000K-6000K' }, { key: 'IP Rating', value: 'IP44' }] },
    { modelNumber: 'CT-BM-002', categorySlug: 'bathroom-mirrors', nameEn: 'Rectangular Smart Mirror', descEn: 'Premium rectangular bathroom mirror with LED backlight, defogger, and dimming control. Perfect for modern bathrooms.', specs: [{ key: 'Size', value: '600×800mm' }, { key: 'Power', value: '24W' }, { key: 'Color Temp', value: '3000K-6000K' }, { key: 'IP Rating', value: 'IP44' }] },
    { modelNumber: 'CT-LED-001', categorySlug: 'led-mirrors', nameEn: 'Frameless LED Wall Mirror', descEn: 'Minimalist frameless LED mirror with edge lighting and memory function. Suitable for bathroom and vanity areas.', specs: [{ key: 'Size', value: '500×700mm' }, { key: 'Power', value: '15W' }, { key: 'Color Temp', value: '4000K' }, { key: 'IP Rating', value: 'IP44' }] },
    { modelNumber: 'CT-LED-002', categorySlug: 'led-mirrors', nameEn: 'Arch Top LED Mirror', descEn: 'Stylish arch-top LED mirror with front lighting and anti-fog pad. A statement piece for any bathroom design.', specs: [{ key: 'Size', value: '550×900mm' }, { key: 'Power', value: '22W' }, { key: 'Color Temp', value: '3000K-6000K' }, { key: 'IP Rating', value: 'IP54' }] },
    { modelNumber: 'CT-FL-001', categorySlug: 'full-length-mirrors', nameEn: 'Full-Length LED Dressing Mirror', descEn: 'Full-body LED dressing mirror with adjustable brightness. Wall-mounted or free-standing installation.', specs: [{ key: 'Size', value: '500×1600mm' }, { key: 'Power', value: '35W' }, { key: 'Color Temp', value: '3000K-6000K' }, { key: 'Installation', value: 'Wall/Standing' }] },
    { modelNumber: 'CT-MC-001', categorySlug: 'mirror-cabinets', nameEn: 'LED Mirror Cabinet with Storage', descEn: 'Multi-functional LED mirror cabinet with ample storage space, soft-close doors, and integrated lighting.', specs: [{ key: 'Size', value: '650×800×130mm' }, { key: 'Power', value: '20W' }, { key: 'Shelves', value: '3 adjustable' }, { key: 'IP Rating', value: 'IP44' }] },
  ];

  const allCatTrans = await db.select().from(schema.categoryTranslations);

  for (const prod of sampleProducts) {
    const catTrans = allCatTrans.find(ct => ct.slug === prod.categorySlug && ct.locale === 'en');

    const [result] = await db.insert(schema.products).values({
      categoryId: catTrans?.categoryId || null,
      modelNumber: prod.modelNumber,
      isFeatured: true,
      isActive: true,
      tags: JSON.stringify(['new arrival']),
      createdBy: 1,
    }).returning();

    if (result) {
      await db.insert(schema.productTranslations).values({
        productId: result.id,
        locale: 'en',
        name: prod.nameEn,
        slug: prod.nameEn.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-$/, ''),
        shortDescription: prod.descEn,
        fullDescription: `<p>${prod.descEn}</p>`,
      });

      for (const spec of prod.specs) {
        await db.insert(schema.productSpecifications).values({
          productId: result.id,
          locale: 'en',
          specKey: spec.key,
          specValue: spec.value,
        });
      }
    }
  }

  console.log('Database seeded successfully!');
  await client.end();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
