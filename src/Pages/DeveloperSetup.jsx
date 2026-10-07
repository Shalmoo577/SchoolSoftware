
import React, { useEffect, useState } from "react";
import axios from "axios";
import {
    Card,
    Form,
    Input,
    Button,
    Select,
    message,
    Typography
} from "antd";

const { Title, Text } = Typography;

const DeveloperSetup = () => {

    const [form] = Form.useForm();

    const [campuses, setCampuses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(true);
    const [setupRequired, setSetupRequired] = useState(false);


    /* =========================================================
       CHECK SETUP STATUS
       ========================================================= */

    const checkSetupStatus = async () => {

        try {

            const response = await axios.get(
                "/api/developer-setup/status"
            );

            setSetupRequired(
                response.data.setup_required
            );

        } catch (error) {

            console.error(
                "Setup Status Error:",
                error
            );

            message.error(
                "Unable to check setup status"
            );

        } finally {

            setChecking(false);
        }
    };


    /* =========================================================
       LOAD CAMPUSES
       ========================================================= */

    const loadCampuses = async () => {

        try {

            const response = await axios.get(
                "/api/campuses"
            );

            setCampuses(response.data);

        } catch (error) {

            console.error(
                "Load Campuses Error:",
                error
            );

            message.error(
                "Unable to load campuses"
            );
        }
    };


    /* =========================================================
       INITIAL LOAD
       ========================================================= */

    useEffect(() => {

        checkSetupStatus();
        loadCampuses();

    }, []);


    /* =========================================================
       CREATE DEVELOPER
       ========================================================= */

    const handleSubmit = async (values) => {

        try {

            setLoading(true);

            const response = await axios.post(
                "/api/developer-setup",
                values
            );

            message.success(
                response.data.message
            );

            form.resetFields();

            setSetupRequired(false);

        } catch (error) {

            console.error(
                "Developer Setup Error:",
                error
            );

            message.error(
                error.response?.data?.message ||
                "Unable to create developer account"
            );

        } finally {

            setLoading(false);
        }
    };


    /* =========================================================
       CHECKING
       ========================================================= */

    if (checking) {

        return (
            <div
                style={{
                    padding: 40,
                    textAlign: "center"
                }}
            >
                Checking setup...
            </div>
        );
    }


    /* =========================================================
       SETUP ALREADY COMPLETED
       ========================================================= */

    if (!setupRequired) {

        return (

            <div
                style={{
                    maxWidth: 600,
                    margin: "50px auto",
                    padding: 20
                }}
            >

                <Card>

                    <Title level={3}>
                        Developer Setup
                    </Title>

                    <Text type="secondary">
                        Developer setup has already
                        been completed.
                    </Text>

                </Card>

            </div>
        );
    }


    /* =========================================================
       FORM
       ========================================================= */

    return (

        <div
            style={{
                maxWidth: 600,
                margin: "40px auto",
                padding: 20
            }}
        >

            <Card
                title="Initial Developer Setup"
                bordered
            >

                <div
                    style={{
                        marginBottom: 25
                    }}
                >

                    <Title level={3}>
                        Create Developer Account
                    </Title>

                    <Text type="secondary">
                        This setup is available only
                        when no user exists in the system.
                    </Text>

                </div>


                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                >

                    {/* NAME */}

                    <Form.Item
                        label="Name"
                        name="name"
                        rules={[
                            {
                                required: true,
                                message:
                                    "Please enter your name"
                            }
                        ]}
                    >

                        <Input
                            placeholder="Developer Name"
                        />

                    </Form.Item>


                    {/* EMAIL */}

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
                                    "Please enter a valid email"
                            }
                        ]}
                    >

                        <Input
                            placeholder="Email address"
                        />

                    </Form.Item>


                    {/* PASSWORD */}

                    <Form.Item
                        label="Password"
                        name="password"
                        rules={[
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
                        ]}
                        hasFeedback
                    >

                        <Input.Password
                            placeholder="Password"
                        />

                    </Form.Item>


                    {/* CONFIRM PASSWORD */}

                    <Form.Item
                        label="Confirm Password"
                        name="confirm_password"
                        dependencies={["password"]}
                        hasFeedback
                        rules={[
                            {
                                required: true,
                                message:
                                    "Please confirm password"
                            },
                            ({ getFieldValue }) => ({
                                validator(_, value) {

                                    if (
                                        !value ||
                                        getFieldValue(
                                            "password"
                                        ) === value
                                    ) {

                                        return Promise.resolve();
                                    }

                                    return Promise.reject(
                                        new Error(
                                            "Passwords do not match"
                                        )
                                    );
                                }
                            })
                        ]}
                    >

                        <Input.Password
                            placeholder="Confirm Password"
                        />

                    </Form.Item>


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
                            placeholder="Select Campus"
                            showSearch
                            optionFilterProp="label"
                            options={campuses.map(
                                campus => ({
                                    value: campus.campus_id,
                                    label: campus.name
                                })
                            )}
                        />

                    </Form.Item>


                    {/* SUBMIT */}

                    <Form.Item>

                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={loading}
                            block
                        >
                            Create Developer Account
                        </Button>

                    </Form.Item>

                </Form>

            </Card>

        </div>
    );
};


export default DeveloperSetup;
