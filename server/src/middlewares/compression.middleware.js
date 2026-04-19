import compression from 'compression';

/**
 * Compression Middleware
 * Uses Brotli if supported, fallback to Gzip
 */
export const compressionMiddleware = compression({
  level: 6, // Balanced performance/compression
  threshold: 1024, // Only compress responses > 1KB
  filter: (req, res) => {
    // Skip compression for metrics and health endpoints
    if (req.originalUrl.includes('/metrics') || req.originalUrl.includes('/health')) {
      return false;
    }
    // Default filter for other requests
    return compression.filter(req, res);
  },
});
