const ForgetModel = require('../models/forget.model')
const bcrypt = require('bcrypt')
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken')
const getData = require('../utils/formatRes');
const AuthService = require('./auth.service');
const userModel = require('../models/user.model');
const ordersModel = require('../models/order.model');
const {InternalServerError, BadRequestError, ConflictRequestError} = require('../utils/error.response')
const isInvalidEmail = require('../utils/checkValidEmail')

const MIN_PASSWORD_LENGTH = 6

const generateVerificationCode = () => {
    return Math.floor(100000 + Math.random() * 900000);
}

class AccessService {
    // [POST]/v1/api/signup
    static signup = async({name, email, address, phone, password}) => {
       try {
            // check invalid/disposable email
            const checkEmail = await isInvalidEmail(email)
            if (checkEmail) {
                return new BadRequestError('Disposable or Invalid email is not allowed')
            }
            
            // check duplicate email
            const existEmail = await userModel.findOne({email: email}).lean()
            if (existEmail) {
                return new ConflictRequestError('Email already exists')
            }

            // check duplicate phone
            const existPhone = await userModel.findOne({phone: phone}).lean()
            if (existPhone) {
                return new ConflictRequestError('Phone already exists')
            }

            if (password.length < MIN_PASSWORD_LENGTH) {
                return new BadRequestError('Password must be at least 6 characters long')
            }

            const salt = await bcrypt.genSalt()
            const passwordHash = await bcrypt.hash(password, salt)

            const newUser = await userModel.create({
                "name": name,
                "email": email || null,
                "address": address,
                "phone": phone || null,
                "password": passwordHash,
            })

            if (email) {
                var transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: "trannhutphattv@gmail.com",
                        pass: "eewp zlsq mzed woej"
                    }
                })
    
