const { contactValidator } = require("../utils");

const Contact = require("../models/contactModel");

const multer = require("multer");
const Jimp = require("jimp");

const { unlink } = require("node:fs");

exports.checkContactId = async (req, res, next) => {
  try {
    const { contactId } = req.params;

    const contact = await Contact.findOne({ _id: contactId });

    if (!contact) {
      return res.status(404).json({ message: "Not found" });
    }

    next();
  } catch (error) {
    if (error.reason) {
      return res.status(404).json({ message: "Not found" });
    }
    console.log(error);
    res.sendStatus(500);
  }
};

exports.checkAbsenceBody = async (req, res, next) => {
  try {
    if (Object.keys(req.body).length === 0) {
      next();
      return;
    }

    if (req.body) {
      return res
        .status(400)
        .json({ message: "This request not allowed to includes body" });
    }
    next();
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
};

exports.checkAbsenceBodyInPatch = async (req, res, next) => {
  try {
    if (Object.keys(req.body).length === 0) {
      return res.status(400).json({ message: "missing fields" });
    }

    next();
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
};

exports.throwError = (req, res, next) => {
  const { error } = contactValidator.createContactValidator.validate(req.body);

  if (error) {
    console.log(error);
    const empty = error.details.find(
      (el) => el.type === "string.empty" || el.type === "any.required"
    );
    if (empty) {
      return res.status(400).json({
        message: `missing required ${empty.context.label} field`,
      });
    }
    if (error.details[0].type === "string.email") {
      return res.status(400).json({
        message: "email must be a valid",
      });
    } else {
      const message = error.details.map((el) => el.message).join(". ");
      return res.status(400).json({
        message,
      });
    }
  }
  next();
};

exports.checkFile = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      message: "Please, upload file!",
    });
  }
  if (!req.file.mimetype.startsWith("image/")) {
    return res.status(400).json({
      message:
        "Incorrect type of image. Please, upload image-type file, e.g. '.jpeg', '.png'",
    });
  }
  next();
};

const multerStorage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, "tmp");
  },
  filename: (req, file, callback) => {
    const extension = file.mimetype.split("/")[1];

    callback(null, `${req.user.id}-${Date.now()}.${extension}`);
  },
});

exports.uploadContactAvatar = multer({
  storage: multerStorage,
  limits: { fileSize: 2 * 1024 * 1024 },
}).single("avatarURL");

exports.resizeContactAvatar = async (req, res, next) => {
  const avatar = await Jimp.read(req.file.path);
  avatar.resize(250, 250).write(req.file.path.replace("tmp", "public/avatars"));

  unlink(req.file.path, (err) => {
    if (err) throw err;
  });
  next();
};
