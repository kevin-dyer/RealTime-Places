const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');
const sendgridConfig = require('./sendgridConfig')
const SENDGRID_API_KEY = sendgridConfig.SENDGRID_API_KEY

const APP_NAME = 'Footprint';
const cors = require('cors')({origin: true});

admin.initializeApp();
sgMail.setApiKey(SENDGRID_API_KEY);


function welcomeUserEmail(user) {
	console.log("welcomeUserEmail user.email: ", user.email)
	const msg = {
	  to: user.email,
	  from: 'support@footprintlive.org',
	  subject: 'Welcome to Footprint!',
	  text: `Welcome to Footprint!
	  	Now you can start sharing your footprints... your adventures and experiences around the world!
	  	And you can follow in real time the footprints of other great people like you and you will never miss a cool opportunity!
	  	Footprint needs you to make a difference in the way of travelling and exploring! Let's make it real, let's make it REAL TIME with FOOTPRINT!

	  	Miles of thanks,
	  	Team Footprint
	  `,
	  html: `<h2 style="font-size: 16px;">Welcome to Footprint!</h2>
      <p>Now you can start sharing your footprints... your adventures and experiences around the world!</p>
      <p>And you can follow in real time the footprints of other great people like you and you will never miss a cool opportunity! </p>
    	<p>Footprint needs you to make a difference in the way of travelling and exploring! Let's make it real, let's make it REAL TIME with FOOTPRINT! </p>
    	<br/>
    	<div>Miles of thanks,</div>
    	<div>Team Footprint</div>
    `,
	};

	sgMail.send(msg);
}

function notifyAdminUserCreated(user) {
	console.log("notifyAdminUserCreated user.email: ", user.email)
	const msg = {
		to: sendgridConfig.adminEmails,
		from: 'support@footprintlive.org',
		subject: 'New User!',
		text: `User ${user.email} Signed up for Footprint!`
	}

	sgMail.send(msg);
}

function sendFlagConfirmation(userEmail) {
	console.log("sendFlagConfirmation userEmail: ", userEmail)
	const msg = {
	  to: userEmail,
	  from: 'support@footprintlive.org',
	  subject: 'Inappropriate content flag received',
	  text: `Thank you for helping us keep Footprint safe by flagging inappropriate content. We will review the flagged media shortly.

	  	Team Footprint
	  `,
	  html: `<h2 style="font-size: 16px;">Inappropriate content flag received</h2>
      <p>Thank you for helping us keep Footprint safe by flagging inappropriate content. We will review the flagged media shortly.</p>
    	<br/>
    	<div>Team Footprint</div>
    `,
	};

	sgMail.send(msg);
}

function notifyAdminFlag(userEmail, checkinId, inappropriateCount) {
	console.log("notifyAdminFlag userEmail: ", userEmail, ", checkinId: ", checkinId, ", inappropriateCount: ", inappropriateCount)
	const msg = {
		to: sendgridConfig.adminEmails,
		from: 'support@footprintlive.org',
	  subject: 'Inappropriate content was flag',
	  text: `
	  	Checkin marked as Inappropriate: ${checkinId}
	  	This checkin has been flagged ${inappropriateCount} time${inappropriateCount === 1 ? '' : 's'}.
	  	User who flagged content: ${userEmail}`
	}

	sgMail.send(msg);
}

exports.sendWelcomeEmail = functions.auth.user().onCreate((user) => {
	console.log("sendWelcomEmail started, user.email: ", user.email)

	welcomeUserEmail(user)
	notifyAdminUserCreated(user)

  return null
});



//For testing
exports.inappropriateContentFlag = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    
    console.log("inappropriateContentFlag started, userEmail: ", req.query.userEmail)
    // get dest email by query string
    const query = req.query
  	const userEmail = query.userEmail
  	const checkinId = query.checkinId
  	const inappropriateCount = query.inappropriateCount

  	sendFlagConfirmation(userEmail)
  	notifyAdminFlag(userEmail, checkinId, inappropriateCount)
  	
		return res.send('Inappropriate content review request sent');
  });    
});