                var mailoptions = {
                    from: "trannhutphattv@gmail.com",
                    to: newUser.email,
                    subject: 'Sign up Successfully - Coffee Shop',
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                            <h2 style="color: #4CAF50; text-align: center;">Welcome to Coffee Shop!</h2>
                            <p style="font-size: 18px; color: #333;">Xin chào bạn,</p>
                            <p style="font-size: 16px; color: #333;">
                                Chúng tôi rất vui mừng khi có bạn tham gia. Bạn đã đăng ký tài khoản thành công với Coffee Shop.
                            </p>
                            <div style="text-align: center; margin: 20px 0;">
                                <img src="https://static.vecteezy.com/system/resources/previews/000/417/713/original/text-thank-you-on-green-background-calligraphy-lettering-vector-illustration-eps10.jpg" alt="Thank You" style="max-width: 50%; max-height: 100px; border-radius: 10px;">
                            </div>
                            <p style="font-size: 16px; color: #333;">
                                Hãy khám phá các tính năng của chúng tôi và tận hưởng trải nghiệm mua sắm tốt nhất.
                            </p>
                            <p style="font-size: 16px; color: #333;">
                                Nếu bạn có bất kỳ câu hỏi nào, đừng ngần ngại <a href="mailto:trannhutphattv@gmail.com" style="color: #4CAF50;">liên hệ với chúng tôi</a>.
                            </p>
                            <p style="font-size: 16px; color: #333;">
                                Trân trọng,<br>
                                The Coffee Shop Team
                            </p>
                        </div>
                    `
                }
    
                transporter.sendMail(mailoptions, function(error, info){
                    if (error) {
                        console.log(error);
                    } else {
                        console.log('Email sent: ' + info.response);
                    }
                });
            }
            return {
                success: true,
                user: getData({ fields: ['_id', 'name', 'email', 'address', 'phone'], object: newUser})
            }
       } catch (error) {
            // Validation Error
            if (error.name === 'ValidationError') {
                const errors = Object.values(error.errors).map(key => ({
                    field: key.path,
                    message: key.message
                }))

                return {
                    type: new BadRequestError('Validation Error', 400),
                    errors: errors
                }
            }
            // Internal Server Error
            throw new InternalServerError(error.message)
       }
    }
    // [POST]/v1/api/login
    static login = async({email, password}, res) => {
        try {
            const existUser = await userModel.findOne({email})
            if (!existUser) {
                return {
                    success: false,
                    message: "User not registered"
                }
            }
            const match = await bcrypt.compare(password, existUser.password);
            if (!match) {   
                return {
                    success: false,
                    message: 'Wrong Password'
                }
            }

            const payload = {id: existUser.id, email};

            const accessToken = AuthService.createAccessToken(payload);

            const refreshToken = AuthService.createRefreshToken(payload);

            res.cookie("refreshToken", refreshToken, {
                httpOnly: true,
                secure: false,
                sameSite: "strict",
                maxAge: 1000 * 60 * 60 * 24 * 14,
                expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14)
            })

            return {
                success: true,
                user: getData({fields: ['_id','email', 'phone', 'address', 'name', 'birthday'], object: existUser}),
                accessToken: accessToken,
            }
        } catch (error) {
            return {
                success: false,
                message: error.message
            }
        }
    }

    static getVerificationCode = async ({email}) => {
        try {
            const existUser = await CustomerModel.findOne({email: email})
            if (!existUser){
                return {
                    success: false,
                    message: "User don't exist"
                }
            }

            if (email) {
                const verificationCode = generateVerificationCode();

                var transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: "trannhutphattv@gmail.com",
                        pass: "gltq larm zfkq acgt"
                    }
                })
    
                var mailoptions = {
                    from: "trannhutphattv@gmail.com",
                    to: existUser.email,
                    subject: 'Verification Code - Fudee',
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                            <h2 style="color: #4CAF50; text-align: center;">Mã xác nhận đặt lại mật khẩu</h2>
                            <p style="font-size: 18px; color: #333;">Xin chào bạn,</p>
                            <p style="font-size: 16px; color: #333;">
                                Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản Fudee của bạn. Vui lòng sử dụng mã xác nhận dưới đây để đặt lại mật khẩu.
                            </p>
                            <p style="font-size: 16px; color: #333; text-align: center;">
                                Mã xác nhận của bạn là: <strong>${verificationCode}</strong>, mã sẽ có thời hạn trong vòng 24h
                            </p>
                            <p style="font-size: 16px; color: #333;">
                                Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này hoặc liên hệ với bộ phận hỗ trợ của chúng tôi nếu bạn có bất kỳ câu hỏi nào.
                            </p>
                            <p style="font-size: 16px; color: #333;">
                                Trân trọng,<br>
                                The Fudee Team
                            </p>
                        </div>
                    `
                }
    
                transporter.sendMail(mailoptions, function(error, info){
                    if (error) {
                        console.log(error);
                    } else {
                        console.log('Email sent: ' + info.response);
                    }
                }); 

