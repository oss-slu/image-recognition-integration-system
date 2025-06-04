#!/usr/bin/env node

/**
 * This module is general utilities.  It should not respond to clients or manipulate the 
 * http request/response.  
 * 
 * @author thehabes 
 */

/**
 * Add the __rerum properties object to a given JSONObject.If __rerum already exists, it will be overwritten because this method is only called on new objects. Properties for consideration are:
APIversion        —1.0.0
history.prime     —if it has an @id, import from that, else "root"
history.next      —always [] 
history.previous  —if it has an @id, @id
releases.previous —if it has an @id, import from that, else ""
releases.next     —always [] 
releases.replaces —always ""
generatedBy       —set to the @id of the public agent of the API Key.
createdAt         —DateTime of right now.
isOverwritten     —always ""
isReleased        —always ""
 * 
 * @param received A potentially optionless JSONObject from the Mongo Database (not the user).  This prevents tainted __rerum's
 * @param update A trigger for special handling from update actions
 * @return configuredObject The same object that was recieved but with the proper __rerum options.  This object is intended to be saved as a new object (@see versioning)
 */
const configureRerumOptions = function(generator, received, update, extUpdate){
    let configuredObject = JSON.parse(JSON.stringify(received))
    let received_options = received.__rerum ? JSON.parse(JSON.stringify(received.__rerum)) : {}
    let history = {}
    let releases = {}
    let rerumOptions = {}
    let history_prime = ""
    let history_previous = ""
    let releases_previous = ""
    if(extUpdate){
        //We are "importing" an external object as a new object in RERUM (via an update).  It can knows its previous external self, but is a root for its existence in RERUM.
        received_options = {}
        history_prime = "root"
        history_previous = received["@id"] ?? received.id ?? ""
    }
    else{
        //We are either updating an existing RERUM object or creating a new one.
        if(received_options.hasOwnProperty("history")){
            history = received_options.history
            if(update){
                //This means we are configuring from the update action and we have passed in a clone of the originating object (with its @id) that contained a __rerum.history
                if(history.prime === "root"){
                    //Hitting this case means we are updating from the prime object, so we can't pass "root" on as the prime value
                    history_prime = received["@id"] ?? received.id ?? ""
                }
                else{
                    //Hitting this means we are updating an object that already knows its prime, so we can pass on the prime value
                    history_prime = history.prime
                }
                //Either way, we know the previous value shold be the @id of the object received here. 
                history_previous = received["@id"] ?? received.id ?? ""
            }
            else{
                //Hitting this means we are saving a new object and found that __rerum.history existed.  We don't trust it, act like it doesn't have it.
                history_prime = "root"
                history_previous = ""
            }
        }
        else{
            //Hitting this means we are are saving an object that did not have __rerum history.  This is normal   
            history_prime = "root"
            history_previous = ""
        }
        if(received_options.hasOwnProperty("releases")){
            releases = received_options.releases
            releases_previous = releases.previous
        }
        else{
            releases_previous = ""         
        }
    } 
    releases.next = []
    releases.previous = releases_previous
    releases.replaces = ""
    history.next = []
    history.previous = history_previous
    history.prime = history_prime
    rerumOptions["@context"] = process.env.RERUM_CONTEXT
    rerumOptions.alpha = true
    rerumOptions.APIversion = process.env.RERUM_API_VERSION
    //It is important for the cache workflow that these be properly formatted.  
    let creationDateTime = new Date(Date.now()).toISOString().replace("Z", "")
    rerumOptions.createdAt = creationDateTime
    rerumOptions.isOverwritten = ""
    rerumOptions.isReleased = ""
    rerumOptions.history = history
    rerumOptions.releases = releases
    rerumOptions.generatedBy = generator
    configuredObject.__rerum = rerumOptions
    return configuredObject //The mongo save/update has not been called yet.  The object returned here will go into mongo.save or mongo.update
}

/**
 * Check this object for deleted status.  deleted objects in RERUM look like {"@id":"{some-id}", __deleted:{object properties}}
 */ 
const isDeleted = function(obj){
    return obj.hasOwnProperty("__deleted")
}

/**
 * Check this object for released status.  Released objects in RERUM look like {"@id":"{some-id}", __rerum:{"isReleased" : "ISO-DATE-TIME"}}
 */ 
const isReleased = function(obj){
    let bool = 
    (obj.hasOwnProperty("__rerum") && 
        obj.__rerum.hasOwnProperty("isReleased") && 
        obj.__rerum.isReleased !== "")
    return bool
}

/**
 * Check to see if the agent from the request (req.user had decoded token) matches the generating agent of the object in mongodb.
 */ 
const isGenerator = function(origObj, changeAgent){
    //If the object in mongo does not have a generator, something wrong.  however, there is no permission to check, no generator is the same as any generator.
    const generatingAgent = origObj.__rerum.generatedBy ?? changeAgent 
    //bots get a free pass through
    return generatingAgent === changeAgent
}

