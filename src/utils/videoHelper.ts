const CLOUD_NAME = 'YOUR_CLOUD_NAME';

export function getVideoUrl(videoUrl: string, isBlurred: boolean): string {
  if (videoUrl.startsWith('http')) return videoUrl;
  const base = `https://res.cloudinary.com/${CLOUD_NAME}/video/upload/`;
  const transformation = isBlurred ? 'e_blur:1500/' : '';
  return `${base}${transformation}${videoUrl}`;
}
