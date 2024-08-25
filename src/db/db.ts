import mongoose from "mongoose";

export const connectDb = (uri: string) => {
  mongoose
    .connect(uri, {
      dbName: "Writo_Assignment",
    })
    .then((c) => {
      console.log(`The database is connected to ${c.connection.host}`);
    })
    .catch((e) => console.log(e));
};
