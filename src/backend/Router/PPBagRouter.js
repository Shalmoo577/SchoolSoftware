import express from "express";
import db from '../db.js'

const router = express.Router();

// Saving Item
router.post("/Saving_PPBag", async (req, res) => {

    try {
        const tb_bagsize = req.body.tb_bagsize;
        const tb_brandname = req.body.tb_brandname;
        const tb_kg = req.body.tb_kg;
        const tb_remarks = req.body.tb_remarks;


        const sql = `
            INSERT INTO ppbags
            (
                    
                    PP_BAG_SIZE,
                    PP_BAG_BRAND,
                    PP_BAG_KG,
                    REMARKS
                    )
            VALUES (?, ?, ?, ?)
        `;

        const values = [
            tb_bagsize,
            tb_brandname,
            tb_kg,
            tb_remarks || null

        ];

        const [result] = await db.query(sql, values);

        res.status(200).json({
            success: true,
            message: "Data Saved Successfully",
            id: result.insertId
        });

    } catch (error) {

        console.error("========== ERROR ==========");
        console.error(error);
        console.error("MESSAGE:", error.message);
        console.error("CODE:", error.code);
        console.error("===========================");

        res.status(500).json({
            success: false,
            message: error.message,
            code: error.code
        });
    }
});

/// Fetching Data for Table
router.get("/ppbag-table", async (req, res) => {
    try {

        const sql = `
           select 

                    PP_BAG_SIZE,
                    PP_BAG_BRAND,
                    PP_BAG_KG,
                    REMARKS,
                    PP_BAG_ID
                    from ppbags
                order by PP_BAG_ID DESC
        `;
        
        const [rows] = await db.query(sql);

        res.json(rows);

    } catch (error) {

       

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/// for edit Control Account
router.put("/update-ppbag/:id", async (req, res) => {

    try {

        const { id } = req.params;

        const { tb_bagsize, tb_brandname, tb_kg, tb_remarks } = req.body;


        if (!tb_bagsize || !tb_bagsize.trim())
             { 
                return 
                res.status(400).json
                ({ success: false, message: "Bag Size is required." }); 
            } 
            
            if (!tb_brandname || !tb_brandname.trim()) 
                { 
                    return res.status(400).json
                    ({ success: false, message: "Brand Name is required." }); 
                }

                if (!tb_kg || !tb_kg.trim()) { return res.status(400).json({ success: false, message: "KG is required." }); }


        const sql = 
                        ` UPDATE PPBAGS SET 
                        PP_BAG_SIZE = ?, 
                        PP_BAG_BRAND = ?, 
                        PP_BAG_KG = ?, 
                        REMARKS = ? 
                        WHERE PP_BAG_ID = ? `;


        const [result] = await db.query( sql, [ tb_bagsize.trim(), tb_brandname.trim(), tb_kg.trim(), tb_remarks ? tb_remarks.trim() : null, id ] );


        if (result.affectedRows === 0)
             { 
                return res.status(404).json(
            { success: false, message: "PP Bag not found." }); }
             res.status(200).json(
            { success: true, message: "PP Bag Updated Successfully." }); } catch (error) { 
             res.status(500).json
             ({ success: false, message: error.message }); } });

export default router