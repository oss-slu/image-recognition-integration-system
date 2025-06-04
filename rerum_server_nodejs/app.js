#!/usr/bin/env node

import express from 'express'
import path from 'path'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'
dotenv.config()
import logger from 'morgan'
import cors from 'cors'
import indexRouter from './routes/index.js'
import apiRouter from './routes/api-routes.js'
import clientRouter from './routes/client.js'
import _gog_fragmentsRouter from './routes/_gog_fragments_from_manuscript.js';
import _gog_glossesRouter from './routes/_gog_glosses_from_manuscript.js';
import rest from './rest.js'
import { fileURLToPath } from 'url'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()

//Middleware to use

/**
 * Get the various CORS headers right
 * "methods" : Allow 
 * "allowedMethods" : Access-Control-Allow-Methods  (Allow ALL the methods)
 * "allowedHeaders" : Access-Control-Allow-Headers  (Allow custom headers)
 * "exposedHeaders" : Access-Control-Expose-Headers (Expose the custom headers)
 * "origin" : "*"   : Access-Control-Allow-Origin   (Allow ALL the origins)
 * "maxAge" : "600" : Access-Control-Max-Age        (how long to cache preflight requests, 10 mins)
 */
app.use(
  cors({
    "methods" : "GET,OPTIONS,HEAD,PUT,PATCH,DELETE,POST",
    "allowedHeaders" : [
      'Content-Type',
      'Content-Length',
      'Allow',
      'Authorization',
      'Location',
      'ETag',
      'Connection',
      'Keep-Alive',
      'Date',
      'Cache-Control',
      'Last-Modified',
      'Link',
      'X-HTTP-Method-Override',
      'Origin',
      'Referrer',
      'User-Agent'
    ],
    "exposedHeaders" : "*",
    "origin" : "*",
    "maxAge" : "600"
  })
)
app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

//Publicly available scripts, CSS, and HTML pages.
app.use(express.static(path.join(__dirname, 'public')))

/**
 * For any request that comes through to the app, check whether or not we are in maintenance mode.
 * If we are, then show the sad puppy.  Otherwise, continue on.
 * This is without middleware
 */
app.all('*', (req, res, next) => {
  if(process.env.DOWN === "true"){
      res.status(503).json({"message":"RERUM v1 is down for updates or maintenance at this time.  We apologize for the inconvenience.  Try again later."})
  }
  else{
      next() //pass on to the next app.use
  }
})

app.use('/', indexRouter)

app.use('/v1', apiRouter)

app.use('/client', clientRouter)

app.use('/gog/fragmentsInManuscript', _gog_fragmentsRouter)
app.use('/gog/glossesInManuscript', _gog_glossesRouter)

/**
 * Handle API errors and warnings RESTfully.  All routes that don't end in res.send() will end up here.
 * Important to note that res.json() will fail to here
 * Important to note api-routes.js handles all the 405s without failing to here - they res.send()
 * Important to note that failures in the controller from the mongo client will fail to here
 * 
 * */
app.use(rest.messenger)

//catch 404 because of an invalid site path
app.use((req, res, next) => {
    let msg = res.statusMessage ?? "This page does not exist"
    res.status(404).send(msg)  
    res.end()
})

export default app
