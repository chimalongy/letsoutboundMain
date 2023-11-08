require('dotenv').config()
const express = require("express");
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const bcryt = require("bcryptjs");
const jwt = require('jsonwebtoken');
const userModel = require('./models/userSchema');
const emailModel = require('./models/emailSchema')
const outBoundModel = require('./models/outboundSchema');
const taskModel = require('./models/taskSchema')
const port = process.env.PORT;
const { sendRegistrationCode, sendOutboundEmailNotFound, sendOutboundEmailDataNotFound } = require('./modules/emailSender')
const cron = require('node-cron') 

global.cronJobs = {}
const emailSender = require('./modules/outboundEngine');
const path= require('path')



const app = express(); 
app.use(cors());
app.use(bodyParser.json())

//set up cron jobs

function setupCronJob(taskName, schedule, taskFunction, timeZone) {
    global.cronJobs[taskName] = cron.schedule(schedule, taskFunction, {
        timezone: timeZone // Specify the desired time zone
      });
}



 


 
// send registration code
app.post("/sendregisterationcode", async (req, res) => {
    try {
        const { recieverName, reciverEmail, code } = req.body
        const mailSent = await sendRegistrationCode(recieverName, reciverEmail, code);
        if (mailSent === "email sent") {
            res.status(200).json({ message: mailSent })
        }
    } catch (error) {
        res.status(400).json(error.message)
    }
})

app.post("/finduser", async (req, res) => {
    try {
        const { email } = req.body;
        const user = await userModel.findOne({ email: email })
        if (!user) {
            return res.status(200).json({ message: "not-found" });
        }
        res.status(200).json({ message: "found" })
    }
    catch (error) {
        res.status(400).json(error.message);
    }
})
app.post("/findemail", async (req, res) => {
    try {
        const { ownerAccount, emailAddress } = req.body;
        const emailCheck = await emailModel.findOne({ownerAccount:ownerAccount, emailAddress: emailAddress})
        if (!emailCheck) {
            return res.status(200).json({ message: "not-found" });
        }
        res.status(200).json({ message: "found", data:emailCheck })
    }
    catch (error) {
        res.status(400).json(error.message);
    }
})
app.post("/findsimilaremails", async (req, res) => {
    try {
        const { ownerAccount, emailAddress } = req.body;
        
         
        const emailCheck = await emailModel.find({ownerAccount:ownerAccount, emailAddress: emailAddress })
        if (emailCheck){
            return res.status(200).json({ message:"found", data:emailCheck})
        }
        else{
            return   res.status(200).json({ message:"not-found"})
        }
       
    }
    catch (error) {
        res.status(400).json(error.message);
    }
})


app.post("/updatedaysassigned", async (req, res) => {
    try {
        const { email, days } = req.body
        // Find the document by its email address
        const findEmail = await emailModel.findOne({ emailAddress: email })
        if (!findEmail) {
            return res.status(200).json({ message: "emailnotfound" })
        }

        const pushed = findEmail.daysAssigned.push(days)

        if (!pushed) {
            res.status(200).json({ message: "could not push" })
        }

        findEmail.save();
        res.status(200).json(findEmail);

    } catch (error) {
        res.status(400).json(error.message)
    }
})


app.post("/registeremail", async (req, res) => {
    try {
        const { ownerAccount, emailAddress, password, senderName, signature, dailySendingCapacity, primary, parentEmail } = req.body;

        const user = await userModel.findOne({ email: ownerAccount })

        const hashedpassword = await bcryt.hash(password, 10);
        if (primary == true) {
            console.log("primary true")
            const newEmail = await emailModel.create({ ownerAccount, emailAddress, password, senderName, signature, dailySendingCapacity, primaryEmail: true })
            res.status(200).json({ message: "registrationComplete" })
        }
        else {
            console.log("primary false")
            const newEmail = await emailModel.create({ ownerAccount, emailAddress, password, senderName, signature, dailySendingCapacity, primaryEmail: false, parentEmail: parentEmail })
            res.status(200).json({ message: "registrationComplete" })
        }


    }
    catch (error) {
        // res.status(400).json(error);
        console.log(error)
    }
})
app.post("/registeroutbound", async (req, res) => {
    try {

        const { ownerAccount, outboundName, emailList } = req.body;
        const outbound = await outBoundModel.findOne({ outboundName: outboundName })
        if (outbound) { return res.status(200).json({ message: "already-exist" }) }
        const newOutbound = await outBoundModel.create({ ownerAccount, outboundName, emailList, tasks: 0 })
        res.status(200).json({ message: "registrationComplete" })
    }
    catch (error) {
        res.status(400).json(error.message);
    }
})




