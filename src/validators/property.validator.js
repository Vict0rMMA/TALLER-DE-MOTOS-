const { z } = require("zod");

const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const propertyBodySchema = z.object({
  title: z.string().min(1, "El titulo es requerido"),
  price: z.coerce.number().positive("El precio debe ser mayor que 0"),
  location: z.string().min(1, "La ubicacion es requerida"),
  available: z.boolean(),
  imageUrl: z.preprocess((v) => {
    if (v == null) return undefined;
    const s = String(v).trim();
    if (s === "") return undefined;
    return s;
  }, z.string().regex(/^(\/uploads\/|https:\/\/)/i, "URL de imagen invalida").optional()),
  bedrooms: z.coerce.number().int().min(1).max(50).optional(),
  bathrooms: z.coerce.number().int().min(1).max(50).optional(),
  areaM2: z.coerce.number().int().min(1).max(999999).optional(),
});

function firstQueryValue(v) {
  if (Array.isArray(v)) return v[0];
  return v;
}

function normalizePropertyQuery(raw) {
  const src = raw && typeof raw === "object" ? raw : {};
  const out = {};

  const page = firstQueryValue(src.page);
  const limit = firstQueryValue(src.limit);
  const sort = firstQueryValue(src.sort);
  const location = firstQueryValue(src.location);
  const minPrice = firstQueryValue(src.minPrice);
  const maxPrice = firstQueryValue(src.maxPrice);

  if (page !== undefined && page !== null && String(page).trim() !== "") out.page = page;
  if (limit !== undefined && limit !== null && String(limit).trim() !== "") out.limit = limit;
  if (sort !== undefined && sort !== null && String(sort).trim() !== "") out.sort = sort;

  if (typeof location === "string") {
    const t = location.trim();
    if (t !== "") out.location = t;
  }
  if (minPrice !== undefined && minPrice !== null && String(minPrice).trim() !== "") {
    out.minPrice = minPrice;
  }
  if (maxPrice !== undefined && maxPrice !== null && String(maxPrice).trim() !== "") {
    out.maxPrice = maxPrice;
  }

  return out;
}

function normalizePropertyQueryMiddleware(req, res, next) {
  req.query = normalizePropertyQuery(req.query);
  next();
}

const propertyQuerySchema = z.object({
  location: z.string().optional(),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  sort: z.enum(["recent", "price-asc", "price-desc"]).default("recent"),
});

module.exports = {
  idParamSchema,
  propertyBodySchema,
  propertyQuerySchema,
  normalizePropertyQueryMiddleware,
};
