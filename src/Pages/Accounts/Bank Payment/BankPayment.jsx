// import React, { useEffect, useState } from "react";
// import axios from "axios";
// import {
//     Button,
//     Card,
//     Col,
//     DatePicker,
//     Form,
//     Input,
//     InputNumber,
//     message,
//     Modal,
//     Popconfirm,
//     Row,
//     Select,
//     Space,
//     Table,
//     Typography
// } from "antd";

// import {
//     SaveOutlined,
//     EditOutlined,
//     DeleteOutlined,
//     PrinterOutlined,
//     PlusOutlined,
//     ReloadOutlined
// } from "@ant-design/icons";

// import dayjs from "dayjs";

// const { Text } = Typography;

// const API = "/api";


// const BankPayment = () => {

//     const [form] = Form.useForm();

//     const [loading, setLoading] = useState(false);
//     const [tableLoading, setTableLoading] = useState(false);

//     const [vno, setVno] = useState("");

//     const [subsidiaryAccounts, setSubsidiaryAccounts] = useState([]);
//     const [banks, setBanks] = useState([]);

//     const [payments, setPayments] = useState([]);

//     const [editing, setEditing] = useState(false);

//     const [printWindow, setPrintWindow] = useState(null);


//     // ======================================================
//     // LOAD INITIAL DATA
//     // ======================================================
//     useEffect(() => {

//         loadAccounts();
//         loadBanks();
//         loadPayments();
//         getNextVoucherNumber();

//     }, []);


//     // ======================================================
//     // LOAD SUBSIDIARY ACCOUNTS
//     // ======================================================
//     const loadAccounts = async () => {

//         try {

//             const response = await axios.get(
//                 `${API}/subsidiary-accounts`
//             );

//             setSubsidiaryAccounts(
//                 response.data || []
//             );

//         } catch (error) {

//             console.error(error);

//             message.error(
//                 "Unable to load subsidiary accounts"
//             );
//         }
//     };


//     // ======================================================
//     // LOAD BANKS
//     // ======================================================
//     const loadBanks = async () => {

//         try {

//             const response = await axios.get(
//                 `${API}/banks`
//             );

//             setBanks(
//                 response.data || []
//             );

//         } catch (error) {

//             console.error(error);

//             message.error(
//                 "Unable to load bank accounts"
//             );
//         }
//     };


//     // ======================================================
//     // GET NEXT VOUCHER NUMBER
//     // ======================================================
//     const getNextVoucherNumber = async () => {

//         try {

//             const response = await axios.get(
//                 `${API}/bank-payment/next-vno`
//             );

//             setVno(response.data.vno);

//             form.setFieldsValue({
//                 vno: response.data.vno
//             });

//         } catch (error) {

//             console.error(error);

//             message.error(
//                 "Unable to generate voucher number"
//             );
//         }
//     };


//     // ======================================================
//     // GET NEXT CHEQUE NUMBER
//     // ======================================================
//     const getNextChequeNumber = async (bankId) => {

//         if (!bankId) {
//             return;
//         }

//         try {

//             const response = await axios.get(
//                 `/api/bank-payment/next-cheque/${bankId}`
//             );

//             form.setFieldsValue({
//                 chq_no: response.data.chequeNo
//             });

//         } catch (error) {

//             console.error(error);

//             message.error(
//                 "Unable to generate cheque number"
//             );
//         }
//     };


//     // ======================================================
//     // LOAD PAYMENT LIST
//     // ======================================================
//    const loadPayments = async () => {

//     try {

//         setTableLoading(true);

//         const response = await axios.get(
//             "/api/bank-payment/list"
//         );

//         console.log(
//             "BANK PAYMENT RESPONSE:",
//             response.data
//         );

//         setPayments(response.data);

//     } catch (error) {

//         console.error(
//             "BANK PAYMENT ERROR:",
//             error
//         );

//         console.error(
//             "STATUS:",
//             error.response?.status
//         );

//         console.error(
//             "DATA:",
//             error.response?.data
//         );

//         message.error(
//             error.response?.data?.message ||
//             "Unable to load bank payments"
//         );

//     } finally {

//         setTableLoading(false);
//     }
// };



//     // ======================================================
//     // CALCULATE AMOUNTS
//     // ======================================================
//     const calculateAmounts = () => {

//         const values =
//             form.getFieldsValue();

//         const amount =
//             Number(values.amount || 0);

//         const addAmount =
//             Number(values.add_amount || 0);

//         const lessAmount =
//             Number(values.less_amount || 0);


//         const subAmount =
//             amount + addAmount;

