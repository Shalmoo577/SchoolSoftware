import React, { useEffect, useState } from "react";
import axios from "axios";
import {
    Card,
    Form,
    Input,
    InputNumber,
    Select,
    Button,
    Table,
    Space,
    Tag,
    Row,
    Col,
    Popconfirm,
    message
} from "antd";

import {
    PlusOutlined,
    EditOutlined,
    ReloadOutlined,
    SaveOutlined,
    CloseOutlined
} from "@ant-design/icons";



const API = "/api";

const Period = () => {

    const [form] = Form.useForm();

    // =========================================================
    // USER
    // =========================================================

    const [user, setUser] = useState(null);

    const userRole = String(
        user?.role || ""
    ).toUpperCase();

    const isAdmin =
        Number(user?.is_developer) === 1 ||
        userRole === "SUPER_ADMIN" ||
        userRole === "CAMPUS_ADMIN";


    // =========================================================
    // STATES
    // =========================================================

    const [campuses, setCampuses] = useState([]);
    const [sections, setSections] = useState([]);

    const [periods, setPeriods] = useState([]);

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [editingId, setEditingId] = useState(null);

    const [searchText, setSearchText] = useState("");

    const [campusFilter, setCampusFilter] = useState(null);
    const [sectionFilter, setSectionFilter] = useState(null);
    const [statusFilter, setStatusFilter] = useState("ALL");


    // =========================================================
    // LOAD USER
    // =========================================================

    useEffect(() => {

        try {

            const savedUser =
                JSON.parse(
                    localStorage.getItem("user") || "null"
                );

            setUser(savedUser);

        } catch (error) {

            console.error(
                "USER LOAD ERROR:",
                error
            );

            setUser(null);
        }

    }, []);


    // =========================================================
    // LOAD CAMPUSES
    // =========================================================

    const loadCampuses = async () => {

        try {

            const response = await axios.get(
                `${API}/campuses`
            );

            console.log(
                "CAMPUSES:",
                response.data
            );

            const data =
                Array.isArray(response.data)
                    ? response.data
                    : [];

            setCampuses(data);

        } catch (error) {

            console.error(
                "CAMPUS LOAD ERROR:",
                error.response?.data || error
            );

            setCampuses([]);

            message.error(
                error.response?.data?.message ||
                "Failed to load campuses"
            );
        }
    };


    // =========================================================
    // LOAD SECTIONS
    // =========================================================

    const loadSections = async (
        campusId = null
    ) => {

        try {

            const params = {};

            if (campusId) {
                params.campus_id = campusId;
            }

            const response = await axios.get(
                `${API}/sections`,
                {
                    params
                }
            );

            console.log(
                "SECTIONS:",
                response.data
            );

            const data =
                Array.isArray(response.data)
                    ? response.data
                    : [];

            setSections(data);

        } catch (error) {

            console.error(
                "SECTION LOAD ERROR:",
                error.response?.data || error
            );

            setSections([]);

            message.error(
                error.response?.data?.message ||
                "Failed to load sections"
            );
        }
    };


    // =========================================================
    // LOAD PERIODS
    // =========================================================

  const loadPeriods = async () => {
    if (!user?.user_id) {
        return;
    }

    try {
        setLoading(true);

        const params = {
            user_id: user.user_id
        };

        // ADMIN
        if (isAdmin) {
            if (campusFilter) {
                params.campus_id = campusFilter;
            }

            if (sectionFilter) {
                params.section_id = sectionFilter;
            }
        }

        // NORMAL USER
        // Backend user ke campus/section ke according data filter karega
        if (!isAdmin) {
            if (user?.section_id) {
                params.section_id = user.section_id;
            }
        }

        const response = await axios.get(
            `${API}/periods`,
            {
                params
            }
        );

        console.log("PERIODS RESPONSE:", response.data);

        const data = Array.isArray(response.data?.periods)
            ? response.data.periods
            : [];

        console.log("PERIOD ARRAY:", data);

        setPeriods(data);

    } catch (error) {

        console.error(
            "PERIOD LOAD ERROR:",
            error.response?.data || error
        );

        setPeriods([]);

        message.error(
            error.response?.data?.message ||
            "Failed to load periods"
        );

    } finally {
        setLoading(false);
    }
};


    // =========================================================
    // INITIAL DATA
    // =========================================================

    useEffect(() => {

        if (!user?.user_id) {
            return;
        }

        loadCampuses();

        if (isAdmin) {

            /*
            Admin can see all sections initially.
            */
            loadSections();

        } else {

            /*
            Normal user:
            load only his campus sections
            */

            if (user?.campus_id) {

                loadSections(
                    user.campus_id
                );

                form.setFieldsValue({
                    campus_id:
                        user.campus_id,

                    section_id:
                        user.section_id
                });
            }
        }

    }, [
        user?.user_id,
        user?.campus_id,
        user?.section_id,
        isAdmin
    ]);


    // =========================================================
    // LOAD PERIODS AFTER USER IS READY
    // =========================================================

    useEffect(() => {

        if (!user?.user_id) {
            return;
        }

        loadPeriods();

    }, [
        user?.user_id,
        campusFilter,
        sectionFilter,
        isAdmin
    ]);


    // =========================================================
    // CAMPUS OPTIONS
    // =========================================================

    const campusOptions = campuses

        .filter(
            item =>
                item.is_active === undefined ||
                Number(item.is_active) === 1
        )

        .filter(
            item => {

                if (isAdmin) {
                    return true;
                }

                return String(
                    item.campus_id ??
                    item.id
                ) === String(
                    user?.campus_id
                );
            }
        )

        .map(
            item => ({
                value:
                    item.campus_id ??
                    item.id,

                label:
                    item.name ??
                    item.campus_name
            })
        );


    // =========================================================
    // SECTION OPTIONS
    // =========================================================

    /*
    IMPORTANT:
    This was the missing variable.
    */

    const sectionOptions = sections

        .filter(
            item =>
                item.is_active === undefined ||
                Number(item.is_active) === 1
        )

        .filter(
            item => {

                /*
                NORMAL USER
                */

                if (!isAdmin) {

                    return String(
                        item.section_id ??
                        item.id
                    ) === String(
                        user?.section_id
                    );
                }


                /*
                ADMIN
                */

                if (!campusFilter) {
                    return true;
                }

                return String(
                    item.campus_id
                ) === String(
                    campusFilter
                );
            }
        )

        .map(
            item => ({
                value:
                    item.section_id ??
                    item.id,

                label:
                    item.section_name ??
                    item.name
            })
        );


    // =========================================================
    // FORM CAMPUS CHANGE
    // =========================================================

    const handleCampusChange = async (
        value
    ) => {

        form.setFieldsValue({
            campus_id: value,
            section_id: undefined
        });

        setSectionFilter(null);

        if (value) {

            await loadSections(value);

        } else {

            setSections([]);
        }
    };


    // =========================================================
    // FORM SECTION CHANGE
    // =========================================================

    const handleSectionChange = (
        value
    ) => {

        form.setFieldValue(
            "section_id",
            value
        );
    };


    // =========================================================
    // FILTER CAMPUS CHANGE
    // =========================================================

    const handleFilterCampusChange = async (
        value
    ) => {

        setCampusFilter(value);
        setSectionFilter(null);

        if (value) {

            await loadSections(value);

        } else {

            await loadSections();
        }
    };


    // =========================================================
    // RESET FORM
    // =========================================================

    const resetForm = () => {

        setEditingId(null);

        form.resetFields();

        if (!isAdmin) {

            form.setFieldsValue({

                campus_id:
                    user?.campus_id,

                section_id:
                    user?.section_id
            });
        }
    };


    // =========================================================
    // SAVE / UPDATE
    // =========================================================

    const handleSubmit = async (
        values
    ) => {

        if (!user?.user_id) {

            message.error(
                "User information not found"
            );

            return;
        }


        try {

            setSaving(true);


            const payload = {

                user_id:
                    user.user_id,

                campus_id:
                    values.campus_id,

                section_id:
                    values.section_id,

                period_no:
                    values.period_no,

                title:
                    values.title?.trim(),

                start_time:
                    values.start_time,

                end_time:
                    values.end_time,

                period_type:
                    values.type || "CLASS",

                is_active:
                    values.is_active === undefined
                        ? 1
                        : values.is_active
            };


            if (editingId) {

                await axios.put(
                    `${API}/periods/${editingId}`,
                    payload
                );

                message.success(
                    "Period updated successfully"
                );

            } else {

                await axios.post(
                    `${API}/periods`,
                    payload
                );

                message.success(
                    "Period added successfully"
                );
            }


            resetForm();

            await loadPeriods();

        } catch (error) {

            console.error(
                "SAVE PERIOD ERROR:",
                error.response?.data || error
            );

            message.error(
                error.response?.data?.message ||
                "Failed to save period"
            );

        } finally {

            setSaving(false);
        }
    };


    // =========================================================
    // EDIT
    // =========================================================

    const handleEdit = (
        record
    ) => {

        setEditingId(
            record.period_id
        );


        form.setFieldsValue({

            campus_id:
                record.campus_id,

            section_id:
                record.section_id,

            period_no:
                record.period_no,

            title:
                record.title,

            start_time:
                record.start_time,

            end_time:
                record.end_time,

            period_type:
                record.type ||
                record.period_type ||
                "CLASS",

            is_active:
                Number(
                    record.is_active
                )
        });


        /*
        For admin, load sections of
        selected record campus.
        */

        if (
            isAdmin &&
            record.campus_id
        ) {

            loadSections(
                record.campus_id
            );
        }


        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    };


    // =========================================================
    // STATUS CHANGE
    // =========================================================

    const handleStatusChange = async (
        record
    ) => {

        try {

            const newStatus =
                Number(record.is_active) === 1
                    ? 0
                    : 1;


            /*
            Using PUT so backend only needs
            the normal period update route.
            */

            await axios.put(
                `${API}/periods/${record.period_id}`,
                {
                    user_id:
                        user.user_id,

                    campus_id:
                        record.campus_id,

                    section_id:
                        record.section_id,

                    period_no:
                        record.period_no,

                    title:
                        record.title,

                    start_time:
                        record.start_time,

                    end_time:
                        record.end_time,

                    type:
                        record.type ||
                        record.period_type ||
                        "CLASS",

                    is_active:
                        newStatus
                }
            );


            message.success(
                newStatus === 1
                    ? "Period activated"
                    : "Period deactivated"
            );


            await loadPeriods();

        } catch (error) {

            console.error(
                "STATUS ERROR:",
                error.response?.data || error
            );

            message.error(
                error.response?.data?.message ||
                "Failed to change period status"
            );
        }
    };


    // =========================================================
    // FILTERED DATA
    // =========================================================

    const filteredData =
        periods.filter(
            record => {

                const text =
                    searchText
                        .trim()
                        .toLowerCase();


                const matchesSearch =
                    !text ||
                    String(
                        record.period_no || ""
                    )
                        .toLowerCase()
                        .includes(text) ||

                    String(
                        record.title || ""
                    )
                        .toLowerCase()
                        .includes(text) ||

                    String(
                        record.campus_name || ""
                    )
                        .toLowerCase()
                        .includes(text) ||

                    String(
                        record.section_name || ""
                    )
                        .toLowerCase()
                        .includes(text);


                const matchesStatus =
                    statusFilter === "ALL" ||
                    (
                        statusFilter === "ACTIVE" &&
                        Number(
                            record.is_active
                        ) === 1
                    ) ||
                    (
                        statusFilter === "INACTIVE" &&
                        Number(
                            record.is_active
                        ) === 0
                    );


                return (
                    matchesSearch &&
                    matchesStatus
                );
            }
        );


    // =========================================================
    // TABLE COLUMNS
    // =========================================================

    const columns = [

        {
            title: "Campus",
            dataIndex: "campus_name",
            key: "campus_name",

            render: value => (
                <Tag color="blue">
                    {value || "-"}
                </Tag>
            )
        },


        {
            title: "Section",
            dataIndex: "section_name",
            key: "section_name",

            render: value => (
                <Tag color="purple">
                    {value || "-"}
                </Tag>
            )
        },


        {
            title: "Period",
            dataIndex: "period_no",
            key: "period_no",

            width: 100,

            render: value => (
                <Tag color="cyan">
                    {value}
                </Tag>
            )
        },


        {
            title: "Title",
            dataIndex: "title",
            key: "title",

            render: value =>
                value || "-"
        },


        {
            title: "Start",
            dataIndex: "start_time",
            key: "start_time",

            width: 100
        },


        {
            title: "End",
            dataIndex: "end_time",
            key: "end_time",

            width: 100
        },


        {
            title: "Type",
            key: "type",

            render: (_, record) => {

                const type =
                    String(
                        record.type ||
                        record.period_type ||
                        "CLASS"
                    ).toUpperCase();


                let color = "blue";

                if (type === "BREAK") {
                    color = "orange";
                }

                if (type === "ACTIVITY") {
                    color = "purple";
                }


                return (
                    <Tag color={color}>
                        {type}
                    </Tag>
                );
            }
        },


        {
            title: "Status",
            dataIndex: "is_active",
            key: "is_active",

            render: value => (

                <Tag
                    color={
                        Number(value) === 1
                            ? "green"
                            : "red"
                    }
                >
                    {
                        Number(value) === 1
                            ? "Active"
                            : "Inactive"
                    }
                </Tag>
            )
        },


        {
            title: "Action",
            key: "action",

            width: 220,

            render: (_, record) => (

                <Space>

                    <Button
                        type="primary"
                        size="small"
                        icon={
                            <EditOutlined />
                        }
                        onClick={() =>
                            handleEdit(record)
                        }
                    >
                        Edit
                    </Button>


                    <Popconfirm
                        title={
                            Number(
                                record.is_active
                            ) === 1
                                ? "Deactivate this period?"
                                : "Activate this period?"
                        }

                        description={
                            Number(
                                record.is_active
                            ) === 1
                                ? "This period will become inactive."
                                : "This period will become active."
                        }

                        okText="Yes"
                        cancelText="No"

                        onConfirm={() =>
                            handleStatusChange(
                                record
                            )
                        }
                    >

                        <Button
                            size="small"
                            danger={
                                Number(
                                    record.is_active
                                ) === 1
                            }
                        >
                            {
                                Number(
                                    record.is_active
                                ) === 1
                                    ? "Deactivate"
                                    : "Activate"
                            }
                        </Button>

                    </Popconfirm>

                </Space>
            )
        }
    ];


    // =========================================================
    // UI
    // =========================================================

    return (

        <div
            style={{
                padding: 20
            }}
        >

            {/* ================================================= */}
            {/* FORM */}
            {/* ================================================= */}

            <Card
                title={
                    editingId
                        ? "Edit Period"
                        : "Add Period"
                }

                extra={

                    editingId && (

                        <Button
                            icon={
                                <CloseOutlined />
                            }
                            onClick={
                                resetForm
                            }
                        >
                            Cancel Edit
                        </Button>
                    )
                }
            >

                <Form
                    form={form}
                    layout="vertical"
                    onFinish={
                        handleSubmit
                    }

                    initialValues={{
                        type: "CLASS",
                        is_active: 1
                    }}
                >

                    <Row gutter={16}>

                        {/* ===================================== */}
                        {/* CAMPUS */}
                        {/* ===================================== */}

                        <Col
                            xs={24}
                            sm={12}
                            md={6}
                        >

                            <Form.Item
                                label="Campus"
                                name="campus_id"

                                rules={[
                                    {
                                        required: true,
                                        message:
                                            "Please select campus"
                                    }
                                ]}
                            >

                                <Select
                                    placeholder="Select Campus"

                                    showSearch

                                    optionFilterProp="label"

                                    disabled={
                                        !isAdmin
                                    }

                                    options={
                                        campusOptions
                                    }

                                    onChange={
                                        handleCampusChange
                                    }
                                />

                            </Form.Item>

                        </Col>


                        {/* ===================================== */}
                        {/* SECTION */}
                        {/* ===================================== */}

                        <Col
                            xs={24}
                            sm={12}
                            md={6}
                        >

                            <Form.Item
                                label="Section"
                                name="section_id"

                                rules={[
                                    {
                                        required: true,
                                        message:
                                            "Please select section"
                                    }
                                ]}
                            >

                                <Select
                                    placeholder="Select Section"

                                    showSearch

                                    optionFilterProp="label"

                                    disabled={
                                        !isAdmin
                                    }

                                    options={
                                        sectionOptions
                                    }

                                    onChange={
                                        handleSectionChange
                                    }
                                />

                            </Form.Item>

                        </Col>


                        {/* ===================================== */}
                        {/* PERIOD NUMBER */}
                        {/* ===================================== */}

                        <Col
                            xs={24}
                            sm={12}
                            md={4}
                        >

                            <Form.Item
                                label="Period No"
                                name="period_no"

                                rules={[
                                    {
                                        required: true,
                                        message:
                                            "Please enter period number"
                                    }
                                ]}
                            >

                                <InputNumber
                                    min={1}
                                    style={{
                                        width: "100%"
                                    }}

                                    placeholder="1"
                                />

                            </Form.Item>

                        </Col>


                        {/* ===================================== */}
                        {/* TYPE */}
                        {/* ===================================== */}

                        <Col
                            xs={24}
                            sm={12}
                            md={8}
                        >

                            <Form.Item
                                label="Period Type"
                                name="type"

                                rules={[
                                    {
                                        required: true,
                                        message:
                                            "Please select period type"
                                    }
                                ]}
                            >

                                <Select
                                    options={[
                                        {
                                            value: "CLASS",
                                            label: "Class"
                                        },
                                        {
                                            value: "BREAK",
                                            label: "Break"
                                        },
                                        {
                                            value: "ACTIVITY",
                                            label: "Activity"
                                        }
                                    ]}
                                />

                            </Form.Item>

                        </Col>

                    </Row>


                    <Row gutter={16}>

                        {/* ===================================== */}
                        {/* TITLE */}
                        {/* ===================================== */}

                        <Col
                            xs={24}
                            sm={12}
                            md={8}
                        >

                            <Form.Item
                                label="Title"
                                name="title"

                                rules={[
                                    {
                                        required: true,
                                        message:
                                            "Please enter period title"
                                    }
                                ]}
                            >

                                <Input
                                    placeholder="e.g. Period 1"
                                />

                            </Form.Item>

                        </Col>


                        {/* ===================================== */}
                        {/* START TIME */}
                        {/* ===================================== */}

                        <Col
                            xs={24}
                            sm={12}
                            md={6}
                        >

                            <Form.Item
                                label="Start Time"
                                name="start_time"

                                rules={[
                                    {
                                        required: true,
                                        message:
                                            "Please enter start time"
                                    }
                                ]}
                            >

                                <Input
                                    type="time"
                                />

                            </Form.Item>

                        </Col>


                        {/* ===================================== */}
                        {/* END TIME */}
                        {/* ===================================== */}

                        <Col
                            xs={24}
                            sm={12}
                            md={6}
                        >

                            <Form.Item
                                label="End Time"
                                name="end_time"

                                rules={[
                                    {
                                        required: true,
                                        message:
                                            "Please enter end time"
                                    }
                                ]}
                            >

                                <Input
                                    type="time"
                                />

                            </Form.Item>

                        </Col>


                        {/* ===================================== */}
                        {/* ACTIVE */}
                        {/* ===================================== */}

                        <Col
                            xs={24}
                            sm={12}
                            md={4}
                        >

                            <Form.Item
                                label="Status"
                                name="is_active"
                            >

                                <Select
                                    options={[
                                        {
                                            value: 1,
                                            label: "Active"
                                        },
                                        {
                                            value: 0,
                                            label: "Inactive"
                                        }
                                    ]}
                                />

                            </Form.Item>

                        </Col>

                    </Row>


                    {/* ========================================= */}
                    {/* BUTTONS */}
                    {/* ========================================= */}

                    <Space>

                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={saving}
                            icon={
                                editingId
                                    ? <SaveOutlined />
                                    : <PlusOutlined />
                            }
                        >
                            {
                                editingId
                                    ? "Update Period"
                                    : "Add Period"
                            }
                        </Button>


                        <Button
                            icon={
                                <ReloadOutlined />
                            }
                            onClick={
                                resetForm
                            }
                        >
                            Reset
                        </Button>

                    </Space>

                </Form>

            </Card>


            {/* ================================================= */}
            {/* FILTERS */}
            {/* ================================================= */}

            <Card
                title="Period List"
                style={{
                    marginTop: 20
                }}
            >

                <Row
                    gutter={16}
                    style={{
                        marginBottom: 16
                    }}
                >

                    {/* ===================================== */}
                    {/* CAMPUS FILTER */}
                    {/* ===================================== */}

                    {isAdmin && (

                        <Col
                            xs={24}
                            sm={12}
                            md={6}
                        >

                            <Select
                                allowClear
                                style={{
                                    width: "100%"
                                }}

                                placeholder="Filter Campus"

                                showSearch

                                optionFilterProp="label"

                                options={
                                    campusOptions
                                }

                                value={
                                    campusFilter
                                }

                                onChange={
                                    handleFilterCampusChange
                                }
                            />

                        </Col>
                    )}


                    {/* ===================================== */}
                    {/* SECTION FILTER */}
                    {/* ===================================== */}

                    {isAdmin && (

                        <Col
                            xs={24}
                            sm={12}
                            md={6}
                        >

                            <Select
                                allowClear

                                style={{
                                    width: "100%"
                                }}

                                placeholder="Filter Section"

                                showSearch

                                optionFilterProp="label"

                                options={
                                    sectionOptions
                                }

                                value={
                                    sectionFilter
                                }

                                onChange={
                                    value =>
                                        setSectionFilter(
                                            value
                                        )
                                }
                            />

                        </Col>
                    )}


                    {/* ===================================== */}
                    {/* STATUS */}
                    {/* ===================================== */}

                    <Col
                        xs={24}
                        sm={12}
                        md={5}
                    >

                        <Select
                            style={{
                                width: "100%"
                            }}

                            value={
                                statusFilter
                            }

                            onChange={
                                value =>
                                    setStatusFilter(
                                        value
                                    )
                            }

                            options={[
                                {
                                    value: "ALL",
                                    label: "All Status"
                                },
                                {
                                    value: "ACTIVE",
                                    label: "Active"
                                },
                                {
                                    value: "INACTIVE",
                                    label: "Inactive"
                                }
                            ]}
                        />

                    </Col>


                    {/* ===================================== */}
                    {/* SEARCH */}
                    {/* ===================================== */}

                    <Col
                        xs={24}
                        sm={12}
                        md={7}
                    >

                        <Input
                            placeholder="Search period..."
                            value={
                                searchText
                            }

                            onChange={
                                e =>
                                    setSearchText(
                                        e.target.value
                                    )
                            }

                            allowClear
                        />

                    </Col>


                    {/* ===================================== */}
                    {/* REFRESH */}
                    {/* ===================================== */}

                    <Col
                        xs={24}
                        sm={12}
                        md={2}
                    >

                        <Button
                            icon={
                                <ReloadOutlined />
                            }

                            onClick={
                                loadPeriods
                            }

                            loading={
                                loading
                            }
                        >
                            Refresh
                        </Button>

                    </Col>

                </Row>


                {/* ================================================= */}
                {/* TABLE */}
                {/* ================================================= */}

                <Table

                    rowKey="period_id"

                    columns={
                        columns
                    }

                    dataSource={
                        filteredData
                    }

                    loading={
                        loading
                    }

                    bordered

                    scroll={{
                        x: 1100
                    }}

                    pagination={{
                        pageSize: 10,

                        showSizeChanger: true,

                        pageSizeOptions: [
                            "5",
                            "10",
                            "20",
                            "50"
                        ]
                    }}

                />

            </Card>

        </div>
    );
};

export default Period;