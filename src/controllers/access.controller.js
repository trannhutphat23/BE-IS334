const AccessService = require("../services/access.service")

class AccessController {
    signUp = async (req, res, next) => {
        try {
            return res.status(201).json(await AccessService.signup(req.body))
        } catch (error){
            next(error)
        }
    }

    login = async (req, res, next) => {
        try {
            return res.status(201).json(await AccessService.login(req.body, res))
        } catch (error) {
            next(error)
        }
    }

    getVerificationCode = async (req, res, next) => {
        try {
            return res.status(201).json(await AccessService.getVerificationCode(req.body))
        } catch (error) {
            next(error)
        }
    }

    checkVerification = async (req, res, next) => {
        try {
            return res.status(201).json(await AccessService.checkVerification(req.body))
        } catch (error) {
            next(error)
        }
    }

    changePassword = async (req, res, next) => {
        try {
            return res.status(201).json(await AccessService.changePassword(req.body))
        } catch (error) {
            next(error)
        }
    }

    updateInfo = async (req, res, next) => {
        try {
            return res.status(201).json(await AccessService.updateInfo(req.body, req.params))
        } catch (error) {
            next(error)
        }
    }

    logout = async (req, res, next) => {
        try {
            return res.status(201).json(await AccessService.logout(req, res))
        } catch (error) {
            next(error)
        }
    }

    contact = async (req, res, next) => {
        try {
            return res.status(201).json(await AccessService.contact(req.body))
        } catch (error) {
            next(error)
        }
    }

    getUsers = async (req, res , next) => {
        try {
            return res.status(201).json(await AccessService.getUsers())
        } catch (error) {
            next(error)
        }
    }
}

module.exports = new AccessController()