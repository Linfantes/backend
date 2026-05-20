const pool = require('./db');
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

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

// Endpoint actualizado para recibir datos de triage
app.post('/api/triaje', async (req, res) => {
  try {
    const {
      id_paciente,
      dni_paciente,
      temperatura,
      spo2,
      pulso,
      triage,
      descripcion,
      timestamp
    } = req.body;

    console.log('📥 Datos recibidos:', req.body);

    // Solo guardar si NO es "ESPERANDO"
    if (triage === 'ESPERANDO') {
      return res.json({
        success: true,
        message: 'Datos no guardados (estado ESPERANDO)'
      });
    }

    // SOLUCIÓN ERROR 2: Formatear la fecha para MySQL (YYYY-MM-DD HH:mm:ss)
    const dateToFormat = timestamp ? new Date(timestamp) : new Date();
    const mysqlTimestamp = dateToFormat.toISOString().slice(0, 19).replace('T', ' ');

    // SOLUCIÓN ERROR 1: Agregamos 'id_triaje' a la consulta para evitar el error de valor por defecto
    const sql = `
      INSERT INTO signos_vitales
      (
        id_paciente,
        dni_paciente,
        temperatura,
        saturacion_oxigeno,
        pulso,
        triage,
        descripcion,
        registrado_por,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await pool.query(sql, [
      id_paciente,
      dni_paciente,
      temperatura,
      spo2,
      pulso,
      triage,
      descripcion,
      'sensor',
      mysqlTimestamp // Fecha formateada correctamente
    ]);

    res.json({
      success: true,
      message: 'Datos guardados en MySQL'
    });
  } catch (err) {
    console.error('❌ Error en el servidor:', err);
    res.status(500).json({
      success: false,
      error: 'Error al guardar',
      details: err.message
    });
  }
});

// Endpoint para obtener paciente por DNI
app.get('/api/paciente/dni/:dni', async (req, res) => {
  try {
    const { dni } = req.params;
    
    const sql = `
      SELECT id_paciente, dni, nombre, apellido, fecha_nacimiento, sexo, created_at
      FROM paciente
      WHERE dni = ?
    `;
    
    const [results] = await pool.query(sql, [dni]);
    
    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Paciente no encontrado'
      });
    }
    
    res.json({
      success: true,
      data: results[0] // Devolvemos el primer resultado directamente
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Error al obtener información del paciente'
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

// Registrar en panel de administrador a los usuarios
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
    } else if (rol === 'Admision' || rol === 'Admisión') {
      tabla = 'personal_admision';
    } else if (rol === 'Admin') {
      tabla = 'administrador';
    } else {
      return res.status(400).json({
        error: 'Rol inválido'
      });
    }

    const checkSql = `SELECT dni FROM ${tabla} WHERE dni = ?`;
    const [filas] = await pool.query(checkSql, [dni]);

    if (filas && filas.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'El DNI ya se encuentra registrado en el sistema'
      });
    }

    const saltRounds = 10; 
    const passwordHash = await bcrypt.hash(password, saltRounds);

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
        passwordHash
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
        passwordHash
      ]);
    }

    res.json({
      success: true,
      message: 'Usuario registrado correctamente'
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Error al registrar usuario'
    });
  }
});

// Hacer login
app.post('/api/login', async (req, res) => {
  try {
    const { dni, password } = req.body;

    // ====================================================================
    // PASO 1: VERIFICAR SOLO DNI (Cuando el frontend ejecuta verificarDni)
    // ====================================================================
    if (!password) {
      
      // 1. Verificar si es Paciente
      const [pacientes] = await pool.query(`SELECT * FROM paciente WHERE dni = ?`, [dni]);
      if (pacientes.length > 0) {
        return res.json({ success: true, rol: 'Paciente', usuario: pacientes[0] });
      }

      // 2. Verificar si es Médico
      const [medicos] = await pool.query(`SELECT * FROM medico WHERE dni = ?`, [dni]);
      if (medicos.length > 0) {
        return res.json({ success: true, rol: 'Doctor' }); 
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
    
    let usuarioEncontrado = null;
    let rolAsignado = '';
    let tablaAsignada = ''; 

    // Buscamos secuencialmente en qué tabla está el DNI para validar su contraseña
    const [medicos] = await pool.query(`SELECT * FROM medico WHERE dni = ?`, [dni]);
    if (medicos.length > 0) {
      usuarioEncontrado = medicos[0];
      rolAsignado = 'Doctor';
      tablaAsignada = 'medico';
    } else {
      const [admision] = await pool.query(`SELECT * FROM personal_admision WHERE dni = ?`, [dni]);
      if (admision.length > 0) {
        usuarioEncontrado = admision[0];
        rolAsignado = 'Admision';
        tablaAsignada = 'personal_admision';
      } else {
        const [admin] = await pool.query(`SELECT * FROM administrador WHERE dni = ?`, [dni]);
        if (admin.length > 0) {
          usuarioEncontrado = admin[0];
          rolAsignado = 'Admin';
          tablaAsignada = 'administrador';
        }
      }
    }

    // Si no se encontró el usuario en ninguna tabla transaccional de login
    if (!usuarioEncontrado) {
      return res.status(401).json({ success: false, error: 'Credenciales incorrectas' });
    }

    const intentosActuales = parseInt(usuarioEncontrado.intentos_login, 10) || 0;

    if (intentosActuales >= 5) {
      return res.status(429).json({ 
        success: false,
        error: 'Demasiados intentos de inicio de sesión',
        details: 'Por seguridad, tu cuenta ha sido temporalmente bloqueada. Contacta al soporte.'
      });
    }

    const match = await bcrypt.compare(password, usuarioEncontrado.clave_hash);

    if (match) {
      await pool.query(`UPDATE ${tablaAsignada} SET intentos_login = 0 WHERE dni = ?`, [dni]);

      delete usuarioEncontrado.clave_hash; 
      
      const payload = {
        dni: usuarioEncontrado.dni,
        rol: rolAsignado
      };
      const secretKey = 'v1t4l$c4N2026$$';
      const token = jwt.sign(payload, secretKey, { expiresIn: '12h' });

      return res.json({ 
        success: true, 
        rol: rolAsignado, 
        usuario: usuarioEncontrado,
        token: token 
      });

    } else {
      const nuevosIntentos = intentosActuales + 1;
      
      await pool.query(`UPDATE ${tablaAsignada} SET intentos_login = ? WHERE dni = ?`, [nuevosIntentos, dni]);
      
      const intentosRestantes = 5 - nuevosIntentos;

      return res.status(401).json({ 
        success: false, 
        error: 'Credenciales incorrectas',
        details: intentosRestantes > 0 
          ? `Te quedan ${intentosRestantes} intento(s) antes de bloquear la cuenta.` 
          : 'Tu cuenta ha sido bloqueada tras 5 intentos fallidos.'
      });
    }

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
  console.log('Servidor corriendo en Railway');
});
