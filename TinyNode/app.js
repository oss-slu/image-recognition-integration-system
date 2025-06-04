#!/usr/bin/env node
import createError from "http-errors"
import express from "express"
import path from "path"
import { fileURLToPath } from "url"
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
import logger from "morgan"
import indexRouter from "./routes/index.js"
import queryRouter from "./routes/query.js"
import createRouter from "./routes/create.js"
import updateRouter from "./routes/update.js"
import deleteRouter from "./routes/delete.js"
import overwriteRouter from "./routes/overwrite.js"
import cors from "cors"

let app = express()

app.use(logger('dev'))
app.use(express.json())
if(process.env.OPEN_API_CORS !== "false") { 
  // This enables CORS for all requests. We may want to update this in the future and only apply to some routes.
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
}
app.use(express.urlencoded({ extended: false }))
app.use(express.static(path.join(__dirname, 'public')))

app.use('/', indexRouter)

//New available usage without /app
app.use('/query', queryRouter)
app.use('/create', createRouter)
app.use('/update', updateRouter)
app.use('/delete', deleteRouter)
app.use('/overwrite', overwriteRouter)

//Legacy support for /app
app.use('/app', indexRouter)
app.use('/app/query', queryRouter)
app.use('/app/create', createRouter)
app.use('/app/update', updateRouter)
app.use('/app/delete', deleteRouter)
app.use('/app/overwrite', overwriteRouter)

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404))
})

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message
  res.locals.error = req.app.get('env') === 'development' ? err : {}

  // render the error page
  res.status(err.status || 500)
  res.send(err.message)
})

export default app
