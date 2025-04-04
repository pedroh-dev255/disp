const dotenv = require('dotenv');
const axios = require('axios');
const csv = require('csv-parser');
const fs = require('fs');

dotenv.config();

const API_URL = process.env.API_URL;
const API_KEY = process.env.API_KEY;

async function sendWhatsAppMessage(number, message) {
  const headers = {
    'Accept': 'application/json',
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json'
  };

  const data = {
    number: number,
    body: message
  };

  try {
    const response = await axios.post(API_URL, data, { headers });
    console.log(`Mensagem enviada para ${number}:`, response.data);
    return true;
  } catch (error) {
    console.error(`Erro ao enviar para ${number}:`, error.response ? error.response.data : error.message);
    return false;
  }
}

async function processCSV(filePath) {
  const contacts = [];


  fs.createReadStream(filePath)
    .pipe(csv(['numero', 'nome'])) // Ajuste os nomes das colunas conforme seu CSV
    .on('data', (row) => contacts.push(row))
    .on('end', async () => {
      console.log(`CSV processado. ${contacts.length} contatos encontrados.`);
      // Processar cada contato
      const results = await Promise.all(contacts.map(async (contact) => {
        const mensagemPersonalizada = process.env.MENSAGEM.replace('{nome}', contact.nome);
        return sendWhatsAppMessage(contact.numero, mensagemPersonalizada);
      }));

      // Exibir resumo
      const successful = results.filter(result => result).length;
      console.log(`\nResumo:
      Total de envios: ${contacts.length}
      Sucessos: ${successful}
      Falhas: ${contacts.length - successful}`);
    });
}

// Uso: node script.js arquivo.csv
const csvFilePath = process.argv[2];
if (!csvFilePath) {
  console.error('Por favor, informe o caminho do arquivo CSV');
  process.exit(1);
}

processCSV(csvFilePath);