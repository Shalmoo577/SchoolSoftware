import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getUserPermissions } from "./permission";

const ProtectedRoute = ({ children, pageKey }) => {

    const location = useLocation();

    const [allowed, setAllowed] = useState(null);

    const userData = localStorage.getItem("user");

    /* =====================================================
       LOGIN CHECK
    ===================================================== */

    if (!userData) {
        return <Navigate to="/login" replace />;
    }

    const user = JSON.parse(userData);

    const isDeveloper =
        Number(user?.is_developer) === 1;


    /* =====================================================
       CHECK PAGE PERMISSION
    ===================================================== */

    useEffect(() => {

        const checkPermission = async () => {

            // Developer can access every page
            if (isDeveloper) {
                setAllowed(true);
                return;
            }

            // If pageKey is not supplied,
            // only login protection will be applied
            if (!pageKey) {
                setAllowed(true);
                return;
            }

            if (!user?.user_id) {
                setAllowed(false);
                return;
            }

            try {

                const data =
                    await getUserPermissions(user.user_id);

                const permissions =
                    Array.isArray(data) ? data : [];


                /*
                    Compare page_key case-insensitively.

                    Example:

                    academic_years
                    ACADEMIC_YEARS

                    Both will match.
                */

                const permission =
                    permissions.find(
                        (item) =>
                            String(item.page_key || "")
                                .trim()
                                .toLowerCase() ===
                            String(pageKey || "")
                                .trim()
                                .toLowerCase()
                    );


                /*
                    Page must exist in permissions
                    AND can_view must be 1.
                */

                if (
                    permission &&
                    Number(permission.can_view) === 1
                ) {

                    setAllowed(true);

                } else {

                    setAllowed(false);

                }

            } catch (error) {

                console.error(
                    "Permission check failed:",
                    error
                );

                setAllowed(false);
            }
        };


        checkPermission();

    }, [
        user?.user_id,
        pageKey,
        isDeveloper
    ]);


    /* =====================================================
       WAITING FOR PERMISSION
    ===================================================== */

    if (allowed === null) {

        return null;

    }


    /* =====================================================
       ACCESS DENIED
    ===================================================== */

    if (!allowed) {

        return (
            <Navigate
                to="/"
                replace
                state={{
                    deniedPath: location.pathname
                }}
            />
        );

    }


    /* =====================================================
       ACCESS ALLOWED
    ===================================================== */

    return children;
};

export default ProtectedRoute;