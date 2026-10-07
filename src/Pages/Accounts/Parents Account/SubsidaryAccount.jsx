import axios from "axios";
import React, {
    useEffect,
    useRef,
    useState,
} from "react";

import Swal from "sweetalert2";

import {
    Card,
    Form,
    Input,
    InputNumber,
    Select,
    Button,
    Table,
    Space,
    Typography,
    Tag,
    message,
} from "antd";

import {
    PlusOutlined,
    EditOutlined,
    ReloadOutlined,
    CloseOutlined,
    SearchOutlined,
} from "@ant-design/icons";

const { Title } = Typography;

const API = "/api";


const SubsidaryAccount = () => {

    const [form] = Form.useForm();

    const inputRef = useRef(null);


    // =====================================================
    // STATES
    // =====================================================

    const [searchTerm, setSearchTerm] =
        useState("");

    const [GeneralAccounts, setGeneralAccounts] =
        useState([]);

    const [generalAccountData, setGeneralAccountData] =
        useState([]);

    const [editId, setEditId] =
        useState(null);

    const [generalLoading, setGeneralLoading] =
        useState(false);

    const [tableLoading, setTableLoading] =
        useState(false);

    const [saving, setSaving] =
        useState(false);


    // =====================================================
    // CAMPUS / SECTION STATES
    // =====================================================

    const [campuses, setCampuses] =
        useState([]);

    const [sections, setSections] =
        useState([]);

    const [campusLoading, setCampusLoading] =
        useState(false);

    const [sectionLoading, setSectionLoading] =
        useState(false);


    // =====================================================
    // WATCH ACCOUNT TYPE
    // =====================================================

    const accountType =
        Form.useWatch(
            "tb_type",
            form
        );


    // =====================================================
    // FETCH GENERAL ACCOUNTS
    // =====================================================

    const fetchGeneralAccounts = async () => {

        try {

            setGeneralLoading(true);

            const response =
                await axios.get(
                    `${API}/general-accounts`
                );

            console.log(
                "General Accounts:",
                response.data
            );

            setGeneralAccounts(
                response.data || []
            );

        } catch (error) {

            console.error(
                "Error fetching general accounts:",
                error
            );

            message.error(
                error.response?.data?.message ||
                "Unable to load General Accounts."
            );

        } finally {

            setGeneralLoading(false);

        }

    };


    // =====================================================
    // FETCH SUBSIDIARY ACCOUNTS
    // =====================================================

    const fetchSubsidaryAccounts = async () => {

        try {

            setTableLoading(true);

            const response =
                await axios.get(
                    `${API}/table`
                );

            console.log(
                "Subsidiary Account Data:",
                response.data
            );

            setGeneralAccountData(
                response.data || []
            );

        } catch (error) {

            console.error(
                "Error getting Subsidiary Accounts:",
                error
            );

            message.error(
                error.response?.data?.message ||
                "Unable to load Subsidiary Accounts."
            );

        } finally {

            setTableLoading(false);

        }

    };


    // =====================================================
    // FETCH CAMPUSES
    // =====================================================

    const fetchCampuses = async () => {

        try {

            setCampusLoading(true);

            const response =
                await axios.get(
                    `${API}/campuses`
                );

            console.log(
                "Campuses:",
                response.data
            );

            setCampuses(
                Array.isArray(response.data)
                    ? response.data
                    : []
            );

        } catch (error) {

            console.error(
                "Error fetching campuses:",
                error
            );

            message.error(
                error.response?.data?.message ||
                "Unable to load Campuses."
            );

        } finally {

            setCampusLoading(false);

        }

    };


    // =====================================================
    // FETCH SECTIONS BY CAMPUS
    // =====================================================

    const fetchSections = async (
        campusId
    ) => {

        if (!campusId) {

            setSections([]);

            return;

        }

        try {

            setSectionLoading(true);

            const response =
                await axios.get(
                    `${API}/sections`,
                    {
                        params: {
                            campus_id:
                                Number(campusId),
                        },
                    }
                );

            console.log(
                "Sections:",
                response.data
            );

            setSections(
                Array.isArray(response.data)
                    ? response.data
                    : []
            );

        } catch (error) {

            console.error(
                "Error fetching sections:",
                error
            );

            setSections([]);

            message.error(
                error.response?.data?.message ||
                "Unable to load Sections."
            );

        } finally {

            setSectionLoading(false);

        }

    };


    // =====================================================
    // INITIAL LOAD
    // =====================================================

    useEffect(() => {

        fetchGeneralAccounts();

        fetchSubsidaryAccounts();

        fetchCampuses();

    }, []);


    // =====================================================
    // CAMPUS CHANGE
    // =====================================================

    const handleCampusChange = async (
        campusId
    ) => {

        form.setFieldValue(
            "section_id",
            undefined
        );

        setSections([]);

        if (!campusId) {

            return;

        }

        await fetchSections(
            campusId
        );

    };


    // =====================================================
    // RESET FORM
    // =====================================================

    const resetForm = () => {

        form.resetFields();

        setSections([]);

        setEditId(null);

    };


    // =====================================================
    // CANCEL EDIT
    // =====================================================

    const cancelEdit = () => {

        resetForm();

    };


    // =====================================================
    // RESET / CANCEL
    // =====================================================

    const handleReset = async () => {

        const result =
            await Swal.fire({

                icon: "warning",

                title: "Are you sure?",

                text:
                    "All entered data will be cleared.",

                showCancelButton: true,

                confirmButtonText:
                    "Yes, clear it",

                cancelButtonText:
                    "No, keep it",

                confirmButtonColor:
                    "#d33",

                cancelButtonColor:
                    "#3085d6",

            });


        if (result.isConfirmed) {

            resetForm();

            Swal.fire({

                icon: "success",

                title: "Cleared!",

                text:
                    "The form has been cleared.",

                timer: 1200,

                showConfirmButton: false,

            });

        }

    };


    // =====================================================
    // EDIT ROW
    // =====================================================

    const handleEdit = async (
        item
    ) => {

        console.log(
            "Editing:",
            item
        );


        try {

            setEditId(
                item.Sa_ID
            );


            const type =
                String(
                    item.Type ||
                    item.type ||
                    ""
                ).toUpperCase();


            // =================================================
            // LOAD SECTIONS FIRST FOR CASH
            // =================================================

            if (
                type === "CASH" &&
                item.campus_id
            ) {

                await fetchSections(
                    item.campus_id
                );

            } else {

                setSections([]);

            }


            // =================================================
            // SET FORM VALUES
            // =================================================

            form.setFieldsValue({

                tb_generalaccount:
                    item.Ga_ID !== null &&
                    item.Ga_ID !== undefined
                        ? String(item.Ga_ID)
                        : undefined,


                tb_subsidaryaccount:
                    item.SA_Name ||
                    item.Sa_Name ||
                    "",


                tb_type:
                    type === "CASH"
                        ? "CASH"
                        : type === "BANK"
                            ? "BANK"
                            : "NONE",


                tb_dr:
                    item.dr !== null &&
                    item.dr !== undefined
                        ? Number(item.dr)
                        : null,


                tb_cr:
                    item.cr !== null &&
                    item.cr !== undefined
                        ? Number(item.cr)
                        : null,


                tb_remarks:
                    item.remarks || "",


                // CASH
                campus_id:
                    item.campus_id !== null &&
                    item.campus_id !== undefined
                        ? Number(item.campus_id)
                        : undefined,


                section_id:
                    item.section_id !== null &&
                    item.section_id !== undefined
                        ? Number(item.section_id)
                        : undefined,


                // BANK
                bank_name:
                    item.bank_name || "",


                account_title:
                    item.account_title || "",


                account_number:
                    item.account_number || "",


                iban:
                    item.iban || "",


                branch_name:
                    item.branch_name || "",


                branch_code:
                    item.branch_code || "",

            });


            window.scrollTo({

                top: 0,

                behavior: "smooth",

            });

        } catch (error) {

            console.error(
                "EDIT ERROR:",
                error
            );

            message.error(
                "Unable to load account details."
            );

        }

    };


    // =====================================================
    // SAVE / UPDATE
    // =====================================================

    const handleSubmit = async (
        values
    ) => {

        try {

            setSaving(true);


            let response;


            // =================================================
            // NORMALIZE TYPE
            // =================================================

            const type =
                String(
                    values.tb_type || ""
                ).toUpperCase();


            // =================================================
            // PAYLOAD
            // =================================================

            const payload = {

                tb_generalaccount:
                    values.tb_generalaccount,


                tb_subsidaryaccount:
                    String(
                        values.tb_subsidaryaccount ||
                        ""
                    ).trim(),


                tb_type:
                    type,


                tb_dr:
                    values.tb_dr ?? 0,


                tb_cr:
                    values.tb_cr ?? 0,


                tb_remarks:
                    String(
                        values.tb_remarks ||
                        ""
                    ).trim(),


                // =================================================
                // CASH
                // =================================================

                campus_id:
                    type === "CASH"
                        ? values.campus_id
                        : null,


                section_id:
                    type === "CASH"
                        ? values.section_id
                        : null,


                // =================================================
                // BANK
                // =================================================

                bank_name:
                    type === "BANK"
                        ? String(
                            values.bank_name ||
                            ""
                        ).trim()
                        : null,


                account_title:
                    type === "BANK"
                        ? String(
                            values.account_title ||
                            ""
                        ).trim()
                        : null,


                account_number:
                    type === "BANK"
                        ? String(
                            values.account_number ||
                            ""
                        ).trim()
                        : null,


                iban:
                    type === "BANK"
                        ? String(
                            values.iban ||
                            ""
                        ).trim()
                        : null,


                branch_name:
                    type === "BANK"
                        ? String(
                            values.branch_name ||
                            ""
                        ).trim()
                        : null,


                branch_code:
                    type === "BANK"
                        ? String(
                            values.branch_code ||
                            ""
                        ).trim()
                        : null,

            };


            console.log(
                "SUBSIDIARY ACCOUNT PAYLOAD:",
                payload
            );


            // =================================================
            // UPDATE
            // =================================================

            if (
                editId !== null
            ) {

                console.log(
                    "Updating ID:",
                    editId
                );


                response =
                    await axios.put(

                        `${API}/subsidary-accounts/${editId}`,

                        payload

                    );

            }


            // =================================================
            // SAVE
            // =================================================

            else {

                console.log(
                    "Saving new account"
                );


                response =
                    await axios.post(

                        `${API}/SaveSA`,

                        payload

                    );

            }


            // =================================================
            // SUCCESS
            // =================================================

            Swal.fire({

                icon: "success",

                title:
                    editId !== null
                        ? "Updated Successfully!"
                        : "Saved Successfully!",

                text:
                    response.data.message ||
                    "Operation completed successfully.",

                showConfirmButton: false,

                timer: 1800,

            });


            // =================================================
            // CLEAR FORM
            // =================================================

            resetForm();


            // =================================================
            // REFRESH TABLE
            // =================================================

            fetchSubsidaryAccounts();


        } catch (error) {

            console.error(
                "Save/Update Error:",
                error
            );


            Swal.fire({

                icon: "error",

                title:
                    editId !== null
                        ? "Update Failed"
                        : "Save Failed",

                text:
                    error.response?.data?.message ||
                    "Something went wrong.",

            });

        } finally {

            setSaving(false);

        }

    };


    // =====================================================
    // FILTER TABLE
    // =====================================================

    const filteredSubsidaryAccounts =
        generalAccountData.filter(
            (item) => {

                const search =
                    searchTerm
                        .toLowerCase()
                        .trim();


                if (!search) {

                    return true;

                }


                return (

                    item.SA_Name
                        ?.toLowerCase()
                        .includes(search)

                    ||

                    item.Sa_Name
                        ?.toLowerCase()
                        .includes(search)

                    ||

                    item.General_Account_Name
                        ?.toLowerCase()
                        .includes(search)

                    ||

                    item.campus_name
                        ?.toLowerCase()
                        .includes(search)

                    ||

                    item.section_name
                        ?.toLowerCase()
                        .includes(search)

                    ||

                    item.bank_name
                        ?.toLowerCase()
                        .includes(search)

                );

            }
        );


    // =====================================================
    // TABLE COLUMNS
    // =====================================================

    const columns = [

    {
        title: "#",
        key: "serial",
        width: 60,
        align: "center",

        render: (_, __, index) => (
            <Tag color="blue">
                {index + 1}
            </Tag>
        ),
    },

    {
        title: "Subsidiary ID",
        dataIndex: "Sa_ID",
        key: "Sa_ID",
        width: 110,
    },

    {
        title: "General Account",
        dataIndex: "General_Account_Name",
        key: "General_Account_Name",
        width: 220,

        render: (value) => (
            <strong>
                {value || "-"}
            </strong>
        ),
    },

    {
        title: "Subsidiary Account",
        dataIndex: "SA_Name",
        key: "SA_Name",
        width: 250,

        render: (value, record) => (
            <strong>
                {
                    value ||
                    record.Sa_Name ||
                    "-"
                }
            </strong>
        ),
    },

    {
        title: "Type",
        dataIndex: "Type",
        key: "Type",
        width: 100,

        render: (value, record) => {

            const type =
                String(
                    value ||
                    record.type ||
                    ""
                ).toUpperCase();

            if (!type) {
                return "-";
            }

            return (
                <Tag
                    color={
                        type === "CASH"
                            ? "green"
                            : type === "BANK"
                                ? "blue"
                                : "default"
                    }
                >
                    {type}
                </Tag>
            );
        },
    },

    {
        title: "Dr",
        dataIndex: "dr",
        key: "dr",
        width: 120,
        align: "right",

        render: (value) =>
            value !== null &&
            value !== undefined &&
            value !== ""
                ? Number(value).toLocaleString()
                : "-",
    },

    {
        title: "Cr",
        dataIndex: "cr",
        key: "cr",
        width: 120,
        align: "right",

        render: (value) =>
            value !== null &&
            value !== undefined &&
            value !== ""
                ? Number(value).toLocaleString()
                : "-",
    },

    {
        title: "Remarks",
        dataIndex: "remarks",
        key: "remarks",
        width: 220,
        ellipsis: true,

        render: (value) =>
            value || "-",
    },

    {
        title: "Action",
        key: "action",
        width: 110,
        fixed: "right",
        align: "center",

        render: (_, record) => (
            <Button
                type={
                    editId === record.Sa_ID
                        ? "primary"
                        : "default"
                }

                icon={
                    <EditOutlined />
                }

                onClick={(e) => {

                    e.stopPropagation();

                    handleEdit(record);

                }}
            >
                Edit
            </Button>
        ),
    },

];


    // =====================================================
    // RENDER
    // =====================================================

    return (

        <div
            style={{
                width: "100%",
                padding: "20px",
            }}
        >

            {/* =================================================
                FORM CARD
            ================================================= */}

            <Card
                style={{
                    marginBottom: 20,
                }}
            >

                <Title
                    level={3}
                    style={{
                        marginTop: 0,
                        marginBottom: 25,
                    }}
                >

                    Subsidiary Account

                </Title>


                <Form

                    form={form}

                    layout="vertical"

                    onFinish={
                        handleSubmit
                    }

                    autoComplete="off"

                >

                    <div
                        style={{
                            display: "grid",

                            gridTemplateColumns:
                                "1fr 1fr",

                            gap: "20px",
                        }}
                    >

                        {/* =====================================
                            GENERAL ACCOUNT
                        ====================================== */}

                        <Form.Item

                            label="General Account"

                            name="tb_generalaccount"

                            rules={[
                                {
                                    required: true,

                                    message:
                                        "Please select General Account.",
                                },
                            ]}

                        >

                            <Select

                                size="large"

                                placeholder=
                                    "Select General Account"

                                loading={
                                    generalLoading
                                }

                                showSearch

                                optionFilterProp="label"

                                options={

                                    GeneralAccounts.map(
                                        (item) => ({

                                            value:
                                                String(
                                                    item.General_Account_Id
                                                ),

                                            label:
                                                item.General_Account_Name,

                                        })
                                    )

                                }

                            />

                        </Form.Item>


                        {/* =====================================
                            SUBSIDIARY ACCOUNT
                        ====================================== */}

                        <Form.Item

                            label="Subsidiary Account"

                            name=
                                "tb_subsidaryaccount"

                            rules={[
                                {
                                    required: true,

                                    message:
                                        "Please enter Subsidiary Account name.",
                                },

                                {
                                    whitespace: true,

                                    message:
                                        "Subsidiary Account cannot be empty.",
                                },
                            ]}

                        >

                            <Input

                                size="large"

                                placeholder=
                                    "Subsidiary Account Name"

                            />

                        </Form.Item>


                        {/* =====================================
                            ACCOUNT TYPE + DR + CR
                        ====================================== */}

                        <div
                            style={{
                                display: "grid",

                                gridTemplateColumns:
                                    "1fr 1fr 1fr",

                                gap: "20px",

                                gridColumn:
                                    "1 / -1",
                            }}
                        >

                            {/* ACCOUNT TYPE */}

                            <Form.Item

                                label="Account Type"

                                name="tb_type"

                                rules={[
                                    {
                                        required: true,

                                        message:
                                            "Please select Account Type.",
                                    },
                                ]}

                                style={{
                                    marginBottom: 0,
                                }}

                            >

                                <Select

                                    ref={inputRef}

                                    size="large"

                                    placeholder=
                                        "Select Type"

                                    options={[
                                        {
                                            value: "CASH",
                                            label: "Cash",
                                        },
                                        {
                                            value: "BANK",
                                            label: "Bank",
                                        },
                                        {
                                            value: "NONE",
                                            label: "None",
                                        },
                                    ]}

                                />

                            </Form.Item>


                            {/* DEBIT */}

                            <Form.Item

                                label="DR."

                                name="tb_dr"

                                style={{
                                    marginBottom: 0,
                                }}

                            >

                                <InputNumber

                                    style={{
                                        width: "100%",
                                    }}

                                    size="large"

                                    placeholder=
                                        "Debit Amount"

                                    min={0}

                                    precision={2}

                                    controls

                                />

                            </Form.Item>


                            {/* CREDIT */}

                            <Form.Item

                                label="CR."

                                name="tb_cr"

                                style={{
                                    marginBottom: 0,
                                }}

                            >

                                <InputNumber

                                    style={{
                                        width: "100%",
                                    }}

                                    size="large"

                                    placeholder=
                                        "Credit Amount"

                                    min={0}

                                    precision={2}

                                    controls

                                />

                            </Form.Item>

                        </div>


                        {/* =================================================
                            CASH DETAILS
                        ================================================= */}

                        {accountType === "CASH" && (

                            <div
                                style={{
                                    gridColumn:
                                        "1 / -1",

                                    padding: "18px",

                                    border:
                                        "1px solid #d9d9d9",

                                    borderRadius:
                                        "8px",

                                    background:
                                        "#fafafa",
                                }}
                            >

                                <Title
                                    level={5}
                                    style={{
                                        marginTop: 0,
                                        marginBottom: 16,
                                    }}
                                >

                                    Cash Account Details

                                </Title>


                                <div
                                    style={{
                                        display: "grid",

                                        gridTemplateColumns:
                                            "1fr 1fr",

                                        gap: "20px",
                                    }}
                                >

                                    {/* CAMPUS */}

                                    <Form.Item

                                        label="Campus"

                                        name="campus_id"

                                        rules={[
                                            {
                                                required: true,

                                                message:
                                                    "Please select Campus.",
                                            },
                                        ]}

                                        style={{
                                            marginBottom: 0,
                                        }}

                                    >

                                        <Select

                                            size="large"

                                            placeholder=
                                                "Select Campus"

                                            loading={
                                                campusLoading
                                            }

                                            showSearch

                                            optionFilterProp=
                                                "label"

                                            onChange={
                                                handleCampusChange
                                            }

                                            options={

                                                campuses.map(
                                                    (item) => ({

                                                        value:
                                                            Number(
                                                                item.campus_id
                                                            ),

                                                        label:
                                                            item.name ||
                                                            item.campus_name,

                                                    })
                                                )

                                            }

                                        />

                                    </Form.Item>


                                    {/* SECTION */}

                                    <Form.Item

                                        label="Section"

                                        name="section_id"

                                        rules={[
                                            {
                                                required: true,

                                                message:
                                                    "Please select Section.",
                                            },
                                        ]}

                                        style={{
                                            marginBottom: 0,
                                        }}

                                    >

                                        <Select

                                            size="large"

                                            placeholder=
                                                "Select Section"

                                            loading={
                                                sectionLoading
                                            }

                                            disabled={
                                                !form.getFieldValue(
                                                    "campus_id"
                                                )
                                            }

                                            showSearch

                                            optionFilterProp=
                                                "label"

                                            options={

                                                sections.map(
                                                    (item) => ({

                                                        value:
                                                            Number(
                                                                item.section_id
                                                            ),

                                                        label:
                                                            item.section_name,

                                                    })
                                                )

                                            }

                                        />

                                    </Form.Item>

                                </div>

                            </div>

                        )}


                        {/* =================================================
                            BANK DETAILS
                        ================================================= */}

                        {accountType === "BANK" && (

                            <div
                                style={{
                                    gridColumn:
                                        "1 / -1",

                                    padding: "18px",

                                    border:
                                        "1px solid #d9d9d9",

                                    borderRadius:
                                        "8px",

                                    background:
                                        "#fafafa",
                                }}
                            >

                                <Title
                                    level={5}
                                    style={{
                                        marginTop: 0,
                                        marginBottom: 16,
                                    }}
                                >

                                    Bank Account Details

                                </Title>


                                <div
                                    style={{
                                        display: "grid",

                                        gridTemplateColumns:
                                            "1fr 1fr",

                                        gap: "20px",
                                    }}
                                >

                                    {/* BANK NAME */}

                                    <Form.Item

                                        label="Bank Name"

                                        name="bank_name"

                                        rules={[
                                            {
                                                required: true,

                                                message:
                                                    "Please enter Bank Name.",
                                            },
                                        ]}

                                        style={{
                                            marginBottom: 0,
                                        }}

                                    >

                                        <Input

                                            size="large"

                                            placeholder=
                                                "Bank Name"

                                        />

                                    </Form.Item>


                                    {/* ACCOUNT TITLE */}

                                    <Form.Item

                                        label="Account Title"

                                        name=
                                            "account_title"

                                        rules={[
                                            {
                                                required: true,

                                                message:
                                                    "Please enter Account Title.",
                                            },
                                        ]}

                                        style={{
                                            marginBottom: 0,
                                        }}

                                    >

                                        <Input

                                            size="large"

                                            placeholder=
                                                "Account Title"

                                        />

                                    </Form.Item>


                                    {/* ACCOUNT NUMBER */}

                                    <Form.Item

                                        label="Account Number"

                                        name=
                                            "account_number"

                                        rules={[
                                            {
                                                required: true,

                                                message:
                                                    "Please enter Account Number.",
                                            },
                                        ]}

                                        style={{
                                            marginBottom: 0,
                                        }}

                                    >

                                        <Input

                                            size="large"

                                            placeholder=
                                                "Account Number"

                                        />

                                    </Form.Item>


                                    {/* IBAN */}

                                    <Form.Item

                                        label="IBAN"

                                        name="iban"

                                        style={{
                                            marginBottom: 0,
                                        }}

                                    >

                                        <Input

                                            size="large"

                                            placeholder=
                                                "IBAN"

                                        />

                                    </Form.Item>


                                    {/* BRANCH NAME */}

                                    <Form.Item

                                        label="Branch Name"

                                        name=
                                            "branch_name"

                                        style={{
                                            marginBottom: 0,
                                        }}

                                    >

                                        <Input

                                            size="large"

                                            placeholder=
                                                "Branch Name"

                                        />

                                    </Form.Item>


                                    {/* BRANCH CODE */}

                                    <Form.Item

                                        label="Branch Code"

                                        name=
                                            "branch_code"

                                        style={{
                                            marginBottom: 0,
                                        }}

                                    >

                                        <Input

                                            size="large"

                                            placeholder=
                                                "Branch Code"

                                        />

                                    </Form.Item>

                                </div>

                            </div>

                        )}


                        {/* =================================================
                            REMARKS
                        ================================================= */}

                        <Form.Item

                            label="Remarks"

                            name="tb_remarks"

                            style={{
                                gridColumn:
                                    "1 / -1",
                            }}

                        >

                            <Input

                                size="large"

                                placeholder=
                                    "Remarks"

                            />

                        </Form.Item>

                    </div>


                    {/* =================================================
                        BUTTONS
                    ================================================= */}

                    <Form.Item

                        style={{
                            marginBottom: 0,

                            marginTop: 10,
                        }}

                    >

                        <Space>

                            <Button

                                type="primary"

                                htmlType="submit"

                                loading={
                                    saving
                                }

                                icon={
                                    editId !== null
                                        ? <EditOutlined />
                                        : <PlusOutlined />
                                }

                                size="large"

                            >

                                {editId !== null
                                    ? "Update"
                                    : "Save"}

                            </Button>


                            <Button

                                danger

                                type="default"

                                icon={
                                    editId !== null
                                        ? <CloseOutlined />
                                        : <ReloadOutlined />
                                }

                                size="large"

                                onClick={
                                    editId !== null
                                        ? cancelEdit
                                        : handleReset
                                }

                            >

                                {editId !== null
                                    ? "Cancel Edit"
                                    : "Cancel"}

                            </Button>

                        </Space>

                    </Form.Item>

                </Form>

            </Card>


            {/* =================================================
                TABLE CARD
            ================================================= */}

            <Card>

                {/* =================================================
                    TABLE HEADER
                ================================================= */}

                <div
                    style={{
                        display: "flex",

                        justifyContent:
                            "space-between",

                        alignItems:
                            "center",

                        marginBottom: 16,

                        gap: 20,

                        flexWrap: "wrap",
                    }}
                >

                    <div>

                        <Title
                            level={4}
                            style={{
                                margin: 0,
                            }}
                        >

                            Subsidiary Accounts

                        </Title>


                        <span
                            style={{
                                color: "#888",
                            }}
                        >

                            {
                                generalAccountData.length
                            }

                            {" "}

                            Accounts

                        </span>

                    </div>


                    {/* SEARCH + REFRESH */}

                    <Space>

                        <Input

                            allowClear

                            prefix={
                                <SearchOutlined />
                            }

                            placeholder=
                                "Search Subsidiary Account..."

                            value={
                                searchTerm
                            }

                            onChange={(e) =>
                                setSearchTerm(
                                    e.target.value
                                )
                            }

                            style={{
                                width: 280,
                            }}

                        />


                        <Button

                            icon={
                                <ReloadOutlined />
                            }

                            onClick={
                                fetchSubsidaryAccounts
                            }

                            loading={
                                tableLoading
                            }

                        >

                            Refresh

                        </Button>

                    </Space>

                </div>


                {/* =================================================
                    TABLE
                ================================================= */}

                <Table

                    rowKey="Sa_ID"

                    columns={columns}

                    dataSource={
                        filteredSubsidaryAccounts
                    }

                    loading={
                        tableLoading
                    }

                    bordered

                    size="middle"

                    scroll={{
                        x: 1200,
                    }}

                    onRow={(record) => ({

                        onClick: () =>
                            handleEdit(record),

                        style: {
                            cursor: "pointer",
                        },

                    })}

                    rowClassName={
                        (record) =>

                            editId ===
                            record.Sa_ID

                                ? "ant-table-row-selected"

                                : ""

                    }

                    pagination={{

                        pageSize: 10,

                        showSizeChanger: true,

                        pageSizeOptions: [
                            "10",
                            "20",
                            "50",
                            "100",
                        ],

                        showTotal:
                            (total) =>
                                `Total ${total} accounts`,

                    }}

                    locale={{

                        emptyText:

                            searchTerm

                                ? "No Subsidiary Account found."

                                : "No Subsidiary Accounts saved yet.",

                    }}

                />

            </Card>

        </div>

    );

};


export default SubsidaryAccount;