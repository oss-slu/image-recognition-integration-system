#!/usr/bin/env node
import express from 'express'
const router = express.Router()
import rewrite from 'express-urlrewrite'
import auth from '../auth/index.js'
// This controller reroutes older style API calls.

router.use(rewrite("/:attemptedAction.action*", "/:attemptedAction$2"))
router.use(rewrite("/getByProperties*", "/query$1"))
router.use(rewrite("/batch_create*", "/bulkCreate$1"))
router.post('/accessToken',auth.generateNewAccessToken)
router.post('/refreshToken',auth.generateNewRefreshToken)


export default router
