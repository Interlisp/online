/*******************************************************************************
 * 
 *  admin.js: Router to handle various admin tasks for online.interlisp.org.
 *            Mainly having to do with the user registration database.
 *
 *  
 *   2021-12-06 Frank Halasz
 * 
 * 
 *   Copyright: 2022 by Interlisp.org 
 * 
 *
 ******************************************************************************/
 
//const config = require("./config");
const express = require("express");
const {userModel} = require('./mongodb');

const adminRouter = express.Router();

function isAdmin(req, res, next) {
    console.dir(req.user.username);
    if(req.user.isAdmin) return next();
    else return res.redirect("/");
}

adminRouter.get('/reset_pwd', isAdmin, (req, res) => res.render('reset_pwd'));

adminRouter.post('/reset_pwd',
    isAdmin,
    async (req, res, next) => {
        try {
            const user = await userModel.findByUsername(req.body.username);
            if (!user)
                return res.redirect('/admin/reset_pwd?info=' + encodeURIComponent(`Error: User ${req.body.username} not found`));
            else {
                await user.setPassword(req.body.password);
                await user.save();
                return res.redirect('/admin/reset_pwd?info=' + "Success");
            }
        } catch(err) {
            console.log("Thrown error");
            console.dir(err);
            return res.redirect('/admin/reset_pwd?info=' + err);
        }
    }
);

adminRouter.get('/delete_user', isAdmin, (req, res) => res.render('delete_user'));

adminRouter.post('/delete_user',
    isAdmin,
    async (req, res, next) => {
        try {
            const user = await userModel.findByUsername(req.body.username);
            if (!user)
                return res.redirect('/admin/delete_user?info=' + encodeURIComponent(`Error: User ${req.body.username} not found`));
            else {
                await user.deleteOne();
                return res.redirect('/admin/delete_user?info=' + "Success");
            }
        } catch (err) {
            console.dir(err);
            return res.redirect('/admin/delete_user?info=' + err);
        }
    }
);


module.exports = adminRouter;