"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateSchema = void 0;
const validateSchema = (schema) => {
    return (req, res, next) => {
        const validation = schema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                message: "Dados inválidos",
                errors: validation.error?.flatten().fieldErrors,
            });
        }
        req.body = validation.data;
        return next();
    };
};
exports.validateSchema = validateSchema;
