import { jest } from "@jest/globals"

// Only real way to test an express route is to mount it and call it so that we can use the req, res, next.
import express from "express"
import request from "supertest"
import controller from '../../db-controller.js'

const routeTester = new express()
routeTester.use(express.json())
routeTester.use(express.urlencoded({ extended: false }))

// Mount our own /query route without auth that will use controller.query
routeTester.use("/query", controller.query)

it("'/query' route functions", async () => {
  const response = await request(routeTester)
    .post("/query")
    .send({ "_id": "11111" })
    .set("Content-Type", "application/json")
    .then(resp => resp)
    .catch(err => err)
    expect(response.statusCode).toBe(200)
    expect(Array.isArray(response.body)).toBe(true)
    expect(response.body.length).toBeTruthy()
    expect(response.body[0]._id).toBeUndefined()
    expect(response.headers["content-length"]).toBeTruthy()
    expect(response.headers["content-type"]).toBeTruthy()
    expect(response.headers["date"]).toBeTruthy()
    expect(response.headers["etag"]).toBeTruthy()
    expect(response.headers["allow"]).toBeTruthy()
    expect(response.headers["link"]).toBeTruthy()
 
})

it.skip("Proper '@id-id' negotation on objects returned from '/query'.", async () => {
  // TODO
})
