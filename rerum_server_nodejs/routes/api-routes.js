#!/usr/bin/env node

/**
 * This module is used to define the routes of the various HITTP request that come to the app.
 * Since this app functions as an API layer, it controls RESTful flows.  Make sure to send a RESTful
 * status code and response message. 
 * 
 * It is used as middleware and so has access to the http module request and response objects, as well as next()
 * 
 * @author thehabes 
 */
import express from 'express'
const router = express.Router()
import staticRouter from './static.js';
// Support GET requests like v1/id/{object id}  
import idRouter from './id.js';
// Support older style API calls through rewrite.
import compatabilityRouter from './compatability.js';
// Support POST requests with JSON bodies used for passing queries though to the database.
import queryRouter from './query.js';
// Support POST requests with JSON bodies used for establishing new objects.
import createRouter from './create.js';
// Support POST requests with JSON Array bodies used for establishing new objects.
import bulkCreateRouter from './bulkCreate.js';
//Support PUT requests with JSON Array bodies used for updating a number of existing objects.
import bulkUpdateRouter from './bulkUpdate.js';
// Support DELETE requests like v1/delete/{object id} to mark an object as __deleted.
import deleteRouter from './delete.js';
// Support POST requests with JSON bodies used for replacing some existing object.
import overwriteRouter from './overwrite.js';
// Support PUT requests with JSON bodies used for versioning an existing object through replacement.
import updateRouter from './putUpdate.js';
// Support PATCH requests with JSON bodies used for versioning an existing object through key/value setting.
import patchRouter from './patchUpdate.js';
// Support PATCH requests with JSON bodies used for creating new keys in some existing object.
import setRouter from './patchSet.js';
// Support PATCH requests with JSON bodies used for removing keys in some existing object.
import unsetRouter from './patchUnset.js';
// Support PATCH requests (that may contain a Slug header or ?slug parameter) to mark as object as released.
import releaseRouter from './release.js';
// Support GET requests like v1/since/{object id} to discover all versions from all sources updating this version.
import sinceRouter from './since.js';
// Support GET requests like v1/history/{object id} to discover all previous versions tracing back to the prime.
import historyRouter from './history.js';

router.use(staticRouter)
router.use('/id',idRouter)
router.use('/api', compatabilityRouter)
router.use('/api/query', queryRouter)
router.use('/api/create', createRouter)
router.use('/api/bulkCreate', bulkCreateRouter)
router.use('/api/bulkUpdate', bulkUpdateRouter)
router.use('/api/delete', deleteRouter)
router.use('/api/overwrite', overwriteRouter)
router.use('/api/update', updateRouter)
router.use('/api/patch', patchRouter)
router.use('/api/set', setRouter)
router.use('/api/unset', unsetRouter)
router.use('/api/release', releaseRouter)
// Set default API response
router.get('/api', (req, res) => {
    res.json({
        message: 'Welcome to v1 in nodeJS!  Below are the available endpoints, used like /v1/api/{endpoint}',
        endpoints: {
            "/create": "POST - Create a new object.",
            "/update": "PUT - Update the body an existing object.",
            "/patch": "PATCH - Update the properties of an existing object.",
            "/set": "PATCH - Update the body an existing object by adding a new property.",
            "/unset": "PATCH - Update the body an existing object by removing an existing property.",
            "/delete": "DELETE - Mark an object as deleted.",
            "/query": "POST - Supply a JSON object to match on, and query the db for an array of matches.",
            "/release": "POST - Lock a JSON object from changes and guarantee the content and URI.",
            "/overwrite": "POST - Update a specific document in place, overwriting the existing body."
        }
    })
})
router.use('/since', sinceRouter)
router.use('/history', historyRouter)

// Note that error responses are handled by rest.js through app.js.  No need to do anything with them here.

// Export API routes
export default router
