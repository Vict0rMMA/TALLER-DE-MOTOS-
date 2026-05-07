const prisma = require("../db/prisma");

async function listProperties(filters) {
  const {
    location,
    minPrice,
    maxPrice,
    page = 1,
    limit = 10,
    sort = "recent",
  } = filters;

  const where = {};

  if (location) {
    where.location = {
      contains: location,
      mode: "insensitive",
    };
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {};

    if (minPrice !== undefined) {
      where.price.gte = minPrice;
    }

    if (maxPrice !== undefined) {
      where.price.lte = maxPrice;
    }
  }

  const parsedPage = Number.isFinite(Number(page)) && Number(page) > 0 ? Number(page) : 1;
  const parsedLimit =
    Number.isFinite(Number(limit)) && Number(limit) > 0 ? Math.min(Number(limit), 100) : 10;
  const skip = (parsedPage - 1) * parsedLimit;

  let orderBy = { createdAt: "desc" };
  if (sort === "price-asc") orderBy = { price: "asc" };
  if (sort === "price-desc") orderBy = { price: "desc" };

  const [items, total] = await Promise.all([
    prisma.property.findMany({
      where,
      orderBy,
      skip,
      take: parsedLimit,
    }),
    prisma.property.count({ where }),
  ]);

  return {
    data: items,
    pagination: {
      page: parsedPage,
      limit: parsedLimit,
      total,
      totalPages: Math.ceil(total / parsedLimit) || 1,
    },
  };
}

async function getPropertyById(id) {
  const property = await prisma.property.findUnique({ where: { id: Number(id) } });

  if (!property) {
    const error = new Error("Propiedad no encontrada");
    error.statusCode = 404;
    throw error;
  }

  return property;
}

function mapPriceToDecimal(value) {
  return value.toFixed(2);
}

function buildPropertyData(payload) {
  const {
    title,
    price,
    location,
    available,
    imageUrl,
    bedrooms,
    bathrooms,
    areaM2,
  } = payload;

  const data = {
    title,
    price: mapPriceToDecimal(price),
    location,
    available,
  };

  if (imageUrl !== undefined) data.imageUrl = imageUrl;
  if (bedrooms !== undefined) data.bedrooms = bedrooms;
  if (bathrooms !== undefined) data.bathrooms = bathrooms;
  if (areaM2 !== undefined) data.areaM2 = areaM2;

  return data;
}

async function createProperty(payload) {
  return prisma.property.create({
    data: buildPropertyData(payload),
  });
}

async function updateProperty(id, payload) {
  await getPropertyById(Number(id));

  return prisma.property.update({
    where: { id: Number(id) },
    data: buildPropertyData(payload),
  });
}

async function deleteProperty(id) {
  await getPropertyById(Number(id));

  await prisma.property.delete({ where: { id: Number(id) } });
}

module.exports = {
  listProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
};
