const app = require("express")();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const bent = require("bent");
const Cep = require("./Cep");

app.use(bodyParser.json());

mongoose.connect("mongodb://localhost:27017/cep_cache?authSource=admin", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.get("/cep/:cep", async (req, res) => {
  const cached = await Cep.findOne({ zipcode: req.params.cep });

  if (cached) {
    return res.status(200).json({ info: cached });
  }

  const ajaxReturn = await bent("GET", "http://cep.la/cep/", "json", {
    Accept: "application/json",
  })(`${req.params.cep}`);

  const { cep, uf, cidade, bairro, logradouro } = ajaxReturn[0];

  const cepValues = {
    zipcode: cep,
    state: uf,
    city: cidade,
    neighborhood: bairro,
    comp: logradouro,
  };

  const cepRegistry = new Cep(cepValues);
  const result = await cepRegistry.save();

  return res.status(201).json(result.toObject());
});

module.exports = app;
