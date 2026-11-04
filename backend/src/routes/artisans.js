const express = require("express");
const router = express.Router();

const supabase = require("../config/supabase");

// Get all artisans
router.get("/", async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("artisan_profiles")
            .select("*");

        if (error) {
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }

        res.status(200).json({
            success: true,
            artisans: data
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
});

module.exports = router;
