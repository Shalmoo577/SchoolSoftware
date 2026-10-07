const uppercaseMiddleware = (req, res, next) => {
    const convertToUppercase = (value) => {
        if (typeof value === "string") {
            return value.toUpperCase();
        }

        if (Array.isArray(value)) {
            return value.map(convertToUppercase);
        }

        if (value !== null && typeof value === "object") {
            const newObject = {};

            for (const key in value) {
                newObject[key] = convertToUppercase(value[key]);
            }

            return newObject;
        }

        return value;
    };

    req.body = convertToUppercase(req.body);

    next();
};

export default uppercaseMiddleware;