//         const netAmount =
//             subAmount - lessAmount;


//         form.setFieldsValue({
//             sub_amount:
//                 subAmount,

//             net_amount:
//                 netAmount
//         });
//     };


//     // ======================================================
//     // NEW VOUCHER
//     // ======================================================
//     const newVoucher = async () => {

//         form.resetFields();

//         setEditing(false);

//         const today = dayjs();

//         form.setFieldsValue({
//             voucher_date: today,
//             chq_date: today,
//             amount: null,
//             add_amount: null,
//             sub_amount: null,
//             less_amount: null,
//             net_amount: null
//         });

//         await getNextVoucherNumber();
//     };


//     // ======================================================
//     // BANK CHANGE
//     // ======================================================
//     const handleBankChange = async (bankId) => {

//         await getNextChequeNumber(bankId);
//     };


//     // ======================================================
//     // ADD AMOUNT CHANGE
//     // ======================================================
//     const handleAddAmountChange = () => {

//         calculateAmounts();

//         const value =
//             form.getFieldValue("add_amount");

//         if (!value || Number(value) <= 0) {

//             form.setFieldsValue({
//                 add_amount_sa_id: undefined
//             });
//         }
//     };


//     // ======================================================
//     // LESS AMOUNT CHANGE
//     // ======================================================
//     const handleLessAmountChange = () => {

//         calculateAmounts();

//         const value =
//             form.getFieldValue("less_amount");

//         if (!value || Number(value) <= 0) {

//             form.setFieldsValue({
//                 less_amount_sa_id: undefined
//             });
//         }
//     };


//     // ======================================================
//     // SAVE
//     // ======================================================
//     const handleSave = async () => {

//         try {

//             const values =
//                 await form.validateFields();

//             calculateAmounts();


//             const amount =
//                 Number(values.amount || 0);

//             const addAmount =
//                 Number(values.add_amount || 0);

//             const lessAmount =
//                 Number(values.less_amount || 0);


//             const subAmount =
//                 amount + addAmount;

//             const netAmount =
//                 subAmount - lessAmount;


//             const payload = {

//                 vno,

//                 post_date:
//                     dayjs().format("YYYY-MM-DD"),

//                 voucher_date:
//                     values.voucher_date
//                         ? values.voucher_date.format("YYYY-MM-DD")
//                         : null,

//                 chq_date:
//                     values.chq_date
//                         ? values.chq_date.format("YYYY-MM-DD")
//                         : null,

//                 sa_id:
//                     values.sa_id,

//                 bank_id:
//                     values.bank_id,

//                 chq_no:
//                     values.chq_no || null,

//                 file_no:
//                     values.file_no || null,

//                 bill_no:
//                     values.bill_no || null,

//                 narration:
//                     values.narration || null,

//                 amount,

//                 add_amount:
//                     addAmount > 0
//                         ? addAmount
//                         : null,

//                 add_amount_sa_id:
//                     addAmount > 0
//                         ? values.add_amount_sa_id
//                         : null,

//                 sub_amount:
//                     subAmount,

//                 less_amount:
//                     lessAmount > 0
//                         ? lessAmount
//                         : null,

//                 less_amount_sa_id:
//                     lessAmount > 0
//                         ? values.less_amount_sa_id
//                         : null,

//                 net_amount:
//                     netAmount
//             };


//             setLoading(true);


//             if (editing) {

//                 await axios.put(
//                     `${API}/bank-payment/${vno}`,
//                     payload
//                 );

//                 message.success(
//                     "Bank payment updated successfully"
//                 );

//             } else {

//                 await axios.post(
//                     `${API}/bank-payment`,
//                     payload
//                 );

//                 message.success(
//                     "Bank payment saved successfully"
//                 );
//             }


//             await loadPayments();

//             await newVoucher();


//         } catch (error) {

//             console.error(error);

//             if (
//                 error?.response?.data?.message
//             ) {

//                 message.error(
//                     error.response.data.message
//                 );

//             } else if (
//                 error?.errorFields
//             ) {

//                 message.error(
//                     "Please complete required fields"
//                 );

//             } else {

//                 message.error(
//                     "Unable to save bank payment"
//                 );
//             }

//         } finally {

//             setLoading(false);
//         }
//     };


//     // ======================================================
//     // EDIT
//     // ======================================================
//     const handleEdit = async (record) => {

//         try {

//             setLoading(true);

//             const response =
//                 await axios.get(
//                     `${API}/bank-payment/${record.vno}`
//                 );

//             const data =
//                 response.data;


//             setEditing(true);

