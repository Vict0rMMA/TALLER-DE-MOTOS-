const { Router } = require("express");

const authMiddleware = require("../middlewares/auth.middleware");
const { uploadPropertyImage } = require("../middlewares/upload.middleware");
const uploadController = require("../controllers/upload.controller");

const router = Router();

router.post(
  "/property-image",
  authMiddleware,
  uploadPropertyImage.single("image"),
  uploadController.uploadPropertyImage
);

module.exports = router;
