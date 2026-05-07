const multer = require("multer");

const memoryStorage = multer.memoryStorage();

const uploadPropertyImage = multer({
  storage: memoryStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    const allowed = /^image\/(jpeg|png|webp)$/i.test(file.mimetype || "");
    if (!allowed) {
      const err = new Error("Solo se permiten imagenes JPEG, PNG o WebP");
      err.statusCode = 400;
      return cb(err);
    }
    cb(null, true);
  },
});

module.exports = {
  uploadPropertyImage,
};
