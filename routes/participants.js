const express = require("express");
const router = express.Router();
// const { dynamoDB, tableName } = require('../db');
const authenticateAdmin = require("../authenticate");
const CyclicDB = require("@cyclic.sh/dynamodb");
const db = CyclicDB(process.env.CYCLIC_DB);
let participants = db.collection("participants");

// Endpoint to get all participants
router.get("/", async (req, res) => {
  let list = await participants.filter();
  res.send(list);
});

// Get deleted participants, only firstname & last name
router.get("/details/deleted", async (req, res) => {
  let response = await participants.filter(); //TODO how to filter
  let list = response.results.filter(function (element) {
    return element.props.active === false;
  });
  return res.send(list);
  return res.status(500).json({ error: "." });
});

router.get("/details/:email", async (req, res) => {
  let emailToFetch = req.params.email;
  if (!validateEmail(emailToFetch)) {
    return res.status(400).json({ error: "Invalid email format." });
  }

  let response = await participants.filter();
  let participant = response.results.filter(function (p, e = emailToFetch) {
    return p.props.active === true && emailToFetch === p.key;
  });
  if (participant.length === 0) {
    return res.status(400).json({ error: "participant not found or inactive" });
  }
  return res.send(participant[0]);
});

router.get("/work/:email", async (req, res) => {
  let emailToFetch = req.params.email;
  if (!validateEmail(emailToFetch)) {
    return res.status(400).json({ error: "invalid email format" });
  }

  let response = await participants.filter();
  let isUserInactive = response.results.filter(function (p, e = emailToFetch) {
    if (p.constructor.name === "CyclicItem" && p.key === emailToFetch && p.props.active === false) {
      return true;
    }
    return false;
  });

  if (isUserInactive.length > 0) {
    return res.status(404).json('No active user found');
  }

  let workFragment = response.results.filter(function (p, e = emailToFetch) {
    if (p.constructor.name !== "CyclicItemFragment") {
      return false;
    }
    return emailToFetch === p.parent.key && p.type === "work";
  });

  if (workFragment.length === 0) {
    return res.status(400).json({ error: "Participants has no workFragment" });
  }
  return res.send(workFragment[0]);
  return;

  try {
    let participant = await participants.get(emailToFetch);
    if (!participant) {
      return res.status(404).json({ error: "Participant not found" });
    }

    if (!participant.work || participant.work.deleted) {
      return res.status(404).json({ error: "Work details not found." });
    }
    filteredWorkDetails = participant.work.filter((workItem) => {
      // legge til conditions her?
      return !workItem.deleted;
    });

    res.json({ workDetails: filteredWorkDetails });
  } catch (error) {
    console.error("Error fetching work details from the database:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch work details from the database." });
  }
});

router.get("/home/:email", async (req, res) => {
  let emailToFetch = req.params.email;
  if (!validateEmail(emailToFetch)) {
    return res.status(400).json({ error: "invalid email format" });
  }

  let response = await participants.filter();
  let isUserInactive = response.results.filter(function (p, e = emailToFetch) {
    if (p.constructor.name === "CyclicItem" && p.key === emailToFetch && p.props.active === false) {
      return true;
    }
    return false;
  });

  if (isUserInactive.length > 0) {
    return res.status(404).json('No active user found');
  }

  let homeFragment = response.results.filter(function (p, e = emailToFetch) {
    if (p.constructor.name !== "CyclicItemFragment") {
      return false;
    }
    return emailToFetch === p.parent.key && p.type === "home";
  });

  if (homeFragment.length === 0) {
    return res.status(400).json({ error: "Participants has no homeFragment" });
  }
  return res.send(homeFragment[0]);

});

router.put("/:email", async (req, res) => {
  let emailToFetch = req.params.email;
  const updatedParticipantData = req.body;

  // Validate email format (kanskje forbedre?)
  if (!validateEmail(emailToFetch)) {
    return res.status(400).json({ error: "Invalid email format." });
  }

  let response = await participants.filter();
  let userExist = response.results.filter(function (p, e = emailToFetch) {
    if (p.constructor.name === "CyclicItem" && p.key === emailToFetch) {
      return true;
    }
    return false;
  });

  if (userExist.length === 0) {
    return res.status(404).json({error: 'User is not found.'})
  }

  const participantData = req.body;
  const { email, firstname, lastname, dob, active, work, home } =
    participantData;

  if ( !email || !firstname || !lastname || !dob || active === undefined || !work || !home ) {
    return res
      .status(400)
      .json({ error: "Incomplete participant data. All fields are required." });
  }

  await participants.set(email, {
    firstName: firstname,
    secondName: lastname,
    dob: dob,
    active: active,
  });

  await participants.item(email).fragment("home").set({
    country: home.country,
    city: home.city,
  });

  await participants.item(email).fragment("work").set({
    companyname: work.companyname,
    salary: work.salary,
    currency: work.currency,
  });

  return res.end();

  // const {email, firstName, lastName, age} = req.body;
  // await participants.set(email, {
  //   firstName: firstName,
  //   secondName: lastName,
  //   age: age
  // })
  // res.end();

  return;
  const params = {
    TableName: tableName,
    Key: {
      email: emailToUpdate,
    },
    UpdateExpression:
      "SET firstname = :firstname, lastname = :lastname, dob = :dob, active = :active, work = :work, home = :home",
    ExpressionAttributeValues: {
      ":firstname": updatedParticipantData.firstname,
      ":lastname": updatedParticipantData.lastname,
      ":dob": updatedParticipantData.dob,
      ":active": updatedParticipantData.active,
      ":work": updatedParticipantData.work,
      ":home": updatedParticipantData.home,
    },
    ReturnValues: "ALL_NEW",
  };

  dynamoDB.update(params, (error, data) => {
    if (error) {
      console.error("Error updating participant in the database:", error);
      return res
        .status(500)
        .json({ error: "Failed to update participant in the database." });
    }

    res.json({
      message: "Participant updated successfully",
      updatedParticipant: data.Attributes,
    });
  });
});

// Endpoint to add participant
router.post("/add", async (req, res) => {
  const participantData = req.body;
  const { email, firstname, lastname, dob, active, work, home } =
    participantData;

  if ( !email || !firstname || !lastname || !dob || active === undefined || !work || !home ) {
    return res
      .status(400)
      .json({ error: "Incomplete participant data. All fields are required." });
  }

  let testprop = await participants.filter();
  let tester = testprop.results.filter(function (element, e = email) {
    return element.key === email;
  });

  var keyExist = await testprop.results.filter(function (element, e = email) {
    return element.key === email;
  });
  if (keyExist.key) {
    return res.status(400).json({ error: "user exists." });
  }

  await participants.set(email, {
    firstName: firstname,
    secondName: lastname,
    dob: dob,
    active: active,
  });

  await participants.item(email).fragment("home").set({
    country: home.country,
    city: home.city,
  });

  await participants.item(email).fragment("work").set({
    companyname: work.companyname,
    salary: work.salary,
    currency: work.currency,
  });

  return res.end();
});

// Endpoint to delete participant by email
router.delete("/:email", async (req, res) => {
  const emailToDelete = req.params.email;

  // Validate email
  if (!validateEmail(emailToDelete)) {
    return res.status(400).json({ error: "Invalid email format." });
  }
  await participants.delete(emailToDelete);
  res.end();
});

// Function to validate email format (kanskje forbedre?)
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

module.exports = router;
