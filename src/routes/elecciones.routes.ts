import { Router } from 'express';
import type { Request, Response } from 'express';
import multer from 'multer';
import { supabase } from '../lib/supabase.js';
import { eleccionesSecurityMiddleware } from '../middleware/eleccionesAuth.js';
import { recordSubmissionAttempt } from '../lib/rateLimiter.js';
import type { EleccionData } from '../types/Elecciones.js';
import type { ApiErrorResponse } from '../types/express.js';

const router = Router();

// Configure multer for file uploads
// Store files in memory temporarily before uploading to Supabase
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size for all files
    files: 2, // Max 2 files (bandera + attachment)
  },
  fileFilter: (req, file, cb) => {
    // Allow images for bandera
    if (file.fieldname === 'bandera') {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('La bandera debe ser una imagen'));
      }
    } else {
      // Allow any file type for attachment
      cb(null, true);
    }
  },
});

/**
 * Generate unique filename
 */
const generateFileName = (originalName: string): string => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = originalName.split('.').pop();
  return `${timestamp}-${randomString}.${extension}`;
};

/**
 * Upload file to Supabase Storage
 */
const uploadFileToSupabase = async (
  bucket: string,
  file: Express.Multer.File,
  folder: string = ''
): Promise<string> => {
  const fileName = generateFileName(file.originalname);
  const filePath = folder ? `${folder}/${fileName}` : fileName;

  // Check if bucket exists
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) {
    throw new Error(`Error al verificar buckets: ${listError.message}`);
  }
  
  const bucketExists = buckets?.some(b => b.name === bucket);
  if (!bucketExists) {
    throw new Error(`El bucket '${bucket}' no existe. Por favor créalo en Supabase Dashboard → Storage. El bucket debe llamarse 'elecciones'.`);
  }

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (error) {
    console.error(`Supabase storage error for bucket '${bucket}':`, error);
    throw new Error(`Error al subir el archivo al bucket '${bucket}': ${error.message}. Verifica que el bucket existe y las políticas de almacenamiento están configuradas.`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return urlData.publicUrl;
};

/**
 * @openapi
 * /api/elecciones:
 *   post:
 *     tags: [Elecciones]
 *     summary: Submit election form
 *     description: Submit election candidate information with flag image and optional attachment
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - mcName
 *               - nombrePartido
 *               - bandera
 *             properties:
 *               mcName:
 *                 type: string
 *                 description: Minecraft username
 *               nombrePartido:
 *                 type: string
 *                 description: Party name
 *               bandera:
 *                 type: string
 *                 format: binary
 *                 description: Flag image file
 *               comentarios:
 *                 type: string
 *                 description: Additional comments
 *               attachment:
 *                 type: string
 *                 format: binary
 *                 description: Additional attachment (max 5MB)
 *     responses:
 *       201:
 *         description: Election submission created successfully
 *       400:
 *         description: Bad request - validation error
 *       500:
 *         description: Server error
 */
router.post(
  '/',
  upload.fields([
    { name: 'bandera', maxCount: 1 },
    { name: 'attachment', maxCount: 1 },
  ]),
  // Error handler for multer errors
  (err: any, req: Request, res: Response, next: any): void => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        res.status(400).json({
          error: 'El archivo es demasiado grande. El tamaño máximo es 5MB para cada archivo.',
        });
        return;
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        res.status(400).json({
          error: 'Demasiados archivos. Máximo 2 archivos permitidos (bandera + adjunto).',
        });
        return;
      }
      res.status(400).json({
        error: `Error al procesar el archivo: ${err.message}`,
      });
      return;
    }
    if (err) {
      res.status(400).json({
        error: err.message || 'Error al procesar el archivo',
      });
      return;
    }
    next();
  },
  // Security middleware - validates whitelist and rate limits
  eleccionesSecurityMiddleware,
  async (req: Request & { clientIp?: string; deviceFingerprint?: string; userAgent?: string }, res: Response<{ success: boolean; message: string; data?: any } | ApiErrorResponse>) => {
    try {
      const { mcName, nombrePartido, comentarios } = req.body;
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };

      // Validate required fields
      if (!mcName || !nombrePartido) {
        return res.status(400).json({
          error: 'mcName y nombrePartido son requeridos',
        });
      }

      // Validate bandera file
      if (!files.bandera || files.bandera.length === 0) {
        return res.status(400).json({
          error: 'La bandera es requerida',
        });
      }

      const banderaFile = files.bandera?.[0];
      const attachmentFile = files.attachment?.[0];

      // Validate bandera file exists (should already be validated by middleware, but double-check)
      if (!banderaFile) {
        return res.status(400).json({
          error: 'La bandera es requerida',
        });
      }

      // Validate bandera file size (5MB max)
      const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
      if (banderaFile.size > MAX_FILE_SIZE) {
        return res.status(400).json({
          error: `La bandera es demasiado grande. El tamaño máximo es ${MAX_FILE_SIZE / (1024 * 1024)}MB.`,
        });
      }

      // Upload bandera to Supabase Storage (in elecciones bucket, banderas folder)
      let banderaUrl: string;
      try {
        banderaUrl = await uploadFileToSupabase('elecciones', banderaFile, 'banderas');
      } catch (error) {
        console.error('Error uploading bandera:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return res.status(500).json({
          error: `Error al subir la bandera: ${errorMessage}`,
        });
      }

      // Upload attachment if provided (in elecciones bucket, attachments folder)
      let attachmentUrl: string | undefined;
      if (attachmentFile) {
        // Validate attachment size (5MB max)
        if (attachmentFile.size > 5 * 1024 * 1024) {
          return res.status(400).json({
            error: 'El archivo adjunto no puede exceder 5MB',
          });
        }

        try {
          attachmentUrl = await uploadFileToSupabase('elecciones', attachmentFile, 'attachments');
        } catch (error) {
          console.error('Error uploading attachment:', error);
          // Don't fail the whole request if attachment upload fails
          // Just log the error and continue
        }
      }

      // Prepare data for database (include tracking info)
      const eleccionData: EleccionData = {
        mc_name: mcName.trim(),
        nombre_partido: nombrePartido.trim(),
        bandera_url: banderaUrl,
        comentarios: comentarios?.trim() || null,
        attachment_url: attachmentUrl || null,
        ip_address: req.clientIp || null,
        device_fingerprint: req.deviceFingerprint || null,
        user_agent: req.userAgent || null,
      };

      // Insert into Supabase database
      const { data, error: dbError } = await supabase
        .from('elecciones')
        .insert(eleccionData)
        .select()
        .single();

      if (dbError) {
        console.error('Error inserting into database:', dbError);
        console.error('Database error details:', JSON.stringify(dbError, null, 2));
        
        // Record failed attempt
        await recordSubmissionAttempt(
          mcName,
          req.clientIp || 'unknown',
          req.deviceFingerprint || '',
          req.userAgent || 'unknown'
        );
        
        return res.status(500).json({
          error: `Error al guardar los datos: ${dbError.message || 'Unknown database error'}`,
        });
      }

      // Record successful submission attempt
      await recordSubmissionAttempt(
        mcName,
        req.clientIp || 'unknown',
        req.deviceFingerprint || '',
        req.userAgent || 'unknown',
        data.id
      );

      return res.status(201).json({
        success: true,
        message: 'Elección enviada exitosamente',
        data: {
          id: data.id,
          mcName: data.mc_name,
          nombrePartido: data.nombre_partido,
          banderaUrl: data.bandera_url,
          comentarios: data.comentarios,
          attachmentUrl: data.attachment_url,
          createdAt: data.created_at,
        },
      });
    } catch (error) {
      console.error('Error in elecciones route:', error);
      if (error instanceof Error) {
        console.error('Error stack:', error.stack);
      }
      return res.status(500).json({
        error: error instanceof Error ? error.message : 'Error interno del servidor',
      });
    }
  }
);

export default router;
