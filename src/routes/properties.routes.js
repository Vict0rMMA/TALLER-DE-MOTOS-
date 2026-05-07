const { Router } = require("express");

const propertiesController = require("../controllers/properties.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validate.middleware");
const {
  idParamSchema,
  propertyBodySchema,
  propertyQuerySchema,
  normalizePropertyQueryMiddleware,
} = require("../validators/property.validator");

const router = Router();

router.get(
  "/",
  normalizePropertyQueryMiddleware,
  validate(propertyQuerySchema, "query"),
  propertiesController.getProperties
);
router.get("/:id", validate(idParamSchema, "params"), propertiesController.getPropertyById);

router.post(
  "/",
  authMiddleware,
  validate(propertyBodySchema),
  propertiesController.createProperty
);

router.put(
  "/:id",
  authMiddleware,
  validate(idParamSchema, "params"),
  validate(propertyBodySchema),
  propertiesController.updateProperty
);

router.delete(
  "/:id",
  authMiddleware,
  validate(idParamSchema, "params"),
  propertiesController.deleteProperty
);

module.exports = router;
