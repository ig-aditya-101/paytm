const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 3001;
const rootRouter = require("./routes/index");
const { authMiddleware } = require("./middleware");

app.use(cors());
app.use(express.json());


app.use("/api/v1", rootRouter);

app.listen(PORT, function (err) {
  if (err) {
    console.log(err);
  }
  console.log("server listening on port: ", PORT);
});
