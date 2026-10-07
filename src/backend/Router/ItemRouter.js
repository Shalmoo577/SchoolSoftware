import express from "express";
import db from '../db.js'

const router = express.Router();

/// getting warehouse from db for item page
router.get("/gowdownList", async (req, res) => {
    try {

        const sql = `  
            SELECT GOWDOWN_ID , GOWDOWN_NAME
            FROM gowdown  `;

        const [rows] = await db.query(sql);
        res.status(200).json(rows);

    } catch (error) {

        console.log("My Sql Error:" , error );

        res.status(500).json({
            message: "Database error",
            error: error.message
        });
    }
});
// Saving Item
router.post("/Saving_Item", async (req, res) => {

    try {

        const tb_item = req.body.tb_item;
        const tb_select_warehouse = req.body.tb_select_warehouse;
        const tb_remarks = req.body.tb_remarks;

        const sql = `
            INSERT INTO ITEM
            (Item_Name, Gowdown, Remarks)
            VALUES (?, ?, ?)
        `;

        const values = [
            tb_item,
            tb_select_warehouse,
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
router.get("/item-table", async (req, res) => {
    try {

        const sql = `
           select g.GOWDOWN_NAME , i.Gowdown, i.Item_ID, i.Item_Name, i.Remarks from gowdown g
                inner join item i 
                on 
                g.gowdown_id = i.Gowdown
                order by i.Item_ID DESC
        `;

        const [rows] = await db.query(sql);

        res.json(rows);

    } catch (error) {

        console.error("Items Data FETCH ERROR:", error);

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});
/// for edit Control Account
router.put("/update-item/:id", async (req, res) => {

    try {

        const { id } = req.params;

        const {
            tb_item,
            tb_select_warehouse,
            tb_remarks
        } = req.body;


        if (!tb_item.trim()) {

            return res.status(400).json({
                success: false,
                message: "Item Name is required."
            });

        }


        if (!tb_select_warehouse || !tb_select_warehouse) {

            return res.status(400).json({
                success: false,
                message: "Select Warehouse."
            });

        }


        const sql = `
            UPDATE item

            SET
                 Item_Name = ?,
                Gowdown = ?,
                Remarks = ?
            WHERE Item_ID = ?
        `;


        const [result] = await db.query(
            sql,
            [
                
                tb_item.trim(),
                tb_select_warehouse ,
                tb_remarks.trim(),
                id
            ]
        );


        if (result.affectedRows === 0) {

            return res.status(404).json({
                success: false,
                message: "Item not found."
            });

        }


        res.json({
            success: true,
            message: "Item Updated Successfully."
        });


    } catch (error) {

        console.error(
            "CONTROL ACCOUNT UPDATE ERROR:",
            error
        );


        res.status(500).json({
            success: false,
            message: error.message
        });

    }

});

export default router