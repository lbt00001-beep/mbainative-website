import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import getConfig from 'next/config';

// Get runtime config or fallback to hardcoded values
const { serverRuntimeConfig } = getConfig() || {};

const EMAIL_CONFIG = {
    host: serverRuntimeConfig?.EMAIL_HOST || process.env.EMAIL_HOST || 'smtp.hostinger.com',
    port: parseInt(serverRuntimeConfig?.EMAIL_PORT || process.env.EMAIL_PORT || '465'),
    user: serverRuntimeConfig?.EMAIL_USER || process.env.EMAIL_USER || 'info@mbainative.com',
    pass: serverRuntimeConfig?.EMAIL_PASS || process.env.EMAIL_PASS || 'sUJxYH4LBTLC$',
    to: serverRuntimeConfig?.EMAIL_TO || process.env.EMAIL_TO || 'info@mbainative.com'
};

export async function POST(request: NextRequest) {
    try {
        const { name, email, message } = await request.json();

        // Validate input
        if (!name || !email || !message) {
            return NextResponse.json(
                { error: 'Todos los campos son obligatorios' },
                { status: 400 }
            );
        }

        // Create transporter with Hostinger SMTP (SSL)
        const transporter = nodemailer.createTransport({
            host: EMAIL_CONFIG.host,
            port: EMAIL_CONFIG.port,
            secure: true, // SSL for port 465
            auth: {
                user: EMAIL_CONFIG.user,
                pass: EMAIL_CONFIG.pass,
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        // Verify connection first
        try {
            await transporter.verify();
        } catch (verifyError) {
            console.error('SMTP connection failed:', verifyError);
            return NextResponse.json(
                { error: 'No se pudo conectar al servidor de email. Inténtalo más tarde.' },
                { status: 500 }
            );
        }

        // Email to site owner
        await transporter.sendMail({
            from: `"MBAI Native Web" <${EMAIL_CONFIG.user}>`,
            to: EMAIL_CONFIG.to,
            replyTo: email,
            subject: `Nuevo mensaje de contacto: ${name}`,
            html: `
                <h2>Nuevo mensaje desde la web MBAI Native</h2>
                <p><strong>Nombre:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Mensaje:</strong></p>
                <p>${message.replace(/\n/g, '<br>')}</p>
                <hr>
                <p style="color: #888; font-size: 12px;">
                    Este mensaje fue enviado desde el formulario de contacto de mbainative.com
                </p>
            `,
        });

        // Auto-reply to user
        await transporter.sendMail({
            from: `"MBAI Native" <${EMAIL_CONFIG.user}>`,
            to: email,
            subject: 'Hemos recibido tu mensaje - MBAI Native',
            html: `
                <h2>¡Gracias por contactarnos, ${name}!</h2>
                <p>Hemos recibido tu mensaje y te responderemos lo antes posible.</p>
                <p><strong>Tu mensaje:</strong></p>
                <blockquote style="border-left: 3px solid #3b82f6; padding-left: 15px; color: #555;">
                    ${message.replace(/\n/g, '<br>')}
                </blockquote>
                <hr>
                <p style="color: #888; font-size: 12px;">
                    MBAI Native - La doctrina de la empresa AI-Nativa<br>
                    <a href="https://mbainative.com">mbainative.com</a>
                </p>
            `,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Email error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        return NextResponse.json(
            { error: `Error al enviar: ${errorMessage}` },
            { status: 500 }
        );
    }
}
