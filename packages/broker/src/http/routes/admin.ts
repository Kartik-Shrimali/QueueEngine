import express from "express";
import { requireScope } from "../middleware/auth.js";
import { checkI3, checkI7, checkI8 } from "../../core/invariants.js";

const adminRouter:express.Router = express.Router();

adminRouter.get('/admin/invariants' , requireScope('admin') , async (req , res) => {
    const checks = [await checkI3() , await checkI8() , await checkI7()];

    const allOk = checks.every((check) => check.ok);

    res.status(200).send({
        ok : allOk,
        checks
    })
})

export {adminRouter}