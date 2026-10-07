import React, { useEffect, useState } from "react";
import axios from "axios";
import dayjs from "dayjs";
import {
    Card,
    Row,
    Col,
    Select,
    DatePicker,
    Input,
    Button,
    Table,
    Tag,
    Space,
    message,
    Statistic
} from "antd";

import {
    SearchOutlined,
    ReloadOutlined,
    PrinterOutlined,
    FileExcelOutlined
} from "@ant-design/icons";

import * as XLSX from "xlsx";

const { RangePicker } = DatePicker;

const FeeCollectionReport = () => {

    const [loading, setLoading] = useState(false);

    const [rows, setRows] = useState([]);

    const [totals, setTotals] = useState({
        cash: 0,
        bank: 0,
        total: 0,
        count: 0
    });

    const [academicYears, setAcademicYears] = useState([]);
    const [classes, setClasses] = useState([]);
    const [sections, setSections] = useState([]);

    const [filters, setFilters] = useState({
        academic_year_id: undefined,
        class_id: undefined,
        section_id: undefined,
        payment_method: "ALL",
        search: "",
        from_date: null,
        to_date: null
    });

    // =====================================================
    // LOAD INITIAL DATA
    // =====================================================

    useEffect(() => {
        loadAcademicYears();
        loadClasses();
        loadReport();
    }, []);

    // =====================================================
    // ACADEMIC YEARS
    // =====================================================

    const loadAcademicYears = async () => {
        try {

            const res = await axios.get(
                "/api/academic-years"
            );

            setAcademicYears(res.data || []);

        } catch (error) {

            console.error(error);

            message.error(
                "Unable to load academic years"
            );
        }
    };

    // =====================================================
    // CLASSES
    // =====================================================

    const loadClasses = async () => {
        try {

            const res = await axios.get(
                "/api/classes"
            );

            setClasses(res.data || []);

        } catch (error) {

            console.error(error);

            message.error(
                "Unable to load classes"
            );
        }
    };

    // =====================================================
    // SECTIONS
    // =====================================================

    const loadSections = async (classId) => {

        if (!classId) {
            setSections([]);
            return;
        }

        try {

            const res = await axios.get(
                `/api/student-sections?class_id=${classId}`
            );

            setSections(res.data || []);

        } catch (error) {

            console.error(error);

            message.error(
                "Unable to load sections"
            );
        }
    };

    // =====================================================
    // LOAD REPORT
    // =====================================================

    const loadReport = async () => {

        try {

            setLoading(true);

            const params = {};

            if (filters.from_date) {
                params.from_date =
                    filters.from_date.format("YYYY-MM-DD");
            }

            if (filters.to_date) {
                params.to_date =
                    filters.to_date.format("YYYY-MM-DD");
            }

            if (filters.academic_year_id) {
                params.academic_year_id =
                    filters.academic_year_id;
            }

            if (filters.class_id) {
                params.class_id =
                    filters.class_id;
            }

            if (filters.section_id) {
                params.section_id =
                    filters.section_id;
            }

            if (
                filters.payment_method &&
                filters.payment_method !== "ALL"
            ) {
                params.payment_method =
                    filters.payment_method;
            }

            if (filters.search?.trim()) {
                params.search =
                    filters.search.trim();
            }

            const res = await axios.get(
                "/api/fee-collection-report",
                {
                    params
                }
            );

            setRows(res.data?.rows || []);

            setTotals(
                res.data?.totals || {
                    cash: 0,
                    bank: 0,
                    total: 0,
                    count: 0
                }
            );

        } catch (error) {

            console.error(
                "Fee Collection Report Error:",
                error
            );

            message.error(
                error.response?.data?.message ||
                "Unable to load fee collection report"
            );

        } finally {

            setLoading(false);
        }
    };

    // =====================================================
    // SEARCH
    // =====================================================

    const handleSearch = () => {
        loadReport();
    };

    // =====================================================
    // RESET
    // =====================================================

    const handleReset = () => {

        const resetFilters = {
            academic_year_id: undefined,
            class_id: undefined,
            section_id: undefined,
            payment_method: "ALL",
            search: "",
            from_date: null,
            to_date: null
        };

        setFilters(resetFilters);

        setSections([]);

        setTimeout(() => {
            loadReport();
        }, 0);
    };

    // =====================================================
    // DATE RANGE
    // =====================================================

    const handleDateChange = (dates) => {

        setFilters(prev => ({
            ...prev,
            from_date: dates?.[0] || null,
            to_date: dates?.[1] || null
        }));
    };

    // =====================================================
    // CLASS CHANGE
    // =====================================================

    const handleClassChange = (value) => {

        setFilters(prev => ({
            ...prev,
            class_id: value,
            section_id: undefined
        }));

        loadSections(value);
    };

    // =====================================================
    // FORMAT DATE
    // =====================================================

    const formatDate = (date) => {

        if (!date) {
            return "-";
        }

        return dayjs(date).format(
            "DD-MM-YYYY"
        );
    };

    // =====================================================
    // FORMAT MONTH
    // =====================================================

    const formatMonth = (date) => {

        if (!date) {
            return "-";
        }

        return dayjs(date).format(
            "MMMM YYYY"
        );
    };

    // =====================================================
    // MONEY
    // =====================================================

    const money = (value) => {

        return Number(
            value || 0
        ).toLocaleString(
            "en-PK",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        );
    };

    // =====================================================
    // PRINT
    // =====================================================

    const handlePrint = () => {

        window.print();
    };

    // =====================================================
    // EXCEL
    // =====================================================

    const handleExcel = () => {

        if (!rows.length) {

            message.warning(
                "No data available to export"
            );

            return;
        }

        const excelData = rows.map(
            (row, index) => ({
                "S.No": index + 1,
                "Receipt No": row.receipt_no,
                "Payment Date":
                    formatDate(row.payment_date),
                "Admission No":
                    row.admission_no,
                "Student Name":
                    row.student_name,
                "Father Name":
                    row.father_name,
                "Class":
                    row.class_name,
                "Section":
                    row.section_name,
                "Academic Year":
                    row.academic_year,
                "Fee Month":
                    formatMonth(row.fee_month),
                "Payment Method":
                    row.payment_method,
                "Reference No":
                    row.reference_no || "",
                "Amount Paid":
                    Number(row.amount_paid || 0)
            })
        );

        excelData.push({});

        excelData.push({
            "Student Name": "CASH COLLECTION",
            "Amount Paid": Number(
                totals.cash || 0
            )
        });

        excelData.push({
            "Student Name": "BANK COLLECTION",
            "Amount Paid": Number(
                totals.bank || 0
            )
        });

        excelData.push({
            "Student Name": "GRAND TOTAL",
            "Amount Paid": Number(
                totals.total || 0
            )
        });

        const worksheet =
            XLSX.utils.json_to_sheet(
                excelData
            );

        const workbook =
            XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(
            workbook,
            worksheet,
            "Fee Collection"
        );

        XLSX.writeFile(
            workbook,
            "Fee_Collection_Report.xlsx"
        );
    };

    // =====================================================
    // TABLE COLUMNS
    // =====================================================

    const columns = [

        {
            title: "S.No",
            width: 60,
            align: "center",
            render: (_, __, index) =>
                index + 1
        },

        {
            title: "Receipt No",
            dataIndex: "receipt_no",
            width: 120
        },

        {
            title: "Date",
            dataIndex: "payment_date",
            width: 110,
            render: value =>
                formatDate(value)
        },

        {
            title: "Admission No",
            dataIndex: "admission_no",
            width: 110
        },

        {
            title: "Student",
            dataIndex: "student_name",
            width: 160
        },

        {
            title: "Father Name",
            dataIndex: "father_name",
            width: 160
        },

        {
            title: "Class",
            dataIndex: "class_name",
            width: 100
        },

        {
            title: "Section",
            dataIndex: "section_name",
            width: 90
        },

        {
            title: "Fee Month",
            dataIndex: "fee_month",
            width: 130,
            render: value =>
                formatMonth(value)
        },

        {
            title: "Payment",
            dataIndex: "payment_method",
            width: 100,
            align: "center",
            render: value => {

                if (value === "CASH") {
                    return (
                        <Tag color="green">
                            CASH
                        </Tag>
                    );
                }

                return (
                    <Tag color="blue">
                        BANK
                    </Tag>
                );
            }
        },

        {
            title: "Reference",
            dataIndex: "reference_no",
            width: 120,
            render: value =>
                value || "-"
        },

        {
            title: "Amount",
            dataIndex: "amount_paid",
            width: 120,
            align: "right",
            render: value =>
                money(value)
        }
    ];

    return (
        <div
            className="fee-collection-report"
            style={{
                padding: "20px"
            }}
        >

            {/* ================================================= */}
            {/* HEADER */}
            {/* ================================================= */}

            <Card
                title="Fee Collection Report"
                variant="outlined"
                className="no-print"
            >

                {/* ================================================= */}
                {/* FILTERS */}
                {/* ================================================= */}

                <Row
                    gutter={[
                        12,
                        12
                    ]}
                >

                    <Col
                        xs={24}
                        sm={12}
                        md={8}
                    >

                        <label>
                            Date Range
                        </label>

                        <RangePicker
                            style={{
                                width: "100%"
                            }}
                            value={
                                filters.from_date &&
                                filters.to_date
                                    ? [
                                        filters.from_date,
                                        filters.to_date
                                    ]
                                    : null
                            }
                            onChange={
                                handleDateChange
                            }
                            format="DD-MM-YYYY"
                        />

                    </Col>

                    <Col
                        xs={24}
                        sm={12}
                        md={5}
                    >

                        <label>
                            Academic Year
                        </label>

                        <Select
                            allowClear
                            style={{
                                width: "100%"
                            }}
                            placeholder="Academic Year"
                            value={
                                filters.academic_year_id
                            }
                            onChange={value =>
                                setFilters(prev => ({
                                    ...prev,
                                    academic_year_id:
                                        value
                                }))
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

                    <Col
                        xs={24}
                        sm={12}
                        md={5}
                    >

                        <label>
                            Class
                        </label>

                        <Select
                            allowClear
                            style={{
                                width: "100%"
                            }}
                            placeholder="Class"
                            value={
                                filters.class_id
                            }
                            onChange={
                                handleClassChange
                            }
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

                    <Col
                        xs={24}
                        sm={12}
                        md={6}
                    >

                        <label>
                            Section
                        </label>

                        <Select
                            allowClear
                            style={{
                                width: "100%"
                            }}
                            placeholder="Section"
                            value={
                                filters.section_id
                            }
                            disabled={
                                !filters.class_id
                            }
                            onChange={value =>
                                setFilters(prev => ({
                                    ...prev,
                                    section_id:
                                        value
                                }))
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

                    <Col
                        xs={24}
                        sm={12}
                        md={5}
                    >

                        <label>
                            Payment Method
                        </label>

                        <Select
                            style={{
                                width: "100%"
                            }}
                            value={
                                filters.payment_method
                            }
                            onChange={value =>
                                setFilters(prev => ({
                                    ...prev,
                                    payment_method:
                                        value
                                }))
                            }
                            options={[
                                {
                                    value: "ALL",
                                    label: "All"
                                },
                                {
                                    value: "CASH",
                                    label: "Cash"
                                },
                                {
                                    value: "BANK",
                                    label: "Bank"
                                }
                            ]}
                        />

                    </Col>

                    <Col
                        xs={24}
                        sm={12}
                        md={7}
                    >

                        <label>
                            Search
                        </label>

                        <Input
                            placeholder="Receipt / Admission / Student / Father"
                            value={
                                filters.search
                            }
                            onChange={e =>
                                setFilters(prev => ({
                                    ...prev,
                                    search:
                                        e.target.value
                                }))
                            }
                            onPressEnter={
                                handleSearch
                            }
                        />

                    </Col>

                    <Col
                        xs={24}
                        md={12}
                        style={{
                            display: "flex",
                            alignItems: "flex-end"
                        }}
                    >

                        <Space>

                            <Button
                                type="primary"
                                icon={
                                    <SearchOutlined />
                                }
                                onClick={
                                    handleSearch
                                }
                            >
                                Search
                            </Button>

                            <Button
                                icon={
                                    <ReloadOutlined />
                                }
                                onClick={
                                    handleReset
                                }
                            >
                                Reset
                            </Button>

                            <Button
                                icon={
                                    <PrinterOutlined />
                                }
                                onClick={
                                    handlePrint
                                }
                            >
                                Print
                            </Button>

                            <Button
                                icon={
                                    <FileExcelOutlined />
                                }
                                onClick={
                                    handleExcel
                                }
                            >
                                Excel
                            </Button>

                        </Space>

                    </Col>

                </Row>

            </Card>

            {/* ================================================= */}
            {/* TOTALS */}
            {/* ================================================= */}

            <Row
                gutter={[
                    12,
                    12
                ]}
                style={{
                    marginTop: 15
                }}
                className="no-print"
            >

                <Col
                    xs={24}
                    sm={8}
                >

                    <Card variant="outlined">

                        <Statistic
                            title="Cash Collection"
                            value={
                                totals.cash
                            }
                            precision={2}
                        />

                    </Card>

                </Col>

                <Col
                    xs={24}
                    sm={8}
                >

                    <Card variant="outlined">

                        <Statistic
                            title="Bank Collection"
                            value={
                                totals.bank
                            }
                            precision={2}
                        />

                    </Card>

                </Col>

                <Col
                    xs={24}
                    sm={8}
                >

                    <Card variant="outlined">

                        <Statistic
                            title="Grand Total"
                            value={
                                totals.total
                            }
                            precision={2}
                        />

                    </Card>

                </Col>

            </Row>

            {/* ================================================= */}
            {/* TABLE */}
            {/* ================================================= */}

            <Card
                variant="outlined"
                style={{
                    marginTop: 15
                }}
            >

                <Table
                    rowKey="fee_receipt_id"
                    columns={columns}
                    dataSource={rows}
                    loading={loading}
                    bordered
                    size="small"
                    scroll={{
                        x: 1500
                    }}
                    pagination={{
                        pageSize: 25,
                        showSizeChanger: true,
                        pageSizeOptions: [
                            25,
                            50,
                            100
                        ]
                    }}
                />

            </Card>

        </div>
    );
};

export default FeeCollectionReport;