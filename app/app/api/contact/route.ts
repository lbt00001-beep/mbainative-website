import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

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

        // Create transporter with Hostinger SMTP
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST || 'smtp.hostinger.com',
            port: parseInt(process.env.EMAIL_PORT || '587'),
            secure: false, // TLS
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        // Email to site owner
        await transporter.sendMail({
            from: `"MBAI Native Web" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_TO || 'info@mbainative.com',
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
            from: `"MBAI Native" <${process.env.EMAIL_USER}>`,
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
        return NextResponse.json(
            { error: 'Error al enviar el mensaje. Inténtalo de nuevo.' },
            { status: 500 }
        );
    }
}
