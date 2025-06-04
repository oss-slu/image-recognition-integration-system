import express from 'express'
const router = express.Router()
//This controller will handle all MongoDB interactions.
import controller from '../db-controller.js'
import auth from '../auth/index.js'
import rest from '../rest.js'

router.route('/')
    .patch(auth.checkJwt, controller.patchSet)
    .post(auth.checkJwt, (req, res, next) => {
        if (rest.checkPatchOverrideSupport(req, res)) {
            controller.patchSet(req, res, next)
        }
        else {
            res.statusMessage = 'Improper request method for updating, please use PATCH to add new keys to this object.'
            res.status(405)
            next(res)
        }
    }) 
    .all((req, res, next) => {
        res.statusMessage = 'Improper request method for updating, please use PATCH to add new keys to this object.'
        res.status(405)
        next(res)
    })

export default router
