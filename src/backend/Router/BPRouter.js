// import express from "express";
// import db from "../db.js";
// import "./CompanyProfileRouter.js";

// const router = express.Router();


// // ======================================================
// // GET NEXT VOUCHER NUMBER
// // ======================================================
// router.get("/bank-payment/next-vno", async (req, res) => {

//     try {

//         const [rows] = await db.query(`
//             SELECT VNO
//             FROM bankpayment
//             WHERE IS_DELETED = 0
//             ORDER BY bp_id DESC
//             LIMIT 1
//         `);

//         let nextNumber = 1;

//         if (rows.length > 0 && rows[0].VNO) {

//             const match = String(rows[0].VNO).match(/\d+$/);

//             if (match) {
//                 nextNumber = parseInt(match[0], 10) + 1;
//             }
//         }

//         const vno =
//             `BP-${String(nextNumber).padStart(5, "0")}`;

//         res.json({
//             vno
//         });

//     } catch (error) {

//         console.error(
//             "Next VNO Error:",
//             error
//         );

//         res.status(500).json({
//             message: "Unable to generate voucher number",
//             error: error.message
//         });
//     }
// });


// // ======================================================
// // GET SUBSIDIARY ACCOUNTS
// // ======================================================
// router.get("/subsidiary-accounts", async (req, res) => {

//     try {

//         const [rows] = await db.query(`
//             SELECT
//                 Sa_ID,
//                 SA_Name
//             FROM subsidaryaccount
//             ORDER BY SA_Name
//         `);

//         res.json(rows);

//     } catch (error) {

//         console.error(
//             "Subsidiary Accounts Error:",
//             error
//         );

//         res.status(500).json({
//             message: "Unable to get Subsidary Accounts",
//             error: error.message
//         });
//     }
// });


// // ======================================================
// // GET BANK ACCOUNTS
// // ======================================================
// router.get("/banks", async (req, res) => {

//     try {

//         const [rows] = await db.query(`
//             SELECT
//                 Sa_ID,
//                 SA_Name
//             FROM subsidaryaccount
//             WHERE type = 'bank'
//             ORDER BY SA_Name
//         `);

//         res.json(rows);

//     } catch (error) {

//         console.error(
//             "Banks Accounts Error:",
//             error
//         );

//         res.status(500).json({
//             message: "Unable to get Banks Accounts",
//             error: error.message
//         });
//     }
// });


// // ======================================================
// // GET NEXT CHEQUE NUMBER ACCORDING TO BANK
// // ======================================================
// // ======================================================
// // GET NEXT CHEQUE NUMBER ACCORDING TO BANK ACCOUNT
// // ======================================================
// router.get("/bank-payment/next-cheque/:bankId", async (req, res) => {

//     try {

//         const { bankId } = req.params;

//         if (!bankId) {
//             return res.status(400).json({
//                 message: "Bank account is required"
//             });
//         }

//         const [rows] = await db.query(
//             `
//             SELECT chq_no
//             FROM bankpayment
//             WHERE bank_id = ?
//               AND is_deleted = 0
//               AND chq_no IS NOT NULL
//               AND chq_no <> ''
//             ORDER BY CAST(chq_no AS UNSIGNED) DESC
//             LIMIT 1
//             `,
//             [bankId]
//         );

//         let nextChequeNumber = 1;

//         if (rows.length > 0 && rows[0].chq_no) {

//             const lastCheque =
//                 String(rows[0].chq_no).trim();

//             // Get numeric part
//             const match =
//                 lastCheque.match(/\d+$/);

//             if (match) {

//                 nextChequeNumber =
//                     parseInt(match[0], 10) + 1;

//             }
//         }

//         res.json({
//             chequeNo: String(nextChequeNumber)
//         });

//     } catch (error) {

//         console.error(
//             "Next Cheque Number Error:",
//             error
//         );

//         res.status(500).json({
//             message:
//                 "Unable to generate cheque number",
//             error: error.message
//         });
//     }
// });


