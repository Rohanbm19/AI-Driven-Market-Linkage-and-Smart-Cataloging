const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Import routes
const productRoutes = require("./routes/products");
const artisanRoutes = require("./routes/artisans");

// API routes
app.use("/api/products", productRoutes);
app.use("/api/artisans", artisanRoutes);

// Home route
app.get("/", (req, res) => {
    res.send("Market Linkage API is running!");
});

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
