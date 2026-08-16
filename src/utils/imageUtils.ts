import { storage } from '../lib/firebase';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';

/**
 * Utility functions for processing, compressing, and caching teacher and student photos.
 */

export interface CompressionResult {
  dataUrl: string;
  originalSizeKb: number;
  compressedSizeKb: number;
  savingsPercentage: number;
}

/**
 * Center-crops and compresses an avatar image file to a lightweight 1:1 square.
 * Produces ultra-compact images (typically 8-20 KB) for instant cloud synchronization.
 */
export function compressAvatarImage(
  file: File | Blob,
  targetSize = 180,
  quality = 0.75
): Promise<CompressionResult> {
  return new Promise((resolve, reject) => {
    if (file instanceof File && !file.type.startsWith('image/')) {
      reject(new Error('Seçilen dosya geçerli bir resim formatında değil.'));
      return;
    }

    const originalSizeKb = Math.round((file.size / 1024) * 10) / 10;
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = targetSize;
        canvas.height = targetSize;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          const fallbackUrl = event.target?.result as string;
          resolve({
            dataUrl: fallbackUrl,
            originalSizeKb,
            compressedSizeKb: originalSizeKb,
            savingsPercentage: 0,
          });
          return;
        }

        // Enable high-quality image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Calculate 1:1 center crop dimensions
        const minDimension = Math.min(img.width, img.height);
        const sourceX = (img.width - minDimension) / 2;
        const sourceY = (img.height - minDimension) / 2;

        // Draw center-cropped square into target size
        ctx.drawImage(
          img,
          sourceX,
          sourceY,
          minDimension,
          minDimension,
          0,
          0,
          targetSize,
          targetSize
        );

        // Convert to lightweight JPEG
        try {
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          // Estimate base64 byte size
          const head = 'data:image/jpeg;base64,';
          const base64Length = compressedDataUrl.length - head.length;
          const compressedBytes = (base64Length * 3) / 4;
          const compressedSizeKb = Math.round((compressedBytes / 1024) * 10) / 10;
          
          const savingsPercentage = originalSizeKb > 0 
            ? Math.max(0, Math.round(((originalSizeKb - compressedSizeKb) / originalSizeKb) * 100))
            : 0;

          resolve({
            dataUrl: compressedDataUrl,
            originalSizeKb,
            compressedSizeKb,
            savingsPercentage,
          });
        } catch (e) {
          const rawUrl = event.target?.result as string;
          resolve({
            dataUrl: rawUrl,
            originalSizeKb,
            compressedSizeKb: originalSizeKb,
            savingsPercentage: 0,
          });
        }
      };

      img.onerror = (err) => reject(err);
      img.src = event.target?.result as string;
    };

    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads a compressed image to Firebase Storage and returns its download URL.
 * Falls back seamlessly to the dataUrl if Storage is restricted or offline.
 */
export async function uploadProfilePhotoToStorage(
  userId: string,
  compressedDataUrl: string
): Promise<string> {
  try {
    if (!storage) return compressedDataUrl;
    
    // Create reference in profilePhotos/ folder
    const storageRef = ref(storage, `profilePhotos/${userId}_avatar_${Date.now()}.jpg`);
    await uploadString(storageRef, compressedDataUrl, 'data_url');
    const downloadUrl = await getDownloadURL(storageRef);
    return downloadUrl;
  } catch (error) {
    console.warn('Firebase Storage upload notice (using optimized inline cloud sync):', error);
    // Return compressed dataUrl directly which syncs in Firestore instantly
    return compressedDataUrl;
  }
}

export function compressImageFile(
  file: File,
  maxWidth = 300,
  maxHeight = 300,
  quality = 0.82
): Promise<string> {
  return compressAvatarImage(file, Math.min(maxWidth, maxHeight), quality).then((res) => res.dataUrl);
}

export function getStudentAvatarUrl(name: string, surname: string, photoUrl?: string): string {
  if (photoUrl && photoUrl.trim().length > 0) {
    return photoUrl;
  }
  const fullName = `${name} ${surname}`.trim() || 'Öğrenci';
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=6366f1&color=fff&bold=true&size=128`;
}

