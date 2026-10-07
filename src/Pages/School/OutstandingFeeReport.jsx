
import React, { useEffect, useState } from "react";
import axios from "axios";
import dayjs from "dayjs";
import Swal from "sweetalert2";

import {
    Button,
    Card,
    Col,
    DatePicker,
    Input,
    Row,
    Select,
    Space,
    Statistic,
    Table,
    Tag
} from "antd";

import {
    SearchOutlined,
    ReloadOutlined,
    PrinterOutlined
} from "@ant-design/icons";

const API = "/api";

    const OutstandingFeeReport = () => {

    const [academicYears, setAcademicYears] = useState([]);
    const [classes, setClasses] = useState([]);
    const [sections, setSections] = useState([]);

    const [academicYearId, setAcademicYearId] = useState(null);
    const [feeMonth, setFeeMonth] = useState(null);
    const [classId, setClassId] = useState(null);
    const [sectionId, setSectionId] = useState(null);
    const [search, setSearch] = useState("");

    const [rows, setRows] = useState([]);

    const [totals, setTotals] = useState({
        total_net: 0,
        total_paid: 0,
        total_balance: 0
    });

    const [loading, setLoading] = useState(false);

    const [campus , setCampus] = useState([]);
    const [campusid , setCampusId] = useState(null);
    const loadCampus = async () => {

        try {

            const response = await axios.get(
                "/api/campuses"
            );
        
            setCampus(response.data || []);

        } catch (error) {

            console.error(error);

            Swal.fire(
                "Error",
                "Unable to load Campuses years.",
                "error"
            );
        }
    };     

    /* =========================================================
       LOAD ACADEMIC YEARS
    ========================================================= */
    const loadAcademicYears = async () => {

        try {

            const response = await axios.get(
                `${API}/class-fee-voucher/academic-years`
            );

            setAcademicYears(response.data || []);

        } catch (error) {

            console.error(error);

            Swal.fire(
                "Error",
                "Unable to load academic years.",
                "error"
            );
        }
    };


    /* =========================================================
       LOAD CLASSES
    ========================================================= */

    const loadClasses = async () => {

        try {

            const response = await axios.get(
                `${API}/class-fee-voucher/classes`
            );

            setClasses(response.data || []);

        } catch (error) {

            console.error(error);

            Swal.fire(
                "Error",
                "Unable to load classes.",
                "error"
            );
        }
    };


    /* =========================================================
       LOAD SECTIONS
    ========================================================= */
// selectedClassId
    const loadSections = async () => {

        // if (!selectedClassId) {

        //     setSections([]);

        //     return;
        // }


        try {

            const response = await axios.get(
                `${API}/student-sections`,
                // {
                //     params: {
                //         class_id: selectedClassId
                //     }
                // }
            );

            setSections(response.data || []);

        } catch (error) {

            console.error(error);

            Swal.fire(
                "Error",
                "Unable to load sections.",
                "error"
            );
        }
    };


    /* =========================================================
       LOAD REPORT
    ========================================================= */

const loadReport = async (customFilters = null) => {
    try {
        setLoading(true);

        const params = customFilters || {};

        if (!customFilters) {
            if (academicYearId) {
                params.academic_year_id = academicYearId;
            }

            if (feeMonth) {
                params.fee_month = feeMonth.format("YYYY-MM-DD");
            }

            if (classId) {
                params.class_id = classId;
            }

            if (sectionId) {
                params.section_id = sectionId;
            }

                if (campusid) {
                params.campus_id = campusid;
            }

            if (search.trim() !== "") {
                params.search = search.trim();
            }
        }

        // console.log("REPORT PARAMS:", params);

        const response = await axios.get(
            `${API}/outstanding-fee-report`,
            {
                params: params
            }
        );

        // console.log("REPORT RESPONSE:", response.data);

        setRows(response.data?.rows || []);

        setTotals(
            response.data?.totals || {
                total_net: 0,
                total_paid: 0,
                total_balance: 0
            }
        );

    } catch (error) {

        console.error(
            "Outstanding Fee Report Error:",
            error.response?.data || error
        );

        Swal.fire(
            "Error",
            error.response?.data?.message ||
            "Unable to load outstanding fee report.",
            "error"
        );

    } finally {
        setLoading(false);
    }
};
    /* =========================================================
       INITIAL LOAD
    ========================================================= */

    useEffect(() => {

        loadAcademicYears();
        loadClasses();
        loadCampus();
        loadReport();
        loadSections();

    }, []);


    /* =========================================================
       CLASS CHANGE
    ========================================================= */

    // const handleClassChange = async (value) => {

    //     setClassId(value || null);

    //     setSectionId(null);

    //     await loadSections(value);
    // };


    /* =========================================================
       RESET
    ========================================================= */

 const resetFilters = async () => {

    setAcademicYearId(null);
    setFeeMonth(null);
    setClassId(null);
    setSectionId(null);
    setCampusId(null);
    setSearch("");
    // setCampus([]);
    setSections([]);

    try {

        setLoading(true);

        const response = await axios.get(
            `${API}/outstanding-fee-report`
        );

        setRows(
            response.data?.rows || []
        );

        setTotals(
            response.data?.totals || {
                total_net: 0,
                total_paid: 0,
                total_balance: 0
            }
        );

    } catch (error) {

        console.error(error);

        Swal.fire(
            "Error",
            "Unable to reset report.",
            "error"
        );

    } finally {

        setLoading(false);
    }
};


    /* =========================================================
       PRINT
    ========================================================= */

    const printReport = () => {

        if (rows.length === 0) {

            Swal.fire(
                "No Data",
                "There is no outstanding fee data to print.",
                "info"
            );

            return;
        }


        const printWindow =
            window.open(
                "",
                "_blank",
                "width=1100,height=800"
            );


        if (!printWindow) {

            Swal.fire(
                "Popup Blocked",
                "Please allow popups for this website.",
                "warning"
            );

            return;
        }


        const academicYearName =
            academicYears.find(
                item =>
                    Number(item.academic_year_id) ===
                    Number(academicYearId)
            )?.year_name || "All Academic Years";


        const className =
            classes.find(
                item =>
                    Number(item.class_id) ===
                    Number(classId)
            )?.name || "All Classes";


        const sectionName =
            sections.find(
                item =>
                    Number(item.section_id) ===
                    Number(sectionId)
            )?.section_name || "All Sections";

        const campusName =
            campus.find(
                item =>
                    Number(item.campus_id) ===
                    Number(campusid)
            )?.name || "All Campuses";

        const monthName =
            feeMonth
                ? feeMonth.format("MMMM YYYY")
                : "All Months";


        const tableRows = rows.map(
            (row, index) => `

                <tr>

                    <td>${index + 1}</td>

                    <td>
                        ${row.admission_no || ""}
                    </td>

                    <td>
                        ${row.student_name || ""}
                    </td>

                    <td>
                        ${row.father_name || ""}
                    </td>

                    <td>
                        ${row.class_name || ""}
                    </td>

                    <td>
                        ${row.section_name || ""}
                    </td>

                    <td>
                        ${row.challan_no || ""}
                    </td>

                    <td>
                        ${dayjs(row.fee_month).format("MMM YYYY")}
                    </td>

                    <td class="amount">
                        ${Number(row.net_amount || 0).toFixed(2)}
                    </td>

                    <td class="amount">
                        ${Number(row.paid_amount || 0).toFixed(2)}
                    </td>

                    <td class="amount">
                        <strong>
                            ${Number(row.balance_amount || 0).toFixed(2)}
                        </strong>
                    </td>

                </tr>

            `
        ).join("");


        printWindow.document.write(`

            <!DOCTYPE html>

            <html>

            <head>

                <title>
                    Outstanding Fee Report
                </title>

                <style>

                    @page {
                        size: A4 landscape;
                        margin: 10mm;
                    }

                    * {
                        box-sizing: border-box;
                    }

                    body {
                        font-family: Arial, sans-serif;
                        margin: 0;
                        padding: 0;
                        color: #000;
                    }

                    h1 {
                        text-align: center;
                        margin: 0 0 5px 0;
                        font-size: 20px;
                    }

                    .subtitle {
                        text-align: center;
                        font-size: 12px;
                        margin-bottom: 12px;
                    }

                    .filters {
                        display: flex;
                        justify-content: center;
                        gap: 20px;
                        font-size: 11px;
                        margin-bottom: 12px;
                    }

                    .summary {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 12px;
                        border: 1px solid #000;
                    }

                    .summary-box {
                        flex: 1;
                        text-align: center;
                        padding: 7px;
                        border-right: 1px solid #000;
                    }

                    .summary-box:last-child {
                        border-right: none;
                    }

                    .summary-label {
                        font-size: 10px;
                    }

                    .summary-value {
                        font-size: 14px;
                        font-weight: bold;
                        margin-top: 3px;
                    }

                    table {
                        width: 100%;
                        border-collapse: collapse;
                        font-size: 8.5px;
                    }

                    th,
                    td {
                        border: 1px solid #000;
                        padding: 4px;
                    }

                    th {
                        text-align: center;
                        font-weight: bold;
                    }

                    .amount {
                        text-align: right;
                    }

                    tfoot td {
                        font-weight: bold;
                    }

                    .footer {
                        margin-top: 12px;
                        display: flex;
                        justify-content: space-between;
                        font-size: 9px;
                    }

                </style>

            </head>


            <body>

                <h1>
                    OUTSTANDING FEE REPORT
                </h1>

                <div class="subtitle">
                    Academic Year: ${academicYearName}
                </div>


                <div class="filters">

                    <span>
                        <strong>Month:</strong>
                        ${monthName}
                    </span>

                    <span>
                        <strong>Class:</strong>
                        ${className}
                    </span>

                    <span>
                        <strong>Section:</strong>
                        ${sectionName}
                    </span>

                </div>


                <div class="summary">

                    <div class="summary-box">

                        <div class="summary-label">
                            TOTAL NET
                        </div>

                        <div class="summary-value">
                            ${Number(
                                totals.total_net || 0
                            ).toFixed(2)}
                        </div>

                    </div>


                    <div class="summary-box">

                        <div class="summary-label">
                            TOTAL PAID
                        </div>

                        <div class="summary-value">
                            ${Number(
                                totals.total_paid || 0
                            ).toFixed(2)}
                        </div>

                    </div>


                    <div class="summary-box">

                        <div class="summary-label">
                            TOTAL OUTSTANDING
                        </div>

                        <div class="summary-value">
                            ${Number(
                                totals.total_balance || 0
                            ).toFixed(2)}
                        </div>

                    </div>

                </div>


                <table>

                    <thead>

                        <tr>

                            <th>#</th>
                            <th>Admission No.</th>
                            <th>Student</th>
                            <th>Father</th>
                            <th>Class</th>
                            <th>Section</th>
                            <th>Challan No.</th>
                            <th>Month</th>
                            <th>Net</th>
                            <th>Paid</th>
                            <th>Outstanding</th>

                        </tr>

                    </thead>


                    <tbody>

                        ${tableRows}

                    </tbody>


                    <tfoot>

                        <tr>

                            <td
                                colspan="8"
                                style="text-align:right"
                            >
                                TOTAL
                            </td>

                            <td class="amount">
                                ${Number(
                                    totals.total_net || 0
                                ).toFixed(2)}
                            </td>

                            <td class="amount">
                                ${Number(
                                    totals.total_paid || 0
                                ).toFixed(2)}
                            </td>

                            <td class="amount">
                                ${Number(
                                    totals.total_balance || 0
                                ).toFixed(2)}
                            </td>

                        </tr>

                    </tfoot>

                </table>


                <div class="footer">

                    <span>
                        Total Outstanding Records:
                        ${rows.length}
                    </span>

                    <span>
                        Printed:
                        ${dayjs().format(
                            "DD-MM-YYYY HH:mm"
                        )}
                    </span>

                </div>


                <script>

                    window.onload = function() {

                        window.print();

                    };

                <\/script>

            </body>

            </html>

        `);


        printWindow.document.close();
    };


    /* =========================================================
       TABLE COLUMNS
    ========================================================= */

    const columns = [

        {
            title: "#",
            key: "index",
            width: 60,

            render: (_, __, index) =>
                index + 1
        },


        {
            title: "Admission No.",
            dataIndex: "admission_no",
            key: "admission_no"
        },


        {
            title: "Student",
            dataIndex: "student_name",
            key: "student_name"
        },


        {
            title: "Father",
            dataIndex: "father_name",
            key: "father_name"
        },


        {
            title: "Class",
            dataIndex: "class_name",
            key: "class_name"
        },


        {
            title: "Section",
            dataIndex: "section_name",
            key: "section_name"
        },

        {
            title: "Campus",
            dataIndex: "name",
            key: "name"
        },

        {
            title: "Challan No.",
            dataIndex: "challan_no",
            key: "challan_no"
        },


        {
            title: "Month",
            dataIndex: "fee_month",
            key: "fee_month",

            render: value =>
                value
                    ? dayjs(value).format("MMMM YYYY")
                    : ""
        },


        {
            title: "Due Date",
            dataIndex: "due_date",
            key: "due_date",

            render: value =>
                value
                    ? dayjs(value).format("DD-MM-YYYY")
                    : ""
        },


        {
            title: "Net",
            dataIndex: "net_amount",
            key: "net_amount",
            align: "right",

            render: value =>
                Number(value || 0).toFixed(2)
        },


        {
            title: "Paid",
            dataIndex: "paid_amount",
            key: "paid_amount",
            align: "right",

            render: value =>
                Number(value || 0).toFixed(2)
        },


        {
            title: "Outstanding",
            dataIndex: "balance_amount",
            key: "balance_amount",
            align: "right",

            render: value => (

                <strong>
                    {Number(
                        value || 0
                    ).toFixed(2)}
                </strong>

            )
        },


        {
            title: "Status",
            dataIndex: "status",
            key: "status",

            render: status => (

                <Tag
                    color={
                        status === "PARTIAL"
                            ? "gold"
                            : "red"
                    }
                >
                    {status}
                </Tag>

            )
        }

    ];


    return (

        <div
            style={{
                padding: 20
            }}
        >

            {/* =================================================
                FILTER CARD
            ================================================= */}

            <Card
                title="Outstanding Fee Report"
                variant="outlined"
            >

                <Row gutter={[16, 16]}>

                    {/* Academic Year */}

                    <Col xs={24} sm={12} md={5}>

                        <label>
                            Academic Year
                        </label>

                        <Select
                            style={{
                                width: "100%",
                                marginTop: 5
                            }}
                            placeholder="All Academic Years"
                            allowClear
                            showSearch
                            optionFilterProp="label"
                            value={academicYearId}
                            onChange={
                                value =>
                                    setAcademicYearId(
                                        value || null
                                    )
                            }
                            options={
                                academicYears.map(
                                    item => ({
                                        value:
                                            item.academic_year_id,
                                        label:
                                            item.year_name
                                    })
                                )
                            }
                        />

                    </Col>


                    {/* Fee Month */}

                    <Col xs={24} sm={12} md={4}>

                        <label>
                            Fee Month
                        </label>

                        <DatePicker
                            placeholder="All Months"
                            picker="month"
                            style={{
                                width: "100%",
                                marginTop: 5
                            }}
                            format="MMMM YYYY"
                            value={feeMonth}
                            onChange={
                                value =>
                                    setFeeMonth(
                                        value || null
                                    )
                            }
                            allowClear
                        />

                    </Col>


                    {/* Class */}

                    <Col xs={24} sm={12} md={5}>

                        <label>
                            Class
                        </label>

                        <Select
                            style={{
                                width: "100%",
                                marginTop: 5
                            }}
                            placeholder="All Classes"
                            allowClear
                            showSearch
                            optionFilterProp="label"
                            value={classId}
                            // onChange={
                            //     handleClassChange
                            // }
                            options={
                                classes.map(
                                    item => ({
                                        value:
                                            item.class_id,
                                        label:
                                            item.name
                                    })
                                )
                            }
                        />

                    </Col>


                    {/* Section */}

                    <Col xs={24} sm={12} md={4}>

                        <label>
                            Section
                        </label>

                        <Select
                            style={{
                                width: "100%",
                                marginTop: 5
                            }}
                            placeholder="All Sections"
                            allowClear
                            showSearch
                            optionFilterProp="label"
                            value={sectionId}
                            // disabled={!classId}
                            onChange={
                                value =>
                                    setSectionId(
                                        value || null
                                    )
                            }
                            options={
                                sections.map(
                                    item => ({
                                        value:
                                            item.section_id,
                                        label:
                                            item.section_name
                                    })
                                )
                            }
                        />

                    </Col>

                    {/* Campus */}

                    <Col xs={24} sm={12} md={4}>

                        <label>
                            Campuses
                        </label>

                        <Select
                            style={{
                                width: "100%",
                                marginTop: 5
                            }}
                            placeholder="Select Campus"
                            allowClear
                            showSearch
                            optionFilterProp="label"
                            value={campusid}
                            
                            onChange={
                                value =>
                                    setCampusId(
                                        value || null
                                    )
                            }
                            options={campus.map(item => ({
                                        value:item.campus_id,
                                        label:item.name
                                    })
                                )
                            }
                        />

                    </Col>

                    {/* Search */}

                    <Col xs={24} sm={24} md={6}>

                        <label>
                            Search
                        </label>

                        <Input
                            style={{
                                marginTop: 5
                            }}
                            prefix={
                                <SearchOutlined />
                            }
                            placeholder="Admission / Student / Father / Challan"
                            value={search}
                            onChange={
                                e =>
                                    setSearch(
                                        e.target.value
                                    )
                            }
                            allowClear
                            onPressEnter={
                                loadReport
                            }
                        />

                    </Col>

                </Row>


                <Space
                    style={{
                        marginTop: 16
                    }}
                >
              <Button
                    type="primary"
                    icon={<SearchOutlined />}
                    onClick={() => loadReport()}
                    
                >
                    Search
                </Button>
               


                    <Button
                        icon={<ReloadOutlined />}
                        onClick={() => {
                            resetFilters();
                            setTimeout(() => {
                                loadReport();
                            }, 0);
                        }}
                    >
                        Reset
                    </Button>


                    <Button
                        icon={
                            <PrinterOutlined />
                        }
                        onClick={
                            printReport
                        }
                        disabled={
                            rows.length === 0
                        }
                    >
                        Print
                    </Button>

                </Space>

            </Card>


            {/* =================================================
                SUMMARY
            ================================================= */}

            <Row
                gutter={[16, 16]}
                style={{
                    marginTop: 20
                }}
            >

                <Col xs={24} md={8}>

                    <Card variant="outlined">

                        <Statistic
                            title="Total Net"
                            value={
                                Number(
                                    totals.total_net || 0
                                )
                            }
                            precision={2}
                        />

                    </Card>

                </Col>


                <Col xs={24} md={8}>

                    <Card variant="outlined">

                        <Statistic
                            title="Total Paid"
                            value={
                                Number(
                                    totals.total_paid || 0
                                )
                            }
                            precision={2}
                        />

                    </Card>

                </Col>


                <Col xs={24} md={8}>

                    <Card variant="outlined">

                        <Statistic
                            title="Total Outstanding"
                            value={
                                Number(
                                    totals.total_balance || 0
                                )
                            }
                            precision={2}
                        />

                    </Card>

                </Col>

            </Row>


            {/* =================================================
                REPORT TABLE
            ================================================= */}

            <Card
                title={`Outstanding Fees (${rows.length})`}
                style={{
                    marginTop: 20
                }}
                variant="outlined"
            >

                <Table
                    rowKey="student_fee_id"
                    columns={columns}
                    dataSource={rows}
                    loading={loading}
                    bordered
                    scroll={{
                        x: "max-content"
                    }}
                    pagination={{
                        pageSize: 20,
                        showSizeChanger: true,
                        showTotal: total =>
                            `Total ${total} records`
                    }}
                />

            </Card>

        </div>

    );
};

export default OutstandingFeeReport;