app.post("/registertask", async (req, res) => {
    try {

        const { ownerAccount, outboundName, taskName, taskDate, taskTime, taskSendingRate, taskSubject, taskBody, timeZone } = req.body;


        function taskFunction() {

            const thisUserRegisteredEmails = []
            //get all user registed email list
            emailModel.find({ ownerAccount: ownerAccount })
                .then((result) => {
                    // result.forEach((item) => {
                    //     thisUserRegisteredEmails.push(item.emailAddress)
                    // })

                    for (let i=0; i< result.length;i++){
                        thisUserRegisteredEmails.push(result[i].emailAddress)
                    }
                })
                .catch(error => console.log(error))

            //get the Partcular Outbound
            outBoundModel.findOne({ outboundName: outboundName })
                .then((result) => {


                    const emailList = result.emailList

                    emailList.forEach(async element => {

                        try {
                            let senderEmail = element.allocatedEmail;// sending email address
                            let sendingFrom = element.allocatedEmail;// what will be show on the email
                            let senderName = "";
                            let senderSignature = ""
                            let senderPassword = ""
 
                            let mailData = await emailModel.findOne({ emailAddress: senderEmail })
                            if (mailData.primaryEmail == false) {
                                senderEmail = mailData.parentEmail;
                                sendingFrom = mailData.emailAddress
                                senderName = mailData.senderName
                                senderSignature = mailData.signature
                                senderPassword = mailData.password;
                            }
                            else {
                                senderEmail = mailData.emailAddress
                                sendingFrom = mailData.emailAddress
                                senderName = mailData.senderName
                                senderSignature = mailData.signature
                                senderPassword = mailData.password;
                            }

                            newBody = taskBody + "\n\n" + senderSignature

                            // console.log(`
                            //     =================sending details for ${senderEmail} ======================================
                            //     sender email: ${senderEmail}
                            //     sending from: ${sendingFrom}
                            //     senderName: ${senderName}
                            //     senderSignature: ${senderSignature}
                            //     senderPassword:${senderPassword}
                            //     ===========================================================================================                       `)
                            // console.log(thisUserRegisteredEmails)
                            // //check if the email has not been deleted.
                            if (thisUserRegisteredEmails.some(item => item === senderEmail)) {
                                let sent = emailSender.sendOutbound(senderEmail, senderPassword, senderName, taskSubject, newBody, element.emailAllocations, element.nameAllocations, taskSendingRate, taskName, outboundName, sendingFrom)
                                // console.log("this email is registered "+sendingFrom)
                            }
                            else {
                                //send an email to the owner telling him that he deleted the email required to  send a task
                                sendOutboundEmailNotFound(ownerAccount, outboundName, taskName, senderEmail)
                            //    console.log("this email is not registered "+sendingFrom)
                            }
                            //console.log("----------------------------------------------------")

                        }
                        catch (error) {
                             sendOutboundEmailDataNotFound(ownerAccount, outboundName, taskName)
                            // console.log(error)
                        }


                    });





                })
                .catch((error) => {
                    return res.status(400).json(error.message)
                })

        }

         

        const [year, month, day] = taskDate.split('-').map(Number);
        const [hour, minute] = taskTime.split(':').map(Number);
        const scheduledDate = new Date(year, month - 1, day, hour, minute);
        const cronSchedule = `${minute} ${hour} ${day} ${month} *`;

        setupCronJob(taskName, cronSchedule, taskFunction, timeZone)

        //save task
        const newTask = await taskModel.create({ ownerAccount, outboundName, taskName, taskDate, taskTime, taskSendingRate, taskSubject, taskBody, status: "pending" })
        //update taskCount

        outBoundModel.findOne({ outboundName: outboundName })
            .then((result) => {
                if (result) {
                    let taskCount = result.tasks;
                    let newCount = taskCount + 1;


                    return outBoundModel.findOneAndUpdate({ outboundName: result.outboundName }, { $set: { tasks: newCount } });
                } else {
                    // Handle the case where no document was found with the given outboundName
                    console.log('Document not found');
                    return null;
                }
            })
            .then((updatedDocument) => {
                if (updatedDocument) {

                }
            })
            .catch(err => console.log(err));





        res.status(200).json({ message: "registrationComplete" })

    }
    catch (error) {
        res.status(400).json(error.message);
    }
})
app.post("/register", async (req, res) => {
    try {
        const { firstName, lastName, email, password } = req.body;
        const hashedpassword = await bcryt.hash(password, 10);
        const newUser = await userModel.create({ firstName, lastName, email, password: hashedpassword })
        res.status(200).json({ message: "registrationComplete" })
    }
    catch (error) {
        res.status(400).json(error.message);
    }
})
//login
app.post("/login", async (req, res) => {
    const { email, password } = req.body
    const user = await userModel.findOne({ email: email })
    if (!user) {
        return res.status(200).json({ message: "not-registered" })
    }
    const isPasswordValid = await bcryt.compare(password, user.password);
    if (!isPasswordValid) {
        return res.status(200).json({ message: "wrong-password" })
    }
    const token = jwt.sign({ userID: user._id }, process.env.SECRETE_KEY, { expiresIn: "1hr" })
    res.status(200).json({ message: "login-success", token: token, userData: user })
})

