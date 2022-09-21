var pg = require("pg");
pg.types.setTypeParser(1082, (value) => value);
// https://github.com/brianc/node-postgres/issues/818
const client = new pg.Client({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  port: process.env.DB_PORT,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});
exports.connect = async function () {
  console.log(process.env.DB_HOST);
  await client.connect();
};
exports.reset = async function () {
  await client.query(`drop table if exists lottery_results;`);
  // client.query(`SET LOCAL TIME ZONE 'Asia/Ho_Chi_Minh';`);
  // client.query(`SET LOCAL TIME ZONE 'UTC';`);
  await client.query(`create table lottery_results(
      day date primary key,
      special_prize varchar(5) not null,
      first_prize varchar(5) not null,
      second_prize varchar(11) not null,
      third_prize varchar(35) not null,
      fourth_prize varchar(19) not null,
      fifth_prize varchar(29) not null,
      sixth_prize varchar(11) not null,
      seventh_prize varchar(11) not null
  );`);
};

exports.view = function view() {
  client.query(`select * from lottery_results;`, (err, res) => {
    if (!err) {
      console.log(res.rows);
    } else {
      console.log(err.message);
    }
  });
};

exports.isExisted = (date) => isExisted(date);

async function isExisted(date) {
  const x = await client.query(`select * from lottery_results where day = $1`, [
    date,
  ]);
  if (x.rows.length !== 0) {
    return true;
  }
  return false;
}

exports.insert = async function (date, prize) {
  insert(date, ...prize);
};

function insert(
  date,
  specialPrize,
  firstPrize,
  secondPrize,
  thirdPrize,
  forthPrice,
  fifthPrize,
  sixthPrize,
  sevenPrize
) {
  client.query(
    `INSERT INTO lottery_results (
      day,
      special_prize,
      first_prize,
      second_prize,
      third_prize,
      fourth_prize,
      fifth_prize,
      sixth_prize,
      seventh_prize
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);`,
    [
      date,
      specialPrize,
      firstPrize,
      secondPrize,
      thirdPrize,
      forthPrice,
      fifthPrize,
      sixthPrize,
      sevenPrize,
    ],
    (err, res) => {
      if (err) {
        console.log(err.message);
      }
    }
  );
}

exports.getResult = async function (date) {
  const x = await client.query(`select * from lottery_results where day = $1`, [
    date,
  ]);
  if (x.rows.length === 0) {
    throw new Error("Not in DB");
  }
  if (x.rows.length !== 1) {
    throw new Error("Multi in DB");
  }
  let y = x.rows[0];
  let prize = [];
  let res = {};
  for (let property in y) {
    if (property !== "day") {
      prize.push(y[property].split(","));
    } else {
      res["day"] = y[property];
    }
  }
  res["prize"] = prize;
  return res;
};

exports.getResults = async function (dateStart, dateFinish) {
  const x = await client.query(
    `select * from lottery_results where day between $1 and $2`,
    [dateStart, dateFinish]
  );
  let res = [];
  for (let i = 0; i < x.rows.length; ++i) {
    let y = x.rows[i];
    let resOneDay = {};
    let prize = [];
    for (let property in y) {
      if (property !== "day") {
        prize.push(y[property].split(","));
      } else {
        resOneDay["day"] = y[property];
      }
    }
    resOneDay["prize"] = prize;
    res[i] = resOneDay;
  }
  return res;
};

exports.deleteResult = function (date) {
  client.query(`delete from lottery_results where day = $1`, [date]);
};

exports.begin = async function () {
  await client.query("BEGIN");
};
exports.commit = async function () {
  await client.query("COMMIT");
};
exports.rollback = async function () {
  await client.query("ROLLBACK");
};
