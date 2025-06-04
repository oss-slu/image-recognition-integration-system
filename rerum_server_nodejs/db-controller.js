#!/usr/bin/env node

/**
 * This module is used to connect to a mongodb instance and perform the necessary unit actions
 * to complete an API action.  The implementation is intended to be a RESTful API.  
 * Known database misteps, like NOT FOUND, should pass a RESTful message downstream.
 * 
 * It is used as middleware and so has access to the http module request and response objects, as well as next() 
 * 
 * @author thehabes 
 */
import { newID, isValidID, db } from './database/index.js'
import utils from './utils.js'
const ObjectID = newID

// Handle index actions
const index = function (req, res, next) {
    res.json({
        status: "connected",
        message: "Not sure what to do"
    })
}

/**
 * Check if a @context value contains a known @id-id mapping context
 *
 * @param contextInput An Array of string URIs or a string URI.
 * @return A boolean
 */
function _contextid(contextInput) {
    if(!Array.isArray(contextInput) && typeof contextInput !== "string") return false
    let bool = false
    let contextURI = typeof contextInput === "string" ? contextInput : "unknown"
    const contextCheck = (c) => contextURI.includes(c)
    const knownContexts = [
        "store.rerum.io/v1/context.json",
        "iiif.io/api/presentation/3/context.json",
        "www.w3.org/ns/anno.jsonld",
        "www.w3.org/ns/oa.jsonld"
    ]
    if(Array.isArray(contextInput)) {
        for(const c of contextInput) {
            contextURI = c
            bool = knownContexts.some(contextCheck)
            if(bool) break
        }
    }
    else {
        bool = knownContexts.some(contextCheck)
    }
    return bool
}

/**
 * Modify the JSON of an Express response body by performing _id, id, and @id negotiation.
 * This ensures the JSON has the appropriate _id, id, and/or @id value on the way out to the client.
 * Make sure the first property is @context and the second property is the negotiated @id/id.
 *
 * @param resBody A JSON object representing an Express response body
 * @return JSON with the appropriate modifications around the 'id;, '@id', and '_id' properties.
 */
const idNegotiation = function (resBody) {
    if(!resBody) return
    const _id = resBody._id
    delete resBody._id
    if(!resBody["@context"]) return resBody
    let modifiedResBody = JSON.parse(JSON.stringify(resBody))
    const context = { "@context": resBody["@context"] }
    if(_contextid(resBody["@context"])) {
        delete resBody["@id"]
        delete resBody["@context"]
        modifiedResBody = Object.assign(context, { "id": process.env.RERUM_ID_PREFIX + _id }, resBody)
    }
    return modifiedResBody
}

/**
 * Check if an object with the proposed custom _id already exists.
 * If so, this is a 409 conflict.  It will be detected downstream if we continue one by returning the proposed Slug.
 * We can avoid the 409 conflict downstream and return a newly minted ObjectID.toHextString()
 * We error out right here with next(createExpressError({"code" : 11000}))
 * @param slug_id A proposed _id.  
 * 
 */  
const generateSlugId = async function(slug_id="", next){
    let slug_return = {"slug_id":"", "code":0}
    let slug
    if(slug_id){
        slug_return.slug_id = slug_id
        try {
            slug = await db.findOne({"$or":[{"_id": slug_id}, {"__rerum.slug": slug_id}]})
        } 
        catch (error) {
            //A DB problem, so we could not check.  Assume it's usable and let errors happen downstream.
            console.error(error)
            //slug_return.code = error.code
        }
        if(null !== slug){
            //This already exist, give the mongodb error code.
            slug_return.code = 11000
        }
    } 
    return slug_return
}


/**
 * Create a new Linked Open Data object in RERUM v1.
 * Order the properties to preference @context and @id.  Put __rerum and _id last. 
 * Respond RESTfully
 * */
const create = async function (req, res, next) {
    res.set("Content-Type", "application/json; charset=utf-8")
    let slug = ""
    if(req.get("Slug")){
        let slug_json = await generateSlugId(req.get("Slug"), next)
        if(slug_json.code){
            next(createExpressError(slug_json))
            return
        }
        else{
            slug = slug_json.slug_id
        }
    }
    
    let generatorAgent = getAgentClaim(req, next)
    let context = req.body["@context"] ? { "@context": req.body["@context"] } : {}
    let provided = JSON.parse(JSON.stringify(req.body))
    let rerumProp = { "__rerum": utils.configureRerumOptions(generatorAgent, provided, false, false)["__rerum"] }
    rerumProp.__rerum.slug = slug
    const providedID = provided._id
    const id = isValidID(providedID) ? providedID : ObjectID()
    delete provided["__rerum"]
    delete provided["@id"]
    // id is also protected in this case, so it can't be set.
    if(_contextid(provided["@context"])) delete provided.id
    delete provided["@context"]
    
    let newObject = Object.assign(context, { "@id": process.env.RERUM_ID_PREFIX + id }, provided, rerumProp, { "_id": id })
    console.log("CREATE")
    try {
        let result = await db.insertOne(newObject)
        res.set(utils.configureWebAnnoHeadersFor(newObject))
        newObject = idNegotiation(newObject)
        newObject.new_obj_state = JSON.parse(JSON.stringify(newObject))
        res.location(newObject[_contextid(newObject["@context"]) ? "id":"@id"])
        res.status(201)
        res.json(newObject)
    }
    catch (error) {
        //MongoServerError from the client has the following properties: index, code, keyPattern, keyValue
        next(createExpressError(error))
    }
}

/**
 * Mark an object as deleted in the database.
 * Support /v1/delete/{id}.  Note this is not v1/api/delete, that is not possible (XHR does not support DELETE with body)
 * Note /v1/delete/{blank} does not route here.  It routes to the generic 404.
 * Respond RESTfully
 * 
 * The user may be trying to call /delete and pass in the obj in the body.  XHR does not support bodies in delete.
 * If there is no id parameter, this is a 400
 * 
 * If there is an id parameter, we ignore body, and continue with that id
 * 
 * */
const deleteObj = async function(req, res, next) {
    let id
    let err = { message: `` }
    try {
        id = req.params["_id"] ?? parseDocumentID(JSON.parse(JSON.stringify(req.body))["@id"])
    } catch(error){
        next(createExpressError(error))
    }
    let agentRequestingDelete = getAgentClaim(req, next)
    let originalObject
    try {
        originalObject = await db.findOne({"$or":[{"_id": id}, {"__rerum.slug": id}]})
    } catch (error) {
        next(createExpressError(error))
        return
    }
    if (null !== originalObject) {
        let safe_original = JSON.parse(JSON.stringify(originalObject))
        if (utils.isDeleted(safe_original)) {
            err = Object.assign(err, {
                message: `The object you are trying to delete is already deleted. ${err.message}`,
                status: 403
            })
        }
        else if (utils.isReleased(safe_original)) {
            err = Object.assign(err, {
                message: `The object you are trying to delete is released. Fork to make changes. ${err.message}`,
                status: 403
            })
        }
        else if (!utils.isGenerator(safe_original, agentRequestingDelete)) {
            err = Object.assign(err, {
                message: `You are not the generating agent for this object and so are not authorized to delete it. ${err.message}`,
                status: 401
            })
        }
        if (err.status) {
            next(createExpressError(err))
            return
        }
        let preserveID = safe_original["@id"]
        let deletedFlag = {} //The __deleted flag is a JSONObject
        deletedFlag["object"] = JSON.parse(JSON.stringify(originalObject))
        deletedFlag["deletor"] = agentRequestingDelete
        deletedFlag["time"] = new Date(Date.now()).toISOString().replace("Z", "")
        let deletedObject = {
            "@id": preserveID,
            "__deleted": deletedFlag,
            "_id": id
        }
        if (healHistoryTree(safe_original)) {
            let result
            try {
                result = await db.replaceOne({ "_id": originalObject["_id"] }, deletedObject)
            } catch (error) {
                next(createExpressError(error))
                return
            }
            if (result.modifiedCount === 0) {
                //result didn't error out, the action was not performed.  Sometimes, this is a neutral thing.  Sometimes it is indicative of an error.
                err.message = "The original object was not replaced with the deleted object in the database."
                err.status = 500
                next(createExpressError(err))
                return
            }
            //204 to say it is deleted and there is nothing in the body
            console.log("Object deleted: " + preserveID);
            res.sendStatus(204)
            return
        }
        //Not sure we can get here, as healHistoryTree might throw and error.
        err.message = "The history tree for the object being deleted could not be mended."
        err.status = 500
        next(createExpressError(err))
        return
    }
    err.message = "No object with this id could be found in RERUM.  Cannot delete."
    err.status = 404
    next(createExpressError(err))
}

/**
 * Replace some existing object in MongoDB with the JSON object in the request body.
 * Order the properties to preference @context and @id.  Put __rerum and _id last. 
 * This also detects an IMPORT situation.  If the object @id or id is not from RERUM
 * then trigger the internal _import function.
 * 
 * Track History
 * Respond RESTfully
 * */
const putUpdate = async function (req, res, next) {
    let err = { message: `` }
    res.set("Content-Type", "application/json; charset=utf-8")
    let objectReceived = JSON.parse(JSON.stringify(req.body))
    let generatorAgent = getAgentClaim(req, next)
    const idReceived = objectReceived["@id"] ?? objectReceived.id
    if (idReceived) {
        if(!idReceived.includes(process.env.RERUM_ID_PREFIX)){
            //This is not a regular update.  This object needs to be imported, it isn't in RERUM yet.
            return _import(req, res, next)
        }
        let id = parseDocumentID(idReceived)
        let originalObject
        try {
            originalObject = await db.findOne({"$or":[{"_id": id}, {"__rerum.slug": id}]})
        } catch (error) {
            next(createExpressError(error))
            return
        }
        if (null === originalObject) {
            //This object is not found.
            err = Object.assign(err, {
                message: `Object not in RERUM even though it has a RERUM URI.  Check if it is an authentic RERUM object. ${err.message}`,
                status: 404
            })
        }
        else if (utils.isDeleted(originalObject)) {
            err = Object.assign(err, {
                message: `The object you are trying to update is deleted. ${err.message}`,
                status: 403
            })
        }
        else {
            id = ObjectID()
            let context = objectReceived["@context"] ? { "@context": objectReceived["@context"] } : {}
            let rerumProp = { "__rerum": utils.configureRerumOptions(generatorAgent, originalObject, true, false)["__rerum"] }
            delete objectReceived["__rerum"]
            delete objectReceived["_id"]
            delete objectReceived["@id"]
            // id is also protected in this case, so it can't be set.
            if(_contextid(objectReceived["@context"])) delete objectReceived.id
            delete objectReceived["@context"]
            
            let newObject = Object.assign(context, { "@id": process.env.RERUM_ID_PREFIX + id }, objectReceived, rerumProp, { "_id": id })
            console.log("UPDATE")
            try {
                let result = await db.insertOne(newObject)
                if (alterHistoryNext(originalObject, newObject["@id"])) {
                    //Success, the original object has been updated.
                    res.set(utils.configureWebAnnoHeadersFor(newObject))
                    newObject = idNegotiation(newObject)
                    newObject.new_obj_state = JSON.parse(JSON.stringify(newObject))
                    res.location(newObject[_contextid(newObject["@context"]) ? "id":"@id"])
                    res.status(200)
                    res.json(newObject)
                    return
                }
                err = Object.assign(err, {
                    message: `Unable to alter the history next of the originating object.  The history tree may be broken. See ${originalObject["@id"]}. ${err.message}`,
                    status: 500
                })
            }
            catch (error) {
                //WriteError or WriteConcernError
                next(createExpressError(error))
                return
            }
        }
    }
    else {
        //The http module will not detect this as a 400 on its own
        err = Object.assign(err, {
            message: `Object in request body must have an 'id' or '@id' property. ${err.message}`,
            status: 400
        })
    }
    next(createExpressError(err))
}

