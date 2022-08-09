// use this package to generate unique ids: https://www.npmjs.com/package/uuid
const { v4: uuidv4 } = require("uuid");
const { startClient } = require("./utils.js");

//get all wearable items
const getItems = async (req, res) => {
  try {
    const client = await startClient();
    const db = client.db("GroupECommerce");
    const allItems = await db.collection("items").find().toArray();
    await client.close();

    res.status(200).json({
      status: 200,
      data: allItems,
    });
  } catch (err) {
    console.log(err);
    res.status(404).json({
      status: 404,
      message: "File not found.",
    });
  }
};

//get a particular wearable item
const getItem = async (req, res) => {
  const reqId = parseInt(req.params.id);
  try {
    const client = await startClient();
    const db = client.db("GroupECommerce");
    const allItems = await db.collection("items").find().toArray();
    await client.close();
    const itemIds = allItems.map((item) => {
      return item._id;
    });
    const doesIdExist = itemIds.find((id) => id === reqId);
    const foundItem = allItems.find((item) => item["_id"] === reqId);

    if (doesIdExist === undefined) {
      res.status(400).json({
        status: 400,
        message: "Invalid Id",
      });
    } else {
      res.status(200).json({
        status: 200,
        data: foundItem,
      });
    }
  } catch (err) {
    console.log(err);
    res.status(404).json({
      status: 404,
      message: "File not found.",
    });
  }
};

//get all brand names
const getBrands = async (req, res) => {
  try {
    const client = await startClient();
    const db = client.db("GroupECommerce");
    const brands = await db.collection("companies").distinct("name");
    client.close();
    res.status(200).json({
      status: 200,
      data: brands,
      message: "Companies fetched!",
    });
  } catch (err) {
    console.log(err);
  }
};

//get wearables from a single brand
const getBrandItems = async (req, res) => {
  const { id } = req.params;

  try {
    const client = await startClient();
    const db = client.db("GroupECommerce");
    const brands = await db.collection("companies").distinct("name");

    if (!brands.includes(id)) {
      return res.status(404).json({ status: 404, message: "Brand not found!" });
    }

    const brandDocument = await db
      .collection("companies")
      .findOne({ name: id });

    const brandId = brandDocument._id;
    const brandItems = await db
      .collection("items")
      .find({ companyId: brandId })
      .toArray();

    client.close();
    res.status(200).json({
      status: 200,
      data: brandItems,
      message: "Brand items fetched!",
    });
  } catch (err) {
    console.log(err);
  }
};

//get all category names
const getCategories = async (req, res) => {
  try {
    const client = await startClient();
    const db = client.db("GroupECommerce");
    const categories = await db.collection("items").distinct("category");

    client.close();
    res.status(200).json({
      status: 200,
      data: categories,
      message: "Categories fetched!",
    });
  } catch (err) {
    console.log(err);
  }
};

//get wearables from a single category
const getCategoryItems = async (req, res) => {
  const { id } = req.params;

  try {
    const client = await startClient();
    const db = client.db("GroupECommerce");
    const categories = await db.collection("items").distinct("category");

    if (!categories.includes(id)) {
      return res
        .status(404)
        .json({ status: 404, message: "Category not found!" });
    }

    const category = await db
      .collection("items")
      .find({ category: id })
      .toArray();

    client.close();
    res.status(200).json({
      status: 200,
      data: category,
      message: "Category fetched!",
    });
  } catch (err) {
    console.log(err);
  }
};

//creates a new order when someone checkout the cart
const addNewOrder = async (req, res) => {
  const { fullName, creditCard, expiration, orderedItems, email } = req.body;

  // ^ and $ define start and end of string, respectively
  //+ define one or multiple occurances
  //[] range of all digits between 0 and 9, inclusive

  const numbers = /^[0-9]+$/;

  if (creditCard.split("").length !== 8 || creditCard.match(numbers) === null) {
    return res
      .status(400)
      .json({ status: "error", error: "Invalid Card Number Format" });
  }

  if (expiration.split("").length !== 4 || expiration.match(numbers) === null) {
    return res
      .status(400)
      .json({ status: "error", error: "Invalid Expiration Format" });
  }

  if (!email.includes("@")) {
    return res
      .status(400)
      .json({ status: "error", error: "Invalid Email Format" });
  }

  if (orderedItems.length === 0) {
    return res.status(400).json({ status: "error", error: "Cart is empty" });
  }

  try {
    const client = await startClient();
    const db = client.db("GroupECommerce");

    const newOrderDetails = {
      _id: uuidv4(),
      fullName,
      creditCard,
      expiration,
      orderedItems,
      email,
    };

    orderedItems.forEach((item) => {
      db.collection("items").updateOne(
        { _id: item._id, name: item.name },
        { $inc: { numInStock: -1 } },
        (err, result) => {
          result
            ? console.log(
                "Found:",
                result.matchedCount,
                "Updated:",
                result.acknowledged
              )
            : console.log(err);
        }
      );
    });
    await db.collection("orders").insertOne(newOrderDetails);
    client.close();
    res.status(201).json({
      status: 201,
      data: newOrderDetails,
      message: "Order has been placed!",
    });
  } catch (err) {
    console.log(err);
  }
};

// Creates new user when someone sign up
const addNewUser = async (req, res) => {
  const { fullName, email, password } = req.body;

  try {
    const client = await startClient();
    const db = client.db("GroupECommerce");
    const users = await db.collection("users").find().toArray();
    const foundUser = users.find((user) => user.email === email);

    const newUserDetails = {
      _id: uuidv4(),
      fullName,
      email,
      password,
    };

    foundUser
      ? res
          .status(404)
          .json({ status: 404, message: "User Email Already Exists" })
      : await db.collection("users").insertOne(newUserDetails);
    client.close();
    res.status(201).json({
      status: 201,
      data: newUserDetails,
      message: "User has been registered successfully",
    });
  } catch (err) {
    console.log(err);
  }
};

// verify user when signing in
const verifyUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const client = await startClient();
    const db = client.db("GroupECommerce");
    const foundUser = await db.collection("users").findOne({ email, password });
    client.close();

    foundUser
      ? res.status(200).json({
          status: 200,
          data: foundUser,
          message: "User verified",
        })
      : res.status(200).json({
          status: 200,
          data: foundUser,
          message: "Please check your email or password!",
        });
  } catch (err) {
    console.log(err);
  }
};

module.exports = {
  addNewOrder,
  getCategories,
  getCategoryItems,
  getItems,
  getItem,
  getBrands,
  getBrandItems,
  addNewUser,
  verifyUser,
};
