#!/usr/bin/env node
import express from 'express'
const router = express.Router()
//This controller will handle all MongoDB interactions.
import controller from '../db-controller.js'
import auth from '../auth/index.js'

router.route('/')
    .put(auth.checkJwt, controller.putUpdate)
    .all((req, res, next) => {
        res.statusMessage = 'Improper request method for updating, please use PUT to update this object.'
        res.status(405)
        next(res)
    })

export default router
