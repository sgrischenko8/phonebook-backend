const app = require("./app");
const mongoose = require("mongoose");

const port = process.env.PORT || 3001;

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    app.listen(port, () => {
      console.log("Server is running. Use our API on port: 3000");
    });
    console.log("Database connection successful");
  })
  .catch((err) => {
    console.log(err.message);
    process.exit(1);
  });

setInterval(() => console.log("tick"), 840000);
