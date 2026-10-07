import React, { useEffect, useState } from "react";
import axios from "axios";
import {
    Card,
    Form,
    Input,
    Select,
    Button,
    Table,
    Space,
    Popconfirm,
    Tag,
    Modal,
    message,
    Row,
    Col
} from "antd";

import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    ReloadOutlined
} from "@ant-design/icons";

const API_URL = "/api";

const User = () => {

    const [form] = Form.useForm();

    const [users, setUsers] = useState([]);
    const [campuses, setCampuses] = useState([]);
    const [section , setSection] = useState([]);

    const [loading, setLoading] = useState(false);
    const [campusLoading, setCampusLoading] = useState(false);
    const [sectionLoading, setSectionLoading] = useState(false);

    const [editingId, setEditingId] = useState(null);

    const [searchText, setSearchText] = useState("");

    // ==========================================
    // CURRENT LOGGED IN USER
    // ==========================================

    const currentUser = JSON.parse(
        localStorage.getItem("user") || "{}"
    );


    // ==========================================
    // LOAD USERS
    // ==========================================

    const loadUsers = async () => {

        try {

            setLoading(true);

            const response = await axios.get(
                `${API_URL}/users`
            );

            setUsers(response.data || []);

        } catch (error) {

            console.error("Load Users Error:", error);

            message.error(
                error.response?.data?.message ||
                "Failed to load users"
            );

        } finally {

            setLoading(false);
        }
    };


    // ==========================================
    // LOAD CAMPUSES
    // ==========================================

    const loadCampuses = async () => {

        try {

            setCampusLoading(true);

            const response = await axios.get(
                `${API_URL}/campuses`
            );

            setCampuses(response.data || []);

        } catch (error) {

            console.error(
                "Load Campuses Error:",
                error
            );

            message.error(
                "Failed to load campuses"
            );

        } finally {

            setCampusLoading(false);
        }
    };
  // ==========================================
    // LOAD SECTION
    // ==========================================

    const loadSection = async () => {

        try {

            // setSeLoading(true);

            const response = await axios.get(
                "/api/section"
            );

            setSection(response.data || []);

        } catch (error) {

            console.error(
                "Load Section Error:",
                error
            );

            message.error(
                "Failed to load Section"
            );

         }
        //  finally {

        //     setCampusLoading(false);
        // }
    };

    // ==========================================
    // INITIAL LOAD
    // ==========================================

    useEffect(() => {

        loadUsers();
        loadCampuses();
        loadSection();

    }, []);


    // ==========================================
    // SAVE USER
    // ==========================================

    const handleSubmit = async (values) => {

        try {

            setLoading(true);

            const payload = {
                name: values.name?.trim(),
                email: values.email?.trim(),
                password: values.password || "",
                campus_id: values.campus_id,
                section_id: values.section_id,
                role: values.role,
                phone: values.phone?.trim() || null
            };


            // ==================================
            // CREATE
            // ==================================

            if (!editingId) {

                await axios.post(
                    `${API_URL}/users`,
                    payload
                );


                message.success(
                    "User created successfully"
                );

            }

            // ==================================
            // UPDATE
            // ==================================

            else {

                await axios.put(
                    `${API_URL}/users/${editingId}`,
                    payload
                );

                message.success(
                    "User updated successfully"
                );
            }


            // ==================================
            // RESET
            // ==================================

            form.resetFields();

            setEditingId(null);

            await loadUsers();

        } catch (error) {

            console.error(
                "Save User Error:",
                error
            );

            message.error(
                error.response?.data?.message ||
                "Failed to save user"
            );

        } finally {

            setLoading(false);
        }
    };


    // ==========================================
    // EDIT USER
    // ==========================================

    const handleEdit = (record) => {

        setEditingId(record.user_id);

        form.setFieldsValue({
            name: record.name,
            email: record.email,
            campus_id: record.campus_id,
            section_id: record.section_id,
            role: record.role,
            phone: record.phone || "",
            password: ""
        });

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    };


    // ==========================================
    // DELETE USER
    // ==========================================

    const handleDelete = async (userId) => {

        try {

            setLoading(true);

            await axios.delete(
                `${API_URL}/users/${userId}`
            );

            message.success(
                "User deleted successfully"
            );

            await loadUsers();

        } catch (error) {

            console.error(
                "Delete User Error:",
                error
            );

            message.error(
                error.response?.data?.message ||
                "Failed to delete user"
            );

        } finally {

            setLoading(false);
        }
    };


    // ==========================================
    // CANCEL EDIT
    // ==========================================

    const handleCancel = () => {

        form.resetFields();

        setEditingId(null);
    };


    // ==========================================
    // FILTER USERS
    // ==========================================

    const filteredUsers = users.filter((user) => {

        const search = searchText
            .toLowerCase()
            .trim();

        if (!search) {
            return true;
        }

        return (
            user.name?.toLowerCase().includes(search) ||
            user.email?.toLowerCase().includes(search) ||
            user.role?.toLowerCase().includes(search) ||
            user.campus_name?.toLowerCase().includes(search) ||
            user.section_name?.toLowerCase().includes(search)||
            user.phone?.toLowerCase().includes(search)
        );
    });


    // ==========================================
    // TABLE COLUMNS
    // ==========================================

    const columns = [

        {
            title: "ID",
            dataIndex: "user_id",
            key: "user_id",
            width: 70
        },

        {
            title: "Name",
            dataIndex: "name",
            key: "name"
        },

        {
            title: "Email",
            dataIndex: "email",
            key: "email"
        },

        {
            title: "Campus",
            dataIndex: "campus_name",
            key: "campus_name"
        },
        {
            title: "Section",
            dataIndex: "section_name",
            key: "section_name"
        },
        

        {
            title: "Role",
            dataIndex: "role",
            key: "role",

            render: (role) => (
                <Tag color="blue">
                    {role}
                </Tag>
            )
        },

        {
            title: "Phone",
            dataIndex: "phone",
            key: "phone",

            render: (phone) =>
                phone || "-"
        },

        {
            title: "Developer",
            dataIndex: "is_developer",
            key: "is_developer",

            render: (value) =>

                Number(value) === 1
                    ? (
                        <Tag color="green">
                            YES
                        </Tag>
                    )
                    : (
                        <Tag>
                            NO
                        </Tag>
                    )
        },

        {
            title: "Actions",
            key: "actions",

            width: 150,

            render: (_, record) => {

                const isDeveloper =
                    Number(record.is_developer) === 1;

                return (
                    <Space>

                        <Button
                            type="primary"
                            icon={<EditOutlined />}
                            size="small"
                            onClick={() =>
                                handleEdit(record)
                            }
                        >
                            Edit
                        </Button>


                        <Popconfirm
                            title="Delete this user?"
                            description="This action cannot be undone."
                            okText="Yes"
                            cancelText="No"
                            onConfirm={() =>
                                handleDelete(
                                    record.user_id
                                )
                            }
                            disabled={isDeveloper}
                        >

                            <Button
                                danger
                                icon={<DeleteOutlined />}
                                size="small"
                                disabled={isDeveloper}
                            >
                                Delete
                            </Button>

                        </Popconfirm>

                    </Space>
                );
            }
        }
    ];


    return (

        <div
            style={{
                padding: 20
            }}
        >

            {/* ======================================
                USER FORM
            ======================================= */}

            <Card
                title={
                    editingId
                        ? "Edit User"
                        : "Add New User"
                }
                extra={
                    editingId && (
                        <Button
                            onClick={handleCancel}
                        >
                            Cancel Edit
                        </Button>
                    )
                }
                style={{
                    marginBottom: 20
                }}
            >

                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                >

                    <Row gutter={16}>

                        {/* NAME */}

                        <Col
                            xs={24}
                            md={12}
                            lg={8}
                        >

                            <Form.Item
                                label="Name"
                                name="name"
                                rules={[
                                    {
                                        required: true,
                                        message:
                                            "Please enter name"
                                    }
                                ]}
                            >

                                <Input
                                    placeholder="Enter name"
                                />

                            </Form.Item>

                        </Col>


                        {/* EMAIL */}

                        <Col
                            xs={24}
                            md={12}
                            lg={8}
                        >

                            <Form.Item
                                label="Email"
                                name="email"
                                rules={[
                                    {
                                        required: true,
                                        message:
                                            "Please enter email"
                                    },
                                    {
                                        type: "email",
                                        message:
                                            "Enter valid email"
                                    }
                                ]}
                            >

                                <Input
                                    placeholder="Enter email"
                                />

                            </Form.Item>

                        </Col>


                        {/* PASSWORD */}

                        <Col
                            xs={24}
                            md={12}
                            lg={8}
                        >

                            <Form.Item
                                label={
                                    editingId
                                        ? "Password (leave blank to keep current)"
                                        : "Password"
                                }
                                name="password"
                                rules={
                                    editingId
                                        ? []
                                        : [
                                            {
                                                required: true,
                                                message:
                                                    "Please enter password"
                                            },
                                            {
                                                min: 6,
                                                message:
                                                    "Password must be at least 6 characters"
                                            }
                                        ]
                                }
                            >

                                <Input.Password
                                    placeholder={
                                        editingId
                                            ? "Leave blank to keep current password"
                                            : "Enter password"
                                    }
                                />

                            </Form.Item>

                        </Col>


                        {/* CAMPUS */}

                        <Col
                            xs={12}
                            md={6}
                            lg={4}
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
                                    loading={campusLoading}
                                    showSearch
                                    optionFilterProp="label"
                                    options={campuses.map(
                                        (campus) => ({
                                            value:
                                                campus.campus_id,
                                            label:
                                                campus.name
                                        })
                                    )}
                                />

                            </Form.Item>

                        </Col>

                          <Col
                            xs={12}
                            md={6}
                            lg={4}
                        >

                            <Form.Item
                                label="Section"
                                name="section_id"
                                rules={[
                                    {
                                        required: true,
                                        message:
                                            "Please select Section"
                                    }
                                ]}
                            >

                                <Select
                                    placeholder="Select Section"
                                    loading={sectionLoading}
                                    showSearch
                                    optionFilterProp="label"
                                    options={section.map(
                                        (section) => ({
                                            value:
                                                section.section_id,
                                            label:
                                                section.section_name
                                        })
                                    )}
                                />

                            </Form.Item>

                        </Col>

                        {/* ROLE */}

                        <Col
                            xs={12}
                            md={6}
                            lg={4}
                        >

                            <Form.Item
                                label="Role"
                                name="role"
                                rules={[
                                    {
                                        required: true,
                                        message:
                                            "Please select role"
                                    }
                                ]}
                            >

                                <Select
                                    placeholder="Select Role"
                                    options={[
                                        {
                                            value:
                                                "SUPER_ADMIN",
                                            label:
                                                "SUPER ADMIN"
                                        },
                                        {
                                            value:
                                                "CAMPUS_ADMIN",
                                            label:
                                                "CAMPUS ADMIN"
                                        },
                                        {
                                            value:
                                                "TEACHER",
                                            label:
                                                "TEACHER"
                                        },
                                        {
                                            value:
                                                "ACCOUNTANT",
                                            label:
                                                "ACCOUNTANT"
                                        },
                                        {
                                            value:
                                                "RECEPTIONIST",
                                            label:
                                                "RECEPTIONIST"
                                        },
                                        {
                                            value:
                                                "STAFF",
                                            label:
                                                "STAFF"
                                        }
                                    ]}
                                />

                            </Form.Item>

                        </Col>


                        {/* PHONE */}

                        <Col
                            xs={12}
                            md={6}
                            lg={4}
                        >

                            <Form.Item
                                label="Phone"
                                name="phone"
                            >

                                <Input
                                    placeholder="Enter phone"
                                />

                            </Form.Item>

                        </Col>

                    </Row>


                    {/* BUTTONS */}

                    <Space>

                        <Button
                            type="primary"
                            htmlType="submit"
                            icon={
                                editingId
                                    ? <EditOutlined />
                                    : <PlusOutlined />
                            }
                            loading={loading}
                        >
                            {editingId
                                ? "Update User"
                                : "Add User"
                            }
                        </Button>


                        <Button
                            icon={<ReloadOutlined />}
                            onClick={handleCancel}
                        >
                            Clear
                        </Button>

                    </Space>

                </Form>

            </Card>


            {/* ======================================
                USER LIST
            ======================================= */}

            <Card
                title="Users"
                extra={
                    <Input
                        placeholder="Search users..."
                        allowClear
                        value={searchText}
                        onChange={(e) =>
                            setSearchText(
                                e.target.value
                            )
                        }
                        style={{
                            width: 280
                        }}
                    />
                }
            >

                <Table
                    rowKey="user_id"
                    columns={columns}
                    dataSource={filteredUsers}
                    loading={loading}
                    bordered
                    scroll={{
                        x: 1000
                    }}
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true
                    }}
                />

            </Card>

        </div>
    );
};

export default User;