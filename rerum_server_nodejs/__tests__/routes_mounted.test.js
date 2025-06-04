import request from "supertest"
import { jest } from "@jest/globals"
import api_routes from "../routes/api-routes.js"
import app from "../app.js"
import fs from 'fs'

let app_stack = app._router.stack
let api_stack = api_routes.stack

describe('Check to see that all expected top level route patterns exist.', () => {

  it('/v1 -- mounted ', () => {
   let exists = false
    for (const middleware of app_stack) {
      if (middleware.regexp && middleware.regexp.toString().includes("/v1")){
        exists = true
        break
      }
    }
    expect(exists).toBe(true)
  })

  it('/client -- mounted ', () => {
   let exists = false
    for (const middleware of app_stack) {
      if (middleware.regexp && middleware.regexp.toString().includes("/client")){
        exists = true
        break
      }
    }
    expect(exists).toBe(true)
  })

  it('/v1/id/{_id} -- mounted', () => {
    let exists = false
    for (const middleware of api_stack) {
      if (middleware.regexp && middleware.regexp.toString().includes("/id")){
        exists = true
        break
      }
    }
    expect(exists).toBe(true)
  })

  it('/v1/since/{_id} -- mounted', () => {
    let exists = false
    for (const middleware of api_stack) {
      if (middleware.regexp && middleware.regexp.toString().includes("/since")){
        exists = true
        break
      }
    }
    expect(exists).toBe(true)
  })

  it('/v1/history/{_id} -- mounted', () => {
    let exists = false
    for (const middleware of api_stack) {
      if (middleware.regexp && middleware.regexp.toString().includes("/history")){
        exists = true
        break
      }
    }
    expect(exists).toBe(true)
  })

})

describe('Check to see that all /v1/api/ route patterns exist.', () => {

  it('/v1/api/query -- mounted ', () => {
   let exists = false
    for (const middleware of api_stack) {
      if (middleware.regexp 
        && middleware.regexp.toString().includes("/api")
        && middleware.regexp.toString().includes("/query")){
        exists = true
        break
      }
    }
    expect(exists).toBe(true)
  })

  it('/v1/api/create -- mounted ', () => {
   let exists = false
    for (const middleware of api_stack) {
      if (middleware.regexp 
        && middleware.regexp.toString().includes("/api")
        && middleware.regexp.toString().includes("/create")){
        exists = true
        break
      }
    }
    expect(exists).toBe(true)
  })

  it('/v1/api/bulkCreate -- mounted ', () => {
   let exists = false
    for (const middleware of api_stack) {
      if (middleware.regexp 
        && middleware.regexp.toString().includes("/api")
        && middleware.regexp.toString().includes("/bulkCreate")){
        exists = true
        break
      }
    }
    expect(exists).toBe(true)
  })

  it('/v1/api/update -- mounted ', () => {
   let exists = false
    for (const middleware of api_stack) {
      if (middleware.regexp
        && middleware.regexp.toString().includes("/api")
        && middleware.regexp.toString().includes("/update")){
        exists = true
        break
      }
    }
    expect(exists).toBe(true)
  })

  it('/v1/api/bulkUpdate -- mounted ', () => {
   let exists = false
    for (const middleware of api_stack) {
      if (middleware.regexp 
        && middleware.regexp.toString().includes("/api")
        && middleware.regexp.toString().includes("/bulkUpdate")){
        exists = true
        break
      }
    }
    expect(exists).toBe(true)
  })

  it('/v1/api/patch -- mounted ', () => {
   let exists = false
    for (const middleware of api_stack) {
      if (middleware.regexp 
        && middleware.regexp.toString().includes("/api")
        && middleware.regexp.toString().includes("/patch")){
        exists = true
        break
      }
    }
    expect(exists).toBe(true)
  })

  it('/v1/api/set -- mounted ', () => {
   let exists = false
    for (const middleware of api_stack) {
      if (middleware.regexp
        && middleware.regexp.toString().includes("/api") 
        && middleware.regexp.toString().includes("/set")){
        exists = true
        break
      }
    }
    expect(exists).toBe(true)
  })

  it('/v1/api/unset -- mounted ', () => {
   let exists = false
    for (const middleware of api_stack) {
      if (middleware.regexp 
        && middleware.regexp.toString().includes("/api")
        && middleware.regexp.toString().includes("/unset")){
        exists = true
        break
      }
    }
    expect(exists).toBe(true)
  })

  it('/v1/api/delete/{id} -- mounted ', () => {
   let exists = false
    for (const middleware of api_stack) {
      if (middleware.regexp 
        && middleware.regexp.toString().includes("/api")
        && middleware.regexp.toString().includes("/delete")){
        exists = true
        break
      }
    }
    expect(exists).toBe(true)
  })

  it('/v1/api/release/{id} -- mounted ', () => {
   let exists = false
    for (const middleware of api_stack) {
      if (middleware.regexp 
        && middleware.regexp.toString().includes("/api")
        && middleware.regexp.toString().includes("/release")){
        exists = true
        break
      }
    }
    expect(exists).toBe(true)
  })

})

describe('Check to see that critical static files are present', () => {
  it('/public folder files', () => {
    const filePath = './public/' // Replace with the actual file path
    expect(fs.existsSync(filePath+"stylesheets/api.css")).toBeTruthy()
    expect(fs.existsSync(filePath+"stylesheets/style.css")).toBeTruthy()
    expect(fs.existsSync(filePath+"index.html")).toBeTruthy()
    expect(fs.existsSync(filePath+"API.html")).toBeTruthy()
    expect(fs.existsSync(filePath+"context.json")).toBeTruthy()
    expect(fs.existsSync(filePath+"favicon.ico")).toBeTruthy()
    expect(fs.existsSync(filePath+"maintenance.html")).toBeTruthy()
    expect(fs.existsSync(filePath+"terms.txt")).toBeTruthy()
    expect(fs.existsSync(filePath+"talend.jpg")).toBeTruthy()
  });
})

describe('Check to see that critical repo files are present', () => {
  it('root folder files', () => {
    const filePath = './' // Replace with the actual file path
    expect(fs.existsSync(filePath+"CODEOWNERS")).toBeTruthy()
    expect(fs.existsSync(filePath+"CODE_OF_CONDUCT.md")).toBeTruthy()
    expect(fs.existsSync(filePath+"CONTRIBUTING.md")).toBeTruthy()
    expect(fs.existsSync(filePath+"README.md")).toBeTruthy()
    expect(fs.existsSync(filePath+"LICENSE")).toBeTruthy()
  })
})