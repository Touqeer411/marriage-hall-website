const express = require("express");
const router = express.Router();
const Booking = require("../Model/booking");

router.post("/bookings", async (req, res) => {
    try {

        const alreadyBooked = await Booking.findOne({
            date: req.body.date
        });

        if (alreadyBooked) {
            return res.status(400).json({
                success: false,
                message: "This date is already booked"
            });
        }

        const booking = new Booking(req.body);

        await booking.save();

        res.status(201).json({
            success: true,
            message: "Booking saved successfully",
            booking
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
});

module.exports = router;