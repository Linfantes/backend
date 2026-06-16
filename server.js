const path = require('path');
const pool = require('./db');
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'triaje', 'build')));

app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Servidor VitaScan activo'
  });
});

app.get('/api/triaje', (req, res) => {
  res.json({
    ok: true,
    mensaje: 'GET triaje funcionando'
  });
});

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

    console.log(' Datos recibidos:', req.body);

    if (triage === 'ESPERANDO') {
      return res.json({
        success: true,
        message: 'Datos no guardados (estado ESPERANDO)'
      });
    }

    const dateToFormat = timestamp ? new Date(timestamp) : new Date();
    const mysqlTimestamp = dateToFormat.toISOString().slice(0, 19).replace('T', ' ');

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
      mysqlTimestamp
    ]);

    res.json({
      success: true,
      message: 'Datos guardados en MySQL'
    });
  } catch (err) {
    console.error(' Error en el servidor:', err);
    res.status(500).json({
      success: false,
      error: 'Error al guardar',
      details: err.message
    });
  }
});

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

    if (rol === 'Doctor' || rol === 'Médico') {
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

    if (tabla === 'medico') {
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

app.post('/api/login', async (req, res) => {
  try {
    const { dni, password } = req.body;

    if (!password) {
      const [pacientes] = await pool.query(`SELECT * FROM paciente WHERE dni = ?`, [dni]);
      if (pacientes.length > 0) {
        return res.json({ success: true, rol: 'Paciente', usuario: pacientes[0] });
      }

      const [medicos] = await pool.query(`SELECT * FROM medico WHERE dni = ?`, [dni]);
      if (medicos.length > 0) {
        return res.json({ success: true, rol: 'Doctor' });
      }

      const [admision] = await pool.query(`SELECT * FROM personal_admision WHERE dni = ?`, [dni]);
      if (admision.length > 0) {
        return res.json({ success: true, rol: 'Admision' });
      }

      const [admin] = await pool.query(`SELECT * FROM administrador WHERE dni = ?`, [dni]);
      if (admin.length > 0) {
        return res.json({ success: true, rol: 'Admin' });
      }

      return res.status(404).json({ success: false, error: 'DNI no registrado' });
    }

    let usuarioEncontrado = null;
    let rolAsignado = '';
    let tablaAsignada = '';

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
      
      if (nuevosIntentos >= 5) {
        await pool.query(`UPDATE ${tablaAsignada} SET intentos_login = ?, activo = 0 WHERE dni = ?`, [nuevosIntentos, dni]);
      } else {
        await pool.query(`UPDATE ${tablaAsignada} SET intentos_login = ? WHERE dni = ?`, [nuevosIntentos, dni]);
      }
      
      const intentosRestantes = 5 - nuevosIntentos;

      return res.status(401).json({
        success: false,
        error: 'Credenciales incorrectas',
        details: intentosRestantes > 0
          ? `Te quedan ${intentosRestantes} intento(s) antes de bloquear la cuenta.`
          : 'Tu cuenta ha sido bloqueada tras 5 intentos fallidos y ha sido desactivada en el sistema.'
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Error interno en el login' });
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

app.get('/api/pacientes/dashboard', async (req, res) => {
  try {
    const sql = `
      SELECT
        p.id_paciente,
        p.dni,
        p.nombre,
        p.apellido,
        sv.temperatura,
        sv.saturacion_oxigeno,
        sv.pulso,
        sv.triage,
        sv.descripcion,
        sv.created_at AS fecha_triaje
      FROM paciente p
      LEFT JOIN signos_vitales sv ON sv.id_paciente = p.id_paciente
        AND sv.id_signos = (
          SELECT MAX(id_signos)
          FROM signos_vitales
          WHERE id_paciente = p.id_paciente
        )
      ORDER BY p.id_paciente DESC
    `;

    const [resultados] = await pool.query(sql);

    const pacientesFormateados = resultados.map(pac => {
      const pasoTriaje = pac.temperatura !== null && pac.temperatura !== undefined && pac.temperatura !== '';
      
      let estadoSalud = 'Pendiente';

      if (pasoTriaje) {
        const oxigeno = parseFloat(pac.saturacion_oxigeno) || 0;
        const pulso = parseInt(pac.pulso) || 0;
        const temp = parseFloat(pac.temperatura) || 0;

        if ((oxigeno > 0 && oxigeno < 90) || pulso > 110 || temp > 38.5 || pac.triage === 'Rojo') {
          estadoSalud = 'Crítico';
        } else if ((oxigeno > 0 && oxigeno < 95) || pulso > 100 || temp > 37.5 || pac.triage === 'Amarillo') {
          estadoSalud = 'Requiere atención';
        } else {
          estadoSalud = 'Normal';
        }
      }

      return {
        id_paciente: pac.id_paciente,
        dni: pac.dni,
        nombreCompleto: `${pac.nombre || ''} ${pac.apellido || ''}`.trim() || `Paciente (${pac.dni})`,
        estado: estadoSalud,
        signosVitales: pasoTriaje ? {
          temperatura: `${pac.temperatura}°C`,
          saturacion_oxigeno: `${pac.saturacion_oxigeno}%`,
          pulso: `${pac.pulso} bpm`,
          nivelTriaje: pac.triage || 'N/A',
          descripcion: pac.descripcion || '',
          fecha: pac.fecha_triaje
        } : null
      };
    });

    res.json({
      success: true,
      data: pacientesFormateados
    });

  } catch (err) {
    console.error('❌ Error crítico en SQL Dashboard:', err);
    res.status(500).json({
      success: false,
      error: 'Error interno al procesar los datos del dashboard',
      details: err.message
    });
  }
});

app.get('/api/usuarios', async (req, res) => {
  try {
    const [medicos] = await pool.query(`SELECT id_medico AS id, dni, nombre, apellido, especialidad, usuario, activo, 'Doctor' AS rol FROM medico`);
    const [admision] = await pool.query(`SELECT id_personal AS id, dni, nombre, apellido, NULL AS especialidad, usuario, activo, 'Admision' AS rol FROM personal_admision`);
    const [admin] = await pool.query(`SELECT id_administrador AS id, dni, nombre, apellido, NULL AS especialidad, usuario, activo, 'Admin' AS rol FROM administrador`);

    res.json({ success: true, data: [...medicos, ...admision, ...admin] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error al obtener usuarios' });
  }
});

app.put('/api/usuarios/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, apellido, dni, password, especialidad, rol } = req.body;

    let tabla = '';
    if (rol === 'Doctor') tabla = 'medico';
    else if (rol === 'Admision' || rol === 'Admisión') tabla = 'personal_admision';
    else if (rol === 'Admin') tabla = 'administrador';

    if (!tabla) return res.status(400).json({ success: false, error: 'Rol inválido' });

    let sql = `UPDATE ${tabla} SET nombre = ?, apellido = ?, dni = ?, usuario = ?`;
    let params = [nombre, apellido, dni, dni];

    if (password) {
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);
      sql += ', clave_hash = ?';
      params.push(passwordHash);
    }

    if (especialidad && tabla === 'medico') {
      sql += ', especialidad = ?';
      params.push(especialidad);
    }

    sql += ' WHERE dni = ?';
    params.push(id);

    const [result] = await pool.query(sql, params);

    if (result.affectedRows > 0) {
      res.json({ success: true, message: 'Usuario actualizado correctamente' });
    } else {
      res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Error al actualizar usuario' });
  }
});

app.put('/api/usuarios/:dni/estado', async (req, res) => {
  try {
    const { dni } = req.params;
    const { activo } = req.body;

    const nuevoEstado = activo ? 1 : 0;

    const sqlMedico = nuevoEstado === 1
      ? 'UPDATE medico SET activo=?, intentos_login=0 WHERE dni=?'
      : 'UPDATE medico SET activo=? WHERE dni=?';

    const sqlAdmision = nuevoEstado === 1
      ? 'UPDATE personal_admision SET activo=?, intentos_login=0 WHERE dni=?'
      : 'UPDATE personal_admision SET activo=? WHERE dni=?';

    const sqlAdmin = nuevoEstado === 1
      ? 'UPDATE administrador SET activo=?, intentos_login=0 WHERE dni=?'
      : 'UPDATE administrador SET activo=? WHERE dni=?';

    const params = [nuevoEstado, dni];

    let [rows] = await pool.query('SELECT * FROM medico WHERE dni=?', [dni]);
    if (rows.length > 0) {
      await pool.query(sqlMedico, params);
      return res.json({ success: true, message: 'Doctor activado e intentos de login reiniciados.' });
    }

    [rows] = await pool.query('SELECT * FROM personal_admision WHERE dni=?', [dni]);
    if (rows.length > 0) {
      await pool.query(sqlAdmision, params);
      return res.json({ success: true, message: 'Personal de admisión activado e intentos de login reiniciados.' });
    }

    [rows] = await pool.query('SELECT * FROM administrador WHERE dni=?', [dni]);
    if (rows.length > 0) {
      await pool.query(sqlAdmin, params);
      return res.json({ success: true, message: 'Administrador activado e intentos de login reiniciados.' });
    }

    res.status(404).json({ success: false, error: 'Usuario no encontrado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Error al cambiar estado y desbloquear' });
  }
});

app.delete('/api/usuarios/:dni', async (req, res) => {
  try {
    const { dni } = req.params;

    const [med] = await pool.query('DELETE FROM medico WHERE dni = ?', [dni]);
    if (med.affectedRows > 0) return res.json({ success: true, message: 'Médico eliminado' });

    const [adm] = await pool.query('DELETE FROM personal_admision WHERE dni = ?', [dni]);
    if (adm.affectedRows > 0) return res.json({ success: true, message: 'Personal de admisión eliminado' });

    const [admn] = await pool.query('DELETE FROM administrador WHERE dni = ?', [dni]);
    if (admn.affectedRows > 0) return res.json({ success: true, message: 'Administrador eliminado' });

    res.status(404).json({ success: false, error: 'Usuario no encontrado para eliminar' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Error al eliminar usuario' });
  }
});

app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Ruta API no encontrada' });
  }
  res.sendFile(path.join(__dirname, 'triaje', 'build', 'index.html'));
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Servidor VitalScan ejecutándose exitosamente en el puerto ${PORT}`);
});
