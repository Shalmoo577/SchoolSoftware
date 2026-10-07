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
    message
} from "antd";
import {
    PlusOutlined,
    EditOutlined,
    ReloadOutlined
} from "@ant-design/icons";

const API = "/api";

const Section = () => {

    const [form] = Form.useForm();

    const [loggedInUser, setLoggedInUser] = useState(null);
    const [campuses, setCampuses] = useState([]);
    const [sections, setSections] = useState([]);

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState(null);

    // =====================================================
    // GET LOGGED IN USER
    // =====================================================
    useEffect(() => {

        try {

            const user = JSON.parse(
                localStorage.getItem("user")
            );

            setLoggedInUser(user || null);

        } catch (error) {

            console.error("USER LOAD ERROR:", error);

            setLoggedInUser(null);
        }

    }, []);


    // =====================================================
    // ADMIN CHECK
    // =====================================================
    const userRole = String(
        loggedInUser?.role || ""
    ).toUpperCase();

    const isAdmin =
        userRole === "SUPER_ADMIN" ||
        userRole === "CAMPUS_ADMIN" ||
        Number(loggedInUser?.is_developer) === 1;


    // =====================================================
    // LOAD CAMPUSES
    // =====================================================
    const loadCampuses = async () => {

        try {

            const response = await axios.get(
                `${API}/campuses`
            );

            setCampuses(response.data || []);

        } catch (error) {

            console.error(
                "LOAD CAMPUSES ERROR:",
                error
            );

            message.error(
                error.response?.data?.message ||
                "Failed to load campuses"
            );
        }
    };


    // =====================================================
    // LOAD SECTIONS
    //
    // campusId provided  -> selected campus
    // campusId omitted   -> ALL campuses
    // =====================================================
    const loadSections = async (campusId = null) => {

        try {

            setLoading(true);

            const params = {};

            // Only send campus_id when a campus
            // is specifically selected
            if (
                campusId !== null &&
                campusId !== undefined &&
                campusId !== ""
            ) {
                params.campus_id = campusId;
            }

            const response = await axios.get(
                `${API}/sections`,
                {
                    params
                }
            );

            setSections(response.data || []);

        } catch (error) {

            console.error(
                "LOAD SECTIONS ERROR:",
                error
            );

            message.error(
                error.response?.data?.message ||
                "Failed to load sections"
            );

        } finally {

            setLoading(false);
        }
    };


    // =====================================================
    // INITIAL LOAD
    // =====================================================
    useEffect(() => {

        if (!loggedInUser) {
            return;
        }

        loadCampuses();

        // =================================================
        // NORMAL USER
        // =================================================
        if (!isAdmin) {

            const campusId =
                Number(loggedInUser?.campus_id);

            if (!campusId) {

                message.error(
                    "Campus is not assigned to this user"
                );

                return;
            }

            // Normal user campus locked
            form.setFieldValue(
                "campus_id",
                campusId
            );

            // Only own campus data
            loadSections(campusId);

        }

        // =================================================
        // ADMIN / DEVELOPER
        // =================================================
        else {

            // IMPORTANT:
            // Do NOT use loggedInUser.campus_id here.
            //
            // Admin should initially see ALL campuses.
            form.setFieldValue(
                "campus_id",
                undefined
            );

            loadSections();

        }

    }, [loggedInUser, isAdmin]);


    // =====================================================
    // NEW
    // =====================================================
    const handleNew = () => {

        setEditingId(null);

        form.resetFields();

        // Normal user -> own campus
        if (!isAdmin && loggedInUser?.campus_id) {

            form.setFieldValue(
                "campus_id",
                Number(loggedInUser.campus_id)
            );
        }

        form.setFieldValue(
            "capacity",
            40
        );

        form.setFieldValue(
            "status",
            "Active"
        );

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    };


    // =====================================================
    // EDIT
    // =====================================================
    const handleEdit = (record) => {

        setEditingId(record.section_id);

        form.setFieldsValue({

            campus_id:
                Number(record.campus_id),

            section_name:
                record.section_name,

            room_number:
                record.room_number,

            capacity:
                record.capacity,

            status:
                record.status
        });

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    };


    // =====================================================
    // CAMPUS CHANGE
    // =====================================================
    const handleCampusChange = (campusId) => {

        form.setFieldValue(
            "campus_id",
            campusId
        );

        // Admin selecting a campus
        // filters table to that campus
        if (isAdmin) {

            if (campusId) {

                loadSections(campusId);

            } else {

                // No campus selected
                // show ALL
                loadSections();
            }

        } else {

            loadSections(
                loggedInUser?.campus_id
            );
        }
    };


    // =====================================================
    // SAVE / UPDATE
    // =====================================================
    const handleSubmit = async (values) => {

        try {

            setSaving(true);

            let campusId =
                Number(values.campus_id);

            // =================================================
            // NORMAL USER SECURITY
            // =================================================
            if (!isAdmin) {

                const userCampusId =
                    Number(loggedInUser?.campus_id);

                if (
                    campusId !== userCampusId
                ) {

                    message.error(
                        "You can only manage your own campus"
                    );

                    return;
                }

                campusId = userCampusId;
            }


            const payload = {

                campus_id:
                    campusId,

                section_name:
                    values.section_name
                        ?.trim()
                        .toUpperCase(),

                room_number:
                    values.room_number
                        ?.trim() || null,

                capacity:
                    Number(values.capacity) || 40,

                status:
                    values.status || "Active"
            };


            // =================================================
            // UPDATE
            // =================================================
            if (editingId) {

                await axios.put(
                    `${API}/sections/${editingId}`,
                    payload
                );

                message.success(
                    "Section updated successfully"
                );

            }

            // =================================================
            // INSERT
            // =================================================
            else {

                await axios.post(
                    `${API}/sections`,
                    payload
                );

                message.success(
                    "Section created successfully"
                );
            }


            // =================================================
            // RESET
            // =================================================
            setEditingId(null);

            form.resetFields();

            form.setFieldValue(
                "capacity",
                40
            );

            form.setFieldValue(
                "status",
                "Active"
            );


            // Normal user gets own campus back
            if (
                !isAdmin &&
                loggedInUser?.campus_id
            ) {

                form.setFieldValue(
                    "campus_id",
                    Number(loggedInUser.campus_id)
                );
            }


            // =================================================
            // REFRESH TABLE
            // =================================================
            if (isAdmin) {

                // If admin currently selected a campus,
                // keep that filter.
                const currentCampus =
                    form.getFieldValue("campus_id");

                if (currentCampus) {

                    loadSections(currentCampus);

                } else {

                    // No campus selected = ALL
                    loadSections();
                }

            } else {

                loadSections(
                    loggedInUser?.campus_id
                );
            }

        } catch (error) {

            console.error(
                "SAVE SECTION ERROR:",
                error
            );

            message.error(
                error.response?.data?.message ||
                "Failed to save section"
            );

        } finally {

            setSaving(false);
        }
    };


    // =====================================================
    // STATUS CHANGE
    // =====================================================
    const handleStatusChange = async (record) => {

        try {

            const newStatus =
                record.status === "Active"
                    ? "Inactive"
                    : "Active";

            await axios.patch(
                `${API}/sections/${record.section_id}/status`,
                {
                    status: newStatus
                }
            );

            message.success(
                `Section ${newStatus.toLowerCase()} successfully`
            );


            // Refresh according to current filter
            if (isAdmin) {

                const currentCampus =
                    form.getFieldValue("campus_id");

                if (currentCampus) {

                    loadSections(currentCampus);

                } else {

                    loadSections();
                }

            } else {

                loadSections(
                    loggedInUser?.campus_id
                );
            }

        } catch (error) {

            console.error(
                "STATUS ERROR:",
                error
            );

            message.error(
                error.response?.data?.message ||
                "Failed to change status"
            );
        }
    };


    // =====================================================
    // TABLE COLUMNS
    // =====================================================
    const columns = [

        {
            title: "ID",
            dataIndex: "section_id",
            key: "section_id",
            width: 70
        },

        {
            title: "Campus",
            dataIndex: "campus_name",
            key: "campus_name"
        },

        {
            title: "Section Name",
            dataIndex: "section_name",
            key: "section_name"
        },

        {
            title: "Room",
            dataIndex: "room_number",
            key: "room_number",

            render: (value) =>
                value || "-"
        },

        {
            title: "Capacity",
            dataIndex: "capacity",
            key: "capacity"
        },

        {
            title: "Status",
            dataIndex: "status",
            key: "status",

            render: (status) => (

                <Tag
                    color={
                        status === "Active"
                            ? "green"
                            : "red"
                    }
                >
                    {status}
                </Tag>
            )
        },

        {
            title: "Action",
            key: "action",

            render: (_, record) => (

                <Space>

                    <Button
                        type="link"
                        icon={
                            <EditOutlined />
                        }
                        onClick={() =>
                            handleEdit(record)
                        }
                    >
                        Edit
                    </Button>

                    <Button
                        type="link"
                        danger={
                            record.status === "Active"
                        }
                        onClick={() =>
                            handleStatusChange(
                                record
                            )
                        }
                    >
                        {
                            record.status === "Active"
                                ? "Deactivate"
                                : "Activate"
                        }
                    </Button>

                </Space>
            )
        }
    ];


    // =====================================================
    // UI
    // =====================================================
    return (

        <div
            style={{
                padding: 20
            }}
        >

            {/* =================================================
                FORM
            ================================================= */}

            <Card
                title={
                    editingId
                        ? "Edit Section"
                        : "Add Section"
                }

                extra={

                    <Button
                        icon={
                            <PlusOutlined />
                        }
                        onClick={handleNew}
                    >
                        New
                    </Button>
                }
            >

                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                >

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns:
                                "repeat(5, minmax(160px, 1fr))",
                            gap: 16
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
                                        "Please select campus"
                                }
                            ]}
                        >

                            <Select
                                placeholder={
                                    isAdmin
                                        ? "All Campuses / Select Campus"
                                        : "Select Campus"
                                }
                                disabled={!isAdmin}
                                allowClear={isAdmin}
                                onChange={
                                    handleCampusChange
                                }
                                options={
                                    campuses.map(
                                        (campus) => ({
                                            value:
                                                Number(
                                                    campus.campus_id
                                                ),
                                            label:
                                                campus.name
                                        })
                                    )
                                }
                            />

                        </Form.Item>


                        {/* SECTION NAME */}

                        <Form.Item
                            label="Section Name"
                            name="section_name"
                            rules={[
                                {
                                    required: true,
                                    message:
                                        "Please enter section name"
                                }
                            ]}
                        >

                            <Input
                                placeholder="MORNING"
                                maxLength={50}
                            />

                        </Form.Item>


                        {/* ROOM */}

                        <Form.Item
                            label="Room Number"
                            name="room_number"
                        >

                            <Input
                                placeholder="Room No."
                                maxLength={20}
                            />

                        </Form.Item>


                        {/* CAPACITY */}

                        <Form.Item
                            label="Capacity"
                            name="capacity"
                            rules={[
                                {
                                    required: true,
                                    message:
                                        "Please enter capacity"
                                }
                            ]}
                        >

                            <InputNumber
                                min={1}
                                style={{
                                    width: "100%"
                                }}
                            />

                        </Form.Item>


                        {/* STATUS */}

                        <Form.Item
                            label="Status"
                            name="status"
                            rules={[
                                {
                                    required: true,
                                    message:
                                        "Please select status"
                                }
                            ]}
                        >

                            <Select
                                options={[
                                    {
                                        value: "Active",
                                        label: "Active"
                                    },
                                    {
                                        value: "Inactive",
                                        label: "Inactive"
                                    }
                                ]}
                            />

                        </Form.Item>

                    </div>


                    <Space>

                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={saving}
                        >
                            {
                                editingId
                                    ? "Update Section"
                                    : "Save Section"
                            }
                        </Button>

                        <Button
                            onClick={handleNew}
                        >
                            Clear
                        </Button>

                    </Space>

                </Form>

            </Card>


            {/* =================================================
                TABLE
            ================================================= */}

            <Card
                title="Section List"
                style={{
                    marginTop: 20
                }}

                extra={

                    <Button
                        icon={
                            <ReloadOutlined />
                        }
                        onClick={() => {

                            if (isAdmin) {

                                const currentCampus =
                                    form.getFieldValue(
                                        "campus_id"
                                    );

                                if (currentCampus) {

                                    loadSections(
                                        currentCampus
                                    );

                                } else {

                                    loadSections();
                                }

                            } else {

                                loadSections(
                                    loggedInUser?.campus_id
                                );
                            }
                        }}
                    >
                        Refresh
                    </Button>
                }
            >

                <Table
                    rowKey="section_id"
                    columns={columns}
                    dataSource={sections}
                    loading={loading}
                    bordered
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true
                    }}
                    scroll={{
                        x: 900
                    }}
                />

            </Card>

        </div>
    );
};

export default Section;
