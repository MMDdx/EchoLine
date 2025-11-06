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
        // else if (process.env.NODE_ENV === "production") {
        //     return nodeMailer.createTransport({
        //         host: "smtp.gmail.com",
        //         port: 587,
        //         secure: true, // SSL
        //         auth: {
        //             user: process.env.EMAIL_FROM,
        //             pass: process.env.APP_PASSWORD, // app password
        //         },
        //         tls: {
        //             rejectUnauthorized: false,
        //         },
        //     });
        //
        //
        // }

    }

    async send_production (html, subject) {
        const {MailerooClient, EmailAddress, Attachment} = await import('maileroo-sdk');

        const client = new MailerooClient(process.env.MAILEROO_API_KEY);

        const referenceId = await client.sendBasicEmail({
            from: new EmailAddress(process.env.MAILEROO_SENDER_EMAIL, process.env.APP_NAME),
            to: [new EmailAddress(this.to, this.firstName)],
            subject: subject,
            html: html,
            plain: htmlToText.htmlToText(html)
        });


        };


    async send(template, subject){
        const transporter = this.newTransport();

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

        if (process.env.NODE_ENV === "production") {
            return await this.send_production(html, subject);
        }
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