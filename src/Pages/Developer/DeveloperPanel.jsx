
import React from "react";
import { Card, Row, Col, Typography } from "antd";
import {
    AppstoreOutlined,
    SafetyOutlined
} from "@ant-design/icons";
import { Link } from "react-router-dom";

const { Title, Text } = Typography;

const DeveloperPanel = () => {

    return (
        <div>

            <Title level={2}>
                Developer Panel
            </Title>

            <Text type="secondary">
                System configuration and permission management
            </Text>

            <Row gutter={[20, 20]} style={{ marginTop: 25 }}>

                <Col xs={24} md={12}>

                    <Link to="/developer-pages">

                        <Card
                            hoverable
                            style={{ height: "100%" }}
                        >

                            <AppstoreOutlined
                                style={{
                                    fontSize: 40,
                                    marginBottom: 15
                                }}
                            />

                            <Title level={4}>
                                Page Management
                            </Title>

                            <Text>
                                Register and manage application pages,
                                routes and page status.
                            </Text>

                        </Card>

                    </Link>

                </Col>


                <Col xs={24} md={12}>

                    <Link to="/user-permissions">

                        <Card
                            hoverable
                            style={{ height: "100%" }}
                        >

                            <SafetyOutlined
                                style={{
                                    fontSize: 40,
                                    marginBottom: 15
                                }}
                            />

                            <Title level={4}>
                                User Permissions
                            </Title>

                            <Text>
                                Manage View, Add, Edit, Delete and Print
                                permissions for users.
                            </Text>

                        </Card>

                    </Link>

                </Col>

            </Row>

        </div>
    );
};

export default DeveloperPanel;
