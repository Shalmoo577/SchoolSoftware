
import React, { useEffect, useState } from "react";

import axios from "axios";
import dayjs from "dayjs";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

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
    Modal,
    Form,
    InputNumber,
    Divider,
    Typography,
    message,
    Tooltip
} from "antd";

import {
    SearchOutlined,
    EditOutlined,
    PrinterOutlined,
    ReloadOutlined,
    SaveOutlined,
    PrinterFilled,
    AppstoreOutlined
     
} from "@ant-design/icons";

const { Title, Text } = Typography;

const API = "/api";


const StudentFee = () => {

    const [form] = Form.useForm();
    const [editForm] = Form.useForm();

    const user = JSON.parse(
        localStorage.getItem("user") || "null"
    );

    const isAdmin =
        user?.role === "SUPER_ADMIN" ||
        user?.role === "CAMPUS_ADMIN";

    
    // ====================================================
    // FILTER DATA
    // ====================================================

    const [academicYears, setAcademicYears] = useState([]);
    const [classes, setClasses] = useState([]);
    const [campuses, setCampuses] = useState([]);
    const [sections, setSections] = useState([]);

    const [feeMonth, setFeeMonth] = useState(
        dayjs().startOf("month")
    );


    const navigate = useNavigate();


    // ====================================================
    // TABLE
    // ====================================================

    const [studentFees, setStudentFees] = useState([]);
    const [loading, setLoading] = useState(false);
    

    // ====================================================
    // EDIT
    // ====================================================

    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingFee, setEditingFee] = useState(null);
    const [editDetails, setEditDetails] = useState([]);
    const [saving, setSaving] = useState(false);


    // ====================================================
    // ADJUSTMENT
    // ====================================================

    const [adjustmentModalOpen, setAdjustmentModalOpen] =
        useState(false);

    const [adjustmentType, setAdjustmentType] =
        useState("");

    const [adjustmentAmount, setAdjustmentAmount] =
        useState(0);

    const [adjustmentAccounts, setAdjustmentAccounts] =
        useState([]);

    const [adjustmentAccountsLoading, setAdjustmentAccountsLoading] =
        useState(false);

    const [selectedAdjustmentAccount, setSelectedAdjustmentAccount] =
        useState(null);

    const [discountAdjustmentAccount, setDiscountAdjustmentAccount] =
        useState(null);

    const [fineAdjustmentAccount, setFineAdjustmentAccount] =
        useState(null);


    // ====================================================
    // INITIAL USER FILTER VALUES
    // ====================================================

    useEffect(() => {

        if (!user) {
            return;
        }

        form.setFieldsValue({

            campus_id:
                user.campus_id || undefined,

            section_id:
                user.section_id || undefined

        });

    }, [form]);


    // ====================================================
    // CURRENT ACADEMIC YEAR
    // ====================================================

    useEffect(() => {

        if (!academicYears.length) {
            return;
        }

        const currentYear =
            academicYears.find(
                item =>
                    Number(item.is_current) === 1
            );

        if (currentYear) {

            form.setFieldValue(
                "academic_year_id",
                currentYear.academic_year_id
            );

        }

    }, [academicYears, form]);


    // ====================================================
    // INITIAL LOAD
    // ====================================================

    useEffect(() => {

        loadAcademicYears();
        loadCampuses();
        loadClasses();

    }, []);



