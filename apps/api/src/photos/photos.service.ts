import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

const HARDCODED_USER_ID = 'cm9qaz1jk0000v88c3xjq8r4z';

@Injectable()
export class PhotosService {
  constructor(private prisma: PrismaService) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async findAll() {
    return this.prisma.progressPhoto.findMany({
      where: { userId: HARDCODED_USER_ID },
      orderBy: { createdAt: 'desc' },
    });
  }

  async uploadPhoto(file: Express.Multer.File) {
    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'iron-log/progress',
          transformation: [{ width: 1080, height: 1440, crop: 'limit' }],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result!);
        },
      );
      stream.end(file.buffer);
    });

    const today = new Date().toISOString().split('T')[0];

    return this.prisma.progressPhoto.create({
      data: {
        userId: HARDCODED_USER_ID,
        date: today,
        imageUrl: result.secure_url,
      },
    });
  }

  async deletePhoto(id: string) {
    const photo = await this.prisma.progressPhoto.findUnique({
      where: { id },
    });

    if (!photo) {
      throw new NotFoundException('Photo not found');
    }

    // Extract public_id from URL for Cloudinary deletion
    const urlParts = photo.imageUrl.split('/');
    const publicIdWithExt = urlParts.slice(-2).join('/'); // iron-log/progress/filename
    const publicId = publicIdWithExt.replace(/\.[^.]+$/, ''); // remove extension

    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      console.error('Failed to delete from Cloudinary:', error);
      // Continue with DB deletion even if Cloudinary fails
    }

    await this.prisma.progressPhoto.delete({
      where: { id },
    });
  }
}
