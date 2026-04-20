import { pgTable, text, integer, serial, boolean, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  fullName: text('full_name').notNull(),
  role: text('role').notNull().default('editor'),
  status: text('status').notNull().default('pending'),
  mustChangePassword: boolean('must_change_password').notNull().default(false),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
});

export const banners = pgTable('banners', {
  id: serial('id').primaryKey(),
  imageUrl: text('image_url').notNull(),
  displayOrder: integer('display_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  ctaLink: text('cta_link'),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
});

export const bannerTranslations = pgTable('banner_translations', {
  id: serial('id').primaryKey(),
  bannerId: integer('banner_id').notNull().references(() => banners.id, { onDelete: 'cascade' }),
  locale: text('locale').notNull(),
  title: text('title'),
  subtitle: text('subtitle'),
  ctaText: text('cta_text'),
});

export const productCategories = pgTable('product_categories', {
  id: serial('id').primaryKey(),
  parentId: integer('parent_id'),
  imageUrl: text('image_url'),
  displayOrder: integer('display_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
});

export const categoryTranslations = pgTable('category_translations', {
  id: serial('id').primaryKey(),
  categoryId: integer('category_id').notNull().references(() => productCategories.id, { onDelete: 'cascade' }),
  locale: text('locale').notNull(),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
});

export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  categoryId: integer('category_id').references(() => productCategories.id),
  modelNumber: text('model_number'),
  isFeatured: boolean('is_featured').notNull().default(false),
  isActive: boolean('is_active').notNull().default(true),
  tags: text('tags'),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
});

export const productTranslations = pgTable('product_translations', {
  id: serial('id').primaryKey(),
  productId: integer('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  locale: text('locale').notNull(),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  shortDescription: text('short_description'),
  fullDescription: text('full_description'),
});

export const productSpecifications = pgTable('product_specifications', {
  id: serial('id').primaryKey(),
  productId: integer('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  locale: text('locale').notNull(),
  specKey: text('spec_key').notNull(),
  specValue: text('spec_value').notNull(),
});

export const productImages = pgTable('product_images', {
  id: serial('id').primaryKey(),
  productId: integer('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  imageUrl: text('image_url').notNull(),
  isPrimary: boolean('is_primary').notNull().default(false),
  displayOrder: integer('display_order').notNull().default(0),
});

export const inquiries = pgTable('inquiries', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  company: text('company'),
  country: text('country'),
  productInterest: text('product_interest'),
  message: text('message').notNull(),
  isRead: boolean('is_read').notNull().default(false),
  isReplied: boolean('is_replied').notNull().default(false),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
});

export const siteSettings = pgTable('site_settings', {
  id: serial('id').primaryKey(),
  key: text('key').notNull().unique(),
  value: text('value'),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
});

export const aboutPage = pgTable('about_page', {
  id: serial('id').primaryKey(),
  locale: text('locale').notNull().unique(),
  content: text('content'),
  factorySize: text('factory_size'),
  employeeCount: text('employee_count'),
  annualCapacity: text('annual_capacity'),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
});

export const aboutGallery = pgTable('about_gallery', {
  id: serial('id').primaryKey(),
  imageUrl: text('image_url').notNull(),
  imageType: text('image_type').notNull(),
  displayOrder: integer('display_order').notNull().default(0),
});

export const faqs = pgTable('faqs', {
  id: serial('id').primaryKey(),
  displayOrder: integer('display_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
});

export const faqTranslations = pgTable('faq_translations', {
  id: serial('id').primaryKey(),
  faqId: integer('faq_id').notNull().references(() => faqs.id, { onDelete: 'cascade' }),
  locale: text('locale').notNull(),
  question: text('question').notNull(),
  answer: text('answer').notNull(),
});

export const pageSeo = pgTable('page_seo', {
  id: serial('id').primaryKey(),
  pageSlug: text('page_slug').notNull(),
  locale: text('locale').notNull(),
  metaTitle: text('meta_title'),
  metaDescription: text('meta_description'),
});
