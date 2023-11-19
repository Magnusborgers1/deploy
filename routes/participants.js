const express = require("express");
const router = express.Router();
const authenticateAdmin = require("../authenticate");
const CyclicDB = require("@cyclic.sh/dynamodb");
const db = CyclicDB(process.env.CYCLIC_DB);
let participants = db.collection("participants");

router.get("/", async (req, res) => {
  let list = await participants.filter();
  list = list.results.filter(function (p) {
    if (p.constructor.name === "CyclicItem" && p.props.active === true) {
      return true;
    }
    return false;
  });

  res.send(list);
});

router.get("/details/deleted", async (req, res) => {
  let response = await participants.filter(); 
  let list = response.results.filter(function (element) {
    return element.props.active === false;
  });
  return res.send(list);
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

  let dateValidated = dob.match(/^\d{4}\/\d{2}\/\d{2}$/);

  if ( !email || !firstname || !lastname || !dob  || !dateValidated || active === undefined ||
    !work || !work.salary|| !work.currency || !work.companyname|| 
    !home || !home.country || !home.city) {
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

  return res.status(200).json({ok: "user updated"});
});

router.post("/add", async (req, res) => {
  const participantData = req.body;
  const { email, firstname, lastname, dob, active, work, home } =
    participantData;
  let dateValidated = dob.match(/^\d{4}\/\d{2}\/\d{2}$/);

  if ( !email || !firstname || !lastname || !dob || !dateValidated || active === undefined ||
      !work || !work.salary|| !work.currency || !work.companyname|| 
      !home || !home.country || !home.city) {
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
    if (keyExist.length > 0) {
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

  let test = participants.list();

  return res.status(200).json({ok: "user added"});
});

router.delete("/:email", async (req, res) => {
  const emailToDelete = req.params.email; 

  if (!validateEmail(emailToDelete)) {
    return res.status(400).json({ error: "Invalid email format." });
  }

  let response = await participants.filter();
  let userExist = response.results.filter(function (p, e = emailToDelete) {
    if (p.constructor.name === "CyclicItem" && p.key === emailToDelete) {
      return true;
    }
    return false;
  });
  
  if (userExist.length === 0) {
    return res.status(404).json({error: 'User is not found.'})
  }

  if (!userExist[0].props.active) {
    return res.status(400).json({error: 'User is already \'deleted\''});
  }

  await participants.set(emailToDelete, {
    active: false
  });
  return res.status(200).json({ok: "user 'deleted'"});
});

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

module.exports = router;
