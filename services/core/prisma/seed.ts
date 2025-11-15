import { KycStatus, Prisma, PrismaClient, UserRole } from '@prisma/client';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import * as argon2 from 'argon2';

type RawProductRecord = {
  id?: string;
  externalProductId?: string | number | null;
  name?: string;
  sku?: string | null;
  description?: string | null;
  price?: number | string;
  currency?: string | null;
  imageUrl?: string | null;
  landingUrl?: string | null;
  isActive?: boolean;
  categoryId?: string | null;
};

type RawCategoryRecord = {
  id?: string;
  name?: string;
  description?: string | null;
};

type ProductSeedPayload =
  | RawProductRecord[]
  | {
      products: RawProductRecord[];
      categories?: RawCategoryRecord[];
    };

type ParsedSeedPayload = {
  products: RawProductRecord[];
  categories: RawCategoryRecord[];
};

const prisma = new PrismaClient();
const DEFAULT_PRODUCTS_PATH = path.resolve(__dirname, 'data', 'products.json');

const CURRENCY_MAP: Record<string, string> = {
  'indian rupee': 'INR',
  inr: 'INR',
  rupee: 'INR'
};

async function main() {

  await seedProductsFromJson();

}

async function seedProductsFromJson() {
  const filePath = process.env.PRODUCT_SEED_PATH
    ? path.resolve(process.env.PRODUCT_SEED_PATH)
    : DEFAULT_PRODUCTS_PATH;

  if (!(await fileExists(filePath))) {
    console.log('No product payload found, skipping bulk product seed.');
    return;
  }

  const payload = await fs.readFile(filePath, 'utf-8');
  let parsedPayload: ParsedSeedPayload;

  try {
    parsedPayload = parseProductSeedPayload(payload);
  } catch (error) {
    console.error('Failed to parse product JSON', error);
    throw error;
  }

  const { products: records, categories } = parsedPayload;

  if (records.length === 0) {
    console.log('Product JSON is empty, nothing to seed.');
    return;
  }

  const categoryLookup = new Map<string, string>();
  await seedCategoriesFromPayload(categories, categoryLookup);
  await ensureCategoriesFromProducts(records, categoryLookup);

  let seededCount = 0;
  for (const raw of records) {
    const sanitized = sanitizeProductRecord(raw, categoryLookup);
    if (!sanitized) {
      continue;
    }

    await prisma.product.upsert({
      where: { id: sanitized.id },
      update: sanitized,
      create: sanitized
    });
    seededCount += 1;
  }

  const linkedCategories = new Set(categoryLookup.values()).size;
  console.log(
    `Seeded ${seededCount} products from ${path.basename(
      filePath
    )} (categories linked: ${linkedCategories})`
  );
}

function parseProductSeedPayload(raw: string): ParsedSeedPayload {
  const sanitizedPayload = raw.replace(/\bNaN\b/g, 'null');
  const parsed = JSON.parse(sanitizedPayload) as ProductSeedPayload;

  if (Array.isArray(parsed)) {
    return { products: parsed, categories: [] };
  }

  if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.products)) {
    throw new Error('Product JSON must be an array or an object with a products array');
  }

  return {
    products: parsed.products,
    categories: Array.isArray(parsed.categories) ? parsed.categories : []
  };
}

async function seedCategoriesFromPayload(
  payload: RawCategoryRecord[],
  lookup: Map<string, string>
) {
  if (payload.length === 0) {
    return;
  }

  const names = payload
    .map((category) => category.name?.trim())
    .filter((name): name is string => Boolean(name));

  let existingByName = new Map<string, { id: string; name: string }>();
  if (names.length > 0) {
    const existingCategories = await prisma.category.findMany({
      where: {
        OR: names.map((name) => ({
          name: {
            equals: name,
            mode: 'insensitive'
          }
        }))
      }
    });
    existingByName = new Map(
      existingCategories.map((category) => [category.name.trim().toLowerCase(), category])
    );
  }

  for (const raw of payload) {
    const name = raw.name?.trim();
    if (!name) {
      continue;
    }

    const normalizedNameKey = name.toLowerCase();
    const description = raw.description?.trim() ?? null;

    if (existingByName.has(normalizedNameKey)) {
      const category = existingByName.get(normalizedNameKey)!;
      const updated = await prisma.category.update({
        where: { id: category.id },
        data: { name, description }
      });
      registerCategory(updated, lookup, [raw.id]);
      continue;
    }

    const normalizedId = normalizeCategoryId(raw.id, name);
    if (!normalizedId) {
      continue;
    }

    const upserted = await prisma.category.upsert({
      where: { id: normalizedId },
      update: { name, description },
      create: { id: normalizedId, name, description }
    });
    registerCategory(upserted, lookup, [raw.id]);
  }
}

