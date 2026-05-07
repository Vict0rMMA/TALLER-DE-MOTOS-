const path = require("path");
const fs = require("fs/promises");
const crypto = require("crypto");

async function ensureUploadDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function uploadPropertyImage(req, res, next) {
  try {
    if (!req.file || !req.file.buffer) {
      const err = new Error("Archivo de imagen requerido");
      err.statusCode = 400;
      throw err;
    }

    const uploadsDir = path.join(__dirname, "..", "..", "public", "uploads", "properties");
    await ensureUploadDir(uploadsDir);

    const id = crypto.randomUUID();
    const outName = `${id}.webp`;
    const outPath = path.join(uploadsDir, outName);

    let sharp;
    try {
      sharp = require("sharp");
    } catch {
      sharp = null;
    }

    if (sharp) {
      await sharp(req.file.buffer)
        .rotate()
        .resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 82 })
        .toFile(outPath);
    } else {
      const fallbackName = `${id}${path.extname(req.file.originalname) || ".jpg"}`;
      const fallbackPath = path.join(uploadsDir, fallbackName);
      await fs.writeFile(fallbackPath, req.file.buffer);
      const publicPath = `/uploads/properties/${fallbackName}`;
      return res.status(201).json({ url: publicPath });
    }

    const publicPath = `/uploads/properties/${outName}`;
    return res.status(201).json({ url: publicPath });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  uploadPropertyImage,
};