//             setVno(data.vno);


//             form.setFieldsValue({

//                 vno:
//                     data.vno,

//                 voucher_date:
//                     data.voucher_date
//                         ? dayjs(data.voucher_date)
//                         : null,

//                 chq_date:
//                     data.chq_date
//                         ? dayjs(data.chq_date)
//                         : null,

//                 sa_id:
//                     data.sa_id,

//                 bank_id:
//                     data.bank_id,

//                 chq_no:
//                     data.chq_no,

//                 file_no:
//                     data.file_no,

//                 bill_no:
//                     data.bill_no,

//                 narration:
//                     data.narration,

//                 amount:
//                     Number(data.amount),

//                 add_amount:
//                     data.add_amount !== null
//                         ? Number(data.add_amount)
//                         : null,

//                 add_amount_sa_id:
//                     data.saMasterAddAccount,

//                 sub_amount:
//                     Number(data.sub_amount),

//                 less_amount:
//                     data.less_amount !== null
//                         ? Number(data.less_amount)
//                         : null,

//                 less_amount_sa_id:
//                     data.saMasterLessAccount,

//                 net_amount:
//                     Number(data.net_amount)
//             });


//             window.scrollTo({
//                 top: 0,
//                 behavior: "smooth"
//             });


//         } catch (error) {

//             console.error(error);

//             message.error(
//                 "Unable to load voucher"
//             );

//         } finally {

//             setLoading(false);
//         }
//     };


//     // ======================================================
//     // DELETE
//     // ======================================================
//     const handleDelete = async (record) => {

//         try {

//             setLoading(true);

//             await axios.delete(
//                 `${API}/bank-payment/${record.vno}`
//             );

//             message.success(
//                 "Bank payment deleted successfully"
//             );

//             await loadPayments();

//             if (vno === record.vno) {
//                 await newVoucher();
//             }

//         } catch (error) {

//             console.error(error);

//             message.error(
//                 error?.response?.data?.message ||
//                 "Unable to delete voucher"
//             );

//         } finally {

//             setLoading(false);
//         }
//     };


//     // ======================================================
//     // PRINT
//     // ======================================================
//     const handlePrint = async (voucherNo) => {

//         try {

//             const response =
//                 await axios.get(
//                     `${API}/bank-payment/print/${voucherNo}`
//                 );


//             const data =
//                 response.data;


//             const printWindow =
//                 window.open(
//                     "",
//                     "_blank",
//                     "width=900,height=700"
//                 );


//             if (!printWindow) {

//                 message.error(
//                     "Please allow popups for printing"
//                 );

//                 return;
//             }


//             const voucher =
//                 data.voucher;

//             const accounts =
//                 data.accounts || [];


//             const accountRows =
//                 accounts
//                     .map(account => {

//                         return `
//                             <tr>
//                                 <td>
//                                     ${account.SA_Name || ""}
//                                 </td>

//                                 <td class="amount">
//                                     ${
//                                         Number(account.DEBIT || 0)
//                                             .toLocaleString(
//                                                 undefined,
//                                                 {
//                                                     minimumFractionDigits: 2
//                                                 }
//                                             )
//                                     }
//                                 </td>

//                                 <td class="amount">
//                                     ${
//                                         Number(account.CREDIT || 0)
//                                             .toLocaleString(
//                                                 undefined,
//                                                 {
//                                                     minimumFractionDigits: 2
//                                                 }
//                                             )
//                                     }
//                                 </td>
//                             </tr>
//                         `;

//                     })
//                     .join("");


//             const money = (value) => {

//                 if (
//                     value === null ||
//                     value === undefined ||
//                     value === ""
//                 ) {
//                     return "";
//                 }

//                 return Number(value)
//                     .toLocaleString(
//                         undefined,
//                         {
//                             minimumFractionDigits: 2,
//                             maximumFractionDigits: 2
//                         }
//                     );
//             };


//             printWindow.document.write(`

//                 <!DOCTYPE html>

//                 <html>

//                 <head>

//                     <title>
//                         Bank Payment - ${voucher.vno}
//                     </title>

//                     <style>

//                         * {
//                             box-sizing: border-box;
//                         }

//                         body {
//                             font-family:
//                                 Arial,
//                                 Helvetica,
//                                 sans-serif;

//                             margin: 0;
//                             padding: 30px;

//                             color: #000;
//                         }

//                         .voucher {
//                             width: 100%;
//                             max-width: 900px;

//                             margin: auto;

//                             border: 1px solid #000;

//                             padding: 25px;
//                         }

//                         .company {
//                             text-align: center;