const handlePrintAllVouchers = () => {

    const values = form.getFieldsValue(true);

    const campusId = values.campus_id;
    const academicYearId = values.academic_year_id;
    const classId = values.class_id;
    const sectionId = values.section_id;

    // ==========================================
    // VALIDATE FEE MONTH
    // ==========================================

    if (!feeMonth || !dayjs.isDayjs(feeMonth)) {

        message.error("Please select Fee Month");

        return;
    }

    // ==========================================
    // FORMAT FEE MONTH
    // ==========================================

    const feeMonthValue = feeMonth
        .clone()
        .startOf("month")
        .format("YYYY-MM");

    // ==========================================
    // DEBUG
    // ==========================================

    console.log(
        "PRINT ALL FILTERS:",
        {
            campus_id: campusId,
            academic_year_id: academicYearId,
            class_id: classId,
            section_id: sectionId,
            fee_month: feeMonthValue
        }
    );

    // ==========================================
    // VALIDATION
    // ==========================================

    if (!campusId) {
        message.error("Please select Campus");
        return;
    }

    if (!academicYearId) {
        message.error("Please select Academic Year");
        return;
    }

    if (!classId) {
        message.error("Please select Class");
        return;
    }

    if (!sectionId) {
        message.error("Please select Section");
        return;
    }

    // ==========================================
    // BUILD URL
    // ==========================================

    const params = new URLSearchParams();

    params.set(
        "campus_id",
        String(campusId)
    );

    params.set(
        "academic_year_id",
        String(academicYearId)
    );

    params.set(
        "class_id",
        String(classId)
    );

    params.set(
        "section_id",
        String(sectionId)
    );

    params.set(
        "fee_month",
        feeMonthValue
    );

    const printUrl =
        `/student-fee-voucher-all?${params.toString()}`;

    console.log(
        "PRINT URL:",
        printUrl
    );

    navigate(printUrl);
};

    // ====================================================
    // LOAD CAMPUSES




    const loadCampuses = async () => {

        try {

            const response =
                await axios.get(
                    `${API}/campuses`
                );

            setCampuses(
                response.data || []
            );

        } catch (error) {

            console.error(
                "LOAD CAMPUSES ERROR:",
                error
            );

            message.error(
                "Failed to load campuses"
            );

        }

    };


    // ====================================================
    // LOAD ACADEMIC YEARS
    // ====================================================

    const loadAcademicYears = async () => {

        try {

            const response =
                await axios.get(
                    `${API}/class-fee-voucher/academic-years`
                );

            setAcademicYears(
                response.data || []
            );

        } catch (error) {

            console.error(error);

            message.error(
                "Failed to load academic years"
            );

        }

    };


    // ====================================================
    // LOAD CLASSES
    // ====================================================

   const loadClasses = async () => {

    try {

        const params = {};

        // Normal user ke liye filter
        if (!isAdmin) {

            params.campus_id = user?.campus_id;
            params.section_id = user?.section_id;

        }

        const response = await axios.get(
            "/api/class-fee-voucher/classes",
            {
                params
            }
        );

        console.log("Classes:", response.data);

        setClasses(
            Array.isArray(response.data)
                ? response.data
                : []
        );

    } catch (error) {

        console.error(
            "Load Classes Error:",
            error.response?.data || error
        );

        setClasses([]);

        message.error("Failed to load classes");
    }
};


    // ====================================================
    // LOAD SECTIONS
    // ====================================================

    const loadSections = async (
        selectedClassId
    ) => {

        if (!selectedClassId) {

            setSections([]);

            return;
        }

        try {

            const response =
                await axios.get(
                    `${API}/student-sections`,
                    {
                        params: {
                            class_id:
                                selectedClassId
                        }
                    }
                );

            setSections(
                response.data || []
            );

        } catch (error) {

            console.error(error);

            setSections([]);

            message.error(
                "Failed to load sections"
            );

        }

    };


    // ====================================================
    // LOAD STUDENT FEES
    // ====================================================

    const loadStudentFees = async () => {

        try {

            setLoading(true);

            const values =
                form.getFieldsValue();

            const params = {};


            // Academic Year
            if (
                values.academic_year_id
            ) {

                params.academic_year_id =
                    values.academic_year_id;

            }


            // Fee Month
            if (feeMonth) {

                params.fee_month =
                    feeMonth.format(
                        "YYYY-MM-01"
                    );

            }


            // Class
            if (values.class_id) {

                params.class_id =
                    values.class_id;

            }


            // Campus
            if (values.campus_id) {

                params.campus_id =
                    values.campus_id;

            }


            // Section
            if (values.section_id) {

                params.section_id =
                    values.section_id;

            }


            // Search
            if (
                values.search?.trim()
            ) {

                params.search =
                    values.search.trim();

            }


            const response =
                await axios.get(
                    `${API}/student-fees`,
                    {
                        params
                    }
                );


            setStudentFees(
                response.data || []
            );

        } catch (error) {

            console.error(
                "LOAD STUDENT FEES ERROR:",
                error
            );

            message.error(
                error.response?.data?.message ||
                "Failed to load student fees"
            );

        } finally {

            setLoading(false);

        }

    };


    // ====================================================
    // SEARCH
    // ====================================================

    const handleSearch = async () => {

        try {

            await form.validateFields();

            await loadStudentFees();

        } catch (error) {

            console.log(
                "FILTER VALIDATION:",
                error
            );

        }

    };


    // ====================================================
    // CLEAR
    // ====================================================

    const handleClear = () => {

        form.resetFields();

        setSections([]);

        setStudentFees([]);

        setFeeMonth(
            dayjs().startOf("month")
        );


        if (
            user &&
            !isAdmin
        ) {

            form.setFieldsValue({

                campus_id:
                    user.campus_id,

                section_id:
                    user.section_id

            });

        }

    };


    // ====================================================
    // EDIT STUDENT FEE
    // ====================================================

    const handleEdit = async (
        studentFeeId
    ) => {

        try {

            setLoading(true);


            const response =
                await axios.get(
                    `${API}/student-fees/${studentFeeId}`
                );


            console.log(
                "EDIT FEE API RESPONSE:",
                response.data
            );


            const fee =
                response.data?.fee;

            const details =
                response.data?.details || [];


            if (!fee) {

                message.error(
                    "Student fee data not found"
                );

                return;
            }


            // ==================================================
            // FORMAT MAIN FEE
            // ==================================================

            const formattedFee = {

                ...fee,

                total_amount:
                    Number(
                        fee.total_amount || 0
                    ),

                discount_amount:
                    Number(
                        fee.discount_amount || 0
                    ),

                fine_amount:
                    Number(
                        fee.fine_amount || 0
                    ),

                net_amount:
                    Number(
                        fee.net_amount || 0
                    ),

                paid_amount:
                    Number(
                        fee.paid_amount || 0
                    ),

                balance_amount:
                    Number(
                        fee.balance_amount || 0
                    )

            };


            // ==================================================
            // FORMAT DETAILS
            // ==================================================

            const formattedDetails =
                details.map(item => ({

                    ...item,

                    amount:
                        Number(
                            item.amount || 0
                        )

                }));


            // ==================================================
            // SUBSIDIARY ACCOUNTS
            // ==================================================

            const discountSA =
                formattedFee.discount_sa_id
                    ? Number(
                        formattedFee.discount_sa_id
                    )
                    : null;


            const fineSA =
                formattedFee.fine_sa_id
                    ? Number(
                        formattedFee.fine_sa_id
                    )
                    : null;


            setDiscountAdjustmentAccount(
                discountSA
            );


            setFineAdjustmentAccount(
                fineSA
            );


            setSelectedAdjustmentAccount(
                null
            );


            // ==================================================
            // SET DATA
            // ==================================================

            setEditingFee(
                formattedFee
            );


            setEditDetails(
                formattedDetails
            );


            // ==================================================
            // SET EDIT FORM
            // ==================================================

            editForm.setFieldsValue({

                discount_amount:
                    formattedFee.discount_amount,

                fine_amount:
                    formattedFee.fine_amount,

                discount_sa_id:
                    discountSA,

                fine_sa_id:
                    fineSA,

                remarks:
                    formattedFee.remarks || ""

            });


            // ==================================================
            // OPEN
            // ==================================================

            setEditModalOpen(true);

        } catch (error) {

            console.error(
                "LOAD EDIT FEE ERROR:",
                error.response?.data ||
                error
            );

            message.error(
                error.response?.data?.message ||
                "Failed to load student fee"
            );

        } finally {

            setLoading(false);

        }

    };


    // ====================================================
    // DETAIL AMOUNT CHANGE
    // ====================================================

    const handleDetailAmountChange = (
        index,
        value
    ) => {

        setEditDetails(prev => {

            const updated =
                [...prev];

            updated[index] = {

                ...updated[index],

                amount:
                    Number(
                        value || 0
                    )

            };

            return updated;

        });

    };


    // ====================================================
    // LOAD ADJUSTMENT ACCOUNTS
    // ====================================================

    const loadAdjustmentAccounts =
        async () => {

            try {

                setAdjustmentAccountsLoading(
                    true
                );


                const response =
                    await axios.get(
                        `${API}/student-fees/adjustment-accounts`
                    );


                setAdjustmentAccounts(
                    response.data || []
                );


            } catch (error) {

                console.error(
                    "LOAD ADJUSTMENT ACCOUNTS ERROR:",
                    error.response?.data ||
                    error
                );

                message.error(
                    error.response?.data?.message ||
                    "Failed to load subsidiary accounts"
                );

            } finally {

                setAdjustmentAccountsLoading(
                    false
                );

            }

        };


    // ====================================================
    // OPEN ADJUSTMENT MODAL
    // ====================================================

    const openAdjustmentModal =
        async (
            type,
            value
        ) => {

            const amount =
                Number(value || 0);


            if (amount <= 0) {
                return;
            }


            setAdjustmentType(
                type
            );


            setAdjustmentAmount(
                amount
            );


            // --------------------------------------------
            // SHOW EXISTING ACCOUNT IF AVAILABLE
            // --------------------------------------------

            let existingAccount =
                null;


            if (
                type ===
                "DISCOUNT"
            ) {

                existingAccount =
                    discountAdjustmentAccount;

            }


            if (
                type ===
                "FINE"
            ) {

                existingAccount =
                    fineAdjustmentAccount;

            }


            setSelectedAdjustmentAccount(
                existingAccount
                    ? Number(
                        existingAccount
                    )
                    : null
            );


            // --------------------------------------------
            // LOAD ACCOUNTS
            // --------------------------------------------

            await loadAdjustmentAccounts();


            setAdjustmentModalOpen(
                true
            );

        };


    // ====================================================
    // CONFIRM ADJUSTMENT
    // ====================================================

    const handleAdjustmentConfirm =
        () => {

            if (
                !selectedAdjustmentAccount
            ) {

                message.error(
                    "Please select subsidiary account"
                );

                return;
            }


            const selectedSA =
                Number(
                    selectedAdjustmentAccount
                );


            // ==========================================
            // DISCOUNT
            // ==========================================

            if (
                adjustmentType ===
                "DISCOUNT"
            ) {

                setDiscountAdjustmentAccount(
                    selectedSA
                );


                editForm.setFieldValue(
                    "discount_sa_id",
                    selectedSA
                );

            }


            // ==========================================
            // FINE
            // ==========================================

            if (
                adjustmentType ===
                "FINE"
            ) {

                setFineAdjustmentAccount(
                    selectedSA
                );


                editForm.setFieldValue(
                    "fine_sa_id",
                    selectedSA
                );

            }


            console.log(
                "ADJUSTMENT CONFIRMED:",
                {

                    adjustment_type:
                        adjustmentType,

                    amount:
                        adjustmentAmount,

                    sa_id:
                        selectedSA

                }
            );


            setAdjustmentModalOpen(
                false
            );

        };


    // ====================================================
    // CALCULATE TOTAL
    // ====================================================

    const calculateTotal = () => {

        return editDetails.reduce(
            (
                sum,
                item
            ) =>
                sum +
                Number(
                    item.amount || 0
                ),
            0
        );

    };


    const editTotal =
        calculateTotal();


    // ====================================================
    // WATCH DISCOUNT / FINE
    // ====================================================

    const editDiscount =
        Number(
            Form.useWatch(
                "discount_amount",
                editForm
            ) || 0
        );


    const editFine =
        Number(
            Form.useWatch(
                "fine_amount",
                editForm
            ) || 0
        );


    // ====================================================
    // NET
    // ====================================================

    const editNet =
        editTotal -
        editDiscount +
        editFine;


    // ====================================================
    // PAID
    // ====================================================

    const paidAmount =
        Number(
            editingFee?.paid_amount || 0
        );


    // ====================================================
    // BALANCE
    // ====================================================

    const editBalance =
        editNet -
        paidAmount;


    // ====================================================
    // SAVE EDIT
    // ====================================================

    const handleSaveEdit =
        async () => {

            try {

                const values =
                    await editForm.validateFields();


                // ==========================================
                // AMOUNTS
                // ==========================================

                const discount =
                    Number(
                        values.discount_amount ||
                        0
                    );


                const fine =
                    Number(
                        values.fine_amount ||
                        0
                    );


                // ==========================================
                // SUBSIDIARY ACCOUNTS
                // ==========================================

                const discountSA =
                    values.discount_sa_id
                        ? Number(
                            values.discount_sa_id
                        )
                        : (
                            discountAdjustmentAccount
                                ? Number(
                                    discountAdjustmentAccount
                                )
                                : null
                        );


                const fineSA =
                    values.fine_sa_id
                        ? Number(
                            values.fine_sa_id
                        )
                        : (
                            fineAdjustmentAccount
                                ? Number(
                                    fineAdjustmentAccount
                                )
                                : null
                        );


                // ==========================================
                // VALIDATION
                // ==========================================

                if (
                    editNet < 0
                ) {

                    message.error(
                        "Net amount cannot be negative"
                    );

                    return;
                }


                if (
                    editNet < paidAmount
                ) {

                    message.error(
                        "Net amount cannot be less than paid amount"
                    );

                    return;
                }


                // ==========================================
                // DISCOUNT ACCOUNT
                // ==========================================

                if (
                    discount > 0 &&
                    !discountSA
                ) {

                    message.error(
                        "Please select Discount subsidiary account"
                    );

                    return;
                }


                // ==========================================
                // FINE ACCOUNT
                // ==========================================

                if (
                    fine > 0 &&
                    !fineSA
                ) {

                    message.error(
                        "Please select Fine subsidiary account"
                    );

                    return;
                }


                setSaving(true);


                console.log(
                    "=============================="
                );

                console.log(
                    "SAVE STUDENT FEE"
                );

                console.log(
                    "DISCOUNT:",
                    discount
                );

                console.log(
                    "DISCOUNT SA:",
                    discountSA
                );

                console.log(
                    "FINE:",
                    fine
                );

                console.log(
                    "FINE SA:",
                    fineSA
                );

                console.log(
                    "=============================="
                );


                // ==========================================
                // API
                // ==========================================

                const response =
                    await axios.put(
                        `${API}/student-fees/${editingFee.student_fee_id}`,
                        {

                            details:
                                editDetails.map(
                                    item => ({

                                        fee_head_id:
                                            item.fee_head_id,

                                        fee_description:
                                            item.fee_description ||
                                            "",

                                        amount:
                                            Number(
                                                item.amount ||
                                                0
                                            )

                                    })
                                ),


                            discount_amount:
                                discount,

                            discount_sa_id:
                                discountSA,


                            fine_amount:
                                fine,

                            fine_sa_id:
                                fineSA,


                            remarks:
                                values.remarks ||
                                ""

                        }
                    );


                console.log(
                    "STUDENT FEE RESPONSE:",
                    response.data
                );


                // ==========================================
                // SUCCESS
                // ==========================================

                await Swal.fire({

                    icon: "success",

                    title: "Saved",

                    text:
                        response.data?.message ||
                        "Student fee updated successfully",

                    confirmButtonText:
                        "OK"

                });


                // ==========================================
                // RESET
                // ==========================================

                setEditModalOpen(
                    false
                );

                setEditingFee(
                    null
                );

                setEditDetails(
                    []
                );

                setDiscountAdjustmentAccount(
                    null
                );

                setFineAdjustmentAccount(
                    null
                );

                setSelectedAdjustmentAccount(
                    null
                );

                editForm.resetFields();


                // ==========================================
                // RELOAD
                // ==========================================

                await loadStudentFees();


            } catch (error) {

                console.error(
                    "SAVE STUDENT FEE ERROR:",
                    error.response?.data ||
                    error
                );


                if (
                    error?.errorFields
                ) {

                    return;

                }


                Swal.fire(
                    "Error",
                    error.response?.data?.message ||
                    "Failed to update student fee",
                    "error"
                );


            } finally {

                setSaving(false);

            }

        };


    // ====================================================
    // CLOSE EDIT MODAL
    // ====================================================

    const closeEditModal = () => {

        if (saving) {
            return;
        }


        setEditModalOpen(
            false
        );

        setEditingFee(
            null
        );

        setEditDetails(
            []
        );

        setDiscountAdjustmentAccount(
            null
        );

        setFineAdjustmentAccount(
            null
        );

        setSelectedAdjustmentAccount(
            null
        );

        editForm.resetFields();

    };


    // ====================================================
    // PRINT VOUCHER
    // ====================================================

    const handlePrintVoucher =
        record => {
 if (!record?.student_fee_id) {
        message.error("Student fee ID not found");
        return;
    }

    window.location.href =
        `/student-fee-voucher/${record.student_fee_id}`;

        };


    // ====================================================
    // TABLE COLUMNS
    // ====================================================

    const columns = [

        {
            title: "Admission No",
            dataIndex: "admission_no",
            key: "admission_no",
            width: 130
        },

        {
            title: "Student",
            dataIndex: "student_name",
            key: "student_name",
            width: 180
        },

        {
            title: "Father",
            dataIndex: "father_name",
            key: "father_name",
            width: 160
        },

        {
            title: "Class",
            dataIndex: "class_name",
            key: "class_name",
            width: 100
        },

        {
            title: "Section",
            dataIndex: "section_name",
            key: "section_name",
            width: 90
        },

        {
            title: "Challan No",
            dataIndex: "challan_no",
            key: "challan_no",
            width: 130
        },

        {
            title: "Total",
            dataIndex: "total_amount",
            key: "total_amount",
            align: "right",
            width: 100,

            render: value =>
                Number(
                    value || 0
                ).toFixed(2)

        },

        {
            title: "Discount",
            dataIndex: "discount_amount",
            key: "discount_amount",
            align: "right",
            width: 100,

            render: value =>
                Number(
                    value || 0
                ).toFixed(2)

        },

        {
            title: "Fine",
            dataIndex: "fine_amount",
            key: "fine_amount",
            align: "right",
            width: 90,

            render: value =>
                Number(
                    value || 0
                ).toFixed(2)

        },

        {
            title: "Net",
            dataIndex: "net_amount",
            key: "net_amount",
            align: "right",
            width: 100,

            render: value =>
                Number(
                    value || 0
                ).toFixed(2)

        },

        {
            title: "Paid",
            dataIndex: "paid_amount",
            key: "paid_amount",
            align: "right",
            width: 100,

            render: value =>
                Number(
                    value || 0
                ).toFixed(2)

        },

        {
            title: "Balance",
            dataIndex: "balance",
            key: "balance",
            align: "right",
            width: 100,

            render: value =>
                Number(
                    value || 0
                ).toFixed(2)

        },

        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            width: 100,

            render: status => {

                let color =
                    "orange";


                if (
                    status === "PAID"
                ) {

                    color =
                        "green";

                }


                if (
                    status === "PARTIAL"
                ) {

                    color =
                        "blue";

                }


                if (
                    status === "CANCELLED"
                ) {

                    color =
                        "red";

                }


                return (

                    <Tag color={color}>
                        {status}
                    </Tag>

                );

            }

        },

