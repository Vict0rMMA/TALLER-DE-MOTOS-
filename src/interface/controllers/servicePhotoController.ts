import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import prisma from '../../infrastructure/prisma/client';
import { uploadServicePhoto, deleteServicePhoto } from '../../infrastructure/storage/supabaseStorage';
import { DomainError } from '../../domain/errors/DomainError';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Solo se permiten imágenes'));
  },
});

export const uploadMiddleware = upload.single('photo');

export const addPhoto = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const serviceId = String(req.params.id);
    const service = await prisma.service.findFirst({ where: { id: serviceId, workshopId: req.workshopId! } });
    if (!service) return next(new DomainError('Servicio no encontrado', 404));

    if (!req.file) return next(new DomainError('No se recibió ningún archivo', 400));
    if (service.photos.length >= 10) return next(new DomainError('Máximo 10 fotos por servicio', 400));

    const url = await uploadServicePhoto(
      req.workshopId!,
      serviceId,
      req.file.buffer,
      req.file.mimetype,
      req.file.originalname,
    );

    const updated = await prisma.service.update({
      where: { id: serviceId },
      data: { photos: { push: url } },
      select: { photos: true },
    });

    res.status(201).json({ photos: updated.photos });
  } catch (e) { next(e); }
};

export const removePhoto = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const serviceId = String(req.params.id);
    const { url } = req.body as { url?: string };
    if (!url) return next(new DomainError('Indica la URL de la foto', 400));

    const service = await prisma.service.findFirst({ where: { id: serviceId, workshopId: req.workshopId! } });
    if (!service) return next(new DomainError('Servicio no encontrado', 404));

    await deleteServicePhoto(url).catch(() => {});

    const updated = await prisma.service.update({
      where: { id: serviceId },
      data: { photos: service.photos.filter((p) => p !== url) },
      select: { photos: true },
    });

    res.json({ photos: updated.photos });
  } catch (e) { next(e); }
};