/**
 * RERUM was given a PUT update request for an object whose @id was not from the RERUM API.
 * This PUT update request is instead considered internally as an "import".
 * We will create this object in RERUM, but its @id will be a RERUM URI.
 * __rerum.history.previous will point to the origial URI from the @id.
 * 
 * If this functionality were to be offered as its own endpoint, it would be a specialized POST create.
 * */
async function _import(req, res, next) {
    let err = { message: `` }
    res.set("Content-Type", "application/json; charset=utf-8")
    let objectReceived = JSON.parse(JSON.stringify(req.body))
    let generatorAgent = getAgentClaim(req, next)
    const id = ObjectID()
    let context = objectReceived["@context"] ? { "@context": objectReceived["@context"] } : {}
    let rerumProp = { "__rerum": utils.configureRerumOptions(generatorAgent, objectReceived, false, true)["__rerum"] }
    delete objectReceived["__rerum"]
    delete objectReceived["_id"]
    delete objectReceived["@id"]
    // id is also protected in this case, so it can't be set.
    if(_contextid(objectReceived["@context"])) delete objectReceived.id
    delete objectReceived["@context"]
    
    let newObject = Object.assign(context, { "@id": process.env.RERUM_ID_PREFIX + id }, objectReceived, rerumProp, { "_id": id })
    console.log("IMPORT")
    try {
        let result = await db.insertOne(newObject)
        res.set(utils.configureWebAnnoHeadersFor(newObject))
        newObject = idNegotiation(newObject)
        newObject.new_obj_state = JSON.parse(JSON.stringify(newObject))
        res.location(newObject[_contextid(newObject["@context"]) ? "id":"@id"])
        res.status(200)
        res.json(newObject)
    }
    catch (error) {
        //MongoServerError from the client has the following properties: index, code, keyPattern, keyValue
        next(createExpressError(error))
    }
}

/**
 * Update some existing object in MongoDB with the JSON object in the request body.
 * Note that only keys that exist on the object will be respected.  This cannot set or unset keys.  
 * If there is nothing to PATCH, return a 200 with the object in the response body. 
 * Order the properties to preference @context and @id.  Put __rerum and _id last. 
 * Track History
 * Respond RESTfully
 * */
const patchUpdate = async function (req, res, next) {
    let err = { message: `` }
    res.set("Content-Type", "application/json; charset=utf-8")
    let objectReceived = JSON.parse(JSON.stringify(req.body))
    let patchedObject = {}
    let generatorAgent = getAgentClaim(req, next)
    const receivedID = objectReceived["@id"] ?? objectReceived.id
    if (receivedID) {
        let id = parseDocumentID(receivedID)
        let originalObject
        try {
            originalObject = await db.findOne({"$or":[{"_id": id}, {"__rerum.slug": id}]})
        } catch (error) {
            next(createExpressError(error))
            return
        }
        if (null === originalObject) {
            //This object is not in RERUM, they want to import it.  Do that automatically.  
            //updateExternalObject(objectReceived)
            err = Object.assign(err, {
                message: `This object is not from RERUM and will need imported. This is not automated yet. You can make a new object with create. ${err.message}`,
                status: 501
            })
        }
        else if (utils.isDeleted(originalObject)) {
            err = Object.assign(err, {
                message: `The object you are trying to update is deleted. ${err.message}`,
                status: 403
            })
        }
        else {
            patchedObject = JSON.parse(JSON.stringify(originalObject))
            delete objectReceived.__rerum //can't patch this
            delete objectReceived._id //can't patch this
            delete objectReceived["@id"] //can't patch this
            // id is also protected in this case, so it can't be set.
            if(_contextid(objectReceived["@context"])) delete objectReceived.id
            //A patch only alters existing keys.  Remove non-existent keys from the object received in the request body.
            for (let k in objectReceived) {
                if (originalObject.hasOwnProperty(k)) {
                    if (objectReceived[k] === null) {
                        delete patchedObject[k]
                    }
                    else {
                        patchedObject[k] = objectReceived[k]
                    }
                }
                else {
                    //Note the possibility of notifying the user that these keys were not processed.
                    delete objectReceived[k]
                }
            }
            if (Object.keys(objectReceived).length === 0) {
                //Then you aren't actually changing anything...only @id came through
                //Just hand back the object.  The resulting of patching nothing is the object unchanged.
                res.set(utils.configureWebAnnoHeadersFor(originalObject))
                originalObject = idNegotiation(originalObject)
                originalObject.new_obj_state = JSON.parse(JSON.stringify(originalObject))
                res.location(originalObject[_contextid(originalObject["@context"]) ? "id":"@id"])
                res.status(200)
                res.json(originalObject)
                return
            }
            const id = ObjectID()
            let context = patchedObject["@context"] ? { "@context": patchedObject["@context"] } : {}
            let rerumProp = { "__rerum": utils.configureRerumOptions(generatorAgent, originalObject, true, false)["__rerum"] }
            delete patchedObject["__rerum"]
            delete patchedObject["_id"]
            delete patchedObject["@id"]
            // id is also protected in this case, so it can't be set.
            if(_contextid(patchedObject["@context"])) delete patchedObject.id
            delete patchedObject["@context"]
            let newObject = Object.assign(context, { "@id": process.env.RERUM_ID_PREFIX + id }, patchedObject, rerumProp, { "_id": id })
            console.log("PATCH UPDATE")
            try {
                let result = await db.insertOne(newObject)
                if (alterHistoryNext(originalObject, newObject["@id"])) {
                    //Success, the original object has been updated.
                    res.set(utils.configureWebAnnoHeadersFor(newObject))
                    newObject = idNegotiation(newObject)
                    newObject.new_obj_state = JSON.parse(JSON.stringify(newObject))
                    res.location(newObject[_contextid(newObject["@context"]) ? "id":"@id"])
                    res.status(200)
                    res.json(newObject)
                    return
                }
                err = Object.assign(err, {
                    message: `Unable to alter the history next of the originating object.  The history tree may be broken. See ${originalObject["@id"]}. ${err.message}`,
                    status: 500
                })
            }
            catch (error) {
                //WriteError or WriteConcernError
                next(createExpressError(error))
                return
            }
        }
    }
    else {
        //The http module will not detect this as a 400 on its own
        err = Object.assign(err, {
            message: `Object in request body must have the property '@id' or 'id'. ${err.message}`,
            status: 400
        })
    }
    next(createExpressError(err))
}

/**
 * Update some existing object in MongoDB by adding the keys from the JSON object in the request body.
 * Note that if a key on the request object matches a key on the object in MongoDB, that key will be ignored.
 * Order the properties to preference @context and @id.  Put __rerum and _id last. 
 * This cannot change or unset existing keys.
 * Track History
 * Respond RESTfully
 * */
const patchSet = async function (req, res, next) {
    let err = { message: `` }
    res.set("Content-Type", "application/json; charset=utf-8")
    let objectReceived = JSON.parse(JSON.stringify(req.body))
    let originalContext
    let patchedObject = {}
    let generatorAgent = getAgentClaim(req, next)
    const receivedID = objectReceived["@id"] ?? objectReceived.id
    if (receivedID) {
        let id = parseDocumentID(receivedID)
        let originalObject
        try {
            originalObject = await db.findOne({"$or":[{"_id": id}, {"__rerum.slug": id}]})
        } catch (error) {
            next(createExpressError(error))
            return
        }
        if (null === originalObject) {
            //This object is not in RERUM, they want to import it.  Do that automatically.  
            //updateExternalObject(objectReceived)
            err = Object.assign(err, {
                message: `This object is not from RERUM and will need imported. This is not automated yet. You can make a new object with create. ${err.message}`,
                status: 501
            })
        }
        else if (utils.isDeleted(originalObject)) {
            err = Object.assign(err, {
                message: `The object you are trying to update is deleted. ${err.message}`,
                status: 403
            })
        }
        else {
            patchedObject = JSON.parse(JSON.stringify(originalObject))
            if(_contextid(originalObject["@context"])) {
                // If the original object has a context that needs id protected, make sure you don't set it.
                delete objectReceived.id
                delete originalObject.id
                delete patchedObject.id
            }
            //A set only adds new keys.  If the original object had the key, it is ignored here.
            delete objectReceived._id
            for (let k in objectReceived) {
                if (originalObject.hasOwnProperty(k)) {
                    //Note the possibility of notifying the user that these keys were not processed.
                    delete objectReceived[k]
                }
                else {
                    patchedObject[k] = objectReceived[k]
                }
            }
            if (Object.keys(objectReceived).length === 0) {
                //Then you aren't actually changing anything...there are no new properties
                //Just hand back the object.  The resulting of setting nothing is the object from the request body.
                res.set(utils.configureWebAnnoHeadersFor(originalObject))
                originalObject = idNegotiation(originalObject)
                originalObject.new_obj_state = JSON.parse(JSON.stringify(originalObject))
                res.location(originalObject[_contextid(originalObject["@context"]) ? "id":"@id"])
                res.status(200)
                res.json(originalObject)
                return
            }
            const id = ObjectID()
            let context = patchedObject["@context"] ? { "@context": patchedObject["@context"] } : {}
            let rerumProp = { "__rerum": utils.configureRerumOptions(generatorAgent, originalObject, true, false)["__rerum"] }
            delete patchedObject["__rerum"]
            delete patchedObject["_id"]
            delete patchedObject["@id"]
            delete patchedObject["@context"]
            let newObject = Object.assign(context, { "@id": process.env.RERUM_ID_PREFIX + id }, patchedObject, rerumProp, { "_id": id })
            try {
                let result = await db.insertOne(newObject)
                if (alterHistoryNext(originalObject, newObject["@id"])) {
                    //Success, the original object has been updated.
                    res.set(utils.configureWebAnnoHeadersFor(newObject))
                    newObject = idNegotiation(newObject)
                    newObject.new_obj_state = JSON.parse(JSON.stringify(newObject))
                    res.location(newObject[_contextid(newObject["@context"]) ? "id":"@id"])
                    res.status(200)
                    res.json(newObject)
                    return
                }
                err = Object.assign(err, {
                    message: `Unable to alter the history next of the originating object.  The history tree may be broken. See ${originalObject["@id"]}. ${err.message}`,
                    status: 500
                })
            }
            catch (error) {
                //WriteError or WriteConcernError
                next(createExpressError(error))
                return
            }
        }
    }
    else {
        //The http module will not detect this as a 400 on its own
        err = Object.assign(err, {
            message: `Object in request body must have the property '@id' or 'id'. ${err.message}`,
            status: 400
        })
    }
    next(createExpressError(err))
}