{
    title: (
        <Space size={8}>
            <span>Action</span>

            <Tooltip title="Print All Filtered Vouchers">
                <Button
                    shape="circle"
                    size="small"
                    icon={<AppstoreOutlined />}
                    onClick={handlePrintAllVouchers}
                />
            </Tooltip>
        </Space>
    ),

    key: "action",
    fixed: "right",
    width: 120,
    align: "center",

    render: (_, record) => (
        <Space size={6}>

            <Tooltip title="Edit Voucher">
                <Button
                    type="primary"
                    shape="circle"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() =>
                        handleEdit(record.student_fee_id)
                    }
                />
            </Tooltip>

            <Tooltip title="Print Voucher">
                <Button
                    shape="circle"
                    size="small"
                    icon={<PrinterOutlined />}
                    onClick={() =>
                        handlePrintVoucher(record)
                    }
                />
            </Tooltip>

        </Space>
    )
}

    ];


    // ====================================================
    // RETURN
    // ====================================================

    return (

        <div
            style={{
                padding: 20
            }}
        >

            <Card>

                <Title
                    level={3}
                    style={{
                        marginBottom: 5
                    }}
                >
                    Student Fee
                </Title>


                <Text type="secondary">
                    View and edit individual student monthly fees.
                </Text>


                <Divider />


                {/* =================================================
                    FILTER FORM
                ================================================= */}

                <Form
                    form={form}
                    layout="vertical"
                >

                    <Row gutter={[12, 0]}>

                        {/* ACADEMIC YEAR */}

                        <Col
                            xs={24}
                            sm={12}
                            md={5}
                        >

                            <Form.Item
                                name="academic_year_id"
                                label="Academic Year"
                                rules={[
                                    {
                                        required: true,
                                        message:
                                            "Please select Academic Year"
                                    }
                                ]}
                            >

                                <Select
                                    placeholder="Select Academic Year"
                                    showSearch
                                    optionFilterProp="label"
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

                            </Form.Item>

                        </Col>


                        {/* MONTH */}

                        <Col
                            xs={24}
                            sm={12}
                            md={5}
                        >

                            <Form.Item
                                label="Fee Month"
                            >

                                <DatePicker
                                    picker="month"
                                    format="MMMM YYYY"
                                    value={feeMonth}

                                    onChange={
                                        value => {

                                            if (
                                                value
                                            ) {

                                                setFeeMonth(
                                                    value.startOf(
                                                        "month"
                                                    )
                                                );

                                            }

                                        }
                                    }

                                    allowClear={false}

                                    style={{
                                        width:
                                            "100%"
                                    }}

                                />

                            </Form.Item>

                        </Col>


                        {/* CLASS */}

                        <Col
                            xs={24}
                            sm={12}
                            md={4}
                        >

                            <Form.Item
                                name="class_id"
                                label="Class"
                            >

                                 <Select
                                
                                        placeholder="Select Class"
    
                                        onChange={() => {
    
                                            // form.setFieldValue(
    
                                            //     "section_id",
    
                                            //     undefined
    
                                            // );
    
                                        }}
    
                                    >
    
                                    {classes.map(
                                        item => (

                                            <Select.Option

                                                key={
                                                    item.class_id
                                                }

                                                value={
                                                    item.class_id
                                                }

                                            >

                                                {
                                                    item.name
                                                }

                                            </Select.Option>

                                        )
                                    )}

                                </Select>

                            </Form.Item>

                        </Col>


                        {/* CAMPUS */}

                        <Col
                            xs={24}
                            sm={12}
                            md={4}
                        >

                            <Form.Item
                                name="campus_id"
                                label="Campus"
                            >

                                <Select
                                    disabled={
                                        !isAdmin
                                    }

                                    placeholder="Select Campus"
                                    showSearch
                                    optionFilterProp="label"

                                    options={

                                        isAdmin

                                            ? campuses.map(
                                                campus => ({

                                                    value:
                                                        campus.campus_id,

                                                    label:
                                                        campus.name

                                                })
                                            )

                                            : user?.campus_id

                                                ? [
                                                    {

                                                        value:
                                                            user.campus_id,

                                                        label:
                                                            user.campus_name

                                                    }
                                                ]

                                                : []

                                    }

                                />

                            </Form.Item>

                        </Col>


                        {/* SECTION */}

                        <Col
                            xs={24}
                            sm={12}
                            md={4}
                        >

                            <Form.Item
                                name="section_id"
                                label="Section"
                            >

                                <Select
                                    disabled={
                                        !isAdmin
                                    }

                                    placeholder="Select Section"
                                    showSearch
                                    optionFilterProp="label"

                                    options={

                                        isAdmin

                                            ? sections.map(
                                                section => ({

                                                    value:
                                                        section.section_id,

                                                    label:
                                                        section.section_name

                                                })
                                            )

                                            : user?.section_id

                                                ? [
                                                    {

                                                        value:
                                                            user.section_id,

                                                        label:
                                                            user.section_name

                                                    }
                                                ]

                                                : []

                                    }

                                />

                            </Form.Item>

                        </Col>

                    </Row>


                    {/* SEARCH */}

                    <Row gutter={[12, 0]}>

                        <Col
                            xs={24}
                            sm={12}
                            md={6}
                        >

                            <Form.Item
                                name="search"
                                label="Search"
                            >

                                <Input
                                    placeholder="Admission / Student / Father / Challan"

                                    onPressEnter={
                                        handleSearch
                                    }

                                    suffix={
                                        <SearchOutlined />
                                    }

                                />

                            </Form.Item>

                        </Col>

                    </Row>


                    {/* BUTTONS */}

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
                                handleClear
                            }
                        >
                            Clear
                        </Button>

                    </Space>

                </Form>


                <Divider />


                {/* =================================================
                    TABLE
                ================================================= */}

                <Table
                    rowKey="student_fee_id"
                    columns={columns}
                    dataSource={studentFees}
                    loading={loading}
                    bordered
                    size="small"

                    scroll={{
                        x: 1800
                    }}

                    pagination={{
                        pageSize: 20,
                        showSizeChanger: true,

                        showTotal:
                            total =>
                                `Total ${total} students`
                    }}

                />

            </Card>


            {/* =================================================
                EDIT MODAL
            ================================================= */}

            <Modal
                open={editModalOpen}

                title={

                    <div>

                        <div>
                            Edit Student Fee
                        </div>

                        <Text
                            type="secondary"
                            style={{
                                fontSize: 13
                            }}
                        >

                            {editingFee?.student_name}

                            {" | "}

                            Admission No:{" "}

                            {editingFee?.admission_no}

                        </Text>

                    </div>

                }

                width={850}

                onCancel={
                    closeEditModal
                }

                footer={null}

                destroyOnClose
            >

                {editingFee && (

                    <>

                        {/* STUDENT INFORMATION */}

                        <Card
                            size="small"
                            style={{
                                marginBottom: 16
                            }}
                        >

                            <Row
                                gutter={[
                                    16,
                                    8
                                ]}
                            >

                                <Col span={8}>

                                    <Text strong>
                                        Student
                                    </Text>

                                    <div>
                                        {
                                            editingFee.student_name
                                        }
                                    </div>

                                </Col>


                                <Col span={8}>

                                    <Text strong>
                                        Admission No
                                    </Text>

                                    <div>
                                        {
                                            editingFee.admission_no
                                        }
                                    </div>

                                </Col>


                                <Col span={8}>

                                    <Text strong>
                                        Father
                                    </Text>

                                    <div>
                                        {
                                            editingFee.father_name
                                        }
                                    </div>

                                </Col>


                                <Col span={8}>

                                    <Text strong>
                                        Class
                                    </Text>

                                    <div>
                                        {
                                            editingFee.class_name
                                        }
                                    </div>

                                </Col>


                                <Col span={8}>

                                    <Text strong>
                                        Section
                                    </Text>

                                    <div>
                                        {
                                            editingFee.section_name
                                        }
                                    </div>

                                </Col>


                                <Col span={8}>

                                    <Text strong>
                                        Fee Month
                                    </Text>

                                    <div>

                                        {
                                            dayjs(
                                                editingFee.fee_month
                                            ).format(
                                                "MMMM YYYY"
                                            )
                                        }

                                    </div>

                                </Col>

                            </Row>

                        </Card>


                        {/* FEE DETAILS */}

                        <Title level={5}>
                            Fee Details
                        </Title>


                        <Table
                            rowKey="student_fee_detail_id"

                            dataSource={
                                editDetails
                            }

                            pagination={false}

                            bordered

                            size="small"

                            columns={[

                                {
                                    title:
                                        "Fee Head",

                                    dataIndex:
                                        "fee_head_name",

                                    key:
                                        "fee_head_name"

                                },


                                {
                                    title:
                                        "Description",

                                    dataIndex:
                                        "fee_description",

                                    key:
                                        "fee_description",

                                    width: 180

                                },


                                {
                                    title:
                                        "Amount",

                                    dataIndex:
                                        "amount",

                                    key:
                                        "amount",

                                    width: 150,

                                    render:
                                        (
                                            _,
                                            item,
                                            index
                                        ) => (

                                            <InputNumber

                                                min={0}

                                                precision={2}

                                                value={
                                                    item.amount
                                                }

                                                onChange={
                                                    value =>
                                                        handleDetailAmountChange(
                                                            index,
                                                            value
                                                        )
                                                }

                                                style={{
                                                    width:
                                                        "100%"
                                                }}

                                            />

                                        )

                                }

                            ]}

                        />


                        <Divider />


                        {/* =================================================
                            EDIT FORM
                        ================================================= */}

                        <Form
                            form={editForm}
                            layout="vertical"
                        >

                            {/* ============================================
                                HIDDEN DISCOUNT SA
                            ============================================ */}

                            <Form.Item
                                name="discount_sa_id"
                                hidden
                            >

                                <Input />

                            </Form.Item>


                            {/* ============================================
                                HIDDEN FINE SA
                            ============================================ */}

                            <Form.Item
                                name="fine_sa_id"
                                hidden
                            >

                                <Input />

                            </Form.Item>


                            <Row gutter={16}>

                                {/* TOTAL */}

                                <Col span={8}>

                                    <Form.Item
                                        label="Total Amount"
                                    >

                                        <InputNumber
                                            value={
                                                editTotal
                                            }

                                            readOnly

                                            precision={2}

                                            style={{
                                                width:
                                                    "100%"
                                            }}

                                        />

                                    </Form.Item>

                                </Col>


                                {/* DISCOUNT */}

                                <Col span={8}>

                                    <Form.Item
                                        label="Discount"
                                        name="discount_amount"
                                    >

                                        <InputNumber

                                            min={0}

                                            precision={2}

                                            style={{
                                                width:
                                                    "100%"
                                            }}

                                            onBlur={() => {

                                                const value =
                                                    Number(
                                                        editForm.getFieldValue(
                                                            "discount_amount"
                                                        ) || 0
                                                    );


                                                if (
                                                    value > 0
                                                ) {

                                                    openAdjustmentModal(
                                                        "DISCOUNT",
                                                        value
                                                    );

                                                }

                                            }}

                                        />

                                    </Form.Item>

                                </Col>


                                {/* FINE */}

                                <Col span={8}>

                                    <Form.Item
                                        label="Fine"
                                        name="fine_amount"
                                    >

                                        <InputNumber

                                            min={0}

                                            precision={2}

                                            style={{
                                                width:
                                                    "100%"
                                            }}

                                            onBlur={() => {

                                                const value =
                                                    Number(
                                                        editForm.getFieldValue(
                                                            "fine_amount"
                                                        ) || 0
                                                    );


                                                if (
                                                    value > 0
                                                ) {

                                                    openAdjustmentModal(
                                                        "FINE",
                                                        value
                                                    );

                                                }

                                            }}

                                        />

                                    </Form.Item>

                                </Col>

                            </Row>


                            <Row gutter={16}>

                                {/* NET */}

                                <Col span={8}>

                                    <Form.Item
                                        label="Net Amount"
                                    >

                                        <InputNumber
                                            value={
                                                editNet
                                            }

                                            readOnly

                                            precision={2}

                                            style={{
                                                width:
                                                    "100%"
                                            }}

                                        />

                                    </Form.Item>

                                </Col>


                                {/* PAID */}

                                <Col span={8}>

                                    <Form.Item
                                        label="Paid Amount"
                                    >

                                        <InputNumber
                                            value={
                                                paidAmount
                                            }

                                            readOnly

                                            precision={2}

                                            style={{
                                                width:
                                                    "100%"
                                            }}

                                        />

                                    </Form.Item>

                                </Col>


                                {/* BALANCE */}

                                <Col span={8}>

                                    <Form.Item
                                        label="Balance"
                                    >

                                        <InputNumber
                                            value={
                                                editBalance
                                            }

                                            readOnly

                                            precision={2}

                                            style={{
                                                width:
                                                    "100%"
                                            }}

                                        />

                                    </Form.Item>

                                </Col>

                            </Row>


                            {/* REMARKS */}

                            <Form.Item
                                label="Remarks"
                                name="remarks"
                            >

                                <Input.TextArea
                                    rows={3}
                                    placeholder="Remarks"
                                />

                            </Form.Item>

                        </Form>


                        <Divider />


                        {/* BUTTONS */}

                        <Space>

                            <Button
                                type="primary"
                                icon={
                                    <SaveOutlined />
                                }
                                loading={
                                    saving
                                }
                                onClick={
                                    handleSaveEdit
                                }
                            >
                                Save
                            </Button>


                            <Button
                                icon={
                                    <PrinterOutlined />
                                }
                                onClick={() =>
                                    handlePrintVoucher(
                                        editingFee
                                    )
                                }
                            >
                                Print Voucher
                            </Button>


                            <Button
                                onClick={
                                    closeEditModal
                                }
                                disabled={
                                    saving
                                }
                            >
                                Cancel
                            </Button>

                        </Space>

                    </>

                )}

            </Modal>


            {/* =================================================
                ADJUSTMENT MODAL
            ================================================= */}

            <Modal

                open={
                    adjustmentModalOpen
                }

                title={
                    `${adjustmentType} Adjustment`
                }

                width={600}

                onCancel={() => {

                    setAdjustmentModalOpen(
                        false
                    );

                    setSelectedAdjustmentAccount(
                        null
                    );

                }}

                footer={null}

                destroyOnClose

            >

                {/* =============================================
                    ADJUSTMENT SUMMARY
                ============================================= */}

                <Card
                    size="small"
                    style={{
                        marginBottom: 16
                    }}
                >

                    <Row
                        gutter={[
                            16,
                            12
                        ]}
                    >

                        <Col span={12}>

                            <Text strong>
                                Adjustment Type
                            </Text>

                            <div
                                style={{
                                    marginTop: 4
                                }}
                            >

                                <Tag
                                    color={
                                        adjustmentType ===
                                        "DISCOUNT"
                                            ? "blue"
                                            : "orange"
                                    }
                                >
                                    {
                                        adjustmentType
                                    }
                                </Tag>

                            </div>

                        </Col>


                        <Col span={12}>

                            <Text strong>
                                Amount
                            </Text>

                            <div
                                style={{
                                    marginTop: 4,
                                    fontSize: 18,
                                    fontWeight: 600
                                }}
                            >

                                {
                                    Number(
                                        adjustmentAmount ||
                                        0
                                    ).toFixed(2)
                                }

                            </div>

                        </Col>

                    </Row>

                </Card>


                {/* =============================================
                    ADJUSTMENT FORM
                ============================================= */}

                <Form
                    layout="vertical"
                >

                    <Form.Item
                        label="Subsidiary Account"
                        required
                    >

                        <Select

                            showSearch

                            allowClear

                            placeholder={
                                "Select Subsidiary Account"
                            }

                            loading={
                                adjustmentAccountsLoading
                            }

                            value={
                                selectedAdjustmentAccount
                                    ? Number(
                                        selectedAdjustmentAccount
                                    )
                                    : undefined
                            }

                            optionFilterProp="label"

                            options={
                                adjustmentAccounts.map(
                                    account => ({

                                        value:
                                            Number(
                                                account.Sa_ID
                                            ),

                                        label:
                                            `${account.SA_Name} (ID: ${account.Sa_ID})`

                                    })
                                )
                            }


                            // ==========================================
                            // ACCOUNT CHANGE
                            // ==========================================

                            onChange={
                                value => {

                                    const selectedSA =
                                        value === null ||
                                        value === undefined ||
                                        value === ""
                                            ? null
                                            : Number(
                                                value
                                            );


                                    // ----------------------------------
                                    // MODAL STATE
                                    // ----------------------------------

                                    setSelectedAdjustmentAccount(
                                        selectedSA
                                    );


                                    // ----------------------------------
                                    // DISCOUNT
                                    // ----------------------------------

                                    if (
                                        adjustmentType ===
                                        "DISCOUNT"
                                    ) {

                                        setDiscountAdjustmentAccount(
                                            selectedSA
                                        );


                                        editForm.setFieldValue(
                                            "discount_sa_id",
                                            selectedSA
                                        );

                                    }


                                    // ----------------------------------
                                    // FINE
                                    // ----------------------------------

                                    if (
                                        adjustmentType ===
                                        "FINE"
                                    ) {

                                        setFineAdjustmentAccount(
                                            selectedSA
                                        );


                                        editForm.setFieldValue(
                                            "fine_sa_id",
                                            selectedSA
                                        );

                                    }


                                    console.log(
                                        "ACCOUNT SELECTED:",
                                        {

                                            type:
                                                adjustmentType,

                                            sa_id:
                                                selectedSA

                                        }
                                    );

                                }
                            }

                            style={{
                                width: "100%"
                            }}

                        />

                    </Form.Item>


                    {/* =============================================
                        NARRATION
                    ============================================= */}

                    <Form.Item
                        label="Narration"
                    >

                        <Input
                            readOnly

                            value={
                                `Adjust | SCHOOL FEE RECEIVABLE - ${
                                    editingFee?.fee_month

                                        ? dayjs(
                                            editingFee.fee_month
                                        ).format(
                                            "YYYY-MM-DD"
                                        )

                                        : dayjs().format(
                                            "YYYY-MM-DD"
                                        )
                                }`
                            }

                        />

                    </Form.Item>


                    <Divider />


                    {/* =============================================
                        BUTTONS
                    ============================================= */}

                    <Space>

                        <Button
                            type="primary"

                            disabled={
                                !selectedAdjustmentAccount
                            }

                            onClick={
                                handleAdjustmentConfirm
                            }

                        >
                            Confirm
                        </Button>


                        <Button
                            onClick={() => {

                                setAdjustmentModalOpen(
                                    false
                                );

                                setSelectedAdjustmentAccount(
                                    null
                                );

                            }}
                        >
                            Cancel
                        </Button>

                    </Space>

                </Form>

            </Modal>

        </div>

    );

};


export default StudentFee;
