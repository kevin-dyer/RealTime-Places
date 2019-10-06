const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
const cors = require('cors')({origin: true});
admin.initializeApp();

let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'footprint.camera@gmail.com',
        pass: '54pMN5-jJn%4W$bc'
    }
});

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

exports.sendWelcomeEmail = functions.auth.user().onCreate((user) => {
	const mailOptions = {
    from: 'Footprint Support <footprint.camera@gmail.com>', // Something like: Jane Doe <janedoe@gmail.com>
    to: user.email,
    subject: 'Welcome to Footprint!', // email subject
    html: `<h2 style="font-size: 16px;">Welcome to Footprint!</h2>
        <p>
        	<div>Now you can start sharing your footprints...your adventures and experiences around the world!</div>
        	<div>And you can follow in real time the footprints of other great people like you and you will never miss a cool opportunity! </div>
        	<div>Footprint needs you to make a difference in the way of travelling and exploring! Let's make it real, let's make it REAL TIME with FOOTPRINT! </div>
        	<br/>
        	<div>Miles of thanks,</div>
        	<div>Team Footprint</div>
				</p>
        
    ` // email content in HTML
  };

  return transporter.sendMail(mailOptions, (erro, info) => {
    // if (erro){
    //     // return res.send(erro.toString());
    // }
    // return res.send('Sended');
  });
});



//For testing
exports.sendMail = functions.https.onRequest((req, res) => {
    cors(req, res, () => {
      
        // getting dest email by query string
        const dest = req.query.dest;

        const mailOptions = {
            from: 'Your Account Name <yourgmailaccount@gmail.com>', // Something like: Jane Doe <janedoe@gmail.com>
            to: dest,
            subject: 'I\'M A PICKLE!!!', // email subject
            html: `<p style="font-size: 16px;">Pickle Riiiiiiiiiiiiiiiick!!</p>
                <br />
                <img src="https://images.prod.meredith.com/product/fc8754735c8a9b4aebb786278e7265a5/1538025388228/l/rick-and-morty-pickle-rick-sticker" />
            ` // email content in HTML
        };
  
        // returning result
        return transporter.sendMail(mailOptions, (erro, info) => {
            if(erro){
                return res.send(erro.toString());
            }
            return res.send('Sended');
        });
    });    
});