/**
 * Update some existing object in MongoDB by removing the keys noted in the JSON object in the request body.
 * Note that if a key on the request object does not match a key on the object in MongoDB, that key will be ignored.
 * Order the properties to preference @context and @id.  Put __rerum and _id last. 
 * This cannot change existing keys or set new keys.
 * Track History
 * Respond RESTfully
 * */
const patchUnset = async function (req, res, next) {
    let err = { message: `` }
    res.set("Content-Type", "application/json; charset=utf-8")
    let objectReceived = JSON.parse(JSON.stringify(req.body))
    let patchedObject = {}
    let generatorAgent = getAgentClaim(req, next)
    const receivedID = objectReceived["@id"] ?? objectReceived.id
    if (receivedID) {
        let id = parseDocumentID(receivedID)
        let originalObject
        try {
            originalObject = await db.findOne({"$or":[{"_id": id}, {"__rerum.slug": id}]})
        } catch (error) {
            next(createExpressError(error))
            return
        }
        if (null === originalObject) {
            //This object is not in RERUM, they want to import it.  Do that automatically.  
            //updateExternalObject(objectReceived)
            err = Object.assign(err, {
                message: `This object is not from RERUM and will need imported. This is not automated yet. You can make a new object with create. ${err.message}`,
                status: 501
            })
        }
        else if (utils.isDeleted(originalObject)) {
            err = Object.assign(err, {
                message: `The object you are trying to update is deleted. ${err.message}`,
                status: 403
            })
        }
        else {
            patchedObject = JSON.parse(JSON.stringify(originalObject))
            delete objectReceived._id //can't unset this
            delete objectReceived.__rerum //can't unset this
            delete objectReceived["@id"] //can't unset this
            // id is also protected in this case, so it can't be unset.
            if(_contextid(originalObject["@context"])) delete objectReceived.id
            
            /**
             * unset does not alter an existing key.  It removes an existing key.
             * The request payload had {key:null} to flag keys to be removed.
             * Everything else is ignored.
            */
            for (let k in objectReceived) {
                if (originalObject.hasOwnProperty(k) && objectReceived[k] === null) {
                    delete patchedObject[k]
                }
                else {
                    //Note the possibility of notifying the user that these keys were not processed.
                    delete objectReceived[k]
                }
            }
            if (Object.keys(objectReceived).length === 0) {
                //Then you aren't actually changing anything...no properties in the request body were removed from the original object.
                //Just hand back the object.  The resulting of unsetting nothing is the object.
                res.set(utils.configureWebAnnoHeadersFor(originalObject))
                originalObject = idNegotiation(originalObject)
                originalObject.new_obj_state = JSON.parse(JSON.stringify(originalObject))
                res.location(originalObject[_contextid(originalObject["@context"]) ? "id":"@id"])
                res.status(200)
                res.json(originalObject)
                return
            }
            const id = ObjectID()
            let context = patchedObject["@context"] ? { "@context": patchedObject["@context"] } : {}
            let rerumProp = { "__rerum": utils.configureRerumOptions(generatorAgent, originalObject, true, false)["__rerum"] }
            delete patchedObject["__rerum"]
            delete patchedObject["_id"]
            delete patchedObject["@id"]
            // id is also protected in this case, so it can't be set.
            if(_contextid(patchedObject["@context"])) delete patchedObject.id
            delete patchedObject["@context"]
            let newObject = Object.assign(context, { "@id": process.env.RERUM_ID_PREFIX + id }, patchedObject, rerumProp, { "_id": id })
            console.log("PATCH UNSET")
            try {
                let result = await db.insertOne(newObject)
                if (alterHistoryNext(originalObject, newObject["@id"])) {
                    //Success, the original object has been updated.
                    res.set(utils.configureWebAnnoHeadersFor(newObject))
                    newObject = idNegotiation(newObject)
                    newObject.new_obj_state = JSON.parse(JSON.stringify(newObject))
                    res.location(newObject[_contextid(newObject["@context"]) ? "id":"@id"])
                    res.status(200)
                    res.json(newObject)
                    return
                }
                err = Object.assign(err, {
                    message: `Unable to alter the history next of the originating object.  The history tree may be broken. See ${originalObject["@id"]}. ${err.message}`,
                    status: 500
                })
            }
            catch (error) {
                //WriteError or WriteConcernError
                next(createExpressError(error))
                return
            }
        }
    }
    else {
        //The http module will not detect this as a 400 on its own
        err = Object.assign(err, {
            message: `Object in request body must have the property '@id' or 'id'. ${err.message}`,
            status: 400
        })
    }
    next(createExpressError(err))
}

/**
 * Replace some existing object in MongoDB with the JSON object in the request body.
 * Order the properties to preference @context and @id.  Put __rerum and _id last. 
 * DO NOT Track History
 * Respond RESTfully
 * */
const overwrite = async function (req, res, next) {
    let err = { message: `` }
    res.set("Content-Type", "application/json; charset=utf-8")
    let objectReceived = JSON.parse(JSON.stringify(req.body))
    let agentRequestingOverwrite = getAgentClaim(req, next)
    const receivedID = objectReceived["@id"] ?? objectReceived.id
    if (receivedID) {
        console.log("OVERWRITE")
        let id = parseDocumentID(receivedID)
        let originalObject
        try {
            originalObject = await db.findOne({"$or":[{"_id": id}, {"__rerum.slug": id}]})
        } catch (error) {
            next(createExpressError(error))
            return
        }
        if (null === originalObject) {
            err = Object.assign(err, {
                message: `No object with this id could be found in RERUM. Cannot overwrite. ${err.message}`,
                status: 404
            })
        }
        else if (utils.isDeleted(originalObject)) {
            err = Object.assign(err, {
                message: `The object you are trying to overwrite is deleted. ${err.message}`,
                status: 403
            })
        }
        else if (utils.isReleased(originalObject)) {
            err = Object.assign(err, {
                message: `The object you are trying to overwrite is released.  Fork with /update to make changes. ${err.message}`,
                status: 403
            })
        }
        else if (!utils.isGenerator(originalObject, agentRequestingOverwrite)) {
            err = Object.assign(err, {
                message: `You are not the generating agent for this object. You cannot overwrite it. Fork with /update to make changes. ${err.message}`,
                status: 401
            })
        }
        else {
            let context = objectReceived["@context"] ? { "@context": objectReceived["@context"] } : {}
            let rerumProp = { "__rerum": originalObject["__rerum"] }
            rerumProp["__rerum"].isOverwritten = new Date(Date.now()).toISOString().replace("Z", "")
            const id = originalObject["_id"]
            //Get rid of them so we can enforce the order
            delete objectReceived["@id"]
            delete objectReceived["_id"]
            delete objectReceived["__rerum"]
            // id is also protected in this case, so it can't be set.
            if(_contextid(objectReceived["@context"])) delete objectReceived.id
            delete objectReceived["@context"]
            let newObject = Object.assign(context, { "@id": originalObject["@id"] }, objectReceived, rerumProp, { "_id": id })
            let result
            try {
                result = await db.replaceOne({ "_id": id }, newObject)
            } catch (error) {
                next(createExpressError(error))
            }
            if (result.modifiedCount == 0) {
                //result didn't error out, the action was not performed.  Sometimes, this is a neutral thing.  Sometimes it is indicative of an error.
            }
            res.set(utils.configureWebAnnoHeadersFor(newObject))
            newObject = idNegotiation(newObject)
            newObject.new_obj_state = JSON.parse(JSON.stringify(newObject))
            res.location(newObject[_contextid(newObject["@context"]) ? "id":"@id"])
            res.json(newObject)
            return
        }
    }
    else {
        //This is a custom one, the http module will not detect this as a 400 on its own
        err = Object.assign(err, {
            message: `Object in request body must have the property '@id' or 'id'. ${err.message}`,
            status: 400
        })
    }
    next(createExpressError(err))
}

/**
 * Public facing servlet to release an existing RERUM object. This will not
 * perform history tree updates, but rather releases tree updates.
 * (AKA a new node in the history tree is NOT CREATED here.)
 * 
 * The id is on the URL already like, ?_id=.
 * 
 * The user may request the release resource take on a new Slug id.  They can do this
 * with the HTTP Request header 'Slug' or via a url parameter like ?slug=
 */
const release = async function (req, res, next) {
    let agentRequestingRelease = getAgentClaim(req, next)
    let id = req.params["_id"]
    let slug = ""
    let err = {"message":""}
    let treeHealed = false
    if(req.get("Slug")){
        let slug_json = await generateSlugId(req.get("Slug"), next)
        if(slug_json.code){
            next(createExpressError(slug_json))
            return
        }
        else{
            slug = slug_json.slug_id
        }
    }
    if (id){
        let originalObject 
        try {
            originalObject = await db.findOne({"$or":[{"_id": id}, {"__rerum.slug": id}]})
        } 
        catch (error) {
            next(createExpressError(error))
            return
        }
        let safe_original = JSON.parse(JSON.stringify(originalObject))
        let previousReleasedID = safe_original.__rerum.releases.previous
        let nextReleases = safe_original.__rerum.releases.next
        
        if (utils.isDeleted(safe_original)) {
            err = Object.assign(err, {
                message: `The object you are trying to release is deleted. ${err.message}`,
                status: 403
            })
        }
        if (utils.isReleased(safe_original)) {
            err = Object.assign(err, {
                message: `The object you are trying to release is already released. ${err.message}`,
                status: 403
            })
        }
        if (!utils.isGenerator(safe_original, agentRequestingRelease)) {
            err = Object.assign(err, {
                message: `You are not the generating agent for this object. You cannot release it. ${err.message}`,
                status: 401
            })
        }
        if (err.status) {
            next(createExpressError(err))
            return
        }
        console.log("RELEASE")
        if (null !== originalObject){
            safe_original["__rerum"].isReleased = new Date(Date.now()).toISOString().replace("Z", "")
            safe_original["__rerum"].releases.replaces = previousReleasedID
            safe_original["__rerum"].slug = slug
            if (previousReleasedID !== "") {
                // A releases tree exists and an ancestral object is being released.
                treeHealed = await healReleasesTree(safe_original)
            } 
            else { 
                // There was no releases previous value.
                if (nextReleases.length > 0) { 
                    // The release tree has been established and a descendant object is now being released.
                    treeHealed = await healReleasesTree(safe_original)
                } 
                else { 
                    // The release tree has not been established
                    treeHealed = await establishReleasesTree(safe_original)
                }
            }
            if (treeHealed) { 
                // If the tree was established/healed
                // perform the update to isReleased of the object being released. Its
                // releases.next[] and releases.previous are already correct.
                let releasedObject = safe_original
                let result
                try {
                    result = await db.replaceOne({ "_id": id }, releasedObject)
                } 
                catch (error) {
                    next(createExpressError(error))
                    return
                }
                if (result.modifiedCount == 0) {
                    //result didn't error out, the action was not performed.  Sometimes, this is a neutral thing.  Sometimes it is indicative of an error.
                }
                res.set(utils.configureWebAnnoHeadersFor(releasedObject))
                console.log(releasedObject._id+" has been released")
                releasedObject = idNegotiation(releasedObject)
                releasedObject.new_obj_state = JSON.parse(JSON.stringify(releasedObject))
                res.location(releasedObject[_contextid(releasedObject["@context"]) ? "id":"@id"])
                res.json(releasedObject)
                return
            } 
        }
    }
    else{
        //This was a bad request
        err = {
            message: "You must provide the id of an object to release.  Use /release/id-here or release?_id=id-here.",
            status: 400
        }
        next(createExpressError(err))
        return
    }
}

