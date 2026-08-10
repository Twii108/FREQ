export const getImageUrl = (url) => {
  if (!url) return '';
  // If it is a local server media URL (same host), return as-is
  const backendHost = window.location.hostname;
  if (
    url.startsWith(`http://${backendHost}`) ||
    url.startsWith('http://localhost') ||
    url.startsWith('http://127.0.0.1') ||
    url.startsWith('/')
  ) {
    return url;
  }
  // If it is a remote external URL (Spotify, Apple, iTunes, etc.), wrap it in weserv.nl CORS bypass proxy
  const cleanUrl = url.replace(/^https?:\/\//, '');
  return `https://images.weserv.nl/?url=${cleanUrl}&we=1`;
};
