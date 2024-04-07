const express = require("express");
const router = express.Router();
const middleware = require("../middleware/index.js");
const User = require("../models/user.js");
const Donation = require("../models/donation.js");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
	service: 'gmail',
	host: 'smtp.gmail.com',
	port: 587,
	secure: false,
	auth: {
		user:'vidhanprajapati27@gmail.com',
		pass:'fvyu vbqg uuxu xyum' 
	},
})

const { Vonage } = require('@vonage/server-sdk')

const vonage = new Vonage({
  apiKey: "64520c27",
  apiSecret: "C88nZWO1xe6Gyat2"
})

router.get("/agent/dashboard", middleware.ensureAgentLoggedIn, async (req,res) => {
	const agentId = req.user._id;
	const numDonors = await User.countDocuments({ role: "donor" });
	const TotalDonations = await Donation.countDocuments({ status:['pending','accepted','collected'] });
	const EWasteDonations = await Donation.countDocuments({  wasteType:"ewaste" });
	const FoodDonations = await Donation.countDocuments({  wasteType: "foodwaste" });
	const ClothsDonations = await Donation.countDocuments({  wasteType: "clothwaste" });
	res.json({
		title: "Dashboard",
		 TotalDonations , numDonors , EWasteDonations, FoodDonations, ClothsDonations
	});
});

router.get("/agent/donations/pending", middleware.ensureAgentLoggedIn, async (req,res) => {
	try
	{
		const pendingCollections = await Donation.find({  status:[ "pending"] }).populate("donor");
		res.json({ title: "Pending Collections", pendingCollections });
	}
	catch(err)
	{
		console.log(err);
		res.status(500).json({ message: 'Some error occurred on the server.' });
	}
});
router.get("/agent/donations/accepted", middleware.ensureAgentLoggedIn, async (req,res) => {
	try
	{
		const acceptedCollections = await Donation.find({  status:[ "accepted"] }).populate("donor");
		res.json({ title: "Accepted Collections", acceptedCollections });
	}
	catch(err)
	{
		console.log(err);
		res.status(500).json({ message: 'Some error occurred on the server.' });
	}
});
router.get("/agent/donations/rejected", middleware.ensureAgentLoggedIn, async (req,res) => {
	try
	{
		const rejectedCollections = await Donation.find({  status:[ "rejected"] }).populate("donor");
		res.json({ title: "Rejected", rejectedCollections });
	}
	catch(err)
	{
		console.log(err);
		res.status(500).json({ message: 'Some error occurred on the server.' });
	}
});

router.get("/agent/donations/previous", middleware.ensureAgentLoggedIn, async (req,res) => {
	try
	{
		const previousCollections = await Donation.find({ status: "collected" }).populate("donor");
		res.json({ title: "Previous Collections", previousCollections });
	}
	catch(err)
	{
		console.log(err);
		res.status(500).json({ message: 'Some error occurred on the server.' });
	}
});

router.get("/agent/donations/view/:donationId", middleware.ensureAgentLoggedIn, async (req,res) => {
	try
	{
		const donationId = req.params.donationId;
		const donation = await Donation.findById(donationId).populate("donor");
		res.json({ title: "Collection details", donation });
	}
	catch(err)
	{
		console.log(err);
		res.status(500).json({ message: 'Some error occurred on the server.' });
	}
});

router.get("/agent/donations/collect/:donationId", middleware.ensureAgentLoggedIn, async (req,res) => {
	try
	{
		const collectionId = req.params.donationId;
		await Donation.findByIdAndUpdate(collectionId, { status: "collected", collectionTime: Date.now() });
		res.json({ message: "Donation collected successfully" });
	}
	catch(err)
	{
		console.log(err);
		res.status(500).json({ message: 'Some error occurred on the server.' });
	}
});

router.get("/agent/donation/accept/:donationId", middleware.ensureAgentLoggedIn, async (req,res) => {
	try
	{
		const donationId = req.params.donationId;
		await Donation.findByIdAndUpdate(donationId, { status: "accepted" });
		const donation = await Donation.findById(donationId).populate("donor");
		req.flash("success", "Donation accepted successfully");
		const mailOptions = {
			from:{
				name: 'Donation Management System',
				address: 'vidhanprajapati27@gmail.com'
			},
			to: donation.donor.email,
			subject: 'Donation Status',
			text:"Your donation has been accepted by the agent. Please wait for the agent to collect the donation.",
		}
		await transporter.sendMail(mailOptions);

		const from = "EcoEats"
		const to = donation.phone
		console.log(to)
		const text =` Your donation ${donation.quantity} has been accepted by the agent. Please wait for the agent to collect the donation.`
		async function sendSMS() {
			await vonage.sms.send({to, from, text})
				.then(resp => { console.log('Message sent successfully'); console.log(resp); })
				.catch(err => { console.log('There was an error sending the messages.'); console.error(err); });
		}
		for (let i = 0; i < 2; i++){
			sendSMS();
		}
		res.json({message:'Accepted'})

		
	}
	catch(err)
	{
		console.log(err);
		req.flash("error", "Some error occurred on the server.")
		res.redirect("back");
	}
});

router.get("/agent/profile", middleware.ensureAgentLoggedIn, async (req,res) => {
	try
	{
		const agentProfile = await User.findById(req.user._id);
		res.json({ title: "My Profile", agentProfile });
	}
	catch(err)
	{
		console.log(err);
		res.status(500).json({ message: 'Some error occurred on the server.' });
	}
});
router.get("/agent/donation/reject/:donationId", middleware.ensureAgentLoggedIn, async (req,res) => {
	try
	{
		const donationId = req.params.donationId;
		await Donation.findByIdAndUpdate(donationId, { status: "rejected" });
		const donation = await Donation.findById(donationId).populate("donor");
		req.flash("success", "Donation rejected successfully");
		const mailOptions = {
			from:{
				name: 'Donation Management System',
				address: 'vidhanprajapati27@gmail.com'
			},
			to: donation.donor.email,
			subject: 'Donation Status',
			text:"Your donation has been Rejected by the agent. Due to some reasons.",
		}
		await transporter.sendMail(mailOptions);

		const from = "EcoEats"
		const to = donation.phone
		console.log(to)
		const text =` Your donation ${donation.quantity} has been rejected by the agent. Due to some reasons.`
		async function sendSMS() {
			await vonage.sms.send({to, from, text})
				.then(resp => { console.log('Message sent successfully'); console.log(resp); })
				.catch(err => { console.log('There was an error sending the messages.'); console.error(err); });
		}
		for (let i = 0; i < 2; i++){
			sendSMS();
		}
		res.json({message:'Rejected'})

		

	}
	catch(err)
	{
		console.log(err);
		req.flash("error", "Some error occurred on the server.")
		res.redirect("back");
	}
});

router.put("/agent/profile", middleware.ensureAgentLoggedIn, async (req,res) => {
	try
	{
		const id = req.user._id;
		const updateObj = req.body.agent;	// updateObj: {firstName, lastName, gender, address, phone}
		await User.findByIdAndUpdate(id, updateObj);
		res.json({ message: "Profile updated successfully" });
	}
	catch(err)
	{
		console.log(err);
		res.status(500).json({ message: 'Some error occurred on the server.' });
	}
});

module.exports = router;
