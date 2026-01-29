const nodemailer = require('nodemailer');

/**
 * Envoie un email avec le lien de réinitialisation du mot de passe.
 * Utilise SMTP si configuré (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS),
 * sinon en développement affiche le lien dans la console.
 * @param {string} to - Email du destinataire
 * @param {string} resetUrl - URL complète du lien de réinitialisation
 * @param {string} [userName] - Nom de l'utilisateur (optionnel)
 * @returns {Promise<void>}
 */
async function sendPasswordResetEmail(to, resetUrl, userName = '') {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER ? {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    } : undefined
  });

  const subject = 'DailyFix - Réinitialisation de votre mot de passe';
  const html = `
    <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
      <h2>Réinitialisation du mot de passe</h2>
      <p>Bonjour${userName ? ` ${userName}` : ''},</p>
      <p>Vous avez demandé la réinitialisation de votre mot de passe DailyFix.</p>
      <p>Cliquez sur le lien ci-dessous pour définir un nouveau mot de passe (lien valide 1 heure) :</p>
      <p><a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px;">Réinitialiser mon mot de passe</a></p>
      <p>Ou copiez ce lien dans votre navigateur :</p>
      <p style="word-break: break-all; color: #666;">${resetUrl}</p>
      <p>Si vous n'avez pas fait cette demande, ignorez cet email.</p>
      <p>— L'équipe DailyFix</p>
    </div>
  `;
  const text = `Réinitialisation du mot de passe DailyFix.\n\nCliquez sur ce lien (valide 1 heure) : ${resetUrl}\n\nSi vous n'avez pas fait cette demande, ignorez cet email.`;

  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      text,
      html
    });
  } else {
    // Développement : afficher le lien dans la console
    console.log('📧 [DEV] Password reset email (SMTP not configured):');
    console.log('   To:', to);
    console.log('   Reset URL:', resetUrl);
  }
}

module.exports = { sendPasswordResetEmail };
