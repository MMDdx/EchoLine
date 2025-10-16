const nodeMailer = require("nodemailer")
const ejs = require("ejs");
const htmlToText = require("html-to-text");

class Email {
    constructor(user, url) {
        this.user = user.email;
        this.firstName = user.firstName;
        this.url = url;
        this.from = process.env.EMAIL_FROM;
        this.to = user.email;
    }

    newTransport(){
        if (process.env.NODE_ENV === "development") {
            return nodeMailer.createTransport({
                host: process.env.EMAIL_HOST,
                port: process.env.EMAIL_PORT,
                secure: true,
                auth: {
                    user: process.env.EMAIL_USERNAME,
                    pass: process.env.EMAIL_MAILTRAP_PASSWORD
                },
                tls: {
                    rejectUnauthorized: false,
                    minVersion: 'TLSv1.2'
                },
                ignoreTLS: false,
                requireTLS: true,
            });
        }
        else if (process.env.NODE_ENV === "production") {
            return nodeMailer.createTransport({
                host: 'smtp.mail.yahoo.com',
                port: 465, // Yahoo prefers SSL
                secure: true, // Use SSL for port 465
                auth: {
                    user: process.env.YAHOO_EMAIL,
                    pass: process.env.YAHOO_APP_PASSWORD
                },
                tls: { minVersion: 'TLSv1.2' }, // Ensure modern TLS
                logger: true, // Debug logs
                debug: true
            });
            // return new MailerSend({ apiKey: process.env.MAILERSEND_API_KEY })

        }

    }

    async send(template, subject){
        const html = await ejs.renderFile(`${__dirname}/../views/email/${template}.ejs`, {
            name: this.firstName,
            url: this.url,
            appName: process.env.APP_NAME || 'ChatApp',
            subject
        });

            const mailOptions = {
                from: this.from,
                to: this.to,
                subject,
                html,
                text: htmlToText.htmlToText(html)
            };

            return await this.newTransport().sendMail(mailOptions);

    }

    async sendWelcome(){
        return await this.send("welcome", 'Welcome to the our Family, But first you need to verify your Email!');
    }

    async sendSubscribeExpired(){
        return await this.send("subExpired", 'Your Subscription has expired!');
    }

}

module.exports = Email;