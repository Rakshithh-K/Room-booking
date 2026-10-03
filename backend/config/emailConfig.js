module.exports = {
  getBrevoApiKey: () => process.env.BREVO_API_KEY || '',
  getFromEmail: () => process.env.BREVO_FROM_EMAIL || 'reservations@shreelodge.com',
  getFromName: () => process.env.BREVO_FROM_NAME || process.env.BUSINESS_NAME || 'Shree Lodge Hotel',
  getBusinessName: () => process.env.BUSINESS_NAME || process.env.BREVO_FROM_NAME || 'Shree Lodge Hotel',
  getBusinessPhone: () => process.env.BUSINESS_PHONE || '+91 98765 43210',
  getBusinessEmail: () => process.env.BUSINESS_EMAIL || process.env.BREVO_FROM_EMAIL || 'support@shreelodge.com',
  getBusinessAddress: () => process.env.BUSINESS_ADDRESS || 'MG Road, Bengaluru, Karnataka 560001, India',
};