/**
 * Query the MongoDB for objects containing the key:value pairs provided in the JSON Object in the request body.
 * This will support wildcards and mongo params like {"key":{$exists:true}}
 * The return is always an array, even if 0 or 1 objects in the return.
 * */
const query = async function (req, res, next) {
    res.set("Content-Type", "application/json; charset=utf-8")
    let props = req.body
    const limit = parseInt(req.query.limit ?? 100)
    const skip = parseInt(req.query.skip ?? 0)
    if (Object.keys(props).length === 0) {
        //Hey now, don't ask for everything...this can happen by accident.  Don't allow it.
        let err = {
            message: "Detected empty JSON object.  You must provide at least one property in the /query request body JSON.",
            status: 400
        }
        next(createExpressError(err))
        return
    }
    try {
        let matches = await db.find(props).limit(limit).skip(skip).toArray()
        matches = matches.map(o => idNegotiation(o))
        res.set(utils.configureLDHeadersFor(matches))
        res.json(matches)
    } catch (error) {
        next(createExpressError(error))
    }
}

/**
 * Query the MongoDB for objects with the _id provided in the request body or request URL
 * Note this specifically checks for _id, the @id pattern is irrelevant.  
 * Note /v1/id/{blank} does not route here.  It routes to the generic 404
 * */
const id = async function (req, res, next) {
    res.set("Content-Type", "application/json; charset=utf-8")
    let id = req.params["_id"]
    try {
        let match = await db.findOne({"$or": [{"_id": id}, {"__rerum.slug": id}]})
        if (match) {
            res.set(utils.configureWebAnnoHeadersFor(match))
            //Support built in browser caching
            res.set("Cache-Control", "max-age=86400, must-revalidate")
            //Support requests with 'If-Modified_Since' headers
            res.set(utils.configureLastModifiedHeader(match))
            match = idNegotiation(match)
            res.location(_contextid(match["@context"]) ? match.id : match["@id"])
            res.json(match)
            return
        }
        let err = {
            "message": `No RERUM object with id '${id}'`,
            "status": 404
        } 
        next(createExpressError(err))
    } catch (error) {
        next(createExpressError(error))
    }
}

/**
 * Create many objects at once with the power of MongoDB bulkWrite() operations.
 * 
 * @see https://www.mongodb.com/docs/manual/reference/method/db.collection.bulkWrite/
 */
const bulkCreate = async function (req, res, next) {
    res.set("Content-Type", "application/json; charset=utf-8")
    const documents = req.body
    let err = {}
    if (!Array.isArray(documents)) {
        err.message = "The request body must be an array of objects."
        err.status = 400
        next(createExpressError(err))
        return
    }
    if (documents.length === 0) {
        err.message = "No action on an empty array."
        err.status = 400
        next(createExpressError(err))
        return
    }
    const gatekeep = documents.filter(d=> {
        // Each item must be valid JSON, but can't be an array.
        if(Array.isArray(d) || typeof d !== "object") return d
        try {
            JSON.parse(JSON.stringify(d))
        } catch (err) {
            return d
        }
        // Items must not have an @id, and in some cases same for id.
        const idcheck = _contextid(d["@context"]) ? (d.id ?? d["@id"]) : d["@id"]
        if(idcheck) return d
    }) 
    if (gatekeep.length > 0) {
        err.message = "All objects in the body of a `/bulkCreate` must be JSON and must not contain a declared identifier property."
        err.status = 400
        next(createExpressError(err))
        return
    }

    // TODO: bulkWrite SLUGS? Maybe assign an id to each document and then use that to create the slug?
    // let slug = req.get("Slug")
    // if(slug){
    //     const slugError = await exports.generateSlugId(slug)
    //     if(slugError){
    //         next(createExpressError(slugError))
    //         return
    //     }
    //     else{
    //         slug = slug_json.slug_id
    //     }
    // }

    // unordered bulkWrite() operations have better performance metrics.
    let bulkOps = []
    const generatorAgent = getAgentClaim(req, next)
    for(let d of documents) {
        // Do not create empty {}s
        if(Object.keys(d).length === 0) continue
        const providedID = d?._id
        const id = isValidID(providedID) ? providedID : ObjectID()
        d = utils.configureRerumOptions(generatorAgent, d)
        // id is also protected in this case, so it can't be set.
        if(_contextid(d["@context"])) delete d.id
        d._id = id
        d['@id'] = `${process.env.RERUM_ID_PREFIX}${id}`
        bulkOps.push({ insertOne : { "document" : d }})
    }
    try {
        let dbResponse = await db.bulkWrite(bulkOps, {'ordered':false})
        res.set("Content-Type", "application/json; charset=utf-8")
        res.set("Link",dbResponse.result.insertedIds.map(r => `${process.env.RERUM_ID_PREFIX}${r._id}`)) // https://www.rfc-editor.org/rfc/rfc5988
        res.status(201)
        const estimatedResults = bulkOps.map(f=>{
            let doc = f.insertOne.document
            doc = idNegotiation(doc)
            return doc
        })
        res.json(estimatedResults)  // https://www.rfc-editor.org/rfc/rfc7231#section-6.3.2
    }
    catch (error) {
        //MongoServerError from the client has the following properties: index, code, keyPattern, keyValue
        next(createExpressError(error))
    }
}

/**
 * Update many objects at once with the power of MongoDB bulkWrite() operations.
 * Make sure to alter object __rerum.history as appropriate.
 * The same object may be updated more than once, which will create history branches (not straight sticks)
 *
 * @see https://www.mongodb.com/docs/manual/reference/method/db.collection.bulkWrite/
 */
const bulkUpdate = async function (req, res, next) {
    res.set("Content-Type", "application/json; charset=utf-8")
    const documents = req.body
    let err = {}
    let encountered = []
    if (!Array.isArray(documents)) {
        err.message = "The request body must be an array of objects."
        err.status = 400
        next(createExpressError(err))
        return
    }
    if (documents.length === 0) {
        err.message = "No action on an empty array."
        err.status = 400
        next(createExpressError(err))
        return
    }
    const gatekeep = documents.filter(d => {
        // Each item must be valid JSON, but can't be an array.
        if(Array.isArray(d) || typeof d !== "object") return d
        try {
            JSON.parse(JSON.stringify(d))
        } catch (err) {
            return d
        }
        // Items must have an @id, or in some cases an id will do
        const idcheck = _contextid(d["@context"]) ? (d.id ?? d["@id"]) : d["@id"]
        if(!idcheck) return d
    })
    // The empty {}s will cause this error
    if (gatekeep.length > 0) {
        err.message = "All objects in the body of a `/bulkUpdate` must be JSON and must contain a declared identifier property."
        err.status = 400
        next(createExpressError(err))
        return
    }
    // unordered bulkWrite() operations have better performance metrics.
    let bulkOps = []
    const generatorAgent = getAgentClaim(req, next)
    for(const objectReceived of documents){
        // We know it has an id
        const idReceived = objectReceived["@id"] ?? objectReceived.id
        // Update the same thing twice?  can vs should.
        // if(encountered.includes(idReceived)) continue
        encountered.push(idReceived)
        if(!idReceived.includes(process.env.RERUM_ID_PREFIX)) continue
        let id = parseDocumentID(idReceived)
        let originalObject
        try {
            originalObject = await db.findOne({"$or":[{"_id": id}, {"__rerum.slug": id}]})
        } catch (error) {
            next(createExpressError(error))
            return
        }
        if (null === originalObject) continue
        if (utils.isDeleted(originalObject)) continue
        id = ObjectID()
        let context = objectReceived["@context"] ? { "@context": objectReceived["@context"] } : {}
        let rerumProp = { "__rerum": utils.configureRerumOptions(generatorAgent, originalObject, true, false)["__rerum"] }
        delete objectReceived["__rerum"]
        delete objectReceived["_id"]
        delete objectReceived["@id"]
        // id is also protected in this case, so it can't be set.
        if(_contextid(objectReceived["@context"])) delete objectReceived.id
        delete objectReceived["@context"]
        let newObject = Object.assign(context, { "@id": process.env.RERUM_ID_PREFIX + id }, objectReceived, rerumProp, { "_id": id })
        bulkOps.push({ insertOne : { "document" : newObject }})
        if(originalObject.__rerum.history.next.indexOf(newObject["@id"]) === -1){
            originalObject.__rerum.history.next.push(newObject["@id"])
            const replaceOp = { replaceOne :
                {
                    "filter" : { "_id": originalObject["_id"] },
                    "replacement" : originalObject,
                    "upsert" : false
                }
            }
            bulkOps.push(replaceOp)
        }
    }
    try {
        let dbResponse = await db.bulkWrite(bulkOps, {'ordered':false})
        res.set("Content-Type", "application/json; charset=utf-8")
        res.set("Link", dbResponse.result.insertedIds.map(r => `${process.env.RERUM_ID_PREFIX}${r._id}`)) // https://www.rfc-editor.org/rfc/rfc5988
        res.status(200)
        const estimatedResults = bulkOps.filter(f=>f.insertOne).map(f=>{
            let doc = f.insertOne.document
            doc = idNegotiation(doc)
            return doc
        })
        res.json(estimatedResults)  // https://www.rfc-editor.org/rfc/rfc7231#section-6.3.2
    }
    catch (error) {
        //MongoServerError from the client has the following properties: index, code, keyPattern, keyValue
        next(createExpressError(error))
    }
}

/**
 * Allow for HEAD requests by @id via the RERUM getByID pattern /v1/id/
 * No object is returned, but the Content-Length header is set. 
 * Note /v1/id/{blank} does not route here.  It routes to the generic 404
 * */
