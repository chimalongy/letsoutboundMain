
const nodemailer = require('nodemailer')
const { regCodeEmailContent, outboundEmailNotFoundContent, outboundEmailDataNotFound, TaskCompletionEmail, UpdatePasswordCodeContent, passwordUpdateConfirmation } = require('./emailContents')


const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "me.sparkycash@gmail.com",
        pass: "edcuphwvfujhytjw"
    }
})


async function sendSingle(sendingEmail, sendingFrom, emailPassword, emailSignature, senderName, emailSubject, emailBody, reciever) {
    let returnvalue

    let newBody = emailBody + "\n\n" + emailSignature
    if (sendingEmail == sendingFrom) {
        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: sendingFrom,
                pass: emailPassword
            }
        });

        let mailOptions = {
            from: `${senderName} <${sendingFrom}>`,
            to: reciever,
            subject: emailSubject,
            text: newBody
        };

        /// returnvalue=  await transporter.sendMail(mailOptions);
        try {
            const info = await transporter.sendMail(mailOptions);
            console.log('Message sent: %s', info.messageId);
            return true; // Email sent successfully
        } catch (error) {
            console.error(error);
            return false; // Error occurred while sending email
        }
    }
    else {
        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: sendingFrom,
                pass: emailPassword
            }
        });

        let mailOptions = {
            from: `${senderName} <${sendingEmail}>`,
            to: reciever,
            subject: emailSubject,
            text: newBody
        };

        // returnvalue=  await transporter.sendMail(mailOptions);
        try {
            const info = await transporter.sendMail(mailOptions);
            console.log('Message sent: %s', info.messageId);
            return true; // Email sent successfully
        } catch (error) {

            return false; // Error occurred while sending email
        }

    }

    console.log(returnvalue.response)
    return returnvalue

}
async function testemail(email, sendas, password) {
    let returnvalue
    if (sendas == email) {
        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: email,
                pass: password
            }
        });

        let mailOptions = {
            from: email,
            to: email,
            subject: 'Let\'s Outbound Test',
            text: 'we just confirmed your email address'
        };

        /// returnvalue=  await transporter.sendMail(mailOptions);
        try {
            const info = await transporter.sendMail(mailOptions);
            console.log('Message sent: %s', info.messageId);
            return true; // Email sent successfully
        } catch (error) {
            console.error(error);
            return false; // Error occurred while sending email
        }
    }
    else {
        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: email,
                pass: password
            }
        });

        let mailOptions = {
            from: `${email} <${sendas}>`,
            to: email,
            subject: 'Let\'s Outbound Test',
            text: 'we just confirmed your email address'
        };

        // returnvalue=  await transporter.sendMail(mailOptions);
        try {
            const info = await transporter.sendMail(mailOptions);
            console.log('Message sent: %s', info.messageId);
            return true; // Email sent successfully
        } catch (error) {

            return false; // Error occurred while sending email
        }

    }

    console.log(returnvalue.response)
    return returnvalue

}

async function contactemail(name, email, message) {
    let mailOptions = {
        from: `${name} <${email}>`,
        to: "me.sparkycash@gmail.com",
        subject: 'New Message from ' + email,
        text: message
    };

    /// returnvalue=  await transporter.sendMail(mailOptions);
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Message sent: %s', info.messageId);
        return true; // Email sent successfully
    } catch (error) {
        console.error(error);
        return false; // Error occurred while sending email
    }
}
const sendRegistrationCode = (receiverName, receiverEmail, code) => {
    return new Promise((resolve, reject) => {
        const emailContent = regCodeEmailContent(receiverName, code);
        const mailOptions = {
            from: '"Chima | Lets Outbound" <info@letsoutbound.com>',
            to: receiverEmail,
            subject: "Welcome to Let's Outbound",
            html: emailContent
        };

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                reject("failed to send");
            } else {
                resolve("email sent");
            }
        });
    });
};

const sendOutboundEmailNotFound = (receiverEmail, outbondName, taskName, senderEmail) => {
    return new Promise((resolve, reject) => {
        const emailContent = outboundEmailNotFoundContent(outbondName, taskName, senderEmail);
        const mailOptions = {
            from: '"Chima | Lets Outbound" <info@letsoutbound.com>',
            to: receiverEmail,
            subject: "Email not Sent!",
            text: emailContent
        };

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                reject("failed to send");
            } else {
                resolve("email sent");
            }
        });
    });
};
const sendOutboundEmailDataNotFound = (receiverEmail, outbondName, taskName) => {
    return new Promise((resolve, reject) => {
        const emailContent = outboundEmailDataNotFound(outbondName, taskName);
        const mailOptions = {
            from: '"Chima | Lets Outbound" <info@letsoutbound.com>',
            to: receiverEmail,
            subject: "Task Stopped -  Email Data not Found",
            html: emailContent
        };

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                reject("failed to send");
            } else {
                resolve("email sent");
            }
        });
    });
};
const sendTaskCompletionEmail = (receiverEmail, sendingEmail, visibleEmail, outbondName, taskName) => {
    return new Promise((resolve, reject) => {
        const emailContent = TaskCompletionEmail(outbondName, taskName, sendingEmail, visibleEmail);
        const mailOptions = {
            from: '"Chima|Lets Outbound" <info@letsoutbound.com>',
            to: receiverEmail,
            subject: "Watchout for Replies",
            text: emailContent
        };

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                reject("failed to send");
            } else {
                resolve("email sent");
            }
        });
    });
};

const sendUpdatePasswordCode = (receiverEmail, code) => {
    return new Promise((resolve, reject) => {
        const emailContent = UpdatePasswordCodeContent(code);
        const mailOptions = {
            from: '"Agnes" <info@cryptoblackmarket.com>',
            to: receiverEmail,
            subject: "Welcome to Crypto Black Market",
            html: emailContent
        };

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log("failed to send");
            } else {
                resolve("email sent");
            }
        });
    });
};

const sendPasswordUpdateConfirmation = (receiverName, receiverEmail) => {
    return new Promise((resolve, reject) => {
        const emailContent = passwordUpdateConfirmation(receiverName);
        const mailOptions = {
            from: '"Agnes" <info@cryptoblackmarket.com>',
            to: receiverEmail,
            subject: "Password Updated",
            html: emailContent
        };

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log("failed to send");
            } else {
                resolve("email sent");
            }
        });
    });
};





module.exports = {
    sendSingle,
    testemail,
    contactemail,
    sendRegistrationCode,
    sendOutboundEmailNotFound,
    sendOutboundEmailDataNotFound,
    sendTaskCompletionEmail,
    sendUpdatePasswordCode,
    sendPasswordUpdateConfirmation
}