// // ======================================================
// // SAVE BANK PAYMENT
// // ======================================================
// router.post("/bank-payment", async (req, res) => {

//     const connection = await db.getConnection();

//     try {

//         const {
//             vno,
//             post_date,
//             voucher_date,
//             chq_date,

//             sa_id,
//             bank_id,

//             chq_no,
//             file_no,
//             bill_no,
//             narration,

//             amount,

//             add_amount,
//             add_amount_sa_id,

//             less_amount,
//             less_amount_sa_id

//         } = req.body;


//         // ==================================================
//         // VALIDATION
//         // ==================================================

//         if (!vno) {
//             return res.status(400).json({
//                 message: "Voucher number is required"
//             });
//         }

//         if (!sa_id) {
//             return res.status(400).json({
//                 message: "Subsidiary account is required"
//             });
//         }

//         if (!bank_id) {
//             return res.status(400).json({
//                 message: "Bank account is required"
//             });
//         }

//         if (!amount || Number(amount) <= 0) {
//             return res.status(400).json({
//                 message: "Amount must be greater than zero"
//             });
//         }


//         // ==================================================
//         // CONVERT EMPTY ADD/LESS TO NULL
//         // ==================================================

//         const mainAmount = Number(amount);


//         const addAmount =
//             add_amount === null ||
//             add_amount === undefined ||
//             add_amount === "" ||
//             Number(add_amount) <= 0
//                 ? null
//                 : Number(add_amount);


//         const lessAmount =
//             less_amount === null ||
//             less_amount === undefined ||
//             less_amount === "" ||
//             Number(less_amount) <= 0
//                 ? null
//                 : Number(less_amount);


//         // ==================================================
//         // ADD ACCOUNT VALIDATION
//         // ==================================================

//         if (
//             addAmount !== null &&
//             !add_amount_sa_id
//         ) {

//             return res.status(400).json({
//                 message:
//                     "Please select Add Amount account"
//             });
//         }


//         // ==================================================
//         // LESS ACCOUNT VALIDATION
//         // ==================================================

//         if (
//             lessAmount !== null &&
//             !less_amount_sa_id
//         ) {

//             return res.status(400).json({
//                 message:
//                     "Please select Less Amount account"
//             });
//         }


//         // ==================================================
//         // CALCULATE
//         // ==================================================

//         const subAmount =
//             mainAmount +
//             (addAmount ?? 0);


//         const netAmount =
//             subAmount -
//             (lessAmount ?? 0);


//         // DR = NET AMOUNT
//         const dr = netAmount;


//         if (netAmount < 0) {

//             return res.status(400).json({
//                 message:
//                     "Net amount cannot be negative"
//             });
//         }


//         // ==================================================
//         // START TRANSACTION
//         // ==================================================

//         await connection.beginTransaction();


//         // ==================================================
//         // BANK PAYMENT
//         // ALWAYS ONE ROW
//         // ==================================================

//         const bankPaymentSQL = `
//             INSERT INTO bankpayment
//             (
//                 vno,
//                 post_date,
//                 voucher_date,
//                 chq_date,
//                 sa_id,
//                 dr,
//                 bank_id,
//                 chq_no,
//                 file_no,
//                 bill_no,
//                 narration,
//                 amount,
//                 add_amount,
//                 sub_amount,
//                 less_amount,
//                 net_amount,
//                 is_deleted
//             )
//             VALUES (
//                 ?, ?, ?, ?, ?, ?, ?, ?,
//                 ?, ?, ?, ?, ?, ?, ?, ?, 0
//             )
//         `;


//         await connection.execute(
//             bankPaymentSQL,
//             [
//                 vno,
//                 post_date,
//                 voucher_date,
//                 chq_date || null,

//                 sa_id,

//                 dr,

//                 bank_id,

//                 chq_no || null,
//                 file_no || null,
//                 bill_no || null,
//                 narration || null,

//                 mainAmount,

//                 addAmount,

//                 subAmount,

//                 lessAmount,

//                 netAmount
//             ]
//         );


