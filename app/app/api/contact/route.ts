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

        // Check environment variables
        const emailUser = process.env.EMAIL_USER;
        const emailPass = process.env.EMAIL_PASS;
        const emailHost = process.env.EMAIL_HOST || 'smtp.hostinger.com';
        const emailPort = parseInt(process.env.EMAIL_PORT || '465');
        const emailTo = process.env.EMAIL_TO || 'info@mbainative.com';

        if (!emailUser || !emailPass) {
            console.error('Missing email configuration:', {
                hasUser: !!emailUser,
                hasPass: !!emailPass,
                host: emailHost,
                port: emailPort
            });
            return NextResponse.json(
                { error: 'Configuración de email incompleta. Contacta al administrador.' },
                { status: 500 }
            );
        }

        // Create transporter with Hostinger SMTP (SSL)
        const transporter = nodemailer.createTransport({
            host: emailHost,
            port: emailPort,
            secure: emailPort === 465, // true for 465, false for 587
            auth: {
                user: emailUser,
                pass: emailPass,
            },
            tls: {
                rejectUnauthorized: false // Allow self-signed certificates
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
            from: `"MBAI Native Web" <${emailUser}>`,
            to: emailTo,
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
            from: `"MBAI Native" <${emailUser}>`,
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
            { error: `Error al enviar el mensaje: ${errorMessage}` },
            { status: 500 }
        );
    }
}
