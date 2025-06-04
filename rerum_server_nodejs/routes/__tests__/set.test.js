import { jest } from "@jest/globals"
import dotenv from "dotenv"
dotenv.config()

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

// Mount our own /create route without auth that will use controller.create
routeTester.use("/set", [addAuth, controller.patchSet])
const unique = new Date(Date.now()).toISOString().replace("Z", "")

it("'/set' route functions", async () => {
  const response = await request(routeTester)
    .patch("/set")
    .send({"@id":`${process.env.RERUM_ID_PREFIX}11111`, "test_set":unique})
    .set('Content-Type', 'application/json; charset=utf-8')
    .then(resp => resp)
    .catch(err => err)
      expect(response.header.location).toBe(response.body["@id"])
      expect(response.headers["location"]).not.toBe(`${process.env.RERUM_ID_PREFIX}11111`)
      expect(response.statusCode).toBe(200)
      expect(response.body._id).toBeUndefined()
      expect(response.body["test_set"]).toBe(unique)
      expect(response.headers["content-length"]).toBeTruthy()
      expect(response.headers["content-type"]).toBeTruthy()
      expect(response.headers["date"]).toBeTruthy()
      expect(response.headers["etag"]).toBeTruthy()
      expect(response.headers["allow"]).toBeTruthy()
      expect(response.headers["link"]).toBeTruthy()
})
