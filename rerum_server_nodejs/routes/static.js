#!/usr/bin/env node

/**
 * This module is used to define the routes of static resources available in `/public`
 * but also under `/v1` paths.
 * 
 * @author cubap 
 */
import express from 'express'
const router = express.Router()
import path from 'path'
import { fileURLToPath } from 'url'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// public also available at `/v1`
router.use(express.urlencoded({ extended: false }))
router.use(express.static(path.join(__dirname, '../public')))

// Set default API response
router.get('/', (req, res) => {
    res.sendFile('index.html') // welcome page for new applications on V1
})

// Export API routes
export default router
