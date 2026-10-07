
import React, { useState } from "react";
import axios from "axios";
import {
    Form,
    Input,
    Button,
    Card,
    Typography,
    message
} from "antd";

const { Title } = Typography;

const Login = () => {
    const [loading, setLoading] = useState(false);

  const handleLogin = async (values) => {
    try {
        setLoading(true);

        const response = await axios.post(
            "/api/login",
            {
                email: values.email,
                password: values.password
            }
        );

        // Save logged-in user
    localStorage.setItem("user",JSON.stringify(response.data.user));

        message.success("Login successful");
    window.location.reload();

        // Go to dashboard
        window.location.href = "/";

    } catch (error) {
        console.error("Login Error:", error);

        message.error(
            error.response?.data?.message ||
            "Login failed"
        );

    } finally {
        setLoading(false);
    }
};

    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                background: "#f5f5f5"
            }}
        >
            <Card
                style={{
                    width: 400,
                    boxShadow: "0 4px 15px rgba(0,0,0,0.1)"
                }}
            >
                <Title
                    level={2}
                    style={{
                        textAlign: "center",
                        marginBottom: 30
                    }}
                >
                    Login
                </Title>

                <Form
                    layout="vertical"
                    onFinish={handleLogin}
                >
                    <Form.Item
                        label="Email"
                        name="email"
                        rules={[
                            {
                                required: true,
                                message: "Please enter email"
                            }
                        ]}
                    >
                        <Input
                            placeholder="Enter email"
                            autoComplete="username"
                        />
                    </Form.Item>

                    <Form.Item
                        label="Password"
                        name="password"
                        rules={[
                            {
                                required: true,
                                message: "Please enter password"
                            }
                        ]}
                    >
                        <Input.Password
                            placeholder="Enter password"
                            autoComplete="current-password"
                        />
                    </Form.Item>

                    <Form.Item style={{ marginBottom: 0 }}>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={loading}
                            block
                        >
                            Login
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
};

export default Login;