async function ensureCategoriesFromProducts(
  records: RawProductRecord[],
  lookup: Map<string, string>
) {
  const identifierMap = new Map<string, string>();
  for (const record of records) {
    if (!record.categoryId) {
      continue;
    }
    const label = record.categoryId.toString().trim();
    if (!label) {
      continue;
    }
    const key = categoryKey(label);
    if (!key || lookup.has(key) || identifierMap.has(key)) {
      continue;
    }
    identifierMap.set(key, label);
  }

  if (identifierMap.size === 0) {
    return;
  }

  const identifiers = Array.from(new Set(identifierMap.values()));
  if (identifiers.length > 0) {
    const existingCategories = await prisma.category.findMany({
      where: {
        OR: [
          { id: { in: identifiers } },
          { name: { in: identifiers } }
        ]
      }
    });
    for (const category of existingCategories) {
      registerCategory(category, lookup);
    }
  }

  for (const [key, label] of identifierMap.entries()) {
    if (lookup.has(key)) {
      continue;
    }

    const normalizedId = normalizeCategoryId(label, label);
    if (!normalizedId) {
      continue;
    }

    const name = formatCategoryName(label);
    const category = await prisma.category.upsert({
      where: { id: normalizedId },
      update: { name },
      create: { id: normalizedId, name }
    });
    registerCategory(category, lookup, [label]);
  }
}

function registerCategory(
  category: { id: string; name: string },
  lookup: Map<string, string>,
  extraKeys: (string | null | undefined)[] = []
) {
  const keys = [
    categoryKey(category.id),
    categoryKey(category.name),
    ...extraKeys.map((value) => categoryKey(value))
  ];

  for (const key of keys) {
    if (key) {
      lookup.set(key, category.id);
    }
  }
}

function categoryKey(value?: string | number | null) {
  if (value === undefined || value === null) {
    return null;
  }
  const stringValue = String(value).trim().toLowerCase();
  return stringValue || null;
}

function normalizeCategoryId(value?: string | null, fallbackName?: string | null) {
  const source = value?.trim() || fallbackName?.trim();
  if (!source) {
    return null;
  }
  return slugify(source);
}

function slugify(value: string) {
  const normalized = value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return normalized || value.trim().toLowerCase();
}

function formatCategoryName(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return trimmed;
  }
  if (trimmed === trimmed.toUpperCase()) {
    return trimmed;
  }
  return trimmed
    .replace(/[-_]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function sanitizeProductRecord(
  record: RawProductRecord,
  categories: Map<string, string>
): Prisma.ProductUpsertArgs['create'] | null {
  const id = normalizeId(record.id);
  const name = record.name?.trim();
  const price = normalizePrice(record.price);

  if (!id || !name || !price) {
    return null;
  }

  const categoryLookupKey = categoryKey(record.categoryId);
  const categoryId = categoryLookupKey ? categories.get(categoryLookupKey) ?? null : null;

  const currency = normalizeCurrency(record.currency);
  const externalProductId =
    normalizeExternalId(record.externalProductId) ?? normalizeExternalId(record.id);
  const sku = record.sku?.trim() ?? record.id?.trim() ?? null;

  return {
    id,
    name,
    description: record.description?.trim() ?? null,
    price,
    currency,
    imageUrl: record.imageUrl ?? null,
    landingUrl: record.landingUrl ?? '#',
    isActive: record.isActive ?? true,
    externalProductId,
    sku,
    categoryId
  };
}

function normalizeId(value?: string | null) {
  if (!value) {
    return null;
  }
  return value.trim();
}

function normalizeExternalId(value?: string | number | null) {
  if (value === undefined || value === null) {
    return null;
  }
  const normalized = String(value).trim();
  return normalized || null;
}

function normalizeCurrency(value?: string | null) {
  if (!value) {
    return 'INR';
  }
  const lower = value.trim().toLowerCase();
  return CURRENCY_MAP[lower] ?? (value.length === 3 ? value.toUpperCase() : 'INR');
}

function normalizePrice(value?: number | string | null) {
  if (value === undefined || value === null) {
    return null;
  }

  const numeric =
    typeof value === 'number'
      ? value
      : Number.parseFloat(
          typeof value === 'string' ? value.replace(/[^0-9.-]/g, '') : String(value)
        );

  if (Number.isNaN(numeric)) {
    return null;
  }

  return new Prisma.Decimal(numeric.toFixed(2));
}

async function fileExists(filePath: string) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
