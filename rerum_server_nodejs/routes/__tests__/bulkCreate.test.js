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
routeTester.use("/bulkCreate", [addAuth, controller.bulkCreate])

it("'/bulkCreate' route functions", async () => {
  const response = await request(routeTester)
    .post("/bulkCreate")
    .send([{ "test": "item1" }, { "test": "item2" }])
    .set("Content-Type", "application/json")
    .then(resp => resp)
    .catch(err => err)
  expect(response.header.location).toBe(response.body["@id"])
  expect(response.statusCode).toBe(201)
  expect(Array.isArray(response.body)).toBe(true)
  expect(response.headers["content-length"]).toBeTruthy()
  expect(response.headers["content-type"]).toBeTruthy()
  expect(response.headers["date"]).toBeTruthy()
  expect(response.headers["etag"]).toBeTruthy()
  expect(response.headers["link"]).toBeTruthy()
})
