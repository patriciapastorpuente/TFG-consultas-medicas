const nodemailer = require('nodemailer');

// Configurar el transporte para enviar correos electrónicos
const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
        user: process.env.MI_EMAIL,
        pass: process.env.MI_PASSWD
    }
})

module.exports = transporter;