//         // ==================================================
//         // MASTER SQL
//         // ==================================================

//         const masterSQL = `
//             INSERT INTO master
//             (
//                 VNO,
//                 VDT,
//                 PDT,
//                 SUBID,
//                 NARRATION,
//                 BILL_NO,
//                 FILE_NO,
//                 CHQ_NO,
//                 CHQ_DT,
//                 DEBIT,
//                 CREDIT,
//                 ADD_OTHER_AMOUNT,
//                 SUB_TOTAL,
//                 LESS_OTHER_AMOUNT,
//                 NET_AMOUNT,
//                 VOUCHER_TYPE,
//                 IS_DELETED
//             )
//             VALUES (
//                 ?, ?, ?, ?, ?, ?, ?, ?, ?,
//                 ?, ?, ?, ?, ?, ?, 'BP', 0
//             )
//         `;


//         // ==================================================
//         // MASTER ROW 1
//         // MAIN SUBSIDIARY ACCOUNT
//         // ==================================================

//         await connection.execute(
//             masterSQL,
//             [
//                 vno,
//                 voucher_date,
//                 post_date,
//                 sa_id,

//                 narration || null,
//                 bill_no || null,
//                 file_no || null,
//                 chq_no || null,
//                 chq_date || null,

//                 mainAmount, // DEBIT
//                 0,          // CREDIT

//                 addAmount,
//                 subAmount,
//                 lessAmount,
//                 netAmount
//             ]
//         );


//         // ==================================================
//         // MASTER ROW 2
//         // ADD ACCOUNT
//         // ==================================================

//         if (addAmount !== null) {

//             await connection.execute(
//                 masterSQL,
//                 [
//                     vno,
//                     voucher_date,
//                     post_date,
//                     add_amount_sa_id,

//                     narration || null,
//                     bill_no || null,
//                     file_no || null,
//                     chq_no || null,
//                     chq_date || null,

//                     addAmount, // DEBIT
//                     0,         // CREDIT

//                     addAmount,
//                     subAmount,
//                     lessAmount,
//                     netAmount
//                 ]
//             );
//         }


//         // ==================================================
//         // MASTER ROW 3
//         // LESS ACCOUNT
//         // ==================================================

//         if (lessAmount !== null) {

//             await connection.execute(
//                 masterSQL,
//                 [
//                     vno,
//                     voucher_date,
//                     post_date,
//                     less_amount_sa_id,

//                     narration || null,
//                     bill_no || null,
//                     file_no || null,
//                     chq_no || null,
//                     chq_date || null,

//                     0,          // DEBIT
//                     lessAmount,  // CREDIT

//                     addAmount,
//                     subAmount,
//                     lessAmount,
//                     netAmount
//                 ]
//             );
//         }


//         // ==================================================
//         // MASTER BANK ACCOUNT
//         // ==================================================

//         await connection.execute(
//             masterSQL,
//             [
//                 vno,
//                 voucher_date,
//                 post_date,
//                 bank_id,

//                 narration || null,
//                 bill_no || null,
//                 file_no || null,
//                 chq_no || null,
//                 chq_date || null,

//                 0,         // DEBIT
//                 netAmount, // CREDIT

//                 addAmount,
//                 subAmount,
//                 lessAmount,
//                 netAmount
//             ]
//         );


//         // ==================================================
//         // COMMIT
//         // ==================================================

//         await connection.commit();


//         res.status(201).json({
//             message: "Bank payment saved successfully",

//             vno,

//             amount: mainAmount,

//             add_amount: addAmount,

//             sub_amount: subAmount,

//             less_amount: lessAmount,

//             net_amount: netAmount,

//             dr,

//             master_rows:
//                 2 +
//                 (addAmount !== null ? 1 : 0) +
//                 (lessAmount !== null ? 1 : 0)
//         });


//     } catch (error) {

//         await connection.rollback();

//         console.error(
//             "Bank Payment Save Error:",
//             error
//         );