//                             border-bottom:
//                                 2px solid #000;

//                             padding-bottom: 15px;

//                             margin-bottom: 15px;
//                         }

//                         .company h1 {
//                             margin: 0 0 5px 0;
//                             font-size: 24px;
//                         }

//                         .company p {
//                             margin: 2px 0;
//                         }

//                         .title {
//                             text-align: center;

//                             font-size: 20px;

//                             font-weight: bold;

//                             margin: 15px 0;
//                         }

//                         .info {
//                             width: 100%;

//                             margin-bottom: 20px;
//                         }

//                         .info td {
//                             padding: 6px;
//                         }

//                         .label {
//                             font-weight: bold;
//                             width: 120px;
//                         }

//                         table.accounts {
//                             width: 100%;

//                             border-collapse:
//                                 collapse;

//                             margin-top: 15px;
//                         }

//                         .accounts th,
//                         .accounts td {
//                             border:
//                                 1px solid #000;

//                             padding: 8px;
//                         }

//                         .accounts th {
//                             background:
//                                 #f2f2f2;

//                             text-align: left;
//                         }

//                         .amount {
//                             text-align: right;
//                         }

//                         .totals {
//                             margin-top: 20px;

//                             width: 100%;
//                         }

//                         .totals td {
//                             padding: 6px;
//                         }

//                         .total-label {
//                             text-align: right;

//                             font-weight: bold;
//                         }

//                         .narration {
//                             margin-top: 20px;

//                             min-height: 60px;

//                             border:
//                                 1px solid #000;

//                             padding: 10px;
//                         }

//                         .signatures {
//                             display: flex;

//                             justify-content:
//                                 space-between;

//                             margin-top: 80px;
//                         }

//                         .signature {
//                             width: 180px;

//                             text-align: center;

//                             border-top:
//                                 1px solid #000;

//                             padding-top: 8px;
//                         }

//                         @media print {

//                             body {
//                                 padding: 0;
//                             }

//                             .voucher {
//                                 border: none;
//                             }

//                         }

//                     </style>

//                 </head>

//                 <body>

//                     <div class="voucher">

//                         <div class="company">

//                             <h1>
//                                 BANK PAYMENT VOUCHER
//                             </h1>

//                             <p>
//                                 Voucher No:
//                                 <strong>
//                                     ${voucher.vno || ""}
//                                 </strong>
//                             </p>

//                         </div>


//                         <div class="title">
//                             BANK PAYMENT
//                         </div>


//                         <table class="info">

//                             <tr>

//                                 <td class="label">
//                                     Voucher Date
//                                 </td>

//                                 <td>
//                                     ${
//                                         voucher.voucher_date
//                                             ? dayjs(
//                                                 voucher.voucher_date
//                                             ).format("DD-MM-YYYY")
//                                             : ""
//                                     }
//                                 </td>

//                                 <td class="label">
//                                     Cheque Date
//                                 </td>

//                                 <td>
//                                     ${
//                                         voucher.chq_date
//                                             ? dayjs(
//                                                 voucher.chq_date
//                                             ).format("DD-MM-YYYY")
//                                             : ""
//                                     }
//                                 </td>

//                             </tr>

//                             <tr>

//                                 <td class="label">
//                                     Cheque No
//                                 </td>

//                                 <td>
//                                     ${voucher.chq_no || ""}
//                                 </td>

//                                 <td class="label">
//                                     File No
//                                 </td>

//                                 <td>
//                                     ${voucher.file_no || ""}
//                                 </td>

//                             </tr>

//                             <tr>

//                                 <td class="label">
//                                     Bill No
//                                 </td>

//                                 <td>
//                                     ${voucher.bill_no || ""}
//                                 </td>

//                                 <td></td>
//                                 <td></td>

//                             </tr>

//                         </table>


//                         <table class="accounts">

//                             <thead>

//                                 <tr>

//                                     <th>
//                                         Account
//                                     </th>

//                                     <th>
//                                         Debit
//                                     </th>

//                                     <th>
//                                         Credit
//                                     </th>

//                                 </tr>

//                             </thead>

//                             <tbody>

//                                 ${accountRows}

//                             </tbody>

//                         </table>


//                         <table class="totals">

//                             <tr>

//                                 <td class="total-label">
//                                     Amount:
//                                 </td>

//                                 <td class="amount">
//                                     ${money(voucher.amount)}
//                                 </td>

//                             </tr>

//                             ${
//                                 voucher.add_amount !== null
//                                     ? `
//                                         <tr>
//                                             <td class="total-label">
//                                                 Add Amount:
//                                             </td>

