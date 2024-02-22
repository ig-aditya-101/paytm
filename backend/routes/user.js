const express = require("express");
const router = express.Router();

const {User,Account} = require("../db");
const z = require("zod");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config");
const { authMiddleware } = require("../middleware");

const userSchema = z.object({
  username: z.string().email(),

  firstName: z.string(),
  lastName: z.string(),
  password: z.string(),
});

router.post("/signup", async (req, res) => {
  const createPayload = req.body;
  const parsedPayload = userSchema.safeParse(createPayload);
  if (!parsedPayload.success) {
    return res.status(411).json({
      message: "Incorrect inputs",
    });
  }
  const existingUser = await User.findOne({
    username: req.body.username,
  });
  if (existingUser) {
    return res.status(411).json({
      message: "Email already taken",
    });
  }
  const user = await User.create({
    username: createPayload.username,
    password: createPayload.password,
    firstName: createPayload.firstName,
    lastName: createPayload.lastName,
  });
  const userId = user._id;

  await Account.create({
    userId,
    balance: 1 + Math.random() * 1000,
  });
  const token = jwt.sign(
    {
      userId,
    },
    JWT_SECRET
  );
  res.json({
    message: "user successfully created.",
    token: token,
  });
});

const signinSchema = z.object({
  username: z.string().email(),
  password: z.string(),
});

router.post("/signin", async (req, res) => {
  const createPayload = req.body;
  const parsedPayload = signinSchema.safeParse(createPayload);
  if (!parsedPayload.success) {
    return res.status(411).json({
      message: " Incorrect inputs",
    });
  }
  const user = await User.findOne({
    username: createPayload.username,
    password: createPayload.password,
  });
  if (user) {
    const token = jwt.sign(
      {
        userId: user._id,
      },
      JWT_SECRET
    );
    res.json({
      token: token,
    });
    return;
  }
  res.status(411).json({
    message: "Error while logging in.",
  });
});

const updateBody = z.object({
  username: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

router.put("/", authMiddleware, async (req, res) => {
  const createPayload = req.body;
  const parsedPayload = updateBody.safeParse(createPayload);
  if (!parsedPayload.success) {
    res.status(411).json({
      message: "error while updating informations",
    });
  }
  await User.updateOne({ _id: req.userId }, req.body);
  res.json({
    message: "Updated Successfully",
  });
});

router.get("/bulk", async (req, res) => {
  const filter = req.query.filter || "";

  const users = await User.find({
    $or: [
      {
        firstName: {
          $regex: filter,
        },
      },
      {
        lastName: {
          $regex: filter,
        },
      },
    ],
  });

  res.json({
    user: users.map((user) => ({
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      _id: user._id,
    })),
  });
});

module.exports = router;