//         res.status(500).json({
//             message: "Unable to save bank payment",
//             error: error.message
//         });

//     } finally {

//         connection.release();
//     }
// });


// // ======================================================
// // GET BANK PAYMENT LIST
// // ======================================================
// // ======================================================
// // GET BANK PAYMENT LIST
// // ======================================================
// router.get("/bank-payment/list", async (req, res) => {

//     try {

//         const [rows] = await db.query(`
//             SELECT
//                 bp_id,
//                 vno,
//                 post_date,
//                 voucher_date,
//                 chq_date,
//                 sa_id,
//                 dr,
//                 bank_id,
//                 chq_no,
//                 file_no,
//                 bill_no,
//                 narration,
//                 amount,
//                 add_amount,
//                 sub_amount,
//                 less_amount,
//                 net_amount
//             FROM bankpayment
//             WHERE is_deleted = 0
//             ORDER BY bp_id DESC
//         `);

//         console.log("BANK PAYMENT ROWS:", rows);

//         res.status(200).json(rows);

//     } catch (error) {

//         console.error(
//             "BANK PAYMENT LIST ERROR:",
//             error
//         );

//         res.status(500).json({
//             message: "Unable to load bank payments",
//             error: error.message
//         });
//     }
// });


// // ======================================================
// // GET ONE BANK PAYMENT FOR EDIT
// // ======================================================
// router.get(
//     "/bank-payment/:vno",
//     async (req, res) => {

//         try {

//             const { vno } = req.params;


//             const sql = `
//                 SELECT
//                     bp.bp_id,
//                     bp.vno,
//                     bp.post_date,
//                     bp.voucher_date,
//                     bp.chq_date,
//                     bp.sa_id,
//                     bp.bank_id,
//                     bp.chq_no,
//                     bp.file_no,
//                     bp.bill_no,
//                     bp.narration,
//                     bp.amount,
//                     bp.add_amount,
//                     bp.sub_amount,
//                     bp.less_amount,
//                     bp.net_amount,

//                     MAX(
//                         CASE
//                             WHEN m.ADD_OTHER_AMOUNT > 0
//                                  AND m.DEBIT =
//                                      m.ADD_OTHER_AMOUNT
//                             THEN m.SUBID
//                         END
//                     ) AS saMasterAddAccount,

//                     MAX(
//                         CASE
//                             WHEN m.LESS_OTHER_AMOUNT > 0
//                                  AND m.CREDIT =
//                                      m.LESS_OTHER_AMOUNT
//                             THEN m.SUBID
//                         END
//                     ) AS saMasterLessAccount

//                 FROM bankpayment bp

//                 LEFT JOIN master m
//                     ON m.VNO = bp.vno
//                     AND m.VOUCHER_TYPE = 'BP'
//                     AND m.IS_DELETED = 0

//                 WHERE bp.is_deleted = 0
//                   AND bp.vno = ?

//                 GROUP BY
//                     bp.bp_id,
//                     bp.vno,
//                     bp.post_date,
//                     bp.voucher_date,
//                     bp.chq_date,
//                     bp.sa_id,
//                     bp.bank_id,
//                     bp.chq_no,
//                     bp.file_no,
//                     bp.bill_no,
//                     bp.narration,
//                     bp.amount,
//                     bp.add_amount,
//                     bp.sub_amount,
//                     bp.less_amount,
//                     bp.net_amount
//             `;


//             const [rows] =
//                 await db.query(sql, [vno]);


//             if (rows.length === 0) {

//                 return res.status(404).json({
//                     message: "Voucher not found"
//                 });
//             }


//             res.json(rows[0]);


//         } catch (error) {

//             console.error(
//                 "Get Bank Payment Error:",
//                 error
//             );

//             res.status(500).json({
//                 message: "Unable to load voucher",
//                 error: error.message
//             });
//         }
//     }
// );


// // ======================================================
// // UPDATE BANK PAYMENT
// // ======================================================
// router.put(
//     "/bank-payment/:vno",
//     async (req, res) => {

