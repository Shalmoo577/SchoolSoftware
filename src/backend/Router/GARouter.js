import express from "express";
import db from "../../backend/db.js";

const router = express.Router();

router.get("/controlaccount", async (req, res) => {
    try {

        const [rows] = await db.query(`
            SELECT ControlAccountID, ControlAccountName
            FROM controlaccounts
        `);

        res.json(rows);

    } catch (error) {

        console.log(error);

        res.status(500).json({
            message: "Database error",
            error: error.message
        });
    }
});

// Saving General Account
    router.post("/SavingGA" , async (req , res)=>{
        console.log("Route Started");
        try {
            console.log("Body Required");
            const tb_controlaccount = req.body.tb_controlaccount;
            const tb_generalaccount = req.body.tb_generalaccount;
            
            const sql = `insert into  generalaccount (Control_Account_Id,General_Account_Name) values(?,?)`;
            
            
            const values = [tb_controlaccount , tb_generalaccount];
            

            const [result] = await db.query(sql,values);
            res.status(200).json({
                success: true,
                message: "Data Save Successfully",
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
    }) 

router.put("/Updategeneral-accounts/:id", async (req, res) => {

    try {

        const { id } = req.params;

        const {
              tb_generalaccount,
              tb_controlaccount
              
        } = req.body;

        if (!tb_controlaccount) {

            return res.status(400).json({
                success: false,
                message: "Control Account is required."
            });

        }


        if (!tb_generalaccount || !tb_generalaccount.trim()) {

            return res.status(400).json({
                success: false,
                message: "General Account Name is required."
            });

        }


        const sql = `
            UPDATE generalaccount

            SET
                Control_Account_Id = ?,
                General_Account_Name = ?
                
            WHERE General_Account_Id = ?
        `;


        const [result] = await db.query(
            sql,
            [

            tb_controlaccount,
              tb_generalaccount,
              
              id
            ]
        );


        if (result.affectedRows === 0) {

            return res.status(404).json({
                success: false,
                message: "General Account not found."
            });

        }


        res.json({
            success: true,
            message: "General Account Updated Successfully."
        });


    } catch (error) {

        console.error(
            "General ACCOUNT UPDATE ERROR:",
            error
        );


        res.status(500).json({
            success: false,
            message: error.message
        });

    }

});

/// Fetching Data for Table General account
// router.get("/table", async (req, res) => {
//     try {

//         const sql = `
//             SELECT
//         ga.General_Account_Id,
//         ga.Control_Account_Id,
//         ca.ControlAccountName,
//         ga.General_Account_Name
//     FROM generalaccount ga
//     LEFT JOIN controlaccounts ca
//         ON ca.ControlAccountID = ga.Control_Account_Id
//     ORDER BY ga.General_Account_Id DESC
//         `;

//         const [rows] = await db.query(sql);

//         res.json(rows);

//     } catch (error) {

//         console.error("General ACCOUNT FETCH ERROR:", error);

//         res.status(500).json({
//             success: false,
//             message: error.message
//         });
//     }
// });


router.get("/table-general", async (req, res) => {
    try {
        console.log("========== GET GENERAL ACCOUNTS ==========");

        const [database] = await db.query(
            "SELECT DATABASE() AS currentDatabase"
        );

        console.log(
            "NODE DATABASE:",
            database[0]?.currentDatabase
        );

        const [allRows] = await db.query(
            "SELECT * FROM generalaccount"
        );

        console.log(
            "DIRECT ROW COUNT:",
            allRows.length
        );

        console.log(
            "DIRECT ROWS:",
            allRows
        );

        const sql = `
            SELECT
                ga.General_Account_Id,
                ga.Control_Account_Id,
                ca.ControlAccountName,
                ga.General_Account_Name
            FROM generalaccount ga
            LEFT JOIN controlaccounts ca
                ON ca.ControlAccountID = ga.Control_Account_Id
            ORDER BY ga.General_Account_Id DESC
        `;

        const [rows] = await db.query(sql);

        console.log(
            "JOIN ROW COUNT:",
            rows.length
        );

        console.log(
            "JOIN ROWS:",
            rows
        );

        res.status(200).json(rows);

    } catch (error) {

        console.error("========== TABLE ERROR ==========");
        console.error(error);

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});


export default router
