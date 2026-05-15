import nodemailer from 'nodemailer';

export const getMailFromAddress = () => process.env.CONTACT_EMAIL || process.env.SMTP_USER;

export const createMailTransport = () => {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = Number(process.env.SMTP_PORT || 465);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!smtpHost || !smtpUser || !smtpPass) {
    throw new Error('La configuración SMTP está incompleta');
  }

  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });
};

export const getSupportMailFromAddress = () => process.env.SUPPORT_EMAIL || process.env.SMTP_SUPPORT_USER;

export const createSupportMailTransport = () => {
  const smtpHost = process.env.SMTP_SUPPORT_HOST || process.env.SMTP_HOST;
  const smtpPort = Number(process.env.SMTP_SUPPORT_PORT || process.env.SMTP_PORT || 465);
  const smtpUser = process.env.SMTP_SUPPORT_USER || process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_SUPPORT_PASS || process.env.SMTP_PASS;

  if (!smtpHost || !smtpUser || !smtpPass) {
    throw new Error('La configuración SMTP de soporte está incompleta');
  }

  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });
};