                const currentDate = new Date();
                const expireDate = new Date(currentDate.getTime() + (24 * 60 * 60 * 1000))
                const newForget = new ForgetModel({
                    user: existUser._id,
                    verificationCode: verificationCode,
                    expiredDate: expireDate
                })
                await newForget.save()
            }

            return {
                message: "Send email successfully"
            }
        } catch (error) {
            return {
                success: false,
                message: error.message
            }
        }
    }

    static checkVerification = async ({email, code}) => {
        try {
            const existEmail = await CustomerModel.findOne({email: email})
            if (!existEmail) {
                return {
                    success: false,
                    message: "User don't exist"
                }
            }

            const existForgetPassword = await ForgetModel.find({user: existEmail._id})
            if (!existForgetPassword){
                return {
                    success: false,
                    message: "Verification don't get in email"
                }
            }
            const currentDate = new Date();
            const validObjects = existForgetPassword.filter(ele => 
                new Date(ele.expiredDate) > currentDate && ele.verificationCode === code
            );
            if (validObjects.length === 0){
                return {
                    success: false,
                    message: "Verification code is not valid"
                }
            }
            const lastValidObject = validObjects[validObjects.length - 1];

            return {
                success: true,
                data: lastValidObject
            }
        } catch (error) {
            return {
                success: false,
                message: error.message
            }
        }
    }

    static changePassword = async({email, newPassword}) => {
        try {
            const existEmail = await CustomerModel.findOne({email: email})
            if (!existEmail) {
                return {
                    success: false,
                    message: "User don't exist"
                }
            }

            const salt = await bcrypt.genSalt()
            const newPasswordHash = await bcrypt.hash(newPassword, salt)

            const updateUser = await CustomerModel.findByIdAndUpdate({_id: existEmail._id}, {password: newPasswordHash}, {new: true})
            
            if (updateUser) {
                return {
                    success: true,
                    message: "Password updated successfully",
                    user: updateUser
                };
            } else {
                return {
                    success: false,
                    message: "Failed to update password"
                };
            }
        } catch (error) {
            return {
                success: false,
                message: error.message
            }
        }
    }

    static updateInfo = async ({name, phone, email, birthday}, {userId}) => {
        try {
            const existUser = await CustomerModel.findById(userId)
            if (!existUser) {
                return {
                    success: false,
                    message: "User don't exist"
                }
            }

            return await CustomerModel.findByIdAndUpdate({_id: userId}, {
                name: name, 
                phone: phone, 
                email: email, 
                birthday: birthday
            }, {new: true})
        } catch (error) {
            return {
                success: false,
                message: error.message
            }
        }
    }

    // [POST]v1/api/logout
    static logout = async(req, res) => {
        const ck = req.cookies.refreshToken
        if (!ck) {
            return {
                message: 'You are not logged in'   
            }
        }
        res.clearCookie('refreshToken')
        return {
            message: "Logout successfully"
        }
    }

    static contact = async ({name, email, phone, address, text}) => {
        try {
            if (email) {
                var transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: "trannhutphattv@gmail.com",
                        pass: "gltq larm zfkq acgt"
                    }
                })
    
                var mailoptions = {
                    from: "trannhutphattv@gmail.com",
                    to: email,
                    subject: 'Verification Code - Fudee',
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                            <h2 style="color: #4CAF50; text-align: center;">Cảm ơn bạn đã phản hồi!</h2>
                            <p style="font-size: 18px; color: #333;">Xin chào ${name},</p>
                            <p style="font-size: 16px; color: #333;">
                                Cảm ơn bạn đã dành thời gian để gửi phản hồi quý báu cho chúng tôi. Dưới đây là tóm tắt ý kiến của bạn:
                            </p>
                            <blockquote style="border-left: 4px solid #ccc; margin: 20px 0; padding-left: 15px; color: #555;">
                                ${text}
                            </blockquote>
                            <p style="font-size: 16px; color: #333;">
                            Chúng tôi rất trân trọng ý kiến của bạn và sẽ sử dụng nó để cải thiện dịch vụ và trải nghiệm mua sắm của bạn.
                            </p>
                            <p style="font-size: 16px; color: #333;">
                                Trân trọng,<br>
                                The Fudee Team
                            </p>
                        </div>
                    `
                }
    
                transporter.sendMail(mailoptions, function(error, info){
                    if (error) {
                        console.log(error);
                    } else {
                        console.log('Email sent: ' + info.response);
                    }
                }); 

                return {
                    sucess: true,
                    message: "Send email successfully"
                }
            }else{
                return {
                    sucess: false,
                    message: "Send email failed"
                }
            }
        } catch (error) {
            return {
                success: false,
                message: error.message
            }
        }
    }

    static getUsers = async () => {
        try {
            const customers = await CustomerModel.find({})
            const orders = await ordersModel.find({}).populate('user')
            let customerTotals = customers.map((customer) => {
                return {
                    customer,
                    totalIntoMoney: 0,
                }
            })
            let customerLookup = {};
            customerTotals.forEach(customer => {
                customerLookup[customer.customer.email] = customer;
            });

            orders.forEach(order => {
                let customerEmail = order.customer.email;
                if (customerLookup.hasOwnProperty(customerEmail)) {
                    customerLookup[customerEmail].totalIntoMoney += order.intoMoney;
                }
            });
            return customerTotals;
        } catch (error) {
            return {
                success: false,
                message: error.message
            }
        }
    }
}

module.exports = AccessService;