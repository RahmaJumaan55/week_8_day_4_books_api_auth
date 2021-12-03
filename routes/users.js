const express = require("express")
const router = express.Router()
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const { User, signupJoi, loginJoi } = require("../models/User")
const checkToken = require("../middleware/checkToken")

router.post("/singup", async (req, res) => {
  try {
    const userBody = req.body
    const { firstName, lastName, email, password, avatar } = userBody
    const result = signupJoi.validate(res.body)
    if (result.error) return res.status(400).send(result.error.details[0].message)

    const userFound = await User.findOne({ email })
    if (userFound) return res.status(400).send("user alredy registered")

    const salt = await bcrypt.genSalt(10)
    const hash = await bcrypt.hash(password, salt)

    const user = new User({
      firstName,
      lastName,
      email,
      password: hash,
      avatar,
    })

    await user.save()
    delete user._doc.passwors

    res.json(user)
  } catch (error) {
    return res.status(500).json(error.message)
  }
})

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body
    const result = loginJoi.validate(req.body)
    if (result.error) return res.status(400).send(result.error.details[0].message)
    const user = await User.findOne({ email })
    if (!user) return res.status(404).send("password is incorrect")

    const token = jwt.sign({ sub: user._id }, process.env.jWT_SECRET_KEY, { expiresIn: "15d" })
    res.json(token)
  } catch (error) {
    return res.status(500).json(error.message)
  }
})

router.get("/profile", checkToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-__v -password")
    if (!user) return res.status(404).json("user not found")

    res.send(user)
  } catch (error) {
    res.status(500).json(error.message)
  }
})

module.exports = router
