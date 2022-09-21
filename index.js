const fs = require("fs");
const SQL = require("./sql");

let pointer;

let tenYearAgo;

async function postData(date) {
  const response = await fetch("https://ketqua2.net/so-ket-qua", {
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body: `code=mb&date=${date.getDate()}-${
      date.getMonth() + 1
    }-${date.getFullYear()}&count=1&dow=7`,
    method: "POST",
  }).then((response) => response.text());

  const regex = /(?<x>([0-9]{2,5}))">\k<x>/gm;
  const texts = response.match(regex); // [string]
  let prize = [];
  const amountPrize = [1, 1, 2, 6, 4, 6, 3, 4];
  let start = 0;
  for (let i = 0; i < 8; ++i) {
    // each price
    prize[i] = "";
    for (let j = start; j < start + amountPrize[i]; ++j) {
      if (j != start) prize[i] = prize[i] + ",";
      const text = texts[j];
      prize[i] =
        prize[i] + text.substring(0, text.length - text.length / 2 - 1);
    }
    start = start + amountPrize[i];
  }
  await SQL.insert(date, prize);
}

exports.reset = async function () {
  pointer = new Date();
  if (pointer.getTime() % 86400000 < 41400000) {
    pointer.setTime(pointer.getTime() - 24 * 60 * 60 * 1000);
  }

  tenYearAgo = new Date(pointer);
  // tenYearAgo.setMonth(pointer.getMonth() - 1);
  tenYearAgo.setDate(pointer.getDate() - 4);

  await SQL.reset();
  while (pointer.getTime() > tenYearAgo.getTime()) {
    await postData(pointer);
    pointer.setTime(pointer.getTime() - 24 * 60 * 60 * 1000);
  }
  // SQL.view();
  console.log("reset successful");
};

// async function main() {
//   await SQL.init();
//   while (pointer.getTime() > tenYearAgo.getTime()) {
//     await postData(pointer);
//     pointer.setTime(pointer.getTime() - 24 * 60 * 60 * 1000);
//   }
//   console.log("init successful");
//   console.log(x);
//   // SQL.view();
// }
// main();
