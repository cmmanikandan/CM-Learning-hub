import { API_BASE } from '../config/api';

let cachedCloudName: string | null = null;
let cachedUploadPreset: string | null = null;

const fetchCloudinaryConfig = async (): Promise<{ cloudName: string; uploadPreset: string }> => {
  if (cachedCloudName && cachedUploadPreset) {
    return { cloudName: cachedCloudName, uploadPreset: cachedUploadPreset };
  }

  const envCloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME?.trim();
  const envUploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET?.trim();

  if (envCloudName && envUploadPreset) {
    cachedCloudName = envCloudName;
    cachedUploadPreset = envUploadPreset;
    return { cloudName: envCloudName, uploadPreset: envUploadPreset };
  }

  // Fallback: fetch dynamically from backend config endpoint
  try {
    const response = await fetch(`${API_BASE}/api/config/cloudinary`);
    if (response.ok) {
      const data = await response.json();
      if (data.cloud_name && data.upload_preset) {
        cachedCloudName = data.cloud_name.trim();
        cachedUploadPreset = data.upload_preset.trim();
        return { cloudName: cachedCloudName!, uploadPreset: cachedUploadPreset! };
      }
    }
  } catch (error) {
    console.error('Failed to fetch Cloudinary config from backend:', error);
  }

  throw new Error('Cloudinary credentials missing in environment variables');
};

export const uploadToCloudinary = (
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    try {
      const { cloudName, uploadPreset } = await fetchCloudinaryConfig();

      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);

      const xhr = new XMLHttpRequest();
      xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/upload`);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress(progress);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response.secure_url);
          } catch (error) {
            reject(new Error('Invalid JSON response from Cloudinary'));
          }
        } else {
          console.error('Cloudinary upload failed:', xhr.responseText);
          reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.statusText}`));
        }
      };

      xhr.onerror = () => {
        reject(new Error('Network error occurred during upload'));
      };

      xhr.send(formData);
    } catch (error) {
      reject(error);
    }
  });
};


export const getCloudinaryDownloadUrl = (url: string): string => {
  if (!url || !url.includes('cloudinary.com')) return url;
  
  // Insert fl_attachment right after upload/
  // Example: .../upload/v12345/... -> .../upload/fl_attachment/v12345/...
  return url.replace('/upload/', '/upload/fl_attachment/');
};