const idHeadRequest = async function (req, res, next) {
    res.set("Content-Type", "application/json; charset=utf-8")
    let id = req.params["_id"]
    try {
        let match = await db.findOne({"$or":[{"_id": id}, {"__rerum.slug": id}]})
        if (match) {
            const size = Buffer.byteLength(JSON.stringify(match))
            res.set("Content-Length", size)
            res.sendStatus(200)
            return
        }
        let err = {
            "message": `No RERUM object with id '${id}'`,
            "status": 404
        }
        next(createExpressError(err))
    } catch (error) {
        next(createExpressError(error))
    }
}

/**
 * Allow for HEAD requests via the RERUM getByProperties pattern /v1/api/query
 * No objects are returned, but the Content-Length header is set. 
 */
const queryHeadRequest = async function (req, res, next) {
    res.set("Content-Type", "application/json; charset=utf-8")
    let props = req.body
    try {
        let matches = await db.find(props).toArray()
        if (matches.length) {
            const size = Buffer.byteLength(JSON.stringify(match))
            res.set("Content-Length", size)
            res.sendStatus(200)
            return
        }
        let err = {
            "message": `There is no object in the database with id '${id}'.  Check the URL.`,
            "status": 404
        } 
        next(createExpressError(err))
    } catch (error) {
        next(createExpressError(error))
    }
}

/**
 * Public facing servlet to gather for all versions downstream from a provided `key object`.
 * @param oid variable assigned by urlrewrite rule for /id in urlrewrite.xml
 * @throws java.lang.Exception
 * @respond JSONArray to the response out for parsing by the client application.
 */
const since = async function (req, res, next) {
    res.set("Content-Type", "application/json; charset=utf-8")
    let id = req.params["_id"]
    let obj
    try {
        obj = await db.findOne({"$or":[{"_id": id}, {"__rerum.slug": id}]})
    } catch (error) {
        next(createExpressError(error))
        return
    }
    if (null === obj) {
        let err = {
            message: `Cannot produce a history. There is no object in the database with id '${id}'.  Check the URL.`,
            status: 404
        }
        next(createExpressError(err))
        return
    }
    let all = await getAllVersions(obj)
        .catch(error => {
            console.error(error)
            return []
        })
    let descendants = getAllDescendants(all, obj, [])
    descendants =
        descendants.map(o => idNegotiation(o))
    res.set(utils.configureLDHeadersFor(descendants))
    res.json(descendants)
}


/**
 * Public facing servlet action to find all upstream versions of an object.  This is the action the user hits with the API.
 * If this object is `prime`, it will be the only object in the array.
 * @param oid variable assigned by urlrewrite rule for /id in urlrewrite.xml
 * @respond JSONArray to the response out for parsing by the client application.
 * @throws Exception 
 */
const history = async function (req, res, next) {
    res.set("Content-Type", "application/json; charset=utf-8")
    let id = req.params["_id"]
    let obj
    try {
        obj = await db.findOne({"$or":[{"_id": id}, {"__rerum.slug": id}]})
    } catch (error) {
        next(createExpressError(error))
        return
    }
    if (null === obj) {
        let err = {
            message: `Cannot produce a history. There is no object in the database with id '${id}'.  Check the URL.`,
            status: 404
        }
        next(createExpressError(err))
        return
    }
    let all = await getAllVersions(obj)
        .catch(error => {
            console.error(error)
            return []
        })
    let ancestors = getAllAncestors(all, obj, [])
    ancestors =
        ancestors.map(o => idNegotiation(o))
    res.set(utils.configureLDHeadersFor(ancestors))
    res.json(ancestors)
}

/**
 * Allow for HEAD requests via the RERUM since pattern /v1/since/:_id
 * No objects are returned, but the Content-Length header is set. 
 * */
const sinceHeadRequest = async function (req, res, next) {
    res.set("Content-Type", "application/json; charset=utf-8")
    let id = req.params["_id"]
    let obj
    try {
        obj = await db.findOne({"$or":[{"_id": id}, {"__rerum.slug": id}]})
    } catch (error) {
        next(createExpressError(error))
        return
    }
    if (null === obj) {
        let err = {
            message: `Cannot produce a history. There is no object in the database with id '${id}'.  Check the URL.`,
            status: 404
        }
        next(createExpressError(err))
        return
    }
    let all = await getAllVersions(obj)
        .catch(error => {
            console.error(error)
            return []
        })
    let descendants = getAllDescendants(all, obj, [])
    if (descendants.length) {
        const size = Buffer.byteLength(JSON.stringify(descendants))
        res.set("Content-Length", size)
        res.sendStatus(200)
        return
    }
    res.set("Content-Length", 0)
    res.sendStatus(200)
}

/**
 * Allow for HEAD requests via the RERUM since pattern /v1/history/:_id
 * No objects are returned, but the Content-Length header is set. 
 * */
const historyHeadRequest = async function (req, res, next) {
    res.set("Content-Type", "application/json; charset=utf-8")
    let id = req.params["_id"]
    let obj
    try {
        obj = await db.findOne({"$or":[{"_id": id}, {"__rerum.slug": id}]})
    } catch (error) {
        next(createExpressError(error))
        return
    }
    if (null === obj) {
        let err = {
            message: "Cannot produce a history. There is no object in the database with this id. Check the URL.",
            status: 404
        }
        next(createExpressError(err))
        return
    }
    let all = await getAllVersions(obj)
        .catch(error => {
            console.error(error)
            return []
        })
    let ancestors = getAllAncestors(all, obj, [])
    if (ancestors.length) {
        const size = Buffer.byteLength(JSON.stringify(ancestors))
        res.set("Content-Length", size)
        res.sendStatus(200)
        return
    }
    res.set("Content-Length", 0)
    res.sendStatus(200)
}

/**
 * Internal private method to loads all derivative versions from the `root` object. It should always receive a reliable object, not one from the user.
 * Used to resolve the history tree for storing into memory.
 * @param  obj A JSONObject to find all versions of.  If it is root, make sure to prepend it to the result.  If it isn't root, query for root from the ID
 * found in prime using that result as a reliable root object. 
 * @return All versions from the store of the object in the request
 * @throws Exception when a JSONObject with no '__rerum' property is provided.
 */
async function getAllVersions(obj) {
    let ls_versions
    let primeID = obj?.__rerum.history.prime
    let rootObj = ( primeID === "root") 
    ?   //The obj passed in is root.  So it is the rootObj we need.
        JSON.parse(JSON.stringify(obj))
    :   //The obj passed in knows the ID of root, grab it from Mongo
        await db.findOne({ "@id": primeID })
        /**
         * Note that if you attempt the following code, it will cause  Cannot convert undefined or null to object in getAllVersions.
         * rootObj = await db.findOne({"$or":[{"_id": primeID}, {"__rerum.slug": primeID}]})
         * This is the because some of the @ids have different RERUM URL patterns on them.
         **/
    //All the children of this object will have its @id in __rerum.history.prime
    ls_versions = await db.find({ "__rerum.history.prime": rootObj['@id'] }).toArray()
    //The root object is a version, prepend it in
    ls_versions.unshift(rootObj)
    return ls_versions
}

/**
 * Internal method to filter ancestors upstream from `key object` until `root`. It should always receive a reliable object, not one from the user.
 * This list WILL NOT contains the keyObj.
 * 
 *  "Get requests can't have body"
 *  In fact in the standard they can (at least nothing says they can't). But lot of servers and firewall implementation suppose they can't 
 *  and drop them so using body in get request is a very bad idea.
 * 
 * @param ls_versions all the versions of the key object on all branches
 * @param keyObj The object from which to start looking for ancestors.  It is not included in the return. 
 * @param discoveredAncestors The array storing the ancestor objects discovered by the recursion.
 * @return All the objects that were deemed ancestors in a JSONArray
 */
function getAllAncestors(ls_versions, keyObj, discoveredAncestors) {
    let previousID = keyObj.__rerum.history.previous //The first previous to look for
    for (let v of ls_versions) {
        if (keyObj.__rerum.history.prime === "root") {
            //Check if we found root when we got the last object out of the list.  If so, we are done.  If keyObj was root, it will be detected here.  Break out. 
            break
        }
        else if (v["@id"] === previousID) {
            //If this object's @id is equal to the previous from the last object we found, its the one we want.  Look to its previous to keep building the ancestors Array.   
            previousID = v.__rerum.history.previous
            if (previousID === "" && v.__rerum.history.prime !== "root") {
                //previous is blank and this object is not the root.  This is gunna trip it up.  
                //@cubap Yikes this is a problem.  This branch on the tree is broken...what should we tell the user?  How should we handle?
                break
            }
            else {
                discoveredAncestors.push(v)
                //Recurse with what you have discovered so far and this object as the new keyObj
                getAllAncestors(ls_versions, v, discoveredAncestors)
                break
            }
        }
    }
    return discoveredAncestors
}

/**
 * Internal method to find all downstream versions of an object.  It should always receive a reliable object, not one from the user.
 * If this object is the last, the return will be an empty JSONArray.  The keyObj WILL NOT be a part of the array.  
 * @param  ls_versions All the given versions, including root, of a provided object.
 * @param  keyObj The provided object
 * @param  discoveredDescendants The array storing the descendants objects discovered by the recursion.
 * @return All the objects that were deemed descendants in a JSONArray
 */
function getAllDescendants(ls_versions, keyObj, discoveredDescendants) {
    let nextIDarr = []
    if (keyObj.__rerum.history.next.length === 0) {
        //essentially, do nothing.  This branch is done.
    }
    else {
        //The provided object has nexts, get them to add them to known descendants then check their descendants.
        nextIDarr = keyObj.__rerum.history.next
    }
    for (let nextID of nextIDarr) {
        for (let v of ls_versions) {
            if (v["@id"] === nextID) { //If it is equal, add it to the known descendants
                //Recurse with what you have discovered so far and this object as the new keyObj
                discoveredDescendants.push(v)
                getAllDescendants(ls_versions, v, discoveredDescendants);
                break
            }
        }
    }
    return discoveredDescendants
}

/**
 * Internal helper method to update the history.previous property of a root object.  This will occur because a new root object can be created
 * by put_update.action on an external object.  It must mark itself as root and contain the original ID for the object in history.previous.
 * This method only receives reliable objects from mongo.
 * 
 * @param newRootObj the RERUM object whose history.previous needs to be updated
 * @param externalObjID the @id of the external object to go into history.previous
 * @return JSONObject of the provided object with the history.previous alteration
 */
async function alterHistoryPrevious(objToUpdate, newPrevID) {
    //We can keep this real short if we trust the objects sent into here.  I think these are private helper functions, and so we can.
    objToUpdate.__rerum.history.previous = newPrevID
    let result = await db.replaceOne({ "_id": objToUpdate["_id"] }, objToUpdate)
    return result.modifiedCount > 0
}

