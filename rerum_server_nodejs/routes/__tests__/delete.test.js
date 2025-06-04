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

// FIXME here we need to create something to delete in order to test this route.
routeTester.use("/create", [addAuth, controller.create])

// TODO test the POST delete as well
//routeTester.use("/delete", [addAuth, controller.delete])

// Mount our own /delete route without auth that will use controller.delete
routeTester.use("/delete/:_id", [addAuth, controller.deleteObj])

it("'/delete' route functions", async () => {
  const created = await request(routeTester)
    .post("/create")
    .send({ "test": "item"})
    .set("Content-Type", "application/json")
    .then(resp => resp)
    .catch(err => err)
    
  const response = await request(routeTester)
    .delete(`/delete/${created.body["@id"].split("/").pop()}`)
    .then(resp => resp)
    .catch(err => err) 
  expect(response.statusCode).toBe(204)
})
