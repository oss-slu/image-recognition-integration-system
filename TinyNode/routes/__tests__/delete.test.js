import express from "express"
import request from "supertest"
import { jest } from "@jest/globals"
import deleteRoute from "../delete.js"
//import app from "../../app.js"

const routeTester = new express()
routeTester.use(express.json())
routeTester.use(express.urlencoded({ extended: false }))
routeTester.use("/delete", deleteRoute)
routeTester.use("/app/delete", deleteRoute)

const rerum_uri = `${process.env.RERUM_ID_PATTERN}_not_`

beforeEach(() => {
  /** 
   * Request/Response Mock Using manual fetch replacement
   * This is overruling the fetch(store.rerum.io/v1/api/delete) call in delete.js
   */
  global.fetch = jest.fn(() =>
    Promise.resolve({
      text: () => Promise.resolve("")
    })
  )
})

/**
 * This test suite runs the logic of the route file 'delete.js' but does not actually communicate with RERUM.
 * It will confirm the following:
 *   - Is the express req/resp sent into the route
 *   - Can the route read the JSON body
 *   - Does the route respond 204
 * 
 * Note: /app/delete uses the same logic and would be a redundant test.
 */
describe("Check that the request/response behavior of the TinyNode delete route functions.  Mock the connection to RERUM.  __mock_functions", () => {
  it("'/delete' route request and response behavior is functioning.", async () => {
    let response = null

    response = await request(routeTester)
      .delete("/delete")
      .send({ "@id": rerum_uri, "test": "item" })
      .set("Content-Type", "application/json")
      .then(resp => resp)
      .catch(err => err)
    expect(response.statusCode).toBe(204)

    response = await request(routeTester)
      .delete("/delete/00000")
      .then(resp => resp)
      .catch(err => err)
    expect(response.statusCode).toBe(204)
  })
})

describe("Check that incorrect TinyNode delete route usage results in expected RESTful responses from RERUM.  __rest __core", () => {
  it("Incorrect '/delete' route usage has expected RESTful responses.", async () => {
    let response = null

    response = await request(routeTester)
      .get("/delete")
      .then(resp => resp)
      .catch(err => err)
    expect(response.statusCode).toBe(405)

    response = await request(routeTester)
      .put("/delete")
      .then(resp => resp)
      .catch(err => err)
    expect(response.statusCode).toBe(405)

    response = await request(routeTester)
      .patch("/delete")
      .then(resp => resp)
      .catch(err => err)
    expect(response.statusCode).toBe(405)

    response = await request(routeTester)
      .post("/delete")
      .then(resp => resp)
      .catch(err => err)
    expect(response.statusCode).toBe(405)

    //Bad request body
    //FIXME to uncomment: https://github.com/CenterForDigitalHumanities/TinyNode/issues/89
    // response = await request(routeTester)
    //   .delete("/delete")
    //   .set("Content-Type", "application/json")
    //   .then(resp => resp)
    //   .catch(err => err)
    // expect(response.statusCode).toBe(400)

  })
})

/**
 * TODO - skipped for now.
 * Full integration test.  Checks the TinyNode app delete endpoint functionality and RERUM connection.
 * 
 * Note: /app/delete uses the same logic and would be a redundant test.
 */
describe.skip("Check that the properly used delete endpoints function and interact with RERUM.  __e2e", () => {
  it("'/delete' route can delete an object in RERUM.  __e2e", async () => {
    const response = await request(routeTester)
      .delete("/app/delete/00000")
      .then(response => {
        expect(response.statusCode).toBe(204)
      })
      .catch(err => err)
    expect(response.statusCode).toBe(204)
  })
})