//                                             <td class="amount">
//                                                 ${money(
//                                                     voucher.add_amount
//                                                 )}
//                                             </td>
//                                         </tr>
//                                     `
//                                     : ""
//                             }


//                             <tr>

//                                 <td class="total-label">
//                                     Sub Amount:
//                                 </td>

//                                 <td class="amount">
//                                     ${money(
//                                         voucher.sub_amount
//                                     )}
//                                 </td>

//                             </tr>


//                             ${
//                                 voucher.less_amount !== null
//                                     ? `
//                                         <tr>
//                                             <td class="total-label">
//                                                 Less Amount:
//                                             </td>

//                                             <td class="amount">
//                                                 ${money(
//                                                     voucher.less_amount
//                                                 )}
//                                             </td>
//                                         </tr>
//                                     `
//                                     : ""
//                             }


//                             <tr>

//                                 <td class="total-label">
//                                     Net Amount:
//                                 </td>

//                                 <td class="amount">
//                                     <strong>
//                                         ${money(
//                                             voucher.net_amount
//                                         )}
//                                     </strong>
//                                 </td>

//                             </tr>

//                         </table>


//                         <div class="narration">

//                             <strong>
//                                 Narration:
//                             </strong>

//                             <br />

//                             ${voucher.narration || ""}

//                         </div>


//                         <div class="signatures">

//                             <div class="signature">
//                                 Prepared By
//                             </div>

//                             <div class="signature">
//                                 Checked By
//                             </div>

//                             <div class="signature">
//                                 Approved By
//                             </div>

//                         </div>

//                     </div>

//                     <script>

//                         window.onload = function() {

//                             window.print();

//                         };

//                     </script>

//                 </body>

//                 </html>

//             `);


//             printWindow.document.close();

//         } catch (error) {

//             console.error(error);

//             message.error(
//                 "Unable to print voucher"
//             );
//         }
//     };


//     // ======================================================
//     // TABLE COLUMNS
//     // ======================================================
//     const columns = [

//         {
//             title: "Voucher No",
//             dataIndex: "vno",
//             key: "vno",
//             width: 120
//         },

//         {
//             title: "Voucher Date",
//             dataIndex: "voucher_date",
//             key: "voucher_date",
//             width: 120,

//             render: (value) =>
//                 value
//                     ? dayjs(value).format("DD-MM-YYYY")
//                     : ""
//         },

//         {
//             title: "Cheque No",
//             dataIndex: "chq_no",
//             key: "chq_no",
//             width: 110
//         },

//         {
//             title: "File No",
//             dataIndex: "file_no",
//             key: "file_no"
//         },

//         {
//             title: "Bill No",
//             dataIndex: "bill_no",
//             key: "bill_no"
//         },

//         {
//             title: "Amount",
//             dataIndex: "amount",
//             key: "amount",
//             align: "right",

//             render: (value) =>
//                 Number(value || 0)
//                     .toLocaleString(
//                         undefined,
//                         {
//                             minimumFractionDigits: 2
//                         }
//                     )
//         },

//         {
//             title: "Add",
//             dataIndex: "add_amount",
//             key: "add_amount",
//             align: "right",

//             render: (value) =>
//                 value === null
//                     ? ""
//                     : Number(value)
//                         .toLocaleString(
//                             undefined,
//                             {
//                                 minimumFractionDigits: 2
//                             }
//                         )
//         },

//         {
//             title: "Sub Amount",
//             dataIndex: "sub_amount",
//             key: "sub_amount",
//             align: "right",

//             render: (value) =>
//                 Number(value || 0)
//                     .toLocaleString(
//                         undefined,
//                         {
//                             minimumFractionDigits: 2
//                         }
//                     )
//         },

//         {
//             title: "Less",
//             dataIndex: "less_amount",
//             key: "less_amount",
//             align: "right",

//             render: (value) =>
//                 value === null
//                     ? ""
//                     : Number(value)
//                         .toLocaleString(
//                             undefined,
//                             {
//                                 minimumFractionDigits: 2
//                             }
//                         )
//         },

//         {
//             title: "Net Amount",
//             dataIndex: "net_amount",
//             key: "net_amount",
//             align: "right",

//             render: (value) =>
//                 Number(value || 0)
//                     .toLocaleString(
//                         undefined,
//                         {
//                             minimumFractionDigits: 2
//                         }
//                     )
//         },

//         {
//             title: "Action",
//             key: "action",
//             fixed: "right",
//             width: 220,

//             render: (_, record) => (

//                 <Space>

