import React, { useEffect, useState } from "react";
import axios from "axios";
import dayjs from "dayjs";
import Swal from "sweetalert2";

import {
    Card,
    Form,
    Select,
    DatePicker,
    Button,
    Row,
    Col,
    Typography,
    Divider,
    Alert,
    Space,
    Table,
    Tag,
    Statistic
} from "antd";

const { Title, Text } = Typography;

const API = "/api";

const ClassFeeVoucher = () => {

    const [form] = Form.useForm();

    const [academicYears, setAcademicYears] = useState([]);
    const [classes, setClasses] = useState([]);

    const [loadingYears, setLoadingYears] = useState(false);
    const [loadingClasses, setLoadingClasses] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [loadingGenerated, setLoadingGenerated] = useState(false);

    const [generatedFees, setGeneratedFees] = useState([]);
    const [generatedInfo, setGeneratedInfo] = useState(null);

    const [userInfo, setUserInfo] = useState({
        user_id: null,
        campus_id: null,
        campus_name: "",
        section_id: null,
        section_name: ""
    });

    /*
    ====================================================
    GET LOGGED-IN USER
    ====================================================
    */
    useEffect(() => {

        const storedUser =
            JSON.parse(localStorage.getItem("user") || "{}");

        setUserInfo({
            user_id: storedUser?.user_id || null,
            campus_id: storedUser?.campus_id || null,
            campus_name: storedUser?.campus_name || "",
            section_id: storedUser?.section_id || null,
            section_name: storedUser?.section_name || ""
        });

    }, []);

const createFeeAccounting = async (studentFeeId) => {
    try {

        await axios.post(
            "/api/fee-voucher/accounting",
            {
                student_fee_id: studentFeeId
            }
        );

        console.log(
            "Accounting entry created:",
            studentFeeId
        );

    } catch (error) {

        console.error(
            "FEE ACCOUNTING ERROR:",
            error
        );

    }
};
    /*
    ====================================================
    FORM WATCH
    ====================================================
    */

    const feeMonth = Form.useWatch("fee_month", form);


    /*
    ====================================================
    INITIAL LOAD
    ====================================================
    */

useEffect(() => {
    loadAcademicYears();
}, []);

    useEffect(() => {

    if (
        userInfo.campus_id &&
        userInfo.section_id
    ) {
        loadClasses();
    } else {
        setClasses([]);
    }

}, [
    userInfo.campus_id,
    userInfo.section_id
]);


    /*
    ====================================================
    AUTO SELECT CURRENT ACADEMIC YEAR
    ====================================================
    */

    useEffect(() => {

        if (academicYears.length === 0) return;

        const currentYear = academicYears.find(
            item => Number(item.is_current) === 1
        );

        if (currentYear) {

            form.setFieldValue(
                "academic_year_id",
                currentYear.academic_year_id
            );
        }

    }, [academicYears, form]);


    /*
    ====================================================
    DEFAULT FEE MONTH
    ====================================================
    */

    useEffect(() => {

        if (!form.getFieldValue("fee_month")) {

            form.setFieldValue(
                "fee_month",
                dayjs().startOf("month")
            );
        }

    }, [form]);


    /*
    ====================================================
    FEE MONTH CHANGE
    ====================================================
    */

    useEffect(() => {

        if (!feeMonth) return;

        /*
            Due Date = 10th of selected month
        */
        const dueDate = feeMonth.date(10);

        form.setFieldValue(
            "due_date",
            dueDate
        );

        /*
            Load only selected month's generated data
        */
        loadGeneratedFees(feeMonth);

    }, [feeMonth, form]);


    /*
    ====================================================
    LOAD ACADEMIC YEARS
    ====================================================
    */

    const loadAcademicYears = async () => {

        try {

            setLoadingYears(true);

            const response = await axios.get(
                `${API}/class-fee-voucher/academic-years`
            );

            setAcademicYears(
                Array.isArray(response.data)
                    ? response.data
                    : []
            );

        } catch (error) {

            console.error(
                "LOAD ACADEMIC YEARS ERROR:",
                error
            );

            Swal.fire(
                "Error",
                "Failed to load academic years",
                "error"
            );

        } finally {

            setLoadingYears(false);
        }
    };


    /*
    ====================================================
    LOAD CLASSES
    ====================================================
    */

    const loadClasses = async () => {

        try {

            setLoadingClasses(true);

            const response = await axios.get(
                `${API}/class-fee-voucher/classes`,
            {
                params: {campus_id: userInfo.campus_id, 
                        section_id: userInfo.section_id}
            }
            );

            setClasses(
                Array.isArray(response.data)
                    ? response.data
                    : []
            );

        } catch (error) {

            console.error(
                "LOAD CLASSES ERROR:",
                error
            );

            Swal.fire(
                "Error",
                "Failed to load classes",
                "error"
            );

        } finally {

            setLoadingClasses(false);
        }
    };


    /*
    ====================================================
    LOAD GENERATED FEES FOR SELECTED MONTH
    ====================================================
    */

    const loadGeneratedFees = async (monthValue) => {

        try {

            if (!monthValue) return;

            if (!userInfo.user_id) return;

            setLoadingGenerated(true);

            const academicYearId =
                form.getFieldValue("academic_year_id");

            const feeMonth =
                monthValue.format("YYYY-MM-01");

            const response = await axios.get(
                `${API}/class-fee-voucher/generated`,
                {
                    params: {
                        user_id: userInfo.user_id,
                        academic_year_id: academicYearId || "",
                        fee_month: feeMonth
                    }
                }
            );

            setGeneratedFees(
                Array.isArray(response.data)
                    ? response.data
                    : []
            );

        } catch (error) {

            console.error(
                "LOAD GENERATED FEES ERROR:",
                error
            );

            setGeneratedFees([]);

        } finally {

            setLoadingGenerated(false);
        }
    };


    /*
    ====================================================
    GENERATE FEES
    ====================================================
    */

    const handleGenerate = async (values) => {

        try {

            const storedUser =
                JSON.parse(
                    localStorage.getItem("user") || "{}"
                );

            const user_id =
                storedUser?.user_id;

            if (!user_id) {

                Swal.fire(
                    "Login Required",
                    "Logged-in user information not found.",
                    "warning"
                );

                return;
            }

            if (!userInfo.campus_id) {

                Swal.fire(
                    "Error",
                    "Campus information not found for logged-in user.",
                    "error"
                );

                return;
            }

            if (!userInfo.section_id) {

                Swal.fire(
                    "Error",
                    "Section information not found for logged-in user.",
                    "error"
                );

                return;
            }

            const academicYearId =
                values.academic_year_id;

            const classId =
                values.class_id;

            const feeMonth =
                values.fee_month.format("YYYY-MM-01");

            const dueDate =
                values.due_date.format("YYYY-MM-DD");


            /*
                CHECK DUPLICATE
            */

            const checkResponse = await axios.get(
                `${API}/class-fee-voucher/check`,
                {
                    params: {
                        user_id,
                        academic_year_id: academicYearId,
                        class_id: classId,
                        fee_month: feeMonth
                    }
                }
            );


            if (checkResponse.data?.exists) {

                Swal.fire(
                    "Already Generated",
                    `Fee has already been generated for this class and month for Section ${userInfo.section_name || ""}.`,
                    "warning"
                );

                await loadGeneratedFees(values.fee_month);

                return;
            }


            /*
                GET CLASS NAME
            */

            const selectedClass =
                classes.find(
                    item =>
                        Number(item.class_id) ===
                        Number(classId)
                );

            const className =
                selectedClass?.name || "Selected Class";


            /*
                CONFIRMATION
            */

            const result = await Swal.fire({

                title: "Generate Class Fee?",

                html: `
                    <div style="text-align:left">
                        <p><b>Campus:</b> ${userInfo.campus_name || "-"}</p>
                        <p><b>Section:</b> ${userInfo.section_name || "-"}</p>
                        <p><b>Class:</b> ${className}</p>
                        <p><b>Fee Month:</b> ${values.fee_month.format("MMMM YYYY")}</p>
                        <p><b>Due Date:</b> ${values.due_date.format("DD-MM-YYYY")}</p>
                    </div>

                    <p style="margin-top:15px">
                        Fees will be generated for all active students
                        of this class in your assigned section.
                    </p>
                `,

                icon: "question",

                showCancelButton: true,

                confirmButtonText: "Yes, Generate",

                cancelButtonText: "Cancel"
            });


            if (!result.isConfirmed) {
                return;
            }


            /*
                GENERATE
            */

            setGenerating(true);

            const response = await axios.post(
                `${API}/class-fee-voucher/generate`,
                {
                    user_id,
                    academic_year_id: academicYearId,
                    class_id: classId,
                    fee_month: feeMonth,
                    due_date: dueDate
                }
            );


            setGeneratedInfo(response.data);


            await Swal.fire(
                "Generated Successfully",
                `${response.data.generated_count} student fee voucher(s) generated for ${response.data.class_name}.`,
                "success"
            );


            /*
                REFRESH TABLE
            */

            await loadGeneratedFees(
                values.fee_month
            );


            /*
                RESET CLASS ONLY
            */

            form.setFieldValue(
                "class_id",
                undefined
            );


        } catch (error) {

            console.error(
                "GENERATE FEES ERROR:",
                error
            );

            Swal.fire(
                "Error",
                error?.response?.data?.message ||
                "Failed to generate class fee vouchers",
                "error"
            );

        } finally {

            setGenerating(false);
        }
    };


    /*
    ====================================================
    TABLE COLUMNS
    ====================================================
    */

    const columns = [

        {
            title: "#",
            key: "index",
            width: 60,
            render: (_, __, index) =>
                index + 1
        },

        {
            title: "Class",
            dataIndex: "class_name",
            key: "class_name"
        },

        {
            title: "Section",
            dataIndex: "section_name",
            key: "section_name",
            render: value =>
                value || userInfo.section_name || "-"
        },

        {
            title: "Students",
            dataIndex: "total_students",
            key: "total_students",
            align: "center"
        },

        {
            title: "Total Amount",
            dataIndex: "total_amount",
            key: "total_amount",
            align: "right",
            render: value =>
                Number(value || 0).toLocaleString()
        },

        {
            title: "Month",
            dataIndex: "fee_month",
            key: "fee_month",
            render: value =>
                value
                    ? dayjs(value).format("MMMM YYYY")
                    : "-"
        },

        {
            title: "Status",
            key: "status",
            align: "center",
            render: () => (
                <Tag color="green">
                    Generated
                </Tag>
            )
        }

    ];


    /*
    ====================================================
    RENDER
    ====================================================
    */

    return (

        <div style={{ padding: 20 }}>

            <Card>

                <Title level={3}>
                    Class Fee Voucher
                </Title>

                <Divider />

                <Alert
                    type="info"
                    showIcon
                    style={{ marginBottom: 20 }}
                    message={
                        <>
                            <b>Fee Generation Access:</b>{" "}
                            {userInfo.campus_name || "-"}{" "}
                            / Section{" "}
                            {userInfo.section_name || "-"}
                        </>
                    }
                    description="You can generate fees only for active students belonging to your assigned campus and section."
                />


                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleGenerate}
                >

                    <Row gutter={[16, 8]}>

                        {/* CAMPUS */}

                        <Col xs={24} md={6}>

                            <Form.Item
                                label="Campus"
                            >

                                <Select
                                    value={
                                        userInfo.campus_id
                                            ? Number(userInfo.campus_id)
                                            : undefined
                                    }
                                    disabled
                                    options={[
                                        {
                                            value: Number(
                                                userInfo.campus_id
                                            ),
                                            label:
                                                userInfo.campus_name ||
                                                "Campus"
                                        }
                                    ]}
                                />

                            </Form.Item>

                        </Col>


                        {/* SECTION */}

                        <Col xs={24} md={6}>

                            <Form.Item
                                label="Section"
                            >

                                <Select
                                    value={
                                        userInfo.section_id
                                            ? Number(userInfo.section_id)
                                            : undefined
                                    }
                                    disabled
                                    options={[
                                        {
                                            value: Number(
                                                userInfo.section_id
                                            ),
                                            label:
                                                userInfo.section_name ||
                                                "Section"
                                        }
                                    ]}
                                />

                            </Form.Item>

                        </Col>


                        {/* ACADEMIC YEAR */}

                        <Col xs={24} md={6}>

                            <Form.Item
                                name="academic_year_id"
                                label="Academic Year"
                                rules={[
                                    {
                                        required: true,
                                        message:
                                            "Please select academic year"
                                    }
                                ]}
                            >

                                <Select
                                    loading={loadingYears}
                                    placeholder="Select Academic Year"
                                    options={
                                        academicYears.map(item => ({
                                            value:
                                                item.academic_year_id,
                                            label:
                                                item.year_name
                                        }))
                                    }
                                />

                            </Form.Item>

                        </Col>


                        {/* CLASS */}

                        <Col xs={24} md={6}>

                            <Form.Item
                                name="class_id"
                                label="Class"
                                rules={[
                                    {
                                        required: true,
                                        message:
                                            "Please select class"
                                    }
                                ]}
                            >

                                <Select
                                    loading={loadingClasses}
                                    placeholder="Select Class"
                                    showSearch
                                    optionFilterProp="label"
                                    options={
                                        classes.map(item => ({
                                            value:
                                                item.class_id,
                                            label:
                                                item.name
                                        }))
                                    }
                                />

                            </Form.Item>

                        </Col>


                        {/* FEE MONTH */}

                        <Col xs={24} md={6}>

                            <Form.Item
                                name="fee_month"
                                label="Fee Month"
                                rules={[
                                    {
                                        required: true,
                                        message:
                                            "Please select fee month"
                                    }
                                ]}
                            >

                                <DatePicker
                                    picker="month"
                                    format="MMMM YYYY"
                                    style={{
                                        width: "100%"
                                    }}
                                    allowClear={false}
                                />

                            </Form.Item>

                        </Col>


                        {/* DUE DATE */}

                        <Col xs={24} md={6}>

                            <Form.Item
                                name="due_date"
                                label="Due Date"
                            >

                                <DatePicker
                                    format="DD-MM-YYYY"
                                    style={{
                                        width: "100%"
                                    }}
                                    disabled
                                />

                            </Form.Item>

                        </Col>


                        {/* GENERATE BUTTON */}

                        <Col
                            xs={24}
                            md={12}
                            style={{
                                display: "flex",
                                alignItems: "end"
                            }}
                        >

                            <Form.Item>

                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    loading={generating}
                                    disabled={
                                        !userInfo.user_id ||
                                        !userInfo.campus_id ||
                                        !userInfo.section_id
                                    }
                                >
                                    Generate Class Fee
                                </Button>

                            </Form.Item>

                        </Col>

                    </Row>

                </Form>

            </Card>


            {/* ====================================================
                GENERATED FEES TABLE
            ==================================================== */}

            <Card
                style={{
                    marginTop: 20
                }}
            >

                <Row
                    justify="space-between"
                    align="middle"
                    style={{
                        marginBottom: 16
                    }}
                >

                    <Col>

                        <Title
                            level={4}
                            style={{ margin: 0 }}
                        >
                            Generated Fees
                        </Title>

                        <Text type="secondary">

                            {feeMonth
                                ? feeMonth.format("MMMM YYYY")
                                : "Select Fee Month"}

                            {" • "}

                            Section{" "}
                            {userInfo.section_name || "-"}

                        </Text>

                    </Col>


                    <Col>

                        <Statistic
                            title="Generated Classes"
                            value={generatedFees.length}
                        />

                    </Col>

                </Row>


                <Table

                    rowKey={(record, index) =>
                        record.class_id
                            ? `${record.class_id}-${record.section_id}-${record.fee_month}`
                            : index
                    }

                    loading={loadingGenerated}

                    columns={columns}

                    dataSource={generatedFees}

                    pagination={{ pageSize: 10,
                    showSizeChanger: true,
                    pageSizeOptions: ["10", "20", "50", "100"]}}

                    bordered

                    locale={{
                        emptyText:
                            feeMonth
                                ? `No fee generated for ${feeMonth.format("MMMM YYYY")} in Section ${userInfo.section_name || "-"}`
                                : "Select Fee Month"
                    }}

                />

            </Card>

        </div>
    );
};

export default ClassFeeVoucher;