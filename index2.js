const bodyParser = require("body-parser");
const express = require("express");
const app = express();
const port = 3000;
const data = require("./index");
const SQL = require("./sql");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/reset", async (req, res) => {
  await data.reset(); // cant
  res.send("Reset DB");
});

app.get("/get-result", async (req, res) => {
  try {
    const keys = Object.keys(req.query);
    if (keys.length !== 1 || keys[0] !== "day") {
      throw new Error("Wrong query field");
    }
    let { day } = req.query; // YYYY-MM-DD
    const date = new Date(day);
    if (!isValidDay(day, date)) {
      throw new Error("Invalid day");
    }
    let x = await SQL.getResult(date);
    res.send(x);
  } catch (err) {
    res.send({ message: err.message ?? "ERROR" });
  }
});

app.get("/get-results", async (req, res) => {
  try {
    const note = req.query;
    const keys = Object.keys(note);
    if (
      keys.length !== 2 ||
      !note.hasOwnProperty("from") ||
      !note.hasOwnProperty("to")
    ) {
      throw new Error("Wrong query field");
    }
    const { from, to } = req.query; // YYYY-MM-DD
    const dayStart = from;
    const dateStart = new Date(dayStart);
    if (!isValidDay(dayStart, dateStart)) {
      throw new Error("Invalid day from");
    }
    const dayFinish = to;
    const dateFinish = new Date(dayFinish);
    if (!isValidDay(dayFinish, dateFinish)) {
      throw new Error("Invalid day to");
    }
    if (dateStart.getTime() > dateFinish.getTime()) {
      throw new Error("Wrong period");
    }
    let x = await SQL.getResults(dateStart, dateFinish);
    if (x.length === 0) {
      throw new Error("No data");
    }
    // convert string to array.
    res.send(x);
  } catch (err) {
    res.send({ message: err.message ?? "ERROR" });
  }
});

app.post("/post-result", async (req, res) => {
  try {
    const note = req.body;
    const day = note.day; // YYYY-MM-DD
    const prize = note.prize;
    const date = new Date(day);
    if (!isValidDay(day, date)) {
      throw new Error("Invalid day");
    }
    // validate note.prize
    if (!isValidPrize(prize)) {
      throw new Error("Invalid prize");
    }
    let prizesInsert = [];
    for (let i = 0; i < 8; ++i) {
      prizesInsert.push(prize[i].join(","));
    }
    if (await SQL.isExisted(date)) {
      throw new Error("Existed in DB");
    }
    await SQL.insert(date, prizesInsert);
    res.json(note);
  } catch (err) {
    res.send({ message: err.message ?? "ERROR" });
  }
});

app.post("/post-results", async (req, res) => {
  try {
    // validate
    if (!Array.isArray(req.body)) {
      throw new Error("Invalid array");
    }
    await SQL.begin();
    for (let i = 0; i < req.body.length; ++i) {
      const note = req.body[i];
      const day = note.day; // YYYY-MM-DD
      const prize = note.prize;
      const date = new Date(day);
      if (!isValidDay(day, date)) {
        throw new Error("Invalid day at element " + i);
      }
      // validate note.prize
      if (!isValidPrize(prize)) {
        throw new Error("Invalid prize at element " + i);
      }
      if (await SQL.isExisted(date)) {
        throw new Error("Existed in DB at element " + i);
      }
      let prizesInsert = [];
      for (let j = 0; j < 8; ++j) {
        prizesInsert.push(prize[j].join(","));
      }
      try {
        await SQL.insert(date, prizesInsert);
      } catch (err) {
        throw Error(err.message + " at element " + i);
      }
    }
    res.json(req.body);
    await SQL.commit();
  } catch (err) {
    await SQL.rollback();
    res.send({ message: err.message ?? "ERROR" });
  }
});

app.delete("/delete-result", async (req, res) => {
  try {
    const day = req.body.day;
    const date = new Date(day);
    if (!isValidDay(day, date)) {
      throw new Error("Invalid day");
    }
    if (await SQL.isExisted(date)) {
      SQL.deleteResult(date);
    } else {
      throw new Error("Not existed in DB");
    }
    res.send("delete success day " + day);
  } catch (err) {
    res.send({ message: err.message ?? "ERROR" });
  }
});

// app.post("/set-result", (req, res) => {});

function isValidDay(day, date) {
  // day="YYYY-MM-DD"
  const arr = day.split("-");
  if (isNaN(date.getTime()) || parseInt(arr[2]) !== date.getDate()) {
    return false;
  }
  return true;
}

function isValidPrize(prize) {
  const amountPrize = [1, 1, 2, 6, 4, 6, 3, 4];
  const lengthPrize = [5, 5, 5, 5, 4, 4, 3, 2];
  for (let i = 0; i < 8; ++i) {
    let prizes = prize[i];
    if (amountPrize[i] !== prizes.length) {
      return false;
    }
    for (let j = 0; j < amountPrize[i]; ++j) {
      const prize = prizes[j];
      if (prize.length !== lengthPrize[i]) {
        return false;
      }
      if (isNaN(prize)) {
        return false;
      }
    }
  }
  return true;
}

app.listen(port, async () => {
  await SQL.connect();
  // SQL.view();
  console.log(`Example app listening on port ${port}`);
});
