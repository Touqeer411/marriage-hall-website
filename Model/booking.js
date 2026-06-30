const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    eventType: {
        type: String,
        required: true
    },
    guests: {
        type: String,
        required: true
    },
    totalAmount: Number,
    advancePaid: Number,
    remainingBalance: Number,
    requirements: String,
    status: {
        type: String,
        default: "Pending"
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("Booking", bookingSchema);