import express from 'express'
const router = express.Router()
//This controller will handle all MongoDB interactions.
import controller from '../db-controller.js'
import auth from '../auth/index.js'

router.route('/')
    .delete(auth.checkJwt, controller.deleteObj)
    .all((req, res, next) => {
        res.statusMessage = 'Improper request method for deleting, please use DELETE.'
        res.status(405)
        next(res)
    })

router.route('/:_id')
    .delete(auth.checkJwt, controller.deleteObj)
    .all((req, res, next) => {
        res.statusMessage = 'Improper request method for deleting, please use DELETE.'
        res.status(405)
        next(res)
    })

export default router
