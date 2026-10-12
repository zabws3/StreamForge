function requireAdmin(req, res, next) {
    if (!req.session || !req.session.user) {
        return res.status(401).json({
            error: "Debes iniciar sesión."
        });
    }

    if (req.session.user.role !== "admin") {
        return res.status(403).json({
            error: "No tienes permisos de administrador."
        });
    }

    next();
}

module.exports = requireAdmin;
