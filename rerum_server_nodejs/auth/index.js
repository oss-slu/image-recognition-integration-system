import { auth } from 'express-oauth2-jwt-bearer'
import dotenv from 'dotenv'
dotenv.config()

const _tokenError = function (err, req, res, next) {
    if(!err.code || err.code !== "invalid_token"){ 
        next(err)
        return
    }
    try{
        let user = JSON.parse(Buffer.from(req.header("authorization").split(" ")[1].split('.')[1], 'base64').toString())
        if(isBot(user)){
            console.log("Request allowed via bot check")
            next()
            return
        }
    }
    catch(e){
        e.message = e.statusMessage = `This token did not contain a known RERUM agent.`
        e.status = 401
        e.statusCode = 401
        next(e)
    }
    next(err)
}

const _extractUser = (req, res, next) => {
    try{
        req.user = JSON.parse(Buffer.from(req.header("authorization").split(" ")[1].split('.')[1], 'base64').toString())
        next()
    }
    catch(e){
        e.message = e.statusMessage = `This token did not contain a known RERUM agent.}`
        e.status = 401
        e.statusCode = 401
        next(e)
    }
}

/**
 * Use like: 
 * app.get('/api/private', checkJwt, function(req, res) {
 *   // do authorized things
 * });
 */
const checkJwt = [READONLY, auth(), _tokenError, _extractUser]

/**
 * Public API proxy to generate new access tokens through Auth0
 * with a refresh token when original access has expired.
 * @param {ExpressRequest} req from registered server application.
 * @param {ExpressResponse} res to return the new token.
 */
const generateNewAccessToken = async (req, res, next) => {
    console.log("RERUM v1 is generating a proxy access token.")
    const form = {
        grant_type: 'refresh_token',
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        refresh_token: req.body.refresh_token,
        redirect_uri:process.env.RERUM_PREFIX
    }
    try{
        // Successful responses from auth 0 look like {"refresh_token":"BLAHBLAH", "access_token":"BLAHBLAH"}
        // Error responses come back as successful, but they look like {"error":"blahblah", "error_description": "this is why"}
        const tokenObj = await fetch('https://cubap.auth0.com/oauth/token',
        {
            method: 'POST',
            headers: {
                "Content-Type": "application/json"
            },
            body:JSON.stringify(form)
        })
        .then(resp => resp.json())
        .catch(err => {
            // Mock Auth0 error object
            console.error(err)
            return {"error": true, "error_description":err}
        })
        // Here we need to check if this is an Auth0 success object or an Auth0 error object
        if(tokenObj.error){
            console.error(tokenObj.error_description)
            res.status(500).send(tokenObj.error_description)
        }
        else{
            res.status(200).send(tokenObj) 
        }
    }
    catch (e) {
        console.error(e.response ? e.response.body : e.message ? e.message : e)
        res.status(500).send(e)
     }
}

/**
 * Used by RERUM to renew the refresh token upon user request.
 * @param {ExpressRequest} req from registered server application.
 * @param {ExpressResponse} res to return the new token.
 */
const generateNewRefreshToken = async (req, res, next) => {
    console.log("RERUM v1 is generating a new refresh token.")
    const form = {
        grant_type: 'authorization_code',
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        code: req.body.authorization_code,
        redirect_uri:process.env.RERUM_PREFIX
    }
    try {
        // Successful responses from auth 0 look like {"refresh_token":"BLAHBLAH", "access_token":"BLAHBLAH"}
        // Error responses come back as successful, but they look like {"error":"blahblah", "error_description": "this is why"}
        const tokenObj = await fetch('https://cubap.auth0.com/oauth/token',
        {
            method: 'POST',
            headers: {
                "Content-Type": "application/json"
            },
            body:JSON.stringify(form)
        })
        .then(resp => resp.json())
        .catch(err => {
            // Mock Auth0 error object
            console.error(err)
            return {"error": true, "error_description":err}
        })
        // Here we need to check if this is an Auth0 success object or an Auth0 error object
        if(tokenObj.error){
            console.error(tokenObj.error_description)
            res.status(500).send(tokenObj.error_description)
        }
        else{
            res.status(200).send(tokenObj) 
        }
     } 
     catch (e) {
        console.error(e.response ? e.response.body : e.message ? e.message : e)
        res.status(500).send(e)
     }
}

/**
 * Upon requesting an action, confirm the request has a valid token.
 * @param {(Base64)String} secret access_token from `Bearer` header in request
 * @returns decoded payload of JWT if successful
 * @throws Error if token, signature, or date is invalid
 */
const verifyAccess = (secret) => {
    return jwt({
        secret,
        audience: `http://rerum.io/api`,
        issuer: `https://rerum.io/`,
        algorithms: ['RS256']
    })
}

/**
 * 
 * @param {Object} obj RERUM database entry
 * @param {Object} User object discerned from token
 * @returns Boolean match between encoded Generator Agent and obj generator
 */
const isGenerator = (obj, userObj) => {
    return userObj[process.env.RERUM_AGENT_CLAIM] === obj.__rerum.generatedBy
}

/**
 * Even expired tokens may be accepted if the Agent is a known bot. This is a 
 * dangerous thing to include, but may be a useful convenience.
 * @param {Object} User object discerned from token
 * @returns Boolean for matching ID.
 */
const isBot = (userObj) => {
    return process.env.BOT_AGENT === userObj[process.env.RERUM_AGENT_CLAIM]
}

function READONLY(req, res, next) {
     if(process.env.READONLY=="true"){
        res.status(503).json({"message":"RERUM v1 is read only at this time.  We apologize for the inconvenience.  Try again later."})
        return
     }
     next()
     return
}

export default {
    checkJwt,
    generateNewAccessToken,
    generateNewRefreshToken,
    verifyAccess,
    isBot,
    isGenerator,
    READONLY
}