/**
 * Internal helper method to update the history.next property of an object.  This will occur because updateObject will create a new object from a given object, and that
 * given object will have a new next value of the new object.  Watch out for missing __rerum or malformed __rerum.history
 * 
 * @param idForUpdate the @id of the object whose history.next needs to be updated
 * @param newNextID the @id of the newly created object to be placed in the history.next array.
 * @return Boolean altered true on success, false on fail
 */
async function alterHistoryNext(objToUpdate, newNextID) {
    //We can keep this real short if we trust the objects sent into here.  I think these are private helper functions, and so we can.
    if(objToUpdate.__rerum.history.next.indexOf(newNextID) === -1){
        objToUpdate.__rerum.history.next.push(newNextID)
        let result = await db.replaceOne({ "_id": objToUpdate["_id"] }, objToUpdate)
        return result.modifiedCount > 0
    }
    return true
}

/**
 * Internal helper method to handle put_update.action on an external object.  The goal is to make a copy of object as denoted by the PUT request
 * as a RERUM object (creating a new object) then have that new root object reference the @id of the external object in its history.previous. 
 * 
 * @param externalObj the external object as it existed in the PUT request to be saved.
*/
async function updateExternalObject(received) {
    let err = {
        message: "You will get a 201 upon success.  This is not supported yet.  Nothing happened.",
        status: 501
    }
    next(createExpressError(err))
}

/**
* An internal method to handle when an object is deleted and the history tree around it will need amending.  
* This function should only be handed a reliable object from mongo.
* 
* @param obj A JSONObject of the object being deleted.
* @return A boolean representing whether or not this function succeeded. 
*/
async function healHistoryTree(obj) {
    let previous_id = ""
    let prime_id = ""
    let next_ids = []
    if (obj["__rerum"]) {
        previous_id = obj["__rerum"]["history"]["previous"]
        prime_id = obj["__rerum"]["history"]["prime"]
        next_ids = obj["__rerum"]["history"]["next"]
    }
    else {
        console.error("This object has no history because it has no '__rerum' property.  There is nothing to heal.")
        return false
        //throw new Error("This object has no history because it has no '__rerum' property.  There is nothing to heal.")
    }
    let objToDeleteisRoot = (prime_id === "root")
    //Update the history.previous of all the next ids in the array of the deleted object
    try {
        for (nextID of next_ids) {
            let objWithUpdate = {}
            const nextIdForQuery = parseDocumentID(nextID)
            const objToUpdate = await db.findOne({"$or":[{"_id": nextIdForQuery}, {"__rerum.slug": nextIdForQuery}]})
            if (null !== objToUpdate) {
                let fixHistory = JSON.parse(JSON.stringify(objToUpdate))
                if (objToDeleteisRoot) {
                    //This means this next object must become root. 
                    //Strictly, all history trees must have num(root) > 0.  
                    if (newTreePrime(fixHistory)) {
                        fixHistory["__rerum"]["history"]["prime"] = "root"
                        //The previous always inherited in this case, even if it isn't there.
                        fixHistory["__rerum"]["history"]["previous"] = previous_id
                    }
                    else {
                        throw Error("Could not update all descendants with their new prime value")
                    }
                }
                else if (previous_id !== "") {
                    //The object being deleted had a previous.  That is now absorbed by this next object to mend the gap.  
                    fixHistory["__rerum"]["history"]["previous"] = previous_id
                }
                else {
                    // @cubap @theHabes TODO Yikes this is some kind of error...it is either root or has a previous, this case means neither are true.
                    // cubap: Since this is a __rerum error and it means that the object is already not well-placed in a tree, maybe it shouldn't fail to delete?
                    // theHabes: Are their bad implications on the relevant nodes in the tree that reference this one if we allow it to delete?  Will their account of the history be correct?
                    throw Error("object did not have previous and was not root.")
                }
                //Does this have to be async?
                let verify = await db.replaceOne({ "_id": objToUpdate["_id"] }, fixHistory)
                if (verify.modifiedCount === 0) {
                    //result didn't error out, the action was not performed.  Sometimes, this is a neutral thing.  Sometimes it is indicative of an error.
                    throw Error("Could not update all descendants with their new prime value")
                }
            }
            else {
                throw Error("Could not update all descendants with their new prime value")
            }
        }
        //Here it may be better to resolve the previous_id and check for __rerum...maybe this is a sister RERUM with a different prefix
        if (previous_id.indexOf(process.env.RERUM_PREFIX) > -1) {
            //The object being deleted had a previous that is internal to RERUM.  That previous object next[] must be updated with the deleted object's next[].
            //For external objects, do nothing is the right thing to do here.
            let objWithUpdate2 = {}
            const objToUpdate2 = await db.findOne({"$or":[{"_id": nextIdForQuery}, {"__rerum.slug": nextIdForQuery}]})
            if (null !== objToUpdate2) {
                let fixHistory2 = JSON.parse(JSON.stringify(objToUpdate2))
                let origNextArray = fixHistory2["__rerum"]["history"]["next"]
                let newNextArray = [...origNextArray]
                //This next should no longer have obj["@id"]
                newNextArray = newNextArray.splice(obj["@id"], 1)
                //This next needs to contain the nexts from the deleted object
                newNextArray = [...newNextArray, ...next_ids]
                fixHistory2["__rerum"]["history"]["next"] = newNextArray //Rewrite the next[] array to fix the history
                //Does this have to be async
                let verify2 = await db.replaceOne({ "_id": objToUpdate2["_id"] }, fixHistory2)
                if (verify2.modifiedCount === 0) {
                    //verify didn't error out, but it also didn't succeed...
                    throw Error("Could not update all ancestors with their altered next value")
                }
            }
            else {
                //The history.previous object could not be found in this RERUM Database.  
                //It has this APIs id pattern, that means we expected to find it.  This is an error.
                //throw new Error("Could not update all descendants with their new prime value")
                throw Error("Could not update all ancestors with their altered next value: cannot find ancestor.")
            }
        }
        else {
            //console.log("The value of history.previous was an external URI or was not present.  Nothing to heal.  URI:"+previous_id);  
        }
    } catch (error) {
        // something threw so the history tree isn't resolved
        console.error(error)
        return false
    }
    //Here it may be better to resolve the previous_id and check for __rerum...maybe this is a sister RERUM with a different prefix
    if (previous_id.indexOf(process.env.RERUM_PREFIX.split('//')[1]) > -1) {
        //The object being deleted had a previous that is internal to RERUM.  That previous object next[] must be updated with the deleted object's next[].
        //For external objects, do nothing is the right thing to do here.
        let previousIdForQuery = parseDocumentID(previous_id)
        const objToUpdate2 = await db.findOne({"$or":[{"_id": previousIdForQuery}, {"__rerum.slug": previousIdForQuery}]})
        if (null !== objToUpdate2) {
            let fixHistory2 = JSON.parse(JSON.stringify(objToUpdate2))
            let origNextArray = fixHistory2["__rerum"]["history"]["next"]
            let newNextArray = [...origNextArray]
            //This next should no longer have obj["@id"]
            newNextArray = newNextArray.splice(obj["@id"], 1)
            //This next needs to contain the nexts from the deleted object
            newNextArray = [...newNextArray, ...next_ids]
            fixHistory2["__rerum"]["history"]["next"] = newNextArray //Rewrite the next[] array to fix the history
            //Does this have to be async
            let verify2 = await db.replaceOne({ "_id": objToUpdate2["_id"] }, fixHistory2)
            if (verify2.modifiedCount === 0) {
                //result didn't error out, the action was not performed.  Sometimes, this is a neutral thing.  Sometimes it is indicative of an error.
                console.error("Could not update all ancestors with their altered next value")
                return false
            }
        }
        else {
            //The history.previous object could not be found in this RERUM Database.  
            //It has this APIs id pattern, that means we expected to find it.  This is an error.
            //throw new Error("Could not update all descendants with their new prime value")
            console.error("Could not update all ancestors with their altered next value: cannot find ancestor.")
            return false
        }
    }
    else {
        //console.log("The value of history.previous was an external URI or was not present.  Nothing to heal.  URI:"+previous_id);  
    }
    return true
}

/**
* An internal method to make all descendants of this JSONObject take on a new history.prime = this object's @id
* This should only be fed a reliable object from mongo
* @param obj A new prime object whose descendants must take on its id
*/
async function newTreePrime(obj) {
    if (obj["@id"]) {
        let primeID = obj["@id"]
        let ls_versions = []
        let descendants = []
        try {
            ls_versions = await getAllVersions(obj)
            descendants = getAllDescendants(ls_versions, obj, [])
        } catch (error) {
            // fail silently
        }
        for (d of descendants) {
            let objWithUpdate = JSON.parse(JSON.stringify(d))
            objWithUpdate["__rerum"]["history"]["prime"] = primeID
            let result = await db.replaceOne({ "_id": d["_id"] }, objWithUpdate)
            if (result.modifiedCount === 0) {
                console.error("Could not update all descendants with their new prime value: newTreePrime failed")
                return false
                //throw new Error("Could not update all descendants with their new prime value: newTreePrime failed")
            }
        }
    }
    else {
        console.error("newTreePrime failed.  Obj did not have '@id'.")
        return false
        //throw new Error("newTreePrime failed.  Obj did not have '@id'.")
    }
    return true
}

/**
 * Recieve an error from a route.  It should already have a statusCode and statusMessage.
 * Note that this may be a Mongo error that occurred during a database action during a route.
 * Reformat known mongo errors into regular errors with an apprpriate statusCode and statusMessage.
 *
 * @param {Object} err An object with `statusMessage` and `statusCode`, or a Mongo error with 'code', for error reporting
 * @returns A JSON object with a statusCode and statusMessage to send into rest.js for RESTful erroring.
 */
function createExpressError(err) {
    let error = {}
    if (err.code) {
        switch (err.code) {
            case 11000:
                //Duplicate _id key error, specific to SLUG support.  This is a Conflict.
                error.statusMessage = `The id provided already exists.  Please use a different _id or Slug.`
                error.statusCode = 409
                break
            default:
                error.statusMessage = "There was a mongo error that prevented this request from completing successfully."
                error.statusCode = 500
        }
    }
    error.statusCode = err.statusCode ?? err.status ?? 500
    error.statusMessage = err.statusMessage ?? err.message ?? "Detected Error"
    return error
}

/**
 * An internal helper for removing a document from the database using a known _id or __rerums.slug.
 * This is not exposed over the http request and response.
 * Use it internally where necessary.  Ex. end to end Slug test
 */
const remove = async function(id) {
    try {
        const result = await db.deleteOne({"$or":[{"_id": id}, {"__rerum.slug": id}]})
        if (!result.deletedCount === 1) {
            throw Error("Could not remove object")
        }
        return true
    }
    catch (error) {
        error.message = "Could not remove object"
        throw error
    }
}

