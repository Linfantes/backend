require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./db'); // tu conexión MySQL
const bcrypt = require('bcrypt');

const app = express();
app.use(cors());
app.use(express.json());

// Ruta principal
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Servidor VitaScan activo' });
});

// LOGIN seguro con bcrypt y flujo por roles
app.post('/api/login', async (req, res) => {
  const { dni, password } = req.body;

  try {
    // Paciente: solo requiere DNI (pero si envía contraseña, la ignoramos)
    const [paciente] = await pool.query('SELECT * FROM paciente WHERE dni = ?', [dni]);
    if (paciente.length > 0) {
      return res.json({ success: true, rol: 'paciente', usuario: paciente[0] });
    }

    // Otros roles: requieren contraseña
    const roles = [
      { rol: 'Administrador', tabla: 'administrador' },
      { rol: 'Medico', tabla: 'medico' },
      { rol: 'Admision', tabla: 'personal_admision' },
    ];

    for (const r of roles) {
      const [user] = await pool.query(`SELECT * FROM ${r.tabla} WHERE dni = ?`, [dni]);
      if (user.length > 0) {
        // Verificar que se haya enviado contraseña
        if (!password) {
          return res.status(400).json({ success: false, message: 'Se requiere contraseña para este rol' });
        }
        
        // Verificar que el usuario tenga clave_hash
        if (!user[0].clave_hash) {
          return res.status(500).json({ success: false, message: 'Usuario sin contraseña establecida' });
        }

        try {
          const match = await bcrypt.compare(password, user[0].clave_hash);
          if (match) {
            // No enviar la clave_hash en la respuesta por seguridad
            const usuario = { ...user[0] };
            delete usuario.clave_hash;
            return res.json({ success: true, rol: r.rol, usuario });
          } else {
            return res.json({ success: false, message: 'Contraseña incorrecta' });
          }
        } catch (bcryptError) {
          console.error('Error en bcrypt.compare:', bcryptError);
          return res.status(500).json({ success: false, message: 'Error en la verificación de contraseña' });
        }
      }
    }

    // Usuario no registrado
    res.json({ success: false, message: 'Usuario no registrado' });
  } catch (err) {
    console.error('Error en login:', err);
    res.status(500).json({ success: false, message: 'Error en el servidor' });
  }
});

// Crear administrador con contraseña segura usando bcrypt
app.post('/api/admin/create', async (req, res) => {
  const { dni, nombre, apellido, usuario, password } = req.body;
  
  console.log('=== INTENTO DE CREAR ADMIN ===');
  console.log('Datos recibidos:', { dni, nombre, apellido, usuario, password: password ? '[PROTECTED]' : 'MISSING' });
  
  // Validar que se haya enviado contraseña
  if (!password) {
    console.log('ERROR: Contraseña no proporcionada');
    return res.status(400).json({ success: false, message: 'Se requiere contraseña' });
  }

  try {
    // Validar longitud mínima de contraseña
    if (password.length < 6) {
      console.log('ERROR: Contraseña muy corta');
      return res.status(400).json({ success: false, message: 'La contraseña debe tener al menos 6 caracteres' });
    }

    // Generar hash
    console.log('Generando hash de contraseña...');
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    console.log('Hash generado exitosamente. Longitud:', hashedPassword.length);

    // Insertar en base de datos
    console.log('Intentando insertar en base de datos...');
    const result = await pool.query(
      `INSERT INTO administrador (dni, nombre, apellido, usuario, clave_hash, activo) VALUES (?, ?, ?, ?, ?, ?)`,
      [dni, nombre, apellido, usuario, hashedPassword, 1]
    );
    
    console.log('Inserción exitosa. Resultado:', result[0]);
    res.json({ success: true, message: 'Administrador creado con contraseña segura' });
  } catch (err) {
    console.error('ERROR DETALLADO al crear administrador:', err);
    res.status(500).json({ success: false, message: 'Error al crear administrador', error: err.message });
  }
});

// Crear médico con contraseña segura usando bcrypt
app.post('/api/medico/create', async (req, res) => {
  const { dni, nombre, apellido, especialidad, password } = req.body;
  
  // Validar que se haya enviado contraseña
  if (!password) {
    return res.status(400).json({ success: false, message: 'Se requiere contraseña' });
  }

  try {
    // Validar longitud mínima de contraseña
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'La contraseña debe tener al menos 6 caracteres' });
    }

    // Generar hash
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Insertar en base de datos
    await pool.query(
      `INSERT INTO medico (dni, nombre, apellido, especialidad, clave_hash) VALUES (?, ?, ?, ?, ?)`,
      [dni, nombre, apellido, especialidad, hashedPassword]
    );
    
    res.json({ success: true, message: 'Médico creado con contraseña segura' });
  } catch (err) {
    console.error('Error al crear médico:', err);
    res.status(500).json({ success: false, message: 'Error al crear médico', error: err.message });
  }
});

// Crear personal de admisión con contraseña segura usando bcrypt
app.post('/api/admision/create', async (req, res) => {
  const { dni, nombre, apellido, turno, password } = req.body;
  
  // Validar que se haya enviado contraseña
  if (!password) {
    return res.status(400).json({ success: false, message: 'Se requiere contraseña' });
  }

  try {
    // Validar longitud mínima de contraseña
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'La contraseña debe tener al menos 6 caracteres' });
    }

    // Generar hash
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Insertar en base de datos
    await pool.query(
      `INSERT INTO personal_admision (dni, nombre, apellido, turno, clave_hash) VALUES (?, ?, ?, ?, ?)`,
      [dni, nombre, apellido, turno, hashedPassword]
    );
    
    res.json({ success: true, message: 'Personal de admisión creado con contraseña segura' });
  } catch (err) {
    console.error('Error al crear personal de admisión:', err);
    res.status(500).json({ success: false, message: 'Error al crear personal de admisión', error: err.message });
  }
});

// Rutas de triaje
app.get('/api/triaje', (req, res) => {
  res.json({ ok: true, mensaje: 'GET triaje funcionando' });
});

app.post('/api/triaje', async (req, res) => {
  try {
    const { temperatura, spo2, pulso, triage } = req.body;
    const sql = `
      INSERT INTO signos_vitales
      (temperatura, saturacion_oxigeno, pulso, triage, registrado_por)
      VALUES (?, ?, ?, ?, ?)
    `;
    await pool.query(sql, [temperatura, spo2, pulso, triage, 'sensor']);
    res.json({ success: true, message: 'Datos guardados en MySQL' });
  } catch (err) {
    console.error('Error al guardar triaje:', err);
    res.status(500).json({ success: false, error: 'Error al guardar' });
  }
});

app.get('/api/signos', async (req, res) => {
  try {
    const [rows] = await pool.query(`SELECT * FROM signos_vitales ORDER BY created_at DESC LIMIT 10`);
    res.json(rows);
  } catch (err) {
    console.error('Error al obtener signos:', err);
    res.status(500).json({ error: 'Error al obtener signos vitales' });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));