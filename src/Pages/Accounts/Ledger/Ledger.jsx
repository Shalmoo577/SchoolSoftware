import React, { useEffect, useState } from "react";
import axios from "axios";
import dayjs from "dayjs";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";
import { useNavigate } from "react-router-dom";

import {
    Table,
    Select,
    Input,
    Button,
    DatePicker,
    Space,
    Card,
    Row,
    Col,
    Typography,
} from "antd";

import "./Ledger.css";

const { Title, Text } = Typography;


const Ledger = () => {
    const [companyProfile, setCompanyProfile] = useState({});
    const [accounts, setAccounts] = useState([]);
    const [voucherTypes, setVoucherTypes] = useState([]);

    const [loading, setLoading] = useState(false);

    const [ledgerData, setLedgerData] = useState([]);
    const [selectedAccount, setSelectedAccount] = useState(null);

    const [opening, setOpening] = useState({
        debit: 0,
        credit: 0,
        balance: 0,
    });

    const [totals, setTotals] = useState({
        debit: 0,
        credit: 0,
    });
    const navigate = useNavigate();
    const [closingBalance, setClosingBalance] = useState(0);

    const [filters, setFilters] = useState({
        account_id: null,
        from_date: null,
        to_date: null,
        voucher_type: "ALL",
        vno: "",
        narration: "",
        bill_no: "",
        chq_no:"",
        fill_no:"",
    });

   // Click on VNO Navigate
  const handleVoucherClick = (record) => {

    const vno = record.VNO;
    const type = record.VOUCHER_TYPE;

    if (!vno) return;

    if (type === "BP") {
        navigate(`/BankPayment2?vno=${encodeURIComponent(vno)}`);
    }

    if (type === "BR") {
        navigate(`/BankReceipt?vno=${encodeURIComponent(vno)}`);
    }

    if (type === "CP") {
        navigate(`/CashPayment?vno=${encodeURIComponent(vno)}`);
    }

    if (type === "CR") {
        navigate(`/CashReceipt?vno=${encodeURIComponent(vno)}`);
    }
};
    // --------------------------------------------------
    // LOAD ACCOUNTS
    // --------------------------------------------------

    const loadAccounts = async () => {

        try {

            const response = await axios.get(
                "/api/ledger-accounts"
            );

            setAccounts(response.data);

        } catch (error) {

            console.error(error);

            Swal.fire(
                "Error",
                "Unable to load accounts",
                "error"
            );

        }

    };


    // --------------------------------------------------
    // LOAD VOUCHER TYPES
    // --------------------------------------------------

    const loadVoucherTypes = async () => {

        try {

            const response = await axios.get(
                "/api/ledger-voucher-types"
            );

            setVoucherTypes(response.data);

        } catch (error) {

            console.error(error);

        }

    };


    // --------------------------------------------------
    // INITIAL LOAD
    // --------------------------------------------------

    useEffect(() => {

        loadAccounts();
        loadVoucherTypes();
        loadCompanyProfile();

    }, []);


    // --------------------------------------------------
    // SEARCH LEDGER
    // --------------------------------------------------

    const searchLedger = async () => {

        if (!filters.account_id) {

            Swal.fire(
                "Account Required",
                "Please select an account first.",
                "warning"
            );

            return;
        }


        try {

            setLoading(true);


            const params = {

                account_id: filters.account_id,

                from_date: filters.from_date
                    ? dayjs(filters.from_date).format("YYYY-MM-DD")
                    : "",

                to_date: filters.to_date
                    ? dayjs(filters.to_date).format("YYYY-MM-DD")
                    : "",

                voucher_type: filters.voucher_type,

                vno: filters.vno,

                narration: filters.narration,

                bill_no: filters.bill_no,

                chq_no: filters.chq_no,

                file_no: filters.fill_no,


            };


            const response = await axios.get(
                "/api/ledger",
                {
                    params,
                }
            );


            setLedgerData(response.data.transactions || []);

            setSelectedAccount(response.data.account || null);

            
            setOpening(
                response.data.opening || {
                    debit: 0,
                    credit: 0,
                    balance: 0,
                }
            );

            setTotals(
                response.data.totals || {
                    debit: 0,
                    credit: 0,
                }
            );

            setClosingBalance(
                response.data.closingBalance || 0
            );


        } catch (error) {

            console.error(error);

            Swal.fire(
                "Error",
                error.response?.data?.message ||
                "Unable to load ledger",
                "error"
            );

        } finally {

            setLoading(false);

        }

    };

const loadCompanyProfile = async () => {
    try {
        const response = await axios.get(
            "/api/company-profile"
        );

        setCompanyProfile(response.data || {});
    } catch (error) {
        console.error("Company Profile Error:", error);
    }
};


    // --------------------------------------------------
    // RESET
    // --------------------------------------------------

    const resetLedger = () => {

        setFilters({
            account_id: null,
            from_date: null,
            to_date: null,
            voucher_type: "ALL",
            vno: "",
            narration: "",
            bill_no: "",
            chq_no: "",
            file_no: "",
        });

        setLedgerData([]);

        setSelectedAccount(null);

        setOpening({
            debit: 0,
            credit: 0,
            balance: 0,
        });

        setTotals({
            debit: 0,
            credit: 0,
        });

        setClosingBalance(0);

    };


    // --------------------------------------------------
    // TABLE COLUMNS
    // --------------------------------------------------

    const columns = [


        {
            title: "Date",
            dataIndex: "VDT",
            key: "VDT",
            width: 110,

            render: (value) =>
                value
                    ? dayjs(value).format("DD-MM-YYYY")
                    : "",
        },

        {
    title: "V.No",
    dataIndex: "VNO",
    key: "VNO",
    width: 110,

    render: (value, record) => {

        // Don't make Opening Balance clickable
        if (record.isOpening || !value) {
            return value || "";
        }

        return (
            <a
                onClick={() => handleVoucherClick(record)}
                style={{
                    cursor: "pointer",
                    fontWeight: 500,
                    color:" rgb(10, 10, 65)",
                }}
            >
                {value}
            </a>
        );
    },
},

        {
            title: "Type",
            dataIndex: "VOUCHER_TYPE",
            key: "VOUCHER_TYPE",
            width: 90,
        },

        {
            title: "Narration",
            dataIndex: "NARRATION",
            key: "NARRATION",
            width: 250,
        },

        {
            title: "Bill No",
            dataIndex: "BILL_NO",
            key: "BILL_NO",
            width: 100,
        },

        {
            title: "File No",
            dataIndex: "FILE_NO",
            key: "FILE_NO",
            width: 100,
        },

        {
            title: "Cheque No",
            dataIndex: "CHQ_NO",
            key: "CHQ_NO",
            width: 110,
        },

        {
            title: "Debit",
            dataIndex: "DEBIT",
            key: "DEBIT",
            width: 120,
            align: "right",

            render: (value) =>
                Number(value || 0).toLocaleString(
                    undefined,
                    {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                    }
                ),
        },

        {
            title: "Credit",
            dataIndex: "CREDIT",
            key: "CREDIT",
            width: 120,
            align: "right",

            render: (value) =>
                Number(value || 0).toLocaleString(
                    undefined,
                    {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                    }
                ),
        },

        {
            title: "Balance",
            dataIndex: "BALANCE",
            key: "BALANCE",
            width: 140,
            align: "right",

            render: (value) =>
                Number(value || 0).toLocaleString(
                    undefined,
                    {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                    }
                ),
        },

    ];

    const exportToExcel = () => {

    if (!selectedAccount) {
        Swal.fire(
            "Account Required",
            "Please select an account and search first.",
            "warning"
        );
        return;
    }

    if (!ledgerData.length) {
        Swal.fire(
            "No Data",
            "There is no ledger data to export.",
            "warning"
        );
        return;
    }


    // -----------------------------------------
    // Prepare Excel data
    // -----------------------------------------

    const excelData = [];


    // Opening Balance row

    excelData.push({
        Date: "",
        "V.No": "",
        Narration: "Opening Balance",

        Debit: Number(opening.debit || 0),

        Credit: Number(opening.credit || 0),

        Balance: Number(opening.balance || 0),
    });


    // Transactions

    ledgerData.forEach((row) => {

        excelData.push({

            Date: row.VDT
                ? dayjs(row.VDT).format("DD-MM-YYYY")
                : "",

            "V.No": row.VNO || "",

            Narration: row.NARRATION || "",

            Debit: Number(row.DEBIT || 0),

            Credit: Number(row.CREDIT || 0),

            Balance: Number(row.BALANCE || 0),

        });

    });


    // -----------------------------------------
    // Add totals
    // -----------------------------------------

    excelData.push({

        Date: "",
        "V.No": "",
        Narration: "TOTAL",

        Debit: Number(totals.debit || 0),

        Credit: Number(totals.credit || 0),

        Balance: Number(closingBalance || 0),

    });


    // -----------------------------------------
    // Create worksheet
    // -----------------------------------------

    const worksheet = XLSX.utils.json_to_sheet(excelData);


    // -----------------------------------------
    // Column widths
    // -----------------------------------------

    worksheet["!cols"] = [

        { wch: 15 }, // Date
        { wch: 15 }, // V.No
        { wch: 40 }, // Narration
        { wch: 18 }, // Debit
        { wch: 18 }, // Credit
        { wch: 18 }, // Balance

    ];


    // -----------------------------------------
    // Create workbook
    // -----------------------------------------

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        "Ledger"
    );


    // -----------------------------------------
    // File name
    // -----------------------------------------

    const accountName = selectedAccount.SA_Name
        ? selectedAccount.SA_Name
            .replace(/[^a-zA-Z0-9]/g, "_")
        : "Ledger";


    const fileName = `${accountName}_Ledger.xlsx`;


    // -----------------------------------------
    // Download
    // -----------------------------------------

    XLSX.writeFile(
        workbook,
        fileName
    );

};