/**
 * An internal helper for getting the agent from req.user
 * If you do not find an agent, the API does not know this requestor.
 * This means attribution is not possible, regardless of the state of the token.
 * The app is forbidden until registered with RERUM.  Access tokens are encoded with the agent.
 */
function getAgentClaim(req, next) {
    const claimKeys = [process.env.RERUM_AGENT_CLAIM, "http://devstore.rerum.io/v1/agent", "http://store.rerum.io/agent"]
    let agent = ""
    for (const claimKey of claimKeys) {
        agent = req.user[claimKey]
        if (agent) {
            return agent
        }
    }
    let err = {
        "message": "Could not get agent from req.user.  Have you registered with RERUM?",
        "status": 403
    }
    next(createExpressError(err))  
}

/**
 * Internal helper method to establish the releases tree from a given object
 * that is being released.
 * This can probably be collapsed into healReleasesTree. It contains no checks,
 * it is brute force update ancestors and descendants.
 * It is significantly cleaner and slightly faster than healReleaseTree() which
 * is why I think we should keep them separate.
 * 
 * This method only receives reliable objects from mongo.
 * 
 * @param obj the RERUM object being released
 * @return Boolean sucess or some kind of Exception
 */
async function establishReleasesTree(releasing){
    let success = true
    const all = await getAllVersions(releasing)
    .catch(error => {
        console.error(error)
        return []
    })
    const descendants = getAllDescendants(all, releasing, [])
    const ancestors = getAllAncestors(all, releasing, [])
    for(const d of descendants){
        let safe_descendant = JSON.parse(JSON.stringify(d))
        let d_id = safe_descendant._id
        safe_descendant.__rerum.releases.previous = releasing["@id"]
        let result
        try {
            result = await db.replaceOne({ "_id": d_id }, safe_descendant)
        } 
        catch (error) {
            next(createExpressError(error))
            return
        }
        if (result.modifiedCount == 0) {
            //result didn't error out, the action was not performed.  Sometimes, this is a neutral thing.  Sometimes it is indicative of an error.
            //console.log("nothing modified...")
            //success = false
        }  
    }
    for(const a of ancestors){
        let safe_ancestor = JSON.parse(JSON.stringify(a))
        let a_id = safe_ancestor._id
        if(safe_ancestor.__rerum.releases.next.indexOf(releasing["@id"]) === -1){
            safe_ancestor.__rerum.releases.next.push(releasing["@id"])    
        }
        let result
        try {
            result = await db.replaceOne({ "_id": a_id }, safe_ancestor)
        } 
        catch (error) {
            next(createExpressError(error))
            return
        }
        if (result.modifiedCount == 0) {
            //result didn't error out, the action was not performed.  Sometimes, this is a neutral thing.  Sometimes it is indicative of an error.
            //console.log("nothing modified...")
            //success = false
        }  
    }
    return success
}

/**
 * Internal helper method to update the releases tree from a given object that
 * is being released. See code in method for further documentation.
 * https://www.geeksforgeeks.org/find-whether-an-array-is-subset-of-another-array-set-1/
 * 
 * This method only receives reliable objects from mongo.
 * 
 * @param obj the RERUM object being released
 * @return Boolean success or some kind of Exception
 */
async function healReleasesTree(releasing) {
    let success = true
    const all = await getAllVersions(releasing)
    .catch(error => {
        console.error(error)
        return []
    })
    const descendants = getAllDescendants(all, releasing, [])
    const ancestors = getAllAncestors(all, releasing, [])
    for(const d of descendants){
        let safe_descendant = JSON.parse(JSON.stringify(d))
        let d_id = safe_descendant._id
        if(d.__rerum.releases.previous === releasing.__rerum.releases.previous){
            // If the descendant's previous matches the node I am releasing's
            // releases.previous, swap the descendant releses.previous with node I am releasing's @id.
            safe_descendant.__rerum.releases.previous = releasing["@id"]
            if(d.__rerum.isReleased !== ""){
                // If this descendant is released, it replaces the node being released
                if(d.__rerum.releases.previous === releasing["@id"]){
                    safe_descendant.__rerum.releases.replaces = releasing["@id"]
                }
            }
            let result
            try {
                result = await db.replaceOne({ "_id": d_id }, safe_descendant)
            } 
            catch (error) {
                next(createExpressError(error))
                return
            }
            if (result.modifiedCount == 0) {
                //result didn't error out, the action was not performed.  Sometimes, this is a neutral thing.  Sometimes it is indicative of an error.
                //success = false
            }
        }    
    }
    let origNextArray = releasing.__rerum.releases.next
    for (const a of ancestors){
        let safe_ancestor = JSON.parse(JSON.stringify(a))
        let a_id = safe_ancestor._id
        let ancestorNextArray = safe_ancestor.__rerum.releases.next
        if (ancestorNextArray.length == 0) {
            // The releases.next on the node I am releasing is empty. This means only other
            // ancestors with empty releases.next[] are between me and the next ancenstral released node
            // Add the id of the node I am releasing into the ancestor's releases.next array.
            if(ancestorNextArray.indexOf(releasing["@id"]) === -1){
                ancestorNextArray.push(releasing["@id"])
            }
        }
        else{
            // The releases.next on the node I am releasing has 1 - infinity entries. I need
            // to check if any of the entries of that array exist in the releases.next of my
            // ancestors and remove them before
            // adding the @id of the released node into the acenstral releases.next array.  
            for(const i of origNextArray){
                for(const j of ancestorNextArray){
                    // For each id in the ancestor's releases.next array
                    if (i === j) {
                        // If the id is in the next array of the object I am releasing and in the
                        // releases.next array of the ancestor
                        const index = ancestorNextArray.indexOf(j)
                        if (index > -1) {
                            // remove that id.
                          ancestorNextArray = ancestorNextArray.splice(index, 1)
                        }
                    }
                }
            }
            // Whether or not the ancestral node replaces the node I am releasing or not
            // happens in releaseObject() when I make the node I am releasing isReleased
            // because I can use the releases.previous there.
            // Once I have checked against all id's in the ancestor node releases.next[] and removed the ones I needed to
            // Add the id of the node I am releasing into the ancestor's releases.next array.
            if(ancestorNextArray.indexOf(releasing["@id"]) === -1){
                ancestorNextArray.push(releasing["@id"])
            }
        }
        safe_ancestor.__rerum.releases.next = ancestorNextArray
        let result
        try {
            result = await db.replaceOne({ "_id": a_id }, safe_ancestor)
        } 
        catch (error) {
            next(createExpressError(error))
            return
        }
        if (result.modifiedCount == 0) {
            //result didn't error out, the action was not performed.  Sometimes, this is a neutral thing.  Sometimes it is indicative of an error.
            //success = false
        }
    
    }
    return success
}

/**
 * Get the __id database value for lookup from the @id or id key.
 * This is an indexed key so lookup should be very quick.
 * @param {String} atID URI of document at //store.rerum.io/v1/id/
 */
function parseDocumentID(atID){
    if(typeof atID !== 'string') {
        throw new Error("Unable to parse this type.")
    }
    if(!/^https?/.test(atID)){
        throw new Error(`Designed for parsing URL strings. Please check: ${atID}`)
    }
    return atID.split('/').pop()
}

/**
 * THIS IS SPECIFICALLY FOR 'Gallery of Glosses'
 * Starting from a ManuscriptWitness URI get all WitnessFragment entities that are a part of the Manuscript.
 * The inbound request is a POST request with an Authorization header
 * The Bearer Token in the header must be from TinyMatt.
 * The body must be formatted correctly - {"ManuscriptWitness":"witness_uri_here"}
 *
 * TODO? Some sort of limit and skip for large responses?
 *
 * @return The set of {'@id':'123', '@type':'WitnessFragment'} objects that match this criteria, as an Array
 * */
const _gog_fragments_from_manuscript = async function (req, res, next) {
    res.set("Content-Type", "application/json; charset=utf-8")
    const agent = getAgentClaim(req, next)
    const agentID = agent.split("/").pop()
    const manID = req.body["ManuscriptWitness"]
    const limit = parseInt(req.query.limit ?? 50)
    const skip = parseInt(req.query.skip ?? 0)
    let err = { message: `` }
    // This request can only be made my Gallery of Glosses production apps.
    if (!agentID === "61043ad4ffce846a83e700dd") {
        err = Object.assign(err, {
            message: `Only the Gallery of Glosses can make this request.`,
            status: 403
        })
    }
    // Must have a properly formed body with a usable value
    else if(!manID || !manID.startsWith("http")){
        err = Object.assign(err, {
            message: `The body must be JSON like {"ManuscriptWitness":"witness_uri_here"}.`,
            status: 400
        })
    }
    if (err.status) {
        next(createExpressError(err))
        return
    }
    try {
        let matches = []
        const partOfConditions = [
            {"body.partOf.value": manID.replace(/^https?/, "http")},
            {"body.partOf.value": manID.replace(/^https?/, "https")},
            {"body.partOf": manID.replace(/^https?/, "http")},
            {"body.partOf": manID.replace(/^https?/, "https")}
        ]
        const generatorConditions = [
            {"__rerum.generatedBy":  agent.replace(/^https?/, "http")},
            {"__rerum.generatedBy":  agent.replace(/^https?/, "https")}
        ]
        const fragmentTypeConditions = [
            {"witnessFragment.type": "WitnessFragment"},
            {"witnessFragment.@type": "WitnessFragment"}
        ]
        const annoTypeConditions = [
            {"type": "Annotation"},
            {"@type": "Annotation"},
            {"@type": "oa:Annotation"}
        ]
        let witnessFragmentPipeline = [
            // Step 1: Detect Annotations bodies noting their 'target' is 'partOf' this Manuscript
            {
                $match: {
                    "__rerum.history.next": { "$exists": true, "$size": 0 },
                    "$and":[
                        {"$or": annoTypeConditions},
                        {"$or": partOfConditions},
                        {"$or": generatorConditions}
                    ]
                }
            },
            // Step 1.1 through 1.3 for limit and skip functionality.
            { $sort : { _id: 1 } },
            { $skip : skip },
            { $limit : limit },
            // Step 2: Using the target of those Annotations lookup the Entity they represent and store them in a witnessFragment property on the Annotation
            // Note that $match had filtered down the alpha collection, so we use $lookup to look through the whole collection again.
            // FIXME? a target that is http will not match an @id that is https
            {
                $lookup: {
                    from: "alpha",
                    localField: "target",   // Field in `Annotation` referencing `@id` in `alpha` corresponding to a WitnessFragment @id
                    foreignField: "@id",
                    as: "witnessFragment"
                }
            },
            // Step 3: Filter out anything that is not a WitnessFragment entity (and a leaf)
            {
                $match: { 
                    "witnessFragment.__rerum.history.next": { "$exists": true, "$size": 0 },
                    "$or": fragmentTypeConditions
                }
            },
            // Step 4: Unwrap the Annotation and just return its corresponding WitnessFragment entity
            {
                $project: {
                    "_id": 0,
                    "@id": "$witnessFragment.@id",
                    "@type": "WitnessFragment"
                }
            },
            // Step 5: @id values are an Array of 1 and need to be a string instead
            {
                $unwind: { "path": "$@id" }
            }
            // Step 6: Cache it?
        ]

        // console.log("Start GoG WitnessFragment Aggregator")
        const start = Date.now();
        let witnessFragments = await db.aggregate(witnessFragmentPipeline).toArray()
        .then((fragments) => {
            if (fragments instanceof Error) {
              throw fragments
            }
            return fragments
        })
        const fragmentSet = new Set(witnessFragments)
        witnessFragments = Array.from(fragmentSet.values())
        // Note that a server side expand() is available and could be used to expand these fragments here.
        // console.log("End GoG WitnessFragment Aggregator")
        // console.log(witnessFragments.length+" fragments found for this Manuscript")
        // const end = Date.now()
        // console.log(`Total Execution time: ${end - start} ms`)
        res.set(utils.configureLDHeadersFor(witnessFragments))
        res.json(witnessFragments)
    }
    catch (error) {
        console.error(error)
        next(createExpressError(error))
    }
}