//                     <Button
//                         type="primary"
//                         icon={<EditOutlined />}
//                         size="small"
//                         onClick={() =>
//                             handleEdit(record)
//                         }
//                     >
//                         Edit
//                     </Button>


//                     <Popconfirm
//                         title="Delete this voucher?"
//                         description={
//                             `Voucher ${record.vno} will be deleted.`
//                         }
//                         okText="Yes"
//                         cancelText="No"
//                         onConfirm={() =>
//                             handleDelete(record)
//                         }
//                     >

//                         <Button
//                             danger
//                             icon={<DeleteOutlined />}
//                             size="small"
//                         >
//                             Delete
//                         </Button>

//                     </Popconfirm>


//                     <Button
//                         icon={<PrinterOutlined />}
//                         size="small"
//                         onClick={() =>
//                             handlePrint(record.vno)
//                         }
//                     >
//                         Print
//                     </Button>

//                 </Space>
//             )
//         }
//     ];


//     // ======================================================
//     // RENDER
//     // ======================================================
//     return (

//         <div
//             style={{
//                 padding: 20
//             }}
//         >

//             <Card
//                 title="Bank Payment"
//                 extra={

//                     <Space>

//                         <Button
//                             icon={<PlusOutlined />}
//                             onClick={newVoucher}
//                         >
//                             New
//                         </Button>

//                         <Button
//                             icon={<ReloadOutlined />}
//                             onClick={loadPayments}
//                         >
//                             Refresh
//                         </Button>

//                     </Space>
//                 }
//             >

//                 <Form
//                     form={form}
//                     layout="vertical"
//                     onValuesChange={(
//                         changedValues
//                     ) => {

//                         if (
//                             changedValues.amount !==
//                             undefined ||
//                             changedValues.add_amount !==
//                             undefined ||
//                             changedValues.less_amount !==
//                             undefined
//                         ) {
//                             calculateAmounts();
//                         }

//                     }}
//                 >

//                     {/* =====================================
//                         ROW 1
//                     ====================================== */}

//                     <Row gutter={16}>

//                         <Col xs={24} md={6}>

//                             <Form.Item
//                                 label="Voucher Number"
//                                 name="vno"
//                             >

//                                 <Input
//                                     disabled
//                                     value={vno}
//                                 />

//                             </Form.Item>

//                         </Col>


//                         <Col xs={24} md={6}>

//                             <Form.Item
//                                 label="Voucher Date"
//                                 name="voucher_date"
//                                 rules={[
//                                     {
//                                         required: true,
//                                         message:
//                                             "Please select voucher date"
//                                     }
//                                 ]}
//                             >

//                                 <DatePicker
//                                     style={{
//                                         width: "100%"
//                                     }}
//                                     format="DD-MM-YYYY"
//                                 />

//                             </Form.Item>

//                         </Col>


//                         <Col xs={24} md={6}>

//                             <Form.Item
//                                 label="Cheque Date"
//                                 name="chq_date"
//                             >

//                                 <DatePicker
//                                     style={{
//                                         width: "100%"
//                                     }}
//                                     format="DD-MM-YYYY"
//                                 />

//                             </Form.Item>

//                         </Col>


//                         <Col xs={24} md={6}>

//                             <Form.Item
//                                 label="Cheque Number"
//                                 name="chq_no"
//                             >

//                                 <Input />

//                             </Form.Item>

//                         </Col>

//                     </Row>


//                     {/* =====================================
//                         ROW 2
//                     ====================================== */}

//                     <Row gutter={16}>

//                         <Col xs={24} md={8}>

//                             <Form.Item
//                                 label="Subsidiary Account"
//                                 name="sa_id"
//                                 rules={[
//                                     {
//                                         required: true,
//                                         message:
//                                             "Please select subsidiary account"
//                                     }
//                                 ]}
//                             >

//                                 <Select
//                                     showSearch
//                                     placeholder="Select account"
//                                     optionFilterProp="label"
//                                     options={
//                                         subsidiaryAccounts.map(
//                                             item => ({
//                                                 value:
//                                                     item.Sa_ID,
//                                                 label:
//                                                     `${item.Sa_ID} - ${item.SA_Name}`
//                                             })
//                                         )
//                                     }
//                                 />

//                             </Form.Item>

//                         </Col>


//                         <Col xs={24} md={8}>

//                             <Form.Item
//                                 label="Bank Account"
//                                 name="bank_id"
//                                 rules={[
//                                     {
//                                         required: true,
//                                         message:
//                                             "Please select bank account"
//                                     }
//                                 ]}
//                             >

