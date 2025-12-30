import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import getConfig from 'next/config';

// Get runtime config for environment variables
const { serverRuntimeConfig } = getConfig() || {};

const EMAIL_CONFIG = {
    host: serverRuntimeConfig?.EMAIL_HOST || process.env.EMAIL_HOST,
    port: parseInt(serverRuntimeConfig?.EMAIL_PORT || process.env.EMAIL_PORT || '465'),
    user: serverRuntimeConfig?.EMAIL_USER || process.env.EMAIL_USER,
    pass: serverRuntimeConfig?.EMAIL_PASS || process.env.EMAIL_PASS,
    to: serverRuntimeConfig?.EMAIL_TO || process.env.EMAIL_TO
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

        // Check email configuration
        if (!EMAIL_CONFIG.user || !EMAIL_CONFIG.pass) {
            console.error('Missing email configuration');
            return NextResponse.json(
                { error: 'Configuración de email incompleta. Contacta al administrador.' },
                { status: 500 }
            );
        }

        // Create transporter with Hostinger SMTP (SSL)
        const transporter = nodemailer.createTransport({
            host: EMAIL_CONFIG.host || 'smtp.hostinger.com',
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
            to: EMAIL_CONFIG.to || EMAIL_CONFIG.user,
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
                    MBAI Native - Los principios de la empresa AI-Nativa<br>
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