/**
 * THIS IS SPECIFICALLY FOR 'Gallery of Glosses'
 * Starting from a ManuscriptWitness URI get all Gloss entities that are a part of the Manuscript.
 * The inbound request is a POST request with an Authorization header.
 * The Bearer Token in the header must be from TinyMatt.
 * The body must be formatted correctly - {"ManuscriptWitness":"witness_uri_here"}
 *
 * TODO? Some sort of limit and skip for large responses?
 *
 * @return The set of {'@id':'123', '@type':'Gloss'} objects that match this criteria, as an Array
 * */
const _gog_glosses_from_manuscript = async function (req, res, next) {
    res.set("Content-Type", "application/json; charset=utf-8")
    const agent = getAgentClaim(req, next)
    const agentID = agent.split("/").pop()
    const manID = req.body["ManuscriptWitness"]
    const limit = parseInt(req.query.limit ?? 50)
    const skip = parseInt(req.query.skip ?? 0)
    let err = { message: `` }
    // This request can only be made my Gallery of Glosses production apps.
    if (!agentID === "61043ad4ffce846a83e700dd") {
        err = Object.assign(err, {
            message: `Only the Gallery of Glosses can make this request.`,
            status: 403
        })
    }
    // Must have a properly formed body with a usable value
    else if(!manID || !manID.startsWith("http")){
        err = Object.assign(err, {
            message: `The body must be JSON like {"ManuscriptWitness":"witness_uri_here"}.`,
            status: 400
        })
    }
    if (err.status) {
        next(createExpressError(err))
        return
    }
    try {
        let matches = []
        const partOfConditions = [
            {"body.partOf.value": manID.replace(/^https?/, "http")},
            {"body.partOf.value": manID.replace(/^https?/, "https")},
            {"body.partOf": manID.replace(/^https?/, "http")},
            {"body.partOf": manID.replace(/^https?/, "https")}
        ]
        const generatorConditions = [
            {"__rerum.generatedBy":  agent.replace(/^https?/, "http")},
            {"__rerum.generatedBy":  agent.replace(/^https?/, "https")}
        ]
        const fragmentTypeConditions = [
            {"witnessFragment.type": "WitnessFragment"},
            {"witnessFragment.@type": "WitnessFragment"}
        ]
        const annoTypeConditions = [
            {"type": "Annotation"},
            {"@type": "Annotation"},
            {"@type": "oa:Annotation"}
        ]
        let glossPipeline = [
            // Step 1: Detect Annotations bodies noting their 'target' is 'partOf' this Manuscript
            {
                $match: {
                    "__rerum.history.next": { $exists: true, $size: 0 },
                    "$and":[
                        {"$or": annoTypeConditions},
                        {"$or": partOfConditions},
                        {"$or": generatorConditions}
                    ]
                }
            },
            // Step 1.1 through 1.3 for limit and skip functionality.
            { $sort : { _id: 1 } },
            { $skip : skip },
            { $limit : limit },
            // Step 2: Using the target of those Annotations lookup the Entity they represent and store them in a witnessFragment property on the Annotation
            // Note that $match had filtered down the alpha collection, so we use $lookup to look through the whole collection again.
            // FIXME? a target that is http will not match an @id that is https
            {
                $lookup: {
                    from: "alpha",
                    localField: "target",   // Field in `Annotation` referencing `@id` in `alpha` corresponding to a WitnessFragment @id
                    foreignField: "@id",
                    as: "witnessFragment"
                }
            },
            // Step 3: Filter Annotations to be only those which are for a WitnessFragment Entity
            {
                $match: { 
                    "$or": fragmentTypeConditions
                }
            },
            // Step 4: Unwrap the Annotation and just return its corresponding WitnessFragment entity
            {
                $project: {
                    "_id": 0,
                    "@id": "$witnessFragment.@id",
                    "@type": "WitnessFragment"
                }
            },
            // Step 5: @id values are an Array of 1 and need to be a string instead
            {
                $unwind: { "path": "$@id" }
            },
            // Step 6: Using the WitnessFragment ids lookup their references Annotations
            // Note that $match had filtered down the alpha collection, so we use $lookup to look through the whole collection again.
            {
                $lookup: {
                    from: "alpha",
                    localField: "@id",   // Field in `WitnessFragment` referencing `target` in `alpha` corresponding to a Gloss @id
                    foreignField: "target",
                    as: "anno"
                }
            },
            // Step 7: Filter Annos down to those that are the 'references' Annotations
            {
                $match: { 
                    "anno.body.references":{ "$exists": true }
                }
            },
            // Step 7: Collect together the body.references.value[] of those Annotations.  Those are the relevant Gloss URIs.
            {
                $project: {
                    "_id": 0,
                    "@id": "$anno.body.references.value",
                    "@type": "Gloss"
                }
            },
            // Step 8: @id values are an Array of and Array 1 because references.value is an Array
            {
                $unwind: { "path": "$@id" }
            },
            // Step 9: @id values are now an Array of 1 and need to be a string instead
            {
                $unwind: { "path": "$@id" }
            }
        ]

        // console.log("Start GoG Gloss Aggregator")
        // const start = Date.now();
        let glosses = await db.aggregate(glossPipeline).toArray()
        .then((fragments) => {
            if (fragments instanceof Error) {
              throw fragments
            }
            return fragments
          })
        const glossSet = new Set(glosses)
        glosses = Array.from(glossSet.values())
        // Note that a server side expand() is available and could be used to expand these fragments here.
        // console.log("End GoG Gloss Aggregator")
        // console.log(glosses.length+" Glosses found for this Manuscript")
        // const end = Date.now()
        // console.log(`Total Execution time: ${end - start} ms`)
        res.set(utils.configureLDHeadersFor(glosses))
        res.json(glosses)
    }
    catch (error) {
        console.error(error)
        next(createExpressError(error))
    }
}

/**
* Find relevant Annotations targeting a primitive RERUM entity.  This is a 'full' expand.  
* Add the descriptive information in the Annotation bodies to the primitive object.
*
* Anticipate likely Annotation body formats
*   - anno.body
*   - anno.body.value
*
* Anticipate likely Annotation target formats
*   - target: 'uri'
*   - target: {'id':'uri'}
*   - target: {'@id':'uri'}
*
* Anticipate likely Annotation type formats
*   - {"type": "Annotation"}
*   - {"@type": "Annotation"}
*   - {"@type": "oa:Annotation"}
*
* @param primitiveEntity - An existing RERUM object
* @param GENERATOR - A registered RERUM app's User Agent
* @param CREATOR - Some kind of string representing a specific user.  Often combined with GENERATOR. 
* @return the expanded entity object
*
*/
const expand = async function(primitiveEntity, GENERATOR=undefined, CREATOR=undefined){
    if(!primitiveEntity?.["@id"] || primitiveEntity?.id) return primitiveEntity
    const targetId = primitiveEntity["@id"] ?? primitiveEntity.id ?? "unknown"
    let queryObj = {
        "__rerum.history.next": { $exists: true, $size: 0 }
    }
    let targetPatterns = ["target", "target.@id", "target.id"]
    let targetConditions = []
    let annoTypeConditions = [{"type": "Annotation"}, {"@type":"Annotation"}, {"@type":"oa:Annotation"}]

    if (targetId.startsWith("http")) {
        for(const targetKey of targetPatterns){
            targetConditions.push({ [targetKey]: targetId.replace(/^https?/, "http") })
            targetConditions.push({ [targetKey]: targetId.replace(/^https?/, "https") })
        }
        queryObj["$and"] = [{"$or": targetConditions}, {"$or": annoTypeConditions}]
    } 
    else{
        queryObj["$or"] = annoTypeConditions
        queryObj.target = targetId
    }

    // Only expand with data from a specific app
    if(GENERATOR) {
        // Need to check http:// and https://
        const generatorConditions = [
            {"__rerum.generatedBy":  GENERATOR.replace(/^https?/, "http")},
            {"__rerum.generatedBy":  GENERATOR.replace(/^https?/, "https")}
        ]
        if (GENERATOR.startsWith("http")) {
            queryObj["$and"].push({"$or": generatorConditions })
        } 
        else{
            // It should be a URI, but this can be a fallback.
            queryObj["__rerum.generatedBy"] = GENERATOR
        }
    }
    // Only expand with data from a specific creator
    if(CREATOR) {
        // Need to check http:// and https://
        const creatorConditions = [
            {"creator":  CREATOR.replace(/^https?/, "http")},
            {"creator":  CREATOR.replace(/^https?/, "https")}
        ]
        if (CREATOR.startsWith("http")) {
            queryObj["$and"].push({"$or": creatorConditions })
        } 
        else{
            // It should be a URI, but this can be a fallback.
            queryObj["creator"] = CREATOR
        }
    }

    // Get the Annotations targeting this Entity from the db.  Remove _id property.
    let matches = await db.find(queryObj).toArray()
    matches = matches.map(o => {
        delete o._id
        return o
    })

    // Combine the Annotation bodies with the primitive object
    let expandedEntity = JSON.parse(JSON.stringify(primitiveEntity))
    for(const anno of matches){
        const body = anno.body
        let keys = Object.keys(body)
        if(!keys || keys.length !== 1) return
        let key = keys[0]
        let val = body[key].value ?? body[key]
        expandedEntity[key] = val
    }

    return expandedEntity
}

export default {
 index,
 create,
 deleteObj,
 putUpdate,
 patchUpdate,
 patchSet,
 patchUnset,
 generateSlugId,
 overwrite,
 release,
 query,
 id,
 bulkCreate,
 bulkUpdate,
 idHeadRequest,
 queryHeadRequest,
 since,
 history,
 sinceHeadRequest,
 historyHeadRequest,
 remove,
 _gog_glosses_from_manuscript,
 _gog_fragments_from_manuscript,
 idNegotiation
}
