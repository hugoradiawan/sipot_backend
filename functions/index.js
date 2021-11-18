const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

async function createWithPhoneNumber(data) {
  const userRecord = await admin.auth().createUser({
    phoneNumber: data.phoneNumber,
    displayName: data.displayName,
    disabled: false,
  });
  return userRecord;
}

async function createUsersWithPhoneNumberAndEmail(dataList) {
  const userRecordList = [];
  for (let i = 0; i < dataList.length; i++) {
    try {
      const userRecord = await admin.auth().createUser({
        email: dataList[i].email,
        emailVerified: true,
        phoneNumber: dataList[i].phoneNumber,
        password: dataList[i].password,
        displayName: dataList[i].displayName,
        photoURL: dataList[i].photoURL,
        disabled: false,
      });
      userRecordList.push(userRecord);
    } catch (error) {
      throw new functions.https.HttpsError(
        "already-exists",
        error,
        dataList[i].email + " " + dataList[i].phoneNumber
      );
    }
  }
  await updateManagerDataBatch(userRecordList);
  return "succeed";
}

async function updateAccessBatch(userList, ProjekId) {
  const db = admin.firestore();
  const colRef = db.collection("userData");
  await db.runTransaction(async (t) => {
    for (let i = 0; i < userList.length; i++) {
      const docRef = colRef.doc(userList[i][0]);
      t.set(docRef, {
        uid: userList[i][0],
        projectId: ProjekId,
        phoneNumber: userList[i][1],
        docId: "",
        displayName: "",
        avatar: "",
      });
    }
  });
}

async function updateManagerDataBatch(userRecordList) {
  const db = admin.firestore();
  const colRef = db.collection("managerData");
  await db.runTransaction(async (t) => {
    for (let i = 0; i < userRecordList.length; i++) {
      const docRef = colRef.doc(userRecordList[i].uid);
      t.set(docRef, {
        uid: userRecordList[i].uid,
        role: "manager",
        phoneNumber: userRecordList[i].phoneNumber,
        email: userRecordList[i].email,
        displayName: userRecordList[i].displayName,
        avatar: userRecordList[i].photoURL,
        ProjekCodeList: [],
      });
    }
  });
}

exports.createUserWithPhoneNumberAndEmail = functions
  .region("asia-southeast2")
  .https.onCall(createUsersWithPhoneNumberAndEmail);

exports.assignTaskCompleter = functions
  .region("asia-southeast2")
  .https.onCall(async (data) => {
    const userList = [];
    for (let i = 0; i < data.nameAndPhoneNumberList.length; i++) {
      var userRecord;
      try {
        userRecord = await admin
          .auth()
          .getUserByPhoneNumber(dataList.nameAndPhoneNumberList[i].phoneNumber);
      } catch (error) {
        userRecord = await createWithPhoneNumber(dataList.nameAndPhoneNumberList[i]);
      }
      userList.push([userRecord.uid, phoneNumberList[i]]);
    }
    await updateAccessBatch(userList, data.ProjekId);
  });
