import nodemailer from 'nodemailer';
import { checkOrigin, escapeHtml, fingerprint, jsonError, rateLimit, readJson, RequestError, requiredText } from '@/lib/security';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const body = await readJson(request);
    if (body.website) return Response.json({ success: true }, { headers: { 'Cache-Control': 'no-store' } });
    const name = requiredText(body.name, 'Nombre', 120, 2);
    const email = requiredText(body.email, 'Email', 254).toLowerCase();
    const message = requiredText(body.message, 'Mensaje', 5000, 10);
    if (!/^[^\s@<>;,]+@[^\s@<>;,]+\.[^\s@<>;,]+$/.test(email) || /[\r\n]/.test(name)) {
      throw new RequestError('Revisa el nombre y la dirección de email.');
    }
    rateLimit('contact:' + fingerprint(email), 3, 3_600_000);
    rateLimit('contact:global', 20, 3_600_000);
    const { EMAIL_HOST = 'smtp.hostinger.com', EMAIL_USER, EMAIL_PASS, EMAIL_TO } = process.env;
    const port = Number(process.env.EMAIL_PORT || 465);
    if (!EMAIL_USER || !EMAIL_PASS || ![465, 587].includes(port)) throw new RequestError('El formulario no está disponible. Escríbenos a info@mbainative.com.', 503);
    const transporter = nodemailer.createTransport({
      host: EMAIL_HOST, port, secure: port === 465, requireTLS: port === 587,
      auth: { user: EMAIL_USER, pass: EMAIL_PASS },
      tls: { rejectUnauthorized: true, minVersion: 'TLSv1.2' },
      connectionTimeout: 10_000, greetingTimeout: 10_000, socketTimeout: 20_000,
      disableFileAccess: true, disableUrlAccess: true,
    });
    // Only the configured owner receives mail; no reflected content to arbitrary recipients.
    await transporter.sendMail({
      from: { name: 'MBAI Native Web', address: EMAIL_USER }, to: EMAIL_TO || EMAIL_USER, replyTo: email,
      subject: 'Consulta MBAI Native: ' + name,
      text: 'Nombre: ' + name + '\nEmail: ' + email + '\n\n' + message,
      html: '<h2>Consulta desde MBAI Native</h2><p><strong>Nombre:</strong> ' + escapeHtml(name) + '</p><p><strong>Email:</strong> ' + escapeHtml(email) + '</p><p>' + escapeHtml(message).replace(/\n/g, '<br>') + '</p>',
    });
    return Response.json({ success: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return jsonError(error); }
}