//         const connection =
//             await db.getConnection();

//         try {

//             const { vno } = req.params;

//             const {
//                 post_date,
//                 voucher_date,
//                 chq_date,

//                 sa_id,
//                 bank_id,

//                 chq_no,
//                 file_no,
//                 bill_no,
//                 narration,

//                 amount,

//                 add_amount,
//                 add_amount_sa_id,

//                 less_amount,
//                 less_amount_sa_id
//             } = req.body;


//             // ==========================================
//             // VALIDATION
//             // ==========================================

//             if (!vno) {
//                 return res.status(400).json({
//                     message:
//                         "Voucher number is required"
//                 });
//             }

//             if (!sa_id) {
//                 return res.status(400).json({
//                     message:
//                         "Subsidiary account is required"
//                 });
//             }

//             if (!bank_id) {
//                 return res.status(400).json({
//                     message:
//                         "Bank account is required"
//                 });
//             }

//             if (!amount || Number(amount) <= 0) {
//                 return res.status(400).json({
//                     message:
//                         "Amount must be greater than zero"
//                 });
//             }


//             const mainAmount =
//                 Number(amount);


//             const addAmount =
//                 add_amount === null ||
//                 add_amount === undefined ||
//                 add_amount === "" ||
//                 Number(add_amount) <= 0
//                     ? null
//                     : Number(add_amount);


//             const lessAmount =
//                 less_amount === null ||
//                 less_amount === undefined ||
//                 less_amount === "" ||
//                 Number(less_amount) <= 0
//                     ? null
//                     : Number(less_amount);


//             if (
//                 addAmount !== null &&
//                 !add_amount_sa_id
//             ) {

//                 return res.status(400).json({
//                     message:
//                         "Please select Add Amount account"
//                 });
//             }


//             if (
//                 lessAmount !== null &&
//                 !less_amount_sa_id
//             ) {

//                 return res.status(400).json({
//                     message:
//                         "Please select Less Amount account"
//                 });
//             }


//             // ==========================================
//             // CALCULATE
//             // ==========================================

//             const subAmount =
//                 mainAmount +
//                 (addAmount ?? 0);


//             const netAmount =
//                 subAmount -
//                 (lessAmount ?? 0);


//             const dr = netAmount;


//             if (netAmount < 0) {

//                 return res.status(400).json({
//                     message:
//                         "Net amount cannot be negative"
//                 });
//             }


//             await connection.beginTransaction();


//             // ==========================================
//             // UPDATE BANK PAYMENT
//             // ==========================================

//             const [updateResult] =
//                 await connection.execute(
//                     `
//                     UPDATE bankpayment
//                     SET
//                         post_date = ?,
//                         voucher_date = ?,
//                         chq_date = ?,
//                         sa_id = ?,
//                         dr = ?,
//                         bank_id = ?,
//                         chq_no = ?,
//                         file_no = ?,
//                         bill_no = ?,
//                         narration = ?,
//                         amount = ?,
//                         add_amount = ?,
//                         sub_amount = ?,
//                         less_amount = ?,
//                         net_amount = ?

//                     WHERE vno = ?
//                       AND is_deleted = 0
//                     `,
//                     [
//                         post_date,
//                         voucher_date,
//                         chq_date || null,

//                         sa_id,

//                         dr,

//                         bank_id,

//                         chq_no || null,
//                         file_no || null,
//                         bill_no || null,
//                         narration || null,

//                         mainAmount,
//                         addAmount,
//                         subAmount,
//                         lessAmount,
//                         netAmount,

//                         vno
//                     ]
//                 );


//             if (
//                 updateResult.affectedRows === 0
//             ) {

//                 await connection.rollback();

//                 return res.status(404).json({
//                     message:
//                         "Bank payment voucher not found"
//                 });
//             }


//             // ==========================================
//             // SOFT DELETE OLD MASTER ROWS
//             // ==========================================

//             await connection.execute(
//                 `
//                 UPDATE master
//                 SET IS_DELETED = 1