//                                 <Select
//                                     showSearch
//                                     placeholder="Select bank"
//                                     optionFilterProp="label"

//                                     onChange={
//                                         handleBankChange
//                                     }

//                                     options={
//                                         banks.map(
//                                             item => ({
//                                                 value:
//                                                     item.Sa_ID,
//                                                 label:
//                                                     `${item.Sa_ID} - ${item.SA_Name}`
//                                             })
//                                         )
//                                     }
//                                 />

//                             </Form.Item>

//                         </Col>


//                         <Col xs={24} md={8}>

//                             <Form.Item
//                                 label="File Number"
//                                 name="file_no"
//                             >

//                                 <Input />

//                             </Form.Item>

//                         </Col>

//                     </Row>


//                     {/* =====================================
//                         ROW 3
//                     ====================================== */}

//                     <Row gutter={16}>

//                         <Col xs={24} md={8}>

//                             <Form.Item
//                                 label="Bill Number"
//                                 name="bill_no"
//                             >

//                                 <Input />

//                             </Form.Item>

//                         </Col>


//                         <Col xs={24} md={16}>

//                             <Form.Item
//                                 label="Narration"
//                                 name="narration"
//                             >

//                                 <Input.TextArea
//                                     rows={1}
//                                 />

//                             </Form.Item>

//                         </Col>

//                     </Row>


//                     {/* =====================================
//                         AMOUNT SECTION
//                     ====================================== */}

//                     <Card
//                         size="small"
//                         title="Amount Details"
//                         style={{
//                             marginBottom: 20
//                         }}
//                     >

//                         <Row gutter={16}>

//                             {/* AMOUNT */}

//                             <Col xs={24} md={6}>

//                                 <Form.Item
//                                     label="Amount"
//                                     name="amount"
//                                     rules={[
//                                         {
//                                             required: true,
//                                             message:
//                                                 "Please enter amount"
//                                         },

//                                         {
//                                             validator:
//                                                 (_, value) => {

//                                                     if (
//                                                         value ===
//                                                         undefined ||
//                                                         value ===
//                                                         null ||
//                                                         Number(value) <= 0
//                                                     ) {

//                                                         return Promise.reject(
//                                                             new Error(
//                                                                 "Amount must be greater than zero"
//                                                             )
//                                                         );
//                                                     }

//                                                     return Promise.resolve();
//                                                 }
//                                         }
//                                     ]}
//                                 >

//                                     <InputNumber
//                                         style={{
//                                             width: "100%"
//                                         }}
//                                         min={0}
//                                         precision={2}
//                                         onChange={
//                                             calculateAmounts
//                                         }
//                                     />

//                                 </Form.Item>

//                             </Col>


//                             {/* ADD AMOUNT */}

//                             <Col xs={24} md={6}>

//                                 <Form.Item
//                                     label="Add Amount"
//                                     name="add_amount"
//                                 >

//                                     <InputNumber
//                                         style={{
//                                             width: "100%"
//                                         }}
//                                         min={0}
//                                         precision={2}
//                                         onChange={
//                                             handleAddAmountChange
//                                         }
//                                     />

//                                 </Form.Item>

//                             </Col>


//                             {/* ADD ACCOUNT */}

//                             <Col xs={24} md={6}>

//                                 <Form.Item
//                                     noStyle
//                                     shouldUpdate={(
//                                         prev,
//                                         current
//                                     ) =>
//                                         prev.add_amount !==
//                                         current.add_amount
//                                     }
//                                 >

//                                     {({
//                                         getFieldValue
//                                     }) => {

//                                         const addAmount =
//                                             Number(
//                                                 getFieldValue(
//                                                     "add_amount"
//                                                 ) || 0
//                                             );


//                                         if (
//                                             addAmount <= 0
//                                         ) {
//                                             return null;
//                                         }


//                                         return (

//                                             <Form.Item
//                                                 label="Add Account"
//                                                 name="add_amount_sa_id"
//                                                 rules={[
//                                                     {
//                                                         required: true,
//                                                         message:
//                                                             "Please select Add Amount account"
//                                                     }
//                                                 ]}
//                                             >

//                                                 <Select
//                                                     showSearch
//                                                     placeholder="Select account"
//                                                     optionFilterProp="label"

//                                                     options={
//                                                         subsidiaryAccounts.map(
//                                                             item => ({
//                                                                 value:
//                                                                     item.Sa_ID,
//                                                                 label:
//                                                                     `${item.Sa_ID} - ${item.SA_Name}`
//                                                             })
//                                                         )
//                                                     }
//                                                 />

