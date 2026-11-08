const IMAGE_ENHANCER_URL = (
  import.meta.env.VITE_IMAGE_ENHANCER_URL || 'http://localhost:8000'
).replace(/\/+$/, '');

const MAX_IMAGE_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export function validateImageFile(file) {
  if (!file) {
    throw new Error('Choose an image to continue.');
  }
  if (file.size > MAX_IMAGE_FILE_SIZE) {
    throw new Error('Image files must be 10 MB or smaller.');
  }
  if (file.type && !ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error('Use a JPEG, PNG, or WebP image.');
  }
}

export async function enhanceProductImage(file) {
  validateImageFile(file);

  const formData = new FormData();
  formData.append('file', file);

  let response;
  try {
    response = await fetch(`${IMAGE_ENHANCER_URL}/api/enhance`, {
      method: 'POST',
      body: formData
    });
  } catch {
    throw new Error(
      'Could not reach the image enhancement service. Check that the FastAPI service is running.'
    );
  }

  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(result.detail || 'Image enhancement failed. Please try again.');
  }

  const blob = await response.blob();
  if (!blob.type.startsWith('image/')) {
    throw new Error('The image service returned an invalid response.');
  }

  const originalName = file.name.replace(/\.[^.]+$/, '');
  const extension = blob.type === 'image/png' ? 'png' : blob.type === 'image/webp' ? 'webp' : 'jpg';
  return new File([blob], `${originalName}-enhanced.${extension}`, {
    type: blob.type,
    lastModified: Date.now()
  });
}
