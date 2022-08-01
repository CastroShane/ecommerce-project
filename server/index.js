"use strict";

const express = require("express");
const morgan = require("morgan");

const { addNewOrder, getCategories, getCategoryItems, getItems, getItem } = require("./handlers");

const PORT = 4000;

express()
  .use(function (req, res, next) {
    res.header(
      "Access-Control-Allow-Methods",
      "OPTIONS, HEAD, GET, PUT, POST, DELETE"
    );
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept"
    );
    next();
  })
  .use(morgan("tiny"))
  .use(express.static("./server/assets"))
  .use(express.json())
  .use(
    express.urlencoded({
      extended: false,
    })
  )
  .use("/", express.static(__dirname + "/"))

  // REST endpoints?
  .get("/bacon", (req, res) => res.status(200).json("🥓"))
  .get("/category", getCategories)
  .get("/category/:id", getCategoryItems)
  .get("/api/get-items", getItems)
  .get("/api/get-item/:id", getItem)
  .post("/checkout", addNewOrder)

  .listen(PORT, () => console.info(`Listening on port ${PORT}`));
