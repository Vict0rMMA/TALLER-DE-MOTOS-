const propertiesService = require("../services/properties.service");

async function getProperties(req, res, next) {
  try {
    const result = await propertiesService.listProperties(req.query);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

async function getPropertyById(req, res, next) {
  try {
    const property = await propertiesService.getPropertyById(req.params.id);
    return res.status(200).json(property);
  } catch (error) {
    return next(error);
  }
}

async function createProperty(req, res, next) {
  try {
    const property = await propertiesService.createProperty(req.body);
    return res.status(201).json(property);
  } catch (error) {
    return next(error);
  }
}

async function updateProperty(req, res, next) {
  try {
    const property = await propertiesService.updateProperty(req.params.id, req.body);
    return res.status(200).json(property);
  } catch (error) {
    return next(error);
  }
}

async function deleteProperty(req, res, next) {
  try {
    await propertiesService.deleteProperty(req.params.id);
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
};