app.post("/getuseroutbounds", async (req, res) => {
    try {
        const { ownerAccount } = req.body;
        const userOutbounds = await outBoundModel.find({ ownerAccount: ownerAccount });
        if (!userOutbounds) {
            return res.status(200).json({ message: "no-outbound-registered" })
        }
        return res.status(200).json({ message: "outbounds-found", data: userOutbounds })

    } catch (error) {
        return res.status(400).json(error.message)
    }
})
app.post("/getuseroutboundemails", async (req, res) => {
    try {
        const { ownerAccount } = req.body;
        const userEmails = await emailModel.find({ ownerAccount: ownerAccount });
        if (!userEmails) {
            return res.status(200).json({ message: "no-emails-registered" })
        }
        return res.status(200).json({ message: "emails-found", data: userEmails })

    } catch (error) {
        return res.status(400).json(error.message)
    }
})
app.post("/getusertasks", async (req, res) => {
    try {
        const { ownerAccount } = req.body;
        const userTasks = await taskModel.find({ ownerAccount: ownerAccount });
        if (!userTasks) {
            return res.status(200).json({ message: "no-task-found" })
        }
        return res.status(200).json({ message: "tasks-found", data: userTasks })

    } catch (error) {
        return res.status(400).json(error.message)
    }
})




app.post("/deleteOutbound", async (req, res) => {

    const { outboundName, ownerAccount } = req.body;

    try {
        // Delete documents from outBoundModel
        const outBoundResult = await outBoundModel.deleteMany({ outboundName, ownerAccount });
        console.log(`${outBoundResult.deletedCount} document(s) deleted from outBoundModel.`);
    } catch (err) {
        console.error("Error deleting documents from outBoundModel:", err);
    }


    try {
        const tasks = await taskModel.find({ outboundName: outboundName })

        for (let i = 0; i < tasks.length; i++) {
            let taskName = tasks[i].taskName
            if (global.cronJobs[taskName]) {
                global.cronJobs[taskName].stop();
                console.log(`Cron job for ${taskName} has been stopped.`);
                console.log("current jobs =" + cronJobs)
            } else {
                console.log(`No cron job found for ${taskName}.`);
            }
        }
    }
    catch (error) { console.error("Error findiing documents from taskModel:", err); }

    try {
        // Delete documents from taskModel
        const taskResult = await taskModel.deleteMany({ outboundName });
        console.log(`${taskResult.deletedCount} document(s) deleted from taskModel.`);
    } catch (err) {
        return res.status(200).json(err)
    }

    res.status(200).json({ message: "outbond-deleted" })

})
app.post("/deleteOutboundEmail", async (req, res) => {

    const { outboundName, emailsToDelete } = req.body;
    for (let i = 0; i < emailsToDelete.length; i++) {
        console.log(emailsToDelete[i])
    }


    // Delete documents from outBoundModel
    outbound = await outBoundModel.findOne({ outboundName: outboundName })
    let newMailList=[]
    

    if (outbound) {
        outbound.emailList.forEach(emailEntry => {
           
            let formerEmailList = emailEntry.emailAllocations
            let formerNameList = emailEntry.nameAllocations

            let newEmailList = []; let newNameList = []

            for (let i = 0; i < formerEmailList.length; i++) {
                let exist = false
                for (let j = 0; j < emailsToDelete.length; j++) {
                    if (emailsToDelete[j] === formerEmailList[i]) {
                        exist = true
                    }
                }
                if (exist == false) {
                    newEmailList.push(formerEmailList[i])
                    newNameList.push(formerNameList[i])
                }
            }
            emailEntry.emailAllocations = newEmailList;
            emailEntry.nameAllocations = newNameList;
            
        });
        newMailList=outbound.emailList    
    }
    else {
        return res.status(200).json({ message: "outbound-not-found" })
    }

    try {
        const updatedDoc = await outBoundModel.findOneAndUpdate(
          { outboundName:  outboundName, },
          { $set: { emailList: newMailList } },
          { new: true }
        );
      
        if (updatedDoc) {
            return res.status(200).json({ message: "deleted" })
        } else {
            return res.status(200).json({ message: "could-not-delete"})
        }
      } catch (err) {
        console.error(err);
      }
      



   



})
app.post("/deleteEmail", async (req, res) => {

    const { emailAddress, ownerAccount } = req.body;

    try {
        // Delete documents from outBoundModel
        const emailDeleteResult = await emailModel.deleteMany({ emailAddress, emailAddress });
        if (emailDeleteResult) {
            return res.status(200).json({ message: "email-deleted" })
        }
        else {
            return res.status(200).json({ message: "email-not-deleted" })
        }

    } catch (err) {
        console.error("Error deleting documents from emailModel:", err);
    }






})





























app.use(express.static(path.join(__dirname, "client/build")))
console.log( "__dirnames is: "+__dirname)

app.get("*", (req, res)=>{ 
    res.sendFile(
        path.join(__dirname,"client/build/index.html")
    )
})



mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        app.listen(process.env.PORT, () => {
            console.log("Connected to port " + port + " and Database")
        })
    })
    .catch((error) => {
        console.log("Could not connect to DataBase")
    })

//"Could not connect to DataBase"
