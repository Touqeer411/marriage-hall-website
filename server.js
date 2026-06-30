const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const Booking = require("./Model/booking");
const PDFDocument = require("pdfkit");

require("dotenv").config();
const mongoose = require("mongoose");

const app = express();

console.log(process.env.MONGO_URI);

mongoose.connect(process.env.MONGO_URI)
.then(() => {
    console.log("MongoDB Connected");
})
.catch((err) => {
    console.log(err);
});

app.use(cors());
app.use(express.json());

app.use("/receipts", express.static("receipts"));

let bookings = [];

// Load existing bookings
if (fs.existsSync("bookings.json")) {
    bookings = JSON.parse(
        fs.readFileSync("bookings.json", "utf8")
    );
}

function generateBill(booking) {

    console.log(booking);

    const fs = require("fs");
    const path = require("path");
    const PDFDocument = require("pdfkit");

    const receiptsDir = path.join(__dirname, "receipts");

    // Create receipts folder if it doesn't exist
    if (!fs.existsSync(receiptsDir)) {
        fs.mkdirSync(receiptsDir);
    }

    const billPath = path.join(
        receiptsDir,
        `${booking._id}.pdf`
    );

    const doc = new PDFDocument({ margin: 50 });

    doc.pipe(fs.createWriteStream(billPath));

    // Header
    doc.fontSize(22)
       .text("SIWANI MARRIAGE HALL BOOKING RECEIPT", {
           align: "center"
       });

    doc.moveDown();

    doc.fontSize(12)
       .text(`Receipt No: ${booking._id}`)
       .text(`Date: ${new Date().toLocaleDateString("en-IN")}`);

    doc.moveDown();

    // Customer Details
    doc.fontSize(16).text("Customer Details");
    doc.moveDown(0.5);

    doc.fontSize(12)
   .text(`Name: ${booking.name || ""}`)
   .text(`Phone: ${booking.phone || ""}`)
   .text(`Event Date: ${new Date(booking.date).toLocaleDateString("en-IN")}`)
   .text(`Event Type: ${booking.eventType || "N/A"}`)
   .text(`Expected Guests: ${booking.expectedGuests || booking.guests || "N/A"}`)
   .text(`Special Requirements: ${booking.requirements || "None"}`);

    doc.moveDown();

    // Payment Details
    doc.fontSize(16).text("Payment Details");
    doc.moveDown(0.5);

    const totalAmount = booking.totalAmount || booking.amount || 0;
    const advancePaid = booking.advancePaid || 0;
const remainingBalance = booking.remainingBalance || (totalAmount - advancePaid);

    doc.fontSize(12)
       .text(`Total Amount: Rs${totalAmount}`)
       .text(`Advance Paid: Rs${booking.advancePaid}`)
       .text(`Remaining Amount: Rs${booking.remainingBalance}`);

    doc.moveDown(2);

    doc.text(
        "Thank you for choosing our Marriage Hall.",
        { align: "center" }
    );

    doc.moveDown();

    doc.text(
        "Authorized Signature",
        { align: "right" }
    );

    doc.end();

    return billPath;
}

// Home Route
app.get("/", (req, res) => {
    res.send("Marriage Hall Backend Running");
});

// Get All Bookings
app.get("/bookings", async (req, res) => {
    try {
        const bookings = await Booking.find();
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post("/bookings", async (req, res) => {

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

        res.json({
    success: true,
    message: "Booking saved successfully",
    bookingId: booking._id,
    status: booking.status
});

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

});

app.put("/bookings/:id/approve", async (req, res) => {
    console.log("Approve ID:", req.params.id);

    try {

        const booking = await Booking.findByIdAndUpdate(
            req.params.id,
            { status: "Approved" },
            { new: true }
        );
 
        if (!booking) {
            return res.status(404).json({
                message: "Booking not found"
            });
        }

        const billPath = generateBill(booking);

        res.json({
    message: "Booking approved successfully",
    billPath,
    booking
});

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
});

   // Edit Booking
app.put("/bookings/:id", async (req, res) => {

    try {

        const booking = await Booking.findByIdAndUpdate(
            req.params.id,
            {
                name: req.body.name,
                phone: req.body.phone,
                date: req.body.date,
                eventType: req.body.eventType,
                guests: req.body.guests,
                requirements: req.body.requirements,
                totalAmount: req.body.totalAmount
            },
            { new: true }
        );

        if (!booking) {
            return res.status(404).json({
                message: "Booking not found"
            });
        }

        res.json({
            message: "Booking updated successfully",
            booking
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Server error"
        });

    }

});

// Delete Booking

app.delete("/bookings/:id", async (req, res) => {
    console.log("Delete ID received:", req.params.id);

const booking = await Booking.findById(req.params.id);
console.log("Booking found:", booking);

  try {
    const deletedBooking = await Booking.findByIdAndDelete(req.params.id);

    if (!deletedBooking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }

    res.json({
      success: true,
      message: "Booking deleted"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

    app.get("/check-date/:date", async (req, res) => {

    try {

        const selectedDate = new Date(req.params.date);

        const nextDate = new Date(selectedDate);
        nextDate.setDate(nextDate.getDate() + 1);

        const booking = await Booking.findOne({
            date: {
                $gte: selectedDate,
                $lt: nextDate
            }
        });

        res.json({
            booked: !!booking
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }

});

// Start Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});