//                 WHERE VNO = ?
//                   AND VOUCHER_TYPE = 'BP'
//                   AND IS_DELETED = 0
//                 `,
//                 [vno]
//             );


//             // ==========================================
//             // MASTER SQL
//             // ==========================================

//             const masterSQL = `
//                 INSERT INTO master
//                 (
//                     VNO,
//                     VDT,
//                     PDT,
//                     SUBID,
//                     NARRATION,
//                     BILL_NO,
//                     FILE_NO,
//                     CHQ_NO,
//                     CHQ_DT,
//                     DEBIT,
//                     CREDIT,
//                     ADD_OTHER_AMOUNT,
//                     SUB_TOTAL,
//                     LESS_OTHER_AMOUNT,
//                     NET_AMOUNT,
//                     VOUCHER_TYPE,
//                     IS_DELETED
//                 )
//                 VALUES (
//                     ?, ?, ?, ?, ?, ?, ?, ?, ?,
//                     ?, ?, ?, ?, ?, ?, 'BP', 0
//                 )
//             `;


//             // ==========================================
//             // MASTER MAIN SA
//             // ==========================================

//             await connection.execute(
//                 masterSQL,
//                 [
//                     vno,
//                     voucher_date,
//                     post_date,
//                     sa_id,

//                     narration || null,
//                     bill_no || null,
//                     file_no || null,
//                     chq_no || null,
//                     chq_date || null,

//                     mainAmount,
//                     0,

//                     addAmount,
//                     subAmount,
//                     lessAmount,
//                     netAmount
//                 ]
//             );


//             // ==========================================
//             // MASTER ADD ACCOUNT
//             // ==========================================

//             if (addAmount !== null) {

//                 await connection.execute(
//                     masterSQL,
//                     [
//                         vno,
//                         voucher_date,
//                         post_date,
//                         add_amount_sa_id,

//                         narration || null,
//                         bill_no || null,
//                         file_no || null,
//                         chq_no || null,
//                         chq_date || null,

//                         addAmount,
//                         0,

//                         addAmount,
//                         subAmount,
//                         lessAmount,
//                         netAmount
//                     ]
//                 );
//             }


//             // ==========================================
//             // MASTER LESS ACCOUNT
//             // ==========================================

//             if (lessAmount !== null) {

//                 await connection.execute(
//                     masterSQL,
//                     [
//                         vno,
//                         voucher_date,
//                         post_date,
//                         less_amount_sa_id,

//                         narration || null,
//                         bill_no || null,
//                         file_no || null,
//                         chq_no || null,
//                         chq_date || null,

//                         0,
//                         lessAmount,

//                         addAmount,
//                         subAmount,
//                         lessAmount,
//                         netAmount
//                     ]
//                 );
//             }


//             // ==========================================
//             // MASTER BANK
//             // ==========================================

//             await connection.execute(
//                 masterSQL,
//                 [
//                     vno,
//                     voucher_date,
//                     post_date,
//                     bank_id,

//                     narration || null,
//                     bill_no || null,
//                     file_no || null,
//                     chq_no || null,
//                     chq_date || null,

//                     0,
//                     netAmount,

//                     addAmount,
//                     subAmount,
//                     lessAmount,
//                     netAmount
//                 ]
//             );


//             // ==========================================
//             // COMMIT
//             // ==========================================

//             await connection.commit();


//             res.json({
//                 message:
//                     "Bank payment updated successfully",

//                 vno,

//                 amount: mainAmount,

//                 add_amount: addAmount,

//                 sub_amount: subAmount,

//                 less_amount: lessAmount,

//                 net_amount: netAmount,

//                 dr,

//                 master_rows:
//                     2 +
//                     (addAmount !== null ? 1 : 0) +
//                     (lessAmount !== null ? 1 : 0)
//             });


//         } catch (error) {

//             await connection.rollback();

//             console.error(
//                 "Bank Payment Update Error:",
//                 error
//             );

//             res.status(500).json({
//                 message:
//                     "Unable to update bank payment",
//                 error: error.message
//             });

