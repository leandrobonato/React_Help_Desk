require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 3333;

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Central de Ajuda — API rodando em http://localhost:${PORT}`);
});
