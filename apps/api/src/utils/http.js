export function validationError(res, error) {
  return res.status(422).json({
    code: 'VALIDATION_ERROR',
    message: 'Data yang dikirim belum valid',
    errors: error.flatten()
  });
}

export function apiError(res, status, code, message) {
  return res.status(status).json({ code, message });
}

export function sanitizeText(value) {
  if (typeof value !== 'string') return value;
  return value.trim().replace(/[<>]/g, '');
}
