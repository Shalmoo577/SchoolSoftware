
import React from "react";
import { Navigate } from "react-router-dom";

const DeveloperRoute = ({ children }) => {

    const userData = localStorage.getItem("user");

    // Login nahi hai
    if (!userData) {
        return <Navigate to="/login" replace />;
    }

    let user;

    try {
        user = JSON.parse(userData);
    } catch (error) {
        localStorage.removeItem("user");
        return <Navigate to="/login" replace />;
    }

    // Sirf developer
    if (Number(user?.is_developer) !== 1) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

export default DeveloperRoute;