/**
 * Mint the HTTP response headers required by REST best practices and/or Web Annotation standards.
 * return a JSON object.  keys are header names, values are header values.
 */
const configureWebAnnoHeadersFor = function(obj){
    let headers = {}
    if(isLD(obj)){
        headers["Content-Type"] = "application/ld+json;charset=utf-8;profile=\"http://www.w3.org/ns/anno.jsonld\""
    }
    if(isContainerType(obj)){
        headers["Link"] = "application/ld+json;charset=utf-8;profile=\"http://www.w3.org/ns/anno.jsonld\""
    }
    else{
        headers["Link"] = "<http://www.w3.org/ns/ldp#Resource>; rel=\"type\""
    }
    headers["Allow"] = "GET,OPTIONS,HEAD,PUT,PATCH,DELETE,POST"
    return headers
}

/**
 * Mint the HTTP response headers required by REST best practices and/or Linked Data standards.
 * This is specifically for responses that are not Web Annotation compliant (getByProperties, getAllDescendants, getAllAncestors)
 * They respond with Arrays (which have no @context), but they still need the JSON-LD support headers.
 * return a JSON object.  keys are header names, values are header values.
 */
const configureLDHeadersFor = function(obj){
    //Note that the optimal situation would be to be able to detect the LD-ness of this object
    //What we have are the arrays returned from the aformentioned getters (/query, /since, /history)
    //We know we want them to be LD and that they likely contain LD things, but the arrays don't have an @context
    let headers = {}
    /**
    if(isLD(obj)){
        headers["Content-Type"] = 'application/ld+json;charset=utf-8;profile="http://www.w3.org/ns/anno.jsonld"'
    } 
    else {
        // This breaks Web Annotation compliance, but allows us to return requested
        // objects without misrepresenting the content.
        headers["Content-Type"] = "application/json;charset=utf-8;"
    }
    */
    headers["Allow"] = "GET,OPTIONS,HEAD,PUT,PATCH,DELETE,POST"
    headers["Content-Type"] = 'application/ld+json;charset=utf-8;profile="http://www.w3.org/ns/anno.jsonld"'
    headers["Link"] = '<http://store.rerum.io/v1/context.json>; rel="http://www.w3.org/ns/json-ld#context"; type="application/ld+json"'
    return headers
}

/**
 * Check if this object is of a known container type.  
 * If so, it requires a different header than a stand-alone resource object.
 * return boolean
 */ 
const isContainerType = function(obj){
    let answer = false
    let typestring = obj["@type"] ?? obj.type ?? ""
    const knownContainerTypes = [
        "ItemList",
        "AnnotationPage",
        "AnnotationList",
        "AnnotationCollection",
        "Sequence",
        "Range",
        "Canvas",
        "List",
        "Set",
        "Collection"
    ]
    for(const t of knownContainerTypes){
        //Dang those pesky prefixes...circumventing exact match for now
        if(typestring.includes(t)){
            answer = true
            break
        }
    }
    return answer
    //return knownContainerTypes.includes(typestring)
}

/**
 * Check if this object is a Linked Data object.
 * If so, it will have an @context -(TODO) that resolves!
 * return boolean
 */ 
const isLD = function(obj){
    //Note this is always false if obj is an array, like /since, /history or /query provide as a return.
    return Array.isArray(obj) ? false : obj["@context"] ? true : false
}

/**
 * Mint the Last-Modified header for /v1/id/ responses.
 * It should be displayed like Mon, 14 Mar 2022 22:44:42 GMT
 * The data knows it like 2022-03-14T17:44:42.721
 * return a JSON object.  keys are header names, values are header values.
 */ 
const configureLastModifiedHeader = function(obj){
    let date = ""
    if(obj.__rerum){
        if(!obj.__rerum.isOverwritten === ""){
            date = obj.__rerum.isOverwritten
        }
        else{
            date = obj.__rerum.createdAt
        }
    }
    else if(obj.__deleted){
        date = obj.__deleted.time
    }
    //Note that dates like 2021-05-26T10:39:19.328 have been rounded to 2021-05-26T10:39:19 in browser headers.  Account for that here.
    if(typeof date === "string" && date.includes(".")){
        //If-Modified-Since and Last-Modified headers are rounded.  Wed, 26 May 2021 10:39:19.629 GMT becomes Wed, 26 May 2021 10:39:19 GMT.
        date = date.split(".")[0]
    }
    return {"Last-Modified":new Date(date).toUTCString()}
}

export default {
    configureRerumOptions,
    isDeleted,
    isReleased,
    isGenerator,
    configureWebAnnoHeadersFor,
    configureLDHeadersFor,
    isContainerType,
    isLD,
    configureLastModifiedHeader
}