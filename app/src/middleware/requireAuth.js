function requireAuth(req, res, next) {
    if (!req.session || !req.session.user) {
        return res.status(401).json({
            error: "Debes iniciar sesión para acceder a este recurso."
        });
    }

    next();
}

module.exports = requireAuth;