//         } finally {

//             connection.release();
//         }
//     }
// );


// // ======================================================
// // DELETE BANK PAYMENT
// // ======================================================
// router.delete(
//     "/bank-payment/:vno",
//     async (req, res) => {

//         const connection =
//             await db.getConnection();

//         try {

//             const { vno } = req.params;

//             await connection.beginTransaction();


//             // ==========================================
//             // BANK PAYMENT SOFT DELETE
//             // ==========================================

//             const [bankResult] =
//                 await connection.execute(
//                     `
//                     UPDATE bankpayment
//                     SET is_deleted = 1

//                     WHERE is_deleted = 0
//                       AND vno = ?
//                     `,
//                     [vno]
//                 );


//             // ==========================================
//             // MASTER SOFT DELETE
//             // ==========================================

//             await connection.execute(
//                 `
//                 UPDATE master
//                 SET IS_DELETED = 1

//                 WHERE VNO = ?
//                   AND VOUCHER_TYPE = 'BP'
//                   AND IS_DELETED = 0
//                 `,
//                 [vno]
//             );


//             if (
//                 bankResult.affectedRows === 0
//             ) {

//                 await connection.rollback();

//                 return res.status(404).json({
//                     message:
//                         `Voucher ${vno} not found or already deleted`
//                 });
//             }


//             await connection.commit();


//             res.json({
//                 message:
//                     "Bank payment deleted successfully",
//                 vno
//             });


//         } catch (error) {

//             await connection.rollback();

//             console.error(
//                 "Delete Bank Payment Error:",
//                 error
//             );

//             res.status(500).json({
//                 message:
//                     "Unable to delete bank payment",
//                 error: error.message
//             });

//         } finally {

//             connection.release();
//         }
//     }
// );


// // ======================================================
// // PRINT BANK PAYMENT
// // ======================================================
// router.get(
//     "/bank-payment/print/:vno",
//     async (req, res) => {

//         try {

//             const { vno } = req.params;


//             // ==========================================
//             // VOUCHER
//             // ==========================================

//             const voucherSQL = `
//                 SELECT
//                     bp.vno,
//                     bp.post_date,
//                     bp.voucher_date,
//                     bp.chq_date,
//                     bp.chq_no,
//                     bp.file_no,
//                     bp.bill_no,
//                     bp.narration,
//                     bp.amount,
//                     bp.add_amount,
//                     bp.sub_amount,
//                     bp.less_amount,
//                     bp.net_amount

//                 FROM bankpayment bp

//                 WHERE bp.vno = ?
//                   AND bp.is_deleted = 0
//             `;


//             const [voucherRows] =
//                 await db.query(
//                     voucherSQL,
//                     [vno]
//                 );


//             if (voucherRows.length === 0) {

//                 return res.status(404).json({
//                     message:
//                         "Voucher not found"
//                 });
//             }


//             // ==========================================
//             // MASTER ACCOUNTS
//             // ==========================================

//             const masterSQL = `
//                 SELECT
//                     m.SUBID,
//                     sa.SA_Name,
//                     m.DEBIT,
//                     m.CREDIT

//                 FROM master m

//                 LEFT JOIN subsidaryaccount sa
//                     ON sa.Sa_ID = m.SUBID

//                 WHERE m.VNO = ?
//                   AND m.VOUCHER_TYPE = 'BP'
//                   AND m.IS_DELETED = 0

//                 ORDER BY
//                     m.DEBIT DESC,
//                     m.CREDIT DESC
//             `;


//             const [masterRows] =
//                 await db.query(
//                     masterSQL,
//                     [vno]
//                 );


//             res.json({
//                 voucher: voucherRows[0],
//                 accounts: masterRows
//             });


//         } catch (error) {

//             console.error(
//                 "Print Voucher Error:",
//                 error
//             );

//             res.status(500).json({
//                 message:
//                     "Unable to load voucher for printing",
//                 error: error.message
//             });
//         }
//     }
// );


// export default router;
