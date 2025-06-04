/**
 * Middleware for preprocessing documents to contain the expected format.
 * @author cubap
 */

// expressjs middleware for preprocessing documents. Use the jsonld library to make sure the "@id" and "@type" fields are included on the JSON object in the request.body
import LD from 'jsonld'

const rerumPropertiesWasher = async (req, res, next) => {
    if (typeof req.body !== 'object' || req.body === null) {
        // if the request body is not an object, return an error
        return res.status(400).json({ error: 'Invalid request body' })
    }
    // check if the JSON object has an "@id" field
    if (req.body.hasOwnProperty('@id')) {
        next()
        return
    }
    let missingProps = ['@id']
    // Without @context, we've no idea how to proceed
    if (!req.body.hasOwnProperty('@context')) {
        return res.status(400).json({ error: `Missing required properties: @context, ${missingProps.join(', ')}` })
    }
    // check if the JSON object has an "@type" field
    if (!req.body.hasOwnProperty('@type')) {
        missingProps.push('@type')
        req.body['@type'] = ''
    }
    // look for aliases in the @context
    return LD.expand(req.body)
        .then(expanse => {
            const expanded = expanse[0]
            for (const prop of missingProps) {
                if (expanded.hasOwnProperty(prop)) {
                    req.body[prop] = expanded[prop]
                }
            }
            if(Array.isArray(req.body['@type'])) {
                req.body['@type'] = expanded['@type'].pop()
            }
            next()
        })
        .catch(err => {
            next(err)
        })
}

export default rerumPropertiesWasher
