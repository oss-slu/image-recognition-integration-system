import { jest } from "@jest/globals"

// Only real way to test an express route is to mount it and call it so that we can use the req, res, next.
import express from "express"
import request from "supertest"
import controller from '../../db-controller.js'

// Here is the auth mock so we get a req.user and the controller can function without a NPE.
const addAuth = (req, res, next) => {
  req.user = {"http://store.rerum.io/agent": "https://store.rerum.io/v1/id/agent007"}
  next()
}

const routeTester = new express()
routeTester.use(express.json())
routeTester.use(express.urlencoded({ extended: false }))

// Mount our own /bulkCreate route without auth that will use controller.bulkCreate
routeTester.use("/bulkUpdate", [addAuth, controller.bulkUpdate])

it.skip("'/bulkUpdate' route functions", async () => {
  // TODO without hitting the v1/id/11111 object because it is already abused.
})
