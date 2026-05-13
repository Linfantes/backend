const express = require('express');
const router = express.Router();
const pool = require('../db');

router.post('/', async (req, res) => {
  try {
    const {
      dni,
      nombre,
      apellido,
      fecha_nacimiento,
      sexo,
      telefono,
      direccion
    } = req.body;

    if (!dni || !nombre || !apellido || !fecha_nacimiento || !sexo) {
      return res.status(400).json({
        error: 'dni, nombre, apellido, fecha_nacimiento y sexo son requeridos'
      });
    }

    const sql = `
      INSERT INTO paciente
      (dni, nombre, apellido, fecha_nacimiento, sexo, telefono, direccion)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.query(sql, [
      dni,
      nombre,
      apellido,
      fecha_nacimiento,
      sexo,
      telefono || null,
      direccion || null
    ]);

    res.status(201).json({
      status: 'success',
      id: result.insertId
    });
  } catch (err) {
    console.error(err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'El DNI ya está registrado' });
    }
    res.status(500).json({ error: 'Error al crear paciente' });
  }
});

module.exports = router;