import express from "express";
import db from '../db.js'

const router = express.Router();

// Saving Gowdown
router.post("/Save-gowdown", async (req, res) => {

    try {
        
        const tb_warehousename = req.body.tb_warehousename;
        const tb_phonenumber = req.body.tb_phonenumber;
        const tb_address = req.body.tb_address;
        const tb_remarks = req.body.tb_remarks;


        const sql = `
            INSERT INTO gowdown

            (
                
                GOWDOWN_NAME,
                PHONE_NUMBER,
                ADDRESS,
                REMARKS     )
            VALUES (?, ?, ?, ?)
        `;

        const values = [
          tb_warehousename,
          tb_phonenumber,
          tb_address,
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
router.get("/fetchGowdownList", async (req, res) => {
    try {

        const sql = `
           select        
                GOWDOWN_ID,
                GOWDOWN_NAME,
                PHONE_NUMBER,
                ADDRESS,
                REMARKS      
                FROM gowdown
                order by GOWDOWN_ID DESC
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

/// for edit update gowdown
router.put("/update-gowdown/:id", async (req, res) => {

    try {

        const { id } = req.params;

        const { tb_warehousename, tb_address, tb_phonenumber, tb_remarks } = req.body;


        if (!tb_warehousename || !tb_warehousename.trim())
             { 
                return 
                res.status(400).json
                ({ success: false, message: "Warehouse Name is required." }); 
            } 
            
            if (!tb_address || !tb_address.trim()) 
                { 
                    return res.status(400).json
                    ({ success: false, message: "Address is required." }); 
                }


        const sql = 
                        `UPDATE GOWDOWN SET 
                            GOWDOWN_NAME =?,
                            ADDRESS=?,
                            PHONE_NUMBER =?,
                            REMARKS=?


                        WHERE GOWDOWN_ID = ? `;


        const [result] = await db.query(
            sql,
            [
                tb_warehousename.trim(),
                tb_address.trim(),
                tb_phonenumber.trim(),
                tb_remarks.trim(),
                id
            ]
        );


        if (result.affectedRows === 0)
             { 
                return res.status(404).json(
            { success: false, message: "Server not found." }); }
             res.status(200).json(
            { success: true, message: " Updated Successfully." }); } catch (error) { 
             res.status(500).json
             ({ success: false, message: error.message }); } });

export default router