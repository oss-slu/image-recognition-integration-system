#!/usr/bin/env node
import express from 'express'
const router = express.Router()
//This controller will handle all MongoDB interactions.
import controller from '../db-controller.js'
import rest from '../rest.js'
import auth from '../auth/index.js'

router.route('/')
    .patch(auth.checkJwt, controller.patchUpdate) 
    .post(auth.checkJwt, (req, res, next) => {
        if (rest.checkPatchOverrideSupport(req, res)) {
            controller.patchUpdate(req, res, next)
        }
        else {
            res.statusMessage = 'Improper request method for updating, please use PATCH to alter the existing keys this object.'
            res.status(405)
            next(res)
        }
    }) 
    .all((req, res, next) => {
        res.statusMessage = 'Improper request method for updating, please use PATCH to alter existing keys on this object.'
        res.status(405)
        next(res)
    })

export default router
