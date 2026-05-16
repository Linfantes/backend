const pool = require('./db');
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// Ruta principal
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Servidor VitaScan activo'
  });
});

// Ruta triaje GET
app.get('/api/triaje', (req, res) => {
  res.json({
    ok: true,
    mensaje: 'GET triaje funcionando'
  });
});

// Ruta triaje POST
app.post('/api/triaje', async (req, res) => {

  try {

   const {
  temperatura,
  spo2,
  pulso,
} = req.body;

    console.log('📥 Datos recibidos:', req.body);

    const sql = `
      INSERT INTO signos_vitales
      (
  temperatura,
  saturacion_oxigeno,
  pulso,
  registrado_por
)
     VALUES (?, ?, ?, ?)
    `;

   await pool.query(sql, [
  temperatura,
  spo2,
  pulso,
  'sensor'
]);

    res.json({
      success: true,
      message: 'Datos guardados en MySQL'
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      success: false,
      error: 'Error al guardar'
    });

  }

});

// NUEVA RUTA GET
app.get('/api/signos', async (req, res) => {

  try {

    const [rows] = await pool.query(`
      SELECT *
      FROM signos_vitales
      ORDER BY created_at DESC
      LIMIT 10
    `);

    res.json(rows);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: 'Error al obtener signos vitales'
    });

  }

});
app.post('/api/register', async (req, res) => {

  try {

    const {
      nombre,
      apellido,
      dni,
      password,
      rol,
      especialidad
    } = req.body;

    let tabla = '';

    if (rol === 'Doctor') {
      tabla = 'medico';
    }
   else if (
  rol === 'Admision' ||
  rol === 'Admisión'
) {
  tabla = 'personal_admision';
}
    else if (rol === 'Admin') {
      tabla = 'administrador';
    }
    else {
      return res.status(400).json({
        error: 'Rol inválido'
      });
    }

    const usuario = dni;

    let sql = '';

    if (rol === 'Doctor') {

      sql = `
        INSERT INTO medico
        (
          dni,
          nombre,
          apellido,
          especialidad,
          usuario,
          clave_hash
        )
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      await pool.query(sql, [
        dni,
        nombre,
        apellido,
        especialidad,
        usuario,
        password
      ]);

    } else {

      sql = `
        INSERT INTO ${tabla}
        (
          dni,
          nombre,
          apellido,
          usuario,
          clave_hash
        )
        VALUES (?, ?, ?, ?, ?)
      `;

      await pool.query(sql, [
        dni,
        nombre,
        apellido,
        usuario,
        password
      ]);

    }

    res.json({
      success: true,
      message: 'Usuario registrado'
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      success: false,
      error: 'Error al registrar usuario'
    });

  }

});
app.post('/api/login', async (req, res) => {
  try {
    const { dni, password } = req.body;

    // ====================================================================
    // PASO 1: VERIFICAR SOLO DNI (Cuando el frontend ejecuta verificarDni)
    // ====================================================================
    if (!password) {
      
      // 1. Verificar si es Paciente (Ajusta el nombre de tu tabla de pacientes si es diferente)
      const [pacientes] = await pool.query(`SELECT * FROM paciente WHERE dni = ?`, [dni]);
      if (pacientes.length > 0) {
        return res.json({ success: true, rol: 'Paciente', usuario: pacientes[0] });
      }

      // 2. Verificar si es Médico
      const [medicos] = await pool.query(`SELECT * FROM medico WHERE dni = ?`, [dni]);
      if (medicos.length > 0) {
        return res.json({ success: true, rol: 'Doctor' }); // Devolvemos success para que el frontend pida contraseña
      }

      // 3. Verificar si es Admisión
      const [admision] = await pool.query(`SELECT * FROM personal_admision WHERE dni = ?`, [dni]);
      if (admision.length > 0) {
        return res.json({ success: true, rol: 'Admision' });
      }

      // 4. Verificar si es Admin
      const [admin] = await pool.query(`SELECT * FROM administrador WHERE dni = ?`, [dni]);
      if (admin.length > 0) {
        return res.json({ success: true, rol: 'Admin' });
      }

      // Si no está en NINGUNA tabla:
      return res.status(404).json({ success: false, error: 'DNI no registrado' });
    }

    // ====================================================================
    // PASO 2: VERIFICAR DNI + CONTRASEÑA (Cuando el frontend ejecuta manejarLogin)
    // ====================================================================
    
    // MÉDICO
    const [medicos] = await pool.query(
      `SELECT * FROM medico WHERE dni = ? AND clave_hash = ?`, 
      [dni, password]
    );
    if (medicos.length > 0) return res.json({ success: true, rol: 'Doctor', usuario: medicos[0] });

    // ADMISIÓN
    const [admision] = await pool.query(
      `SELECT * FROM personal_admision WHERE dni = ? AND clave_hash = ?`, 
      [dni, password]
    );
    if (admision.length > 0) return res.json({ success: true, rol: 'Admision', usuario: admision[0] });

    // ADMIN
    const [admin] = await pool.query(
      `SELECT * FROM administrador WHERE dni = ? AND clave_hash = ?`, 
      [dni, password]
    );
    if (admin.length > 0) return res.json({ success: true, rol: 'Admin', usuario: admin[0] });

    // Si llega aquí, el DNI existe pero la contraseña está mal
    res.status(401).json({ success: false, error: 'Credenciales incorrectas' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Error del servidor' });
  }
});

app.get('/api/login', async (req, res) => {
  try {
    const { dni, password } = req.query;

    if (!dni || !password) {
      return res.status(400).json({
        success: false,
        error: 'Faltan parámetros: dni y password son requeridos'
      });
    }

    // Buscar usuario en tabla medico
    const [medicos] = await pool.query(
      `SELECT * FROM administrador WHERE dni = ? AND clave_hash = ?`,
      [dni, password]
    );

    if (medicos.length > 0) {
      return res.json({
        success: true,
        rol: 'Doctor',
        usuario: medicos[0]
      });
    }

    // Buscar en personal_admision
    const [admision] = await pool.query(
      `SELECT * FROM personal_admision WHERE dni = ? AND clave_hash = ?`,
      [dni, password]
    );

    if (admision.length > 0) {
      return res.json({
        success: true,
        rol: 'Admision',
        usuario: admision[0]
      });
    }

    // Buscar en administrador
    const [admin] = await pool.query(
      `SELECT * FROM administrador WHERE dni = ? AND clave_hash = ?`,
      [dni, password]
    );

    if (admin.length > 0) {
      return res.json({
        success: true,
        rol: 'Admin',
        usuario: admin[0]
      });
    }

    // Si no coincide en ninguna tabla
    return res.status(401).json({
      success: false,
      error: 'Credenciales incorrectas'
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Error en el servidor'
    });
  }
});

app.post('/api/paciente', async (req, res) => {

  try {

    const {
      dni,
      nombre,
      apellido,
      fechaNacimiento
    } = req.body;

    const sql = `
      INSERT INTO paciente
      (
        dni,
        nombre,
        apellido,
        fecha_nacimiento,
        sexo
      )
      VALUES (?, ?, ?, ?, ?)
    `;

    await pool.query(sql, [
      dni,
      nombre,
      apellido,
      fechaNacimiento,
      'M'
    ]);

    res.json({
      success: true,
      message: 'Paciente registrado'
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      success: false,
      error: 'Error registrando paciente'
    });

  }

});

app.get('/api/doctores', async (req, res) => {

  try {

    const [rows] = await pool.query(`
      SELECT
        id_medico,
        nombre,
        apellido,
        especialidad
      FROM medico
      WHERE activo = 1
    `);

    res.json(rows);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      success: false,
      error: 'Error obteniendo doctores'
    });

  }

});
app.get('/api/paciente/:dni', async (req, res) => {

  try {

    const dni = req.params.dni;

    const [rows] = await pool.query(
      `
      SELECT *
      FROM paciente
      WHERE dni = ?
      `,
      [dni]
    );

    if (rows.length === 0) {

      return res.json({
        success: false
      });

    }

    res.json({
      success: true,
      paciente: rows[0]
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      success: false,
      error: 'Error servidor'
    });

  }

});
app.listen(4000, () => {
  console.log('🚀 Servidor corriendo en puerto 4000');
});
