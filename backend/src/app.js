import express from 'express';
import { pool } from './config/db.js';

const app = express();

app.use(express.json());

app.get('/health', async(req, res) => {
    try {
    const [result] = await pool.query('SELECT 1');
    res.json({ status: 'OK', database: 'Conectada' });
  } catch (error) {
    res.status(500).json({ status: 'ERROR', database: 'No conecta' });
  }
});

export default app;
