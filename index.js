require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const Razorpay = require('razorpay');
const cors = require('cors');
const bodyParser = require('body-parser');

const Booking = require('./models/Booking'); // <-- ADD THIS LINE

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ✅ Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// ✅ Razorpay Setup
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ✅ Create Order API
app.post('/create-order', async (req, res) => {
    try {
        const { amount, currency, receipt } = req.body;

        const options = {
            amount: amount * 100, // amount in paise
            currency: currency || 'INR',
            receipt: receipt || 'receipt_' + Math.random().toString(36).substring(7),
            payment_capture: 1
        };

        const order = await razorpay.orders.create(options);
        res.json(order);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error creating Razorpay order');
    }
});


// ✅ ⬇️ ADD THIS ROUTE BELOW /create-order
app.post('/save-booking', async (req, res) => {
    try {
        const { name, email, event, quantity, totalAmount, paymentId } = req.body;

        const booking = new Booking({
            name,
            email,
            event,
            quantity,
            totalAmount,
            razorpay_payment_id: paymentId
        });

        await booking.save();
        res.status(200).json({ message: 'Booking saved successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to save booking' });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