//                                             </Form.Item>
//                                         );
//                                     }}

//                                 </Form.Item>

//                             </Col>


//                             {/* SUB AMOUNT */}

//                             <Col xs={24} md={6}>

//                                 <Form.Item
//                                     label="Sub Amount"
//                                     name="sub_amount"
//                                 >

//                                     <InputNumber
//                                         style={{
//                                             width: "100%"
//                                         }}
//                                         disabled
//                                         precision={2}
//                                     />

//                                 </Form.Item>

//                             </Col>

//                         </Row>


//                         <Row gutter={16}>

//                             {/* LESS AMOUNT */}

//                             <Col xs={24} md={6}>

//                                 <Form.Item
//                                     label="Less Amount"
//                                     name="less_amount"
//                                 >

//                                     <InputNumber
//                                         style={{
//                                             width: "100%"
//                                         }}
//                                         min={0}
//                                         precision={2}
//                                         onChange={
//                                             handleLessAmountChange
//                                         }
//                                     />

//                                 </Form.Item>

//                             </Col>


//                             {/* LESS ACCOUNT */}

//                             <Col xs={24} md={6}>

//                                 <Form.Item
//                                     noStyle
//                                     shouldUpdate={(
//                                         prev,
//                                         current
//                                     ) =>
//                                         prev.less_amount !==
//                                         current.less_amount
//                                     }
//                                 >

//                                     {({
//                                         getFieldValue
//                                     }) => {

//                                         const lessAmount =
//                                             Number(
//                                                 getFieldValue(
//                                                     "less_amount"
//                                                 ) || 0
//                                             );


//                                         if (
//                                             lessAmount <= 0
//                                         ) {
//                                             return null;
//                                         }


//                                         return (

//                                             <Form.Item
//                                                 label="Less Account"
//                                                 name="less_amount_sa_id"
//                                                 rules={[
//                                                     {
//                                                         required: true,
//                                                         message:
//                                                             "Please select Less Amount account"
//                                                     }
//                                                 ]}
//                                             >

//                                                 <Select
//                                                     showSearch
//                                                     placeholder="Select account"
//                                                     optionFilterProp="label"

//                                                     options={
//                                                         subsidiaryAccounts.map(
//                                                             item => ({
//                                                                 value:
//                                                                     item.Sa_ID,
//                                                                 label:
//                                                                     `${item.Sa_ID} - ${item.SA_Name}`
//                                                             })
//                                                         )
//                                                     }
//                                                 />

//                                             </Form.Item>

//                                         );
//                                     }}

//                                 </Form.Item>

//                             </Col>


//                             {/* NET AMOUNT */}

//                             <Col xs={24} md={6}>

//                                 <Form.Item
//                                     label="Net Amount"
//                                     name="net_amount"
//                                 >

//                                     <InputNumber
//                                         style={{
//                                             width: "100%"
//                                         }}
//                                         disabled
//                                         precision={2}
//                                     />

//                                 </Form.Item>

//                             </Col>

//                         </Row>

//                     </Card>


//                     {/* =====================================
//                         BUTTONS
//                     ====================================== */}

//                     <Row>

//                         <Col span={24}>

//                             <Space>

//                                 <Button
//                                     type="primary"
//                                     icon={<SaveOutlined />}
//                                     loading={loading}
//                                     onClick={handleSave}
//                                 >
//                                     {
//                                         editing
//                                             ? "Update"
//                                             : "Save"
//                                     }
//                                 </Button>


//                                 <Button
//                                     onClick={newVoucher}
//                                 >
//                                     Clear
//                                 </Button>


//                                 {editing && (

//                                     <Button
//                                         icon={
//                                             <PrinterOutlined />
//                                         }
//                                         onClick={() =>
//                                             handlePrint(vno)
//                                         }
//                                     >
//                                         Print
//                                     </Button>

//                                 )}

//                             </Space>

//                         </Col>

//                     </Row>

//                 </Form>

//             </Card>


//             {/* ============================================
//                 LIST TABLE
//             ============================================= */}

//             <Card
//                 title="Bank Payment Vouchers"
//                 style={{
//                     marginTop: 20
//                 }}
//             >

//                 <Table
//                     rowKey="bp_id"
//                     loading={tableLoading}
//                     columns={columns}
//                     dataSource={payments}
//                     scroll={{
//                         x: 1400
//                     }}
//                     pagination={{
//                         pageSize: 10,
//                         showSizeChanger: true
//                     }}
//                 />

//             </Card>

//         </div>
//     );
// };


// export default BankPayment;
