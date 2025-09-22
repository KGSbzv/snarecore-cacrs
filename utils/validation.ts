/**
 * Validates if a string is a plausible video URL.
 * It primarily checks if the URL is syntactically correct by using the
 * browser's built-in URL parser, which is more robust than a regex.
 *
 * @param url The URL string to validate.
 * @returns An error message string if invalid, otherwise null.
 */
export const validateVideoUrl = (url: string): string | null => {
  // Don't show an error for an empty field; the button will be disabled.
  if (!url || url.trim() === '') {
    return null;
  }

  try {
    const parsedUrl = new URL(url);
    
    // A simple check to ensure it has a protocol (http/https) and a domain.
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return 'URL must start with http:// or https://';
    }
    
    // Ensure the hostname looks like a valid domain.
    if (!parsedUrl.hostname || !parsedUrl.hostname.includes('.')) {
        return 'Please enter a valid URL with a proper domain name.';
    }

  } catch (error) {
    // This catches malformed URLs that the constructor can't parse.
    return 'Invalid URL format. Please enter a complete URL.';
  }

  // If all checks pass, the URL is considered valid for submission.
  return null;
};