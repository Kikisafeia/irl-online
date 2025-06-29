import DOMPurify from 'dompurify';

// Sanitize input using DOMPurify to prevent XSS.
// This is a robust client-side sanitization measure.
// Server-side validation remains crucial.
export const sanitizeInput = (str: string): string => {
  return DOMPurify.sanitize(str);
};
