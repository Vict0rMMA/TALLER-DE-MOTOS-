const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const authRoutes = require("./routes/auth.routes");
const propertyRoutes = require("./routes/properties.routes");
const { notFoundHandler, errorHandler } = require("./middlewares/error.middleware");

const app = express();

const disableCsp = process.env.DISABLE_CSP === "1";

app.use(
  disableCsp
    ? helmet({ contentSecurityPolicy: false })
    : helmet({
        contentSecurityPolicy: {
          directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            "img-src": ["'self'", "data:", "https://picsum.photos", "https://fastly.picsum.photos"],
            "script-src": ["'self'"],
            "connect-src": ["'self'"],
            "style-src": ["'self'", "https://fonts.googleapis.com"],
            "font-src": ["'self'", "https://fonts.gstatic.com"],
          },
        },
      })
);
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

app.get("/api/v1/health", (req, res) => {
  res.json({ ok: true, message: "API de propiedades funcionando", apiVersion: "v1" });
});

const uploadRoutes = require("./routes/upload.routes");

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/upload", uploadRoutes);
app.use("/api/v1/properties", propertyRoutes);

app.use("/uploads", express.static(path.join(__dirname, "..", "public", "uploads")));

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
