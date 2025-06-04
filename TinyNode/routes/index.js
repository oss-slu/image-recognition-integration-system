import express from "express"
const router = express.Router()

/* GET home page. */
router.get('/', function(req, res, next) {
  res.status(200).sendFile('index.html')
})

router.all('/', (req, res, next) => {
  res.status(405).send("Method Not Allowed")
})

export default router
