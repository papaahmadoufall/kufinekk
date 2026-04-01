export const ERROR_CODES = {
  // Auth
  UNAUTHORIZED: 'unauthorized',
  FORBIDDEN: 'forbidden',
  OTP_INVALID: 'otp_invalid',
  OTP_EXPIRED: 'otp_expired',

  // Ressources
  NOT_FOUND: 'not_found',
  CONFLICT: 'conflict',

  // Validation
  VALIDATION_ERROR: 'validation_error',

  // Métier
  AGENT_ALREADY_POINTED: 'agent_already_pointed',
  CONTRAT_INACTIF: 'contrat_inactif',
  CONTRAT_EXPIRE: 'contrat_expire',
  POINTAGE_DEJA_CLOS: 'pointage_deja_clos',
  CYCLE_DEJA_VALIDE: 'cycle_deja_valide',

  // Infra
  INTERNAL_ERROR: 'internal_error',
  WAVE_ERROR: 'wave_error',
  SMS_ERROR: 'sms_error',
} as const

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES]
