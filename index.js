const express = require("express"); // import thư viện express đã cài ở trên
const app = express(); // app ở đây đại diện cho cái dự án nodejs mà mình sẽ làm việc xuyên suốt
const port = 3000; // muốn run app ở port 3000

const fs = require("fs");
const readline = require("readline");
const { google } = require("googleapis");

const SCOPES = ["https://www.googleapis.com/auth/drive"];
const KEYFILEPATH = "foodimages-354509-1701f68056c0.json";

const auth = new google.auth.GoogleAuth({
  keyFile: KEYFILEPATH,
  scopes: SCOPES,
});

const createAndUpload = async (auth, filename) => {
  const driveService = google.drive({ version: "v3", auth });
  let fileMetaData = {
    name: filename + ".png",
    parents: ["15olDSCIpfc4D5o7dJDsoX7WWxFqPV1Hc"],
  };
  console.log("1");
  let media = {
    mimeType: "image/png",
    body: fs.createReadStream("./uploads/" + filename),
  };
  console.log("2");
  let response = await driveService.files.create({
    resource: fileMetaData,
    media: media,
    fields: "id",
  });
  console.log("3");
  fs.unlink("./uploads/" + filename, () => {});
  console.log("4");
  if (response.status < 299 && response.status > 199) {
    // return `https://drive.google.com/file/d/${response.data.id}/view`;
    // return `https://drive.google.com/thumbnail?id=${response.data.id}`;
    return `https://drive.google.com/uc?id=${response.data.id}`;
  }
  return "";
};

const cors = require("cors");
const bodyParser = require("body-parser");
const multer = require("multer");
const path = require("path");

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));

// handle storage using multer
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads");
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + "-" + Date.now());
  },
});

var upload = multer({ storage: storage });

const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
  // Cho app lắng nghe địa chỉ localhost (127.0.0.1) trên port 3002
  console.log(`Example app listening on port http://localhost:${PORT}`);
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname + "/assets/html/intro/index.html"));
});

// handle single file upload
app.post(
  "/food-recipe-upload-file",
  upload.single("dataFile"),
  async (req, res, next) => {
    // Khi gửi hình cũng phải gửi qua key là "dataFile"
    const file = req.file;
    if (!file) {
      return res.status(400).send({ message: "Please upload a file." });
    }
    let uploadRes = await createAndUpload(auth, file.filename);
    if (uploadRes === "") return res.status(500).json({ success: false });
    return res.json({ success: true, id: uploadRes });
  }
);

app.use((req, res) => {
  res.sendFile(path.join(__dirname + "/assets/html/error/index.html"));
});
