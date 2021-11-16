const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

async function createWithPhoneNumber(data, phoneNumber) {
  if (!phoneNumber) {
    throw new functions.https.HttpsError(
      "phone-number-not-found",
      "parameter phoneNumber wajib terisi"
    );
  }
  const userRecord = await admin.auth().createUser({
    phoneNumber: phoneNumber,
    displayName: data.displayName,
    disabled: false,
  });
  return userRecord;
}

async function createUserWithPhoneNumberAndEmail(data, phoneNumber) {
  const newPhoneNumber = null;
  if (phoneNumber != null || phoneNumber != "") {
    newPhoneNumber = phoneNumber;
  } else {
    newPhoneNumber = data.phoneNumber;
  }
  const userRecord = await admin.auth().createUser({
    email: data.email,
    emailVerified: true,
    phoneNumber: newPhoneNumber,
    password: "bpi12345",
    displayName: data.displayName,
    photoURL: data.photoURL,
    disabled: false,
  });
  console.log("creating new user Succeded:", userRecord.uid);
  admin
    .firestore()
    .collection("managerData")
    .doc(userRecord.uid)
    .set({
      uid: userRecord.uid,
      role: "manager",
      phoneNumber: newPhoneNumber,
      email: data.email,
      displayName: data.displayName,
      avatar: data.photoURL,
      ProjekCodeList: data.ProjekCodeList,
    })
    .then((writeResult) => {
      console.log("write Result:", writeResult);
    });
  return userRecord;
}

async function updateAccess(uid, ProjekId, phoneNumber) {
  const writeResult = await admin
    .firestore()
    .collection("userData")
    .doc(uid)
    .set({
      uid: uid,
      projectId: ProjekId,
      phoneNumber: phoneNumber,
      docId: "",
      displayName: "new TaskCompleter",
      avatar: "",
    });
  return writeResult;
}

exports.createUserWithPhoneNumberAndEmail = functions
  .region("asia-southeast2")
  .https.onCall((data) => {
    createUserWithPhoneNumberAndEmail(data);
  });
// param
exports.assignTaskCompleter = functions
  .region("asia-southeast2")
  .https.onCall(async (data) => {
    const phoneNumberList = data.phoneNumberList;
    for (let i = 0; i < phoneNumberList.length; i++) {
      try {
        const userRecord = await admin
          .auth()
          .getUserByPhoneNumber(phoneNumberList[i]);
        console.log("already exist");
        const writeResult = await updateAccess(
          userRecord.uid,
          data.ProjekId,
          phoneNumberList[i]
        );
        console.log("write Result:", writeResult);
        console.log("phoneNumber:", phoneNumberList[i]);
      } catch (error) {
        const userRecord = await createWithPhoneNumber(
          data,
          phoneNumberList[i]
        );
        const writeResult = await updateAccess(
          userRecord.uid,
          data.ProjekId,
          phoneNumberList[i]
        );
        console.log("no PhoneNumber found");
        console.log("write Result:", writeResult);
        console.log("phoneNumber:", phoneNumberList[i]);
      }
    }
  });
