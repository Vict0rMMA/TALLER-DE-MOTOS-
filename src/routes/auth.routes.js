const { Router } = require("express");

const authController = require("../controllers/auth.controller");
const validate = require("../middlewares/validate.middleware");
const { loginSchema } = require("../validators/auth.validator");

const router = Router();

router.post("/login", validate(loginSchema), authController.login);

module.exports = router;