const tableData = selectedAccount
    ? [
        {
            MASTER_ID: "opening-balance",

            VDT: null,
            VNO: "",
            VOUCHER_TYPE: "",
            NARRATION: "OPENING BALANCE",
            BILL_NO: "",
            FILE_NO: "",
            CHQ_NO: "",

            DEBIT:
                Number(opening.balance) > 0
                    ? Number(opening.balance)
                    : 0,

            CREDIT:
                Number(opening.balance) < 0
                    ? Math.abs(Number(opening.balance))
                    : 0,

            BALANCE: Number(opening.balance || 0),

            isOpening: true,
        },

        ...ledgerData,
    ]
    : ledgerData;

    return (

        <div className="ledger-page">

            
            <div className="ledger-print-header">

    {/* <h1>LEDGER</h1> */}

    {selectedAccount && (
        <>
            {/* <h2>{selectedAccount.SA_Name}</h2> */}
        </>
    )}

</div>
<div className="ledger-print-header">

    {/* COMPANY PROFILE */}
    <div className="print-company-profile">

        {companyProfile.company_name && (
            <h1>{companyProfile.company_name}</h1>
        )}

        {companyProfile.address && (
            <div>{companyProfile.address}</div>
        )}

        {(companyProfile.phone || companyProfile.email) && (
            <div>
                {companyProfile.phone && (
                    <span>Phone: {companyProfile.phone}</span>
                )}

                {companyProfile.phone && companyProfile.email && (
                    <span> &nbsp; | &nbsp; </span>
                )}

                {companyProfile.email && (
                    <span>Email: {companyProfile.email}</span>
                )}
            </div>
        )}

    </div>

    {/* LEDGER TITLE */}
    {/* <h2 className="print-ledger-title">
        LEDGER
    </h2> */}

    {/* ACCOUNT NAME */}
    {selectedAccount && (
        <h3 className="print-account-name">
            {selectedAccount.SA_Name}
        </h3>
    )}

</div>

            {/* ------------------------------------------ */}
            {/* FILTERS */}
            {/* ------------------------------------------ */}

            <Card className="ledger-filter-card">

                <Row gutter={[12, 12]}>

                    {/* ACCOUNT */}

                    <Col xs={24} md={8} lg={6}>

                        <Text strong>
                            Account
                        </Text>

                        <Select
                            showSearch
                            allowClear
                            placeholder="Select Account"
                            style={{ width: "100%" }}
                            value={filters.account_id}

                            optionFilterProp="label"

                            options={accounts.map((account) => ({
                                value: account.Sa_ID,

                                label:
                                    `${account.SA_Name} (${account.Sa_ID})`,
                            }))}

                            onChange={(value) =>

                                setFilters((prev) => ({
                                    ...prev,
                                    account_id: value,
                                }))

                            }

                        />

                    </Col>


                    {/* FROM DATE */}

                    <Col xs={12} md={6} lg={4}>

                        <Text strong>
                            From Date
                        </Text>

                        <DatePicker
                            style={{ width: "100%" }}

                            format="DD-MM-YYYY"

                            value={
                                filters.from_date
                                    ? dayjs(filters.from_date)
                                    : null
                            }

                            onChange={(date) =>

                                setFilters((prev) => ({
                                    ...prev,
                                    from_date: date
                                        ? date.format("YYYY-MM-DD")
                                        : null,
                                }))

                            }

                        />

                    </Col>


                    {/* TO DATE */}

                    <Col xs={12} md={6} lg={4}>

                        <Text strong>
                            To Date
                        </Text>

                        <DatePicker
                            style={{ width: "100%" }}

                            format="DD-MM-YYYY"

                            value={
                                filters.to_date
                                    ? dayjs(filters.to_date)
                                    : null
                            }

                            onChange={(date) =>

                                setFilters((prev) => ({
                                    ...prev,
                                    to_date: date
                                        ? date.format("YYYY-MM-DD")
                                        : null,
                                }))

                            }

                        />

                    </Col>


                    {/* VOUCHER TYPE */}

                    <Col xs={12} md={6} lg={4}>

                        <Text strong>
                            Voucher Type
                        </Text>

                        <Select
                            style={{ width: "100%" }}

                            value={filters.voucher_type}

                            options={[
                                {
                                    value: "ALL",
                                    label: "All",
                                },

                                ...voucherTypes.map((item) => ({
                                    value: item.VOUCHER_TYPE,
                                    label: item.VOUCHER_TYPE,
                                })),
                            ]}

                            onChange={(value) =>

                                setFilters((prev) => ({
                                    ...prev,
                                    voucher_type: value,
                                }))

                            }

                        />

                    </Col>


                    {/* VOUCHER NO */}

                    <Col xs={12} md={6} lg={3}>

                        <Text strong>
                            Voucher No
                        </Text>

                        <Input
                            placeholder="Voucher No"

                            value={filters.vno}

                            onChange={(e) =>

                                setFilters((prev) => ({
                                    ...prev,
                                    vno: e.target.value,
                                }))

                            }

                        />

                    </Col>


                    {/* NARRATION */}

                    <Col xs={24} md={12} lg={5}>

                        <Text strong>
                            Narration
                        </Text>

                        <Input
                            placeholder="Search narration"

                            value={filters.narration}

                            onChange={(e) =>

                                setFilters((prev) => ({
                                    ...prev,
                                    narration: e.target.value,
                                }))

                            }

                        />

                    </Col>

                        <Col xs={24} md={12} lg={5}>

                        <Text strong>
                            Bill Number
                        </Text>

                        <Input
                            placeholder="Search Bill Number"

                            value={filters.bill_no}

                            onChange={(e) =>

                                setFilters((prev) => ({
                                    ...prev,
                                    bill_no: e.target.value,
                                }))

                            }

                        />

                    </Col>

                    <Col xs={24} md={12} lg={5}>

                        <Text strong>
                            Cheque Number
                        </Text>

                        <Input
                            placeholder="Search Cheque Number"

                            value={filters.chq_no}

                            onChange={(e) =>

                                setFilters((prev) => ({
                                    ...prev,
                                    chq_no: e.target.value,
                                }))

                            }

                        />

                    </Col>
                            
                    <Col xs={24} md={12} lg={5}>

                        <Text strong>
                            File Number
                        </Text>

                        <Input
                            placeholder="Search File Number"

                            value={filters.file_no}

                            onChange={(e) =>

                                setFilters((prev) => ({
                                    ...prev,
                                    file_no: e.target.value,
                                }))

                            }

                        />

                    </Col>
        

                    {/* BUTTONS */}

                    <Col xs={24}>

                     <Space>

    <Button
        type="primary"
        loading={loading}
        onClick={searchLedger}
    >
        Search
    </Button>

    <Button
        onClick={resetLedger}
    >
        Reset
    </Button>

    <Button
        onClick={() => window.print()}
        disabled={!selectedAccount}
    >
        Print Ledger
    </Button>

    <Button
        onClick={exportToExcel}
        disabled={!selectedAccount}
    >
        Export Excel
    </Button>

</Space>

                    </Col>

                </Row>

            </Card>


            {/* ------------------------------------------ */}
            {/* ACCOUNT INFORMATION */}
            {/* ------------------------------------------ */}

            {/* {selectedAccount && (

                <Card className="ledger-account-card">

                    <Row>

                        <Col span={12}>

                            <Text strong>
                                Account:
                            </Text>{" "}

                            {selectedAccount.SA_Name}

                        </Col>

                        <Col span={12}>

                            <Text strong>
                                Account ID:
                            </Text>{" "}

                            {selectedAccount.Sa_ID}

                        </Col>

                    </Row>

                </Card>

            )} */}


            {/* ------------------------------------------ */}
            {/* OPENING BALANCE */}
            {/* ------------------------------------------ */}

            {/* {selectedAccount && (

                <Card className="ledger-opening-card">

                    <Row gutter={20}>

                        <Col>

                            <Text strong>
                                Opening Balance:
                            </Text>{" "}

                            {Number(
                                opening.balance
                            ).toLocaleString(
                                undefined,
                                {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                }
                            )}

                        </Col>

                    </Row>

                </Card>

            )} */}


            {/* ------------------------------------------ */}
            {/* LEDGER TABLE */}
            {/* ------------------------------------------ */}

            <Card className="ledger-table-card">

                <Table

                    rowKey="MASTER_ID"

                    columns={columns}

                    dataSource={tableData}

                    loading={loading}

                    bordered

                    size="small"

                    scroll={{
                        x: 1300,
                        y: 500,
                    }}

                    pagination={{
                        pageSize: 50,
                        showSizeChanger: true,
                        showTotal: (total) =>
                            `Total ${total} records`,
                    }}

                />

            </Card>
{/* =========================================
    PRINT ONLY LEDGER TABLE
    ========================================= */}

<div className="ledger-print-table">

    <table>

        <thead>
            <tr>
                <th>Date</th>
                <th>V.No</th>
                <th>Narration</th>
                <th>Debit</th>
                <th>Credit</th>
                <th>Balance</th>
            </tr>
        </thead>

        <tbody>

            {/* Opening Balance */}

            <tr className="opening-row">

                <td>—</td>

                <td>—</td>

                <td>
                    <strong>Opening Balance</strong>
                </td>

                <td>
                    {Number(opening.debit || 0).toLocaleString(
                        undefined,
                        {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                        }
                    )}
                </td>

                <td>
                    {Number(opening.credit || 0).toLocaleString(
                        undefined,
                        {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                        }
                    )}
                </td>

                <td>
                    {Number(opening.balance || 0).toLocaleString(
                        undefined,
                        {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                        }
                    )}
                </td>

            </tr>


            {/* Transactions */}

            {ledgerData.map((row) => (

                <tr key={row.MASTER_ID}>

                    <td>
                        {row.VDT
                            ? dayjs(row.VDT).format("DD-MM-YYYY")
                            : ""}
                    </td>

                    <td>
                        {row.VNO || ""}
                    </td>

                    <td className="print-narration">
                        {row.NARRATION || ""}
                    </td>

                    <td className="print-number">
                        {Number(row.DEBIT || 0).toLocaleString(
                            undefined,
                            {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                            }
                        )}
                    </td>

                    <td className="print-number">
                        {Number(row.CREDIT || 0).toLocaleString(
                            undefined,
                            {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                            }
                        )}
                    </td>

                    <td className="print-number">
                        {Number(row.BALANCE || 0).toLocaleString(
                            undefined,
                            {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                            }
                        )}
                    </td>

                </tr>

            ))}

        </tbody>

        <tfoot>

            <tr>

                <td colSpan="3">
                    <strong>Totals</strong>
                </td>

                <td className="print-number">
                    <strong>
                        {Number(totals.debit || 0).toLocaleString(
                            undefined,
                            {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                            }
                        )}
                    </strong>
                </td>

                <td className="print-number">
                    <strong>
                        {Number(totals.credit || 0).toLocaleString(
                            undefined,
                            {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                            }
                        )}
                    </strong>
                </td>

                <td className="print-number">
                    <strong>
                        {Number(closingBalance || 0).toLocaleString(
                            undefined,
                            {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                            }
                        )}
                    </strong>
                </td>

            </tr>

        </tfoot>

    </table>

</div>
                    
            {/* ------------------------------------------ */}
            {/* TOTALS */}
            {/* ------------------------------------------ */}

            {selectedAccount && (

                <Card className="ledger-total-card">

                    <Row gutter={[30, 15]}>

                        <Col xs={24} md={8}>

                            <Text strong>
                                Total Debit
                            </Text>

                            <div className="ledger-total-value">

                                {Number(
                                    totals.debit
                                ).toLocaleString(
                                    undefined,
                                    {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    }
                                )}

                            </div>

                        </Col>


                        <Col xs={24} md={8}>

                            <Text strong>
                                Total Credit
                            </Text>

                            <div className="ledger-total-value">

                                {Number(
                                    totals.credit
                                ).toLocaleString(
                                    undefined,
                                    {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    }
                                )}

                            </div>

                        </Col>


                        <Col xs={24} md={8}>

                            <Text strong>
                                Closing Balance
                            </Text>

                            <div className="ledger-total-value">

                                {Number(
                                    closingBalance
                                ).toLocaleString(
                                    undefined,
                                    {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    }
                                )}

                            </div>

                        </Col>

                    </Row>

                </Card>

            )}

        </div>

    );

};

export default Ledger;