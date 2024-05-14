// Importación de módulos
const express = require("express");
const mysql = require("mysql");
const path = require("path");
const bodyParser = require("body-parser");
const session = require('express-session');
const moment = require("moment");
const MySQLStore = require('express-mysql-session')(session);
const fs = require("fs");
const multer = require("multer");
const {body, validationResult} = require('express-validator');
const multerFactory = multer({storage: multer.memoryStorage()});
const nodemailer = require('nodemailer');
const crypto = require('crypto');

require('dotenv').config();
require("ejs");

// Importación de archivos propios, de configuración
const conf = require("./config");
const transporter = require("./emailConfig");

// Importación del módulo de los usuarios (porque previamente hemos hecho module.exports = claseAExportar)
const DAOUsers = require("./DAOUsers")
const DAOCitas = require("./DAOCitas")
const DAOInformes = require("./DAOInformes")
const DAOMensajes = require("./DAOMensajes")

// Iniciamos la app
const app = express();

// Creamos la piscina de conexiones
const pool = mysql.createPool(conf.mysqlConfig);

// configuración de nuestra conexión al servidor, generalmente, se usa el puerto 3306 para el módulo MySQL
const options = {
	host: 'localhost',
	port: 3306,
	user: 'root',
	password: '',
	database: 'consultas-medicas'
};
//
const sessionStore = new MySQLStore(options);

// Creamos la piscina de conexiones para los usuarios
const daoUser = new DAOUsers(pool);
const daoCitas = new DAOCitas(pool);
const daoInformes = new DAOInformes(pool);
const daoMensajes = new DAOMensajes(pool);

// Usaremos el motor de plantillas ejs
app.set('view engine', 'ejs');

// Indicamos que las vistas van a estar en la ruta de este directorio + views (carpeta) para simplificar las llamadas
app.set('views', path.join(__dirname, 'views'))

// Establecemos la escucha con el puerto definida en el archivo config.js, elegimos el 4000
app.listen(conf.port, (err) => {
    if(err) console.log("Error al establecer la conexion con el servidor");
    else console.log("Servidor iniciado en el puerto: ", conf.port );
})

// Ajustes del servidor
app.use(bodyParser());
app.use(bodyParser.urlencoded({ extended: true }));

// Configuramos la carpeta "public" de manera estática para poder acceder a ella
app.use(express.static('public'));

app.use(session({
	key: 'cookie_user',
	secret: 'session_cookie_secret',
	store: sessionStore,
	resave: false,
	saveUninitialized: false
}));

// MIDDLEWARES
// Sirven para ejecutarse antes o después del manejo de ruta y utilizan un objeto request, response y next()
function acceso(req,res,next){
    if('currentUser' in req.session){
		daoUser.getUserID(req.session.currentUser, (err, idUser) => {
			if(err) console.log(err);
			else {
				// Si llamo a info fuera de la llave que cierra daoUser.getUserInfo, no podré acceder a ella, porque es una variable local de esta función
				daoUser.getUserInfo(idUser,(err,info) => {
					if(err) console.log(err);
					else {
						res.locals.info = info;
						req.session.nombre = info.nombre;
						req.session.idUser = info.idUser;
						req.session.perfil = info.perfil;
						next();
					}
				})
			}
		})
    }
    else {
        res.redirect("/login");
    }
}

// Middlware "duplicado" o muy parecido al acceso() por la gestión de los datos del modal IniciarSesion
function accesoInicio(req,res,next){
    if('currentUser' in req.session){
		daoUser.getUserID(req.session.currentUser, (err, idUser) => {
			if(err) console.log(err);
			else{
				daoUser.getUserInfo(idUser,(err,info) => {
					if(err) console.log(err);
					else {
						res.locals.info = info;
						req.session.nombre = info.nombre;
						req.session.idUser = info.idUser;
						req.session.perfil = info.perfil;
						console.log(res.locals.info)
						next();
					}
				})
			}
		})
    }
    else next();
}

// Por ejemplo, en este caso simplemente verificamos si un usuario con un correo electrónico específico ya existe
// y luego almacenar esa información en req.session.exists
function existeCorreo(req, res, next) {
	daoUser.userExistsCorreo(req.body.email, (err, result) => {
		if(err) console.log(err);
		else {
			req.session.existsCorreo = result;
			// se llama a la función next(), que permite que la ejecución continúe con el siguiente middleware
			next();			
		}
	})
}

// Por ejemplo, en este caso simplemente verificamos si un usuario con un DNI específico ya existe
// y luego almacenar esa información en req.session.exists
function existeDNI(req, res, next) {
	daoUser.userExistsDNI(req.body.dni, (err, result) => {
		if(err) console.log(err);
		else {
			req.session.existsDNI = result;
			next();			
		}
	})
}

// Middlewares para que el paciente no pueda acceder a las páginas del médico y viceversa
function accesoMedicos(req, res, next){
	daoUser.esMedico(req.session.currentUser, (err, esMedico) => {
		if(err) console.log(err);
		else {
			if(esMedico) next();
			else res.redirect("/inicio");
		}
	})
}

function accesoUsuarios(req, res, next) {
	daoUser.esMedico(req.session.currentUser, (err, esMedico) => {
		if(err) console.log(err);
		else {
			if(esMedico)	res.redirect("/inicio");
			else next();
		}
	})
}

// METODOS GET --> para solicitar los datos de los formularios
app.get("/", (req,res)=> {
    res.redirect("/inicio");
})

app.get("/login", (req,res)=> {
    res.render('login', {errMsg : null})
})

// Cargo la plantilla registro, con el parámetro validaciones, que es un objeto con todos los datos del formulario
app.get("/registro", (req,res) => {
    res.render("registro", {validaciones : [], valores:[]});
})

app.get("/inicio", accesoInicio, (req, res) => {
	if(req.session.currentUser == null) res.render("inicio", {info:[], medicos: []});
	else{
		daoUser.getAllMedicos((err, result)=>{
			if(err)console.log(err);
			else	res.render("inicio", {info: res.locals.info, medicos: result});
		})
	}
})

app.get("/logout",(req,res) => {
    req.session.destroy();
    res.redirect("login")
})

app.get("/imagenUsuario/:idUser", acceso, (req,res) => {
	const idUser = req.params.idUser;

	daoUser.getUserImage(idUser,(err,img) => {
        if(err) console.log("Error producido en /imagenUsuario");
        else {
			if(img) res.end(img)
            else	res.sendFile(path.join(__dirname, "/public/img/iconos/login.png"));
        }
    })
})

app.get("/listaPacientes", acceso, accesoMedicos, (req,res) => {
    daoUser.getActivePacientes((err,usuarios) => {
        if(err) console.log(err);
		else	res.render("listaPacientes", {usuarios: usuarios});
  	})
})

app.get("/listaPacientesArchivados", acceso, accesoMedicos, (req,res) => {
    daoUser.getInactivePacientes((err,usuarios) => {
        if(err) console.log(err);
		else	res.render("listaPacientesArchivados", {usuarios: usuarios});
  	})
})


app.get("/bajaPaciente/:Id", acceso, accesoMedicos, (req,res) => {
    const pacienteId = req.params.Id;

    if(pacienteId && !isNaN(pacienteId)) {
        daoUser.darBajaPaciente(pacienteId, (err) => {
            if(err) console.log(err);
            else	res.redirect("/listaPacientes");
      	})
    }
})

app.get("/listaPacientesArchivados/:Id", acceso, accesoMedicos, (req,res) => {
    const pacienteId = req.params.Id;

    if(pacienteId && !isNaN(pacienteId)) {
        daoUser.darAltaPaciente(pacienteId, (err) => {
            if(err) console.log(err);
            else	res.redirect("/listaPacientesArchivados");
      	})
    }
})

app.get("/listaCitasUsuario", acceso, accesoUsuarios, (req,res) => {
	const pacienteEmail = req.session.currentUser;

	daoCitas.getPacientesConReserva(pacienteEmail, (err,reservas) => {
        if(err)	console.log(err);
		else	res.render("listaCitasUsuario", {reservas: reservas});
  	})
})

app.get("/listaCitasMedico", acceso, accesoMedicos, (req,res) => {
	daoCitas.getAllCitas(res.locals.info.idUser,(err,reservas) => {
        if(err) console.log(err);
		else	res.render("listaCitasMedico", {reservas: reservas});
  })
})

app.get("/cancelarCita/:idCita", acceso, (req,res) => {
	const idCita = req.params.idCita;

	let datos = {};
	
	daoCitas.getCita(idCita, (err, res) => {
		if(err) console.log(err);
		else datos = res;
	})

	daoCitas.cancelarCita(idCita, (err) => {
		if(err) console.log(err);
		else {
			daoUser.esMedico(req.session.currentUser, (err,result) => {
				if(err) console.log(err);
				else {
					// Si nos devuelve (true) es que es médico
					if(result)	res.redirect("/listaCitasMedico");
					else	res.redirect("/listaCitasUsuario");

					correoCancelarCita(datos, (err, res) => {
						if (err) console.log(err);
						else console.log("Correo cancelar cita enviado correctamente")
					});
				}
			})
		}
  })
})

app.get("/eliminarArchivada/:idCita", acceso, (req,res) => {
	const idCita = req.params.idCita;

	if(idCita && !isNaN(idCita)) {
        daoCitas.cancelarCita(idCita,(err) => {
            if(err) console.log(err);
            else {
				res.redirect("/listaCitasArchivadas");
            }
      	})
    }
})

app.get("/archivarCita/:idCita", acceso, (req,res) => {
    const idCita = req.params.idCita;

    if(idCita && !isNaN(idCita)) {
        daoCitas.archivarCitas(idCita,(err) => {
			if(err) console.log(err);
			else {
				res.redirect("/listaCitasMedico");
			}
      })
    }
})

app.get("/listaCitasArchivadas", acceso, (req,res) => {

	daoCitas.getAllCitasArchivadas(res.locals.info.idUser,(err,reservas) => {
        if(err) console.log(err);
		else {
            res.render("listaCitasArchivadas", {reservas: reservas});
        }
  	})
})

app.get("/verPaciente/:idUser", acceso, (req,res) => {
	const idUser = req.params.idUser;

	daoUser.getUserInfo(idUser, (err, paciente) => {
		if(err) console.log(err);
		else {
			// Si existe ese paciente
			if(paciente) {
				// Cargo sus informes
				daoInformes.getInformesPaciente(paciente.idUser, (err,informes)=> {
					if(err) console.log(err);
					else res.render('verPaciente', {paciente: paciente, informes: informes});
			  })
			}
			else res.render('verPaciente'), {paciente: {}, informes: []};
		}
	});
})

app.get("/informesPaciente", acceso, (req,res)=>{
	const idPaciente = res.locals.info.idUser;

	daoInformes.getInformesPaciente(idPaciente, (err,informes) => {
        if(err) console.log(err);
		else {
            res.render("informesPaciente", {info: res.locals.info, informes: informes});
        }
  	})
})

app.get("/verInforme/:id", acceso, (req, res) => {
	const id = req.params.id;

	daoInformes.getUserInforme(id, (err, informe) => {
		if(err) console.log(err);
        else {
			if(informe) res.end(informe);
        }
	})
})

app.get("/eliminarInforme/:idPaciente/:idInforme", acceso, (req, res) => {
	const idPaciente = req.params.idPaciente;
    const idInforme = req.params.idInforme;

	daoInformes.eliminarInforme(idInforme, (err, informe) => {
		if(err) console.log("Error producido en /eliminarInforme");
        else  {
			res.redirect("/verPaciente/" + idPaciente);
		}
	})
})


app.get("/mensajes", acceso,(req, res)=> {
    res.render("mensajes");
});

app.get("/enviarMensaje", acceso, function(req, res) {
    res.render("mensaje");
});

app.get("/mensajeVisto/:Id", acceso, (req,res) => {
    const mensajeId = req.params.Id;
	console.log("Mensaje visto con ID: ",mensajeId);

    if(mensajeId && !isNaN(mensajeId)) {
        daoMensajes.mensajeVisto(mensajeId, (err) => {
            if(err) console.log(err);
            else {
                res.redirect("/mensajes");
            }
      	})
    }
})

app.get("/success", acceso, (req, res) => {
	res.render("success");
})

app.get("/cancel", acceso, (req, res) => {
	res.render("cancel");
})

// Métodos POST --> para guardar los datos enviados al formulario registro y login
app.post("/registro", multerFactory.single('image'), [
		body("image", "La imagen es demasiado grande, debe ocupar menos de 250KB").isByteLength({min:0, max: 250}),
		body("nombre", "El nombre debe tener al menos 3 caracteres y como máximo 30").isLength({min:3,max:30}),
		body("apellidos", "Los apellidos deben tener al menos 3 caracteres y como máximo 30").isLength({min:3,max:30}),
		body("email", "El correo solo puede contener letras, números, puntos, guiones y guión bajo").isEmail(), 
		body("dni", "El DNI debe tener 8 números seguidos de una letra").matches(/^\d{8}[A-Za-z]$/),
		body("telefono", "El telefono debe tener 9 números").if(body("telefono").notEmpty()).isNumeric().isLength({ min: 9, max: 9 }),
		body("password", "La contraseña debe tener entre 8 y 16 caracteres").isLength({min:8,max:16}),
		body("password", "La contraseña no es válida, debe tener una mayúscula, minúscula, número y un caracter especial").matches(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,16}$/),
		body("confPassword", "Las contraseñas no coinciden").custom((value,{req}) => {
			if(req.body.confPassword != req.body.password) return false;
			else return true;
		}),
		
	], existeCorreo, existeDNI, (req,res) => {
		const valores = req.body; // Guarda los datos del formulario
		const errors = validationResult(req);
		//console.log(errors);

		// Si el correo electrónico ya existe, recargamos la página registro solo con ese mensaje de error
		if(req.session.existsCorreo) {
			validaciones = {
				email: {
					msg: "Ese correo electrónico ya está asociado a una cuenta",
					param: 'email',
					location: 'body'
				}
			}
			res.render('registro', {validaciones, valores});
		}
		// Si es el DNI lo que ya existe 
		else if(req.session.existsDNI) {
			validaciones = {
				dni: {
					msg: "Ese DNI ya está asociado a una cuenta",
					param: 'dni',
					location: 'body'
				}
			}
			res.render('registro', {validaciones, valores});
		}

		// Si tanto el correo como el DNI son datos nuevos, comprobamos si hay algún error en el formulario
		else {
			// Si errors no está vacío, hay algún campo que no ha sido validado correctamente
			if(!errors.isEmpty()){
				const valores = req.body;
				const validaciones = errors.mapped();
				res.render('registro', {validaciones, valores});
			}

			// Si todos los datos han sido introducidos correctamente
			else {
				// Creo un objeto con los datos del formulario --> los valores  se guardan en el request (req) y
				// en el body y de cada  parámetro guardamos el id="" que le hemos puesto en el formulario
				datos = {
					nombre : req.body.nombre,
					apellidos : req.body.apellidos,
					email : req.body.email,
					password : req.body.password,
					perfil : "Paciente",
					sexo : req.body.optSexo,
					fecha : req.body.fecha,
					dni : req.body.dni
				};

				// En caso de haber un archivo en el campo image, lo guardamos también
				if (req.file) {
					datos.img = req.file.buffer;
				}
				if (req.telefono) {
					datos.telefono = req.body.telefono;
				}

				// Insertamos el usuario con la consulta SQL en DAOUsers
				daoUser.insertUser(datos, (err,result) => {
					if(err) console.log(err);
					else { 
						console.log("datos", datos)
						if(result) {
							console.log("Usuario insertado correctamente");
						}
						res.redirect("/login");
					}
				})
			}
		}
	}
)

// Método post del login, comprueba si se ha iniciado sesión correctamente, en caso contrario
// muestra mensaje de error, renderizando la página del login con un mensaje por pantalla
app.post("/login",(req,res) => {
	daoUser.isUserCorrect(req.body.email,req.body.password,(err,result)=> {
		if(err) console.log(err);
		else {
			if(result){
				console.log("Usuario correcto ", result);
				req.session.currentUser = req.body.email;
				res.redirect("/inicio");
			}
			else {
				console.log("Usuario incorrecto")
				res.render("login", {errMsg: "Usuario o contraseña incorrectos"});
			}
		}
	})
})

app.post("/editarPerfil/:idUser", existeCorreo, multerFactory.single('image'), [
    body("image", "La imagen es demasiado grande, debe ocupar menos de 250KB").isByteLength({ min: 1, max: 250 }).optional(),
    body("nombre", "El nombre debe tener al menos 3 caracteres y como máximo 30").if(body("nombre").notEmpty()).isLength({ min: 3, max: 30 }),
    body("apellidos", "Los apellidos deben tener al menos 3 caracteres y como máximo 30").if(body("apellidos").notEmpty()).isLength({ min: 3, max: 30 }),
	body("dni", "El DNI debe tener 8 números seguidos de una letra").if(body("dni").notEmpty()).matches(/^\d{8}[A-Za-z]$/).optional(),
	body("telefono", "El telefono debe tener 9 números").if(body("telefono").notEmpty()).isNumeric().isLength({ min: 9, max: 9 }),
    body("email", "El correo solo puede contener letras, números, puntos, guiones y guión bajo").if(body("email").notEmpty()).isEmail(), 
    body("password", "La contraseña debe tener entre 8 y 16 caracteres").if(body("password").notEmpty()).isLength({min:8,max:16}),
    body("password", "La contraseña no es válida, debe tener una mayúscula, minúscula, número y un caracter especial").if(body("password").notEmpty()).matches(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,16}$/),
    body("confPassword", "Las contraseñas no coinciden").custom((value,{req}) => {
        if(req.body.confPassword != req.body.password) return false;
        else return true;
    }),
], acceso, existeCorreo, (req, res) => {
    const errors = validationResult(req);
	console.log(validationResult(req));
	// Primero comprobamos si el nuevo correo ya existe, en cuyo caso no seguimos comprobando
	if(req.session.existsCorreo) {
		validaciones = {
			email: {
				msg: "Ese correo electrónico ya está asociado a una cuenta",
				param: 'email',
				location: 'body'
			}
		}
		res.json({errores: validaciones});
	}
	else{
		// Si hay algún error en la validación, renderizamos la página con los errores
		if (!errors.isEmpty()) {
			console.log(errors.mapped());
			res.json({errores: errors.mapped()});
		}
		// Si no ha habido errores en la validación de los campos, guardamos los nuevos datos en la BD
		else {
			// Obtener el ID del usuario a editar
			const idUser = req.params.idUser;
			// Obtener los datos enviados en el formulario de edición de perfil
			const { nombre, apellidos, dni, telefono, email, password} = req.body;
			// Crear un objeto con los datos actualizados del usuario
			const newData = {};
			if (nombre) newData.nombre = nombre;
			if (apellidos) newData.apellidos = apellidos;
			if (email) newData.email = email;
			if (dni) newData.dni = dni;
			if (telefono) newData.telefono = telefono;
			if (password) newData.password = password;
			if (req.file) newData.img = req.file.buffer;        // Si se envió una nueva imagen, guardarla en la base de datos
		
			// Actualizar el perfil del usuario en la base de datos
			daoUser.editUser(idUser, newData, (err, result) => {
				if (err) console.log(err);
				else {
					// si el usuario cambia de email, lo aactualizo el email en la sesión activa para que no pete la página
					if(email) {
						daoUser.updateSessionCurrentUser(req.sessionID, newData.email, (err, res) => {
							if(err)	console.log(err);
							else {
							}
						})
					}
					console.log("Perfil editado correctamente");
					res.json({ success: "Perfil editado correctamente" });
				}
			});
		}
	}
});

app.post("/eliminarPerfil/:idUser", acceso, (req, res) => {
    const idUser = req.params.idUser;
    const enteredPassword = req.body.deletePassword;
  
    daoUser.checkPassword(idUser, enteredPassword, (err, result) => {
        if (err)    console.log(err);
        else {
            if (result) {
                daoUser.darBajaPaciente(idUser,(err)=> {
                    if(err) console.log(err);
                    else res.json({ success: "Usuario dado de baja correctamente" });
                })
            }
            else res.json({ error: "Contraseña incorrecta" });
        }
    })
});

app.post("/modalLogin", accesoInicio, (req, res) => {
    daoUser.isUserCorrect(req.body.emailModal, req.body.passwordModal, (err, result) => {
        if (err)    console.log(err);
        else {
            if (result) {
				console.log("Usuario correcto");
				req.session.currentUser = req.body.emailModal;
				res.json({ success: "Usuario correcto"});
			}
            else  {
				console.log("Usuario incorrecto en modalIniciarSesion");
				res.json({ error: "Usuario o contraseña incorrectos" });
			}
        }
    })
})

app.post("/getCitas", (req,res)=>{
	console.log(req.body);

	const userMedico = req.body.idMedico;
	const userfecha = req.body.fecha;

	daoCitas.horasDisponibles(userMedico,userfecha,(err, result)=>{
		if(err)console.log(err);
		else	res.json(result);
	})

});

app.post("/reservarCita", (req,res)=>{
    let datos = req.body;

	daoUser.getUserInfo(datos.id_medico, (err, result1) => {
		if(err) console.log(err);
		else {
			datos.medico = result1;
		}
	})
	
	daoCitas.insertCita(datos, (err,result2) => {
		if(err) console.log(err);
        else {
			// Una vez insertada la cita, enviamos un correo al usuario
			correoNuevaCita(datos, (err, result3) => {
				if (err) console.log(err);
				else console.log("Correo de cita nueva enviado correctamente")
			});
			res.json({success: "Reserva realizada correctamente"});
        }
	})
});

app.post("/listaCitasMedico", (req,res)=>{
	const idCita = req.body.id_citaModificar;

	let datosNuevaCita = {
		fecha: req.body.fecha,
		hora: req.body.hora
	}

	// Formatear la fecha
	var fechaISO = datosNuevaCita.fecha;
	var fecha = new Date(fechaISO);
	var dia = fecha.getDate();
	var mes = fecha.getMonth() + 1;
	var año = fecha.getFullYear();
	if (dia < 10) {
		dia = '0' + dia;
	}
	if (mes < 10) {
		mes = '0' + mes;
	}
	var fechaFormateada = dia + '/' + mes + '/' + año;
	// Formatear la hora
	var horaISO = datosNuevaCita.hora;
	var hora = new Date('1970-01-01T' + horaISO);
	var horaFormateada = hora.getHours() + ':' + (hora.getMinutes() < 10 ? '0' : '') + hora.getMinutes();
	datosNuevaCita.fechaFormateada = fechaFormateada;
	datosNuevaCita.horaFormateada = horaFormateada;

	let datosAnteriorCita = {};
	let medico = {};

	daoCitas.getCita(idCita, (err, res) => {
		if(err) console.log(err);
		else {
			datosAnteriorCita = res;
			daoUser.getUserInfo(datosAnteriorCita.idMedico, (err, res2) => {
				medico = res2;
				// console.log(medico);
			})
		}
	})

	daoCitas.modificarCita(idCita, datosNuevaCita, (err,result) => {
		if(err) console.log(err);
        else {
			console.log("Datos cita modificar: ", datosNuevaCita);

			correoModificarCita(datosAnteriorCita, datosNuevaCita, medico, (err, res) => {
				if (err) console.log(err);
				else console.log("Correo de cita modificada enviado correctamente")
			});
            res.json({error: "Reserva modificada correctamente"});
        }
	})
});

app.post("/subirInforme", multerFactory.single('archivo'), (req,res)=>{
	let datos = {
		idUser: req.body.id_paciente,
		nombre: req.body.nombreUsu,
		apellidos: req.body.apellidosUsu,
		fecha: req.body.fecha,
		descripcion: req.body.descripcion,
		nombreArchivo: req.body.nombreArchivo,
		archivo: req.file.buffer
	};

	daoInformes.insertInforme(datos, (err,result) => {
		if(err) console.log(err);
        else	res.json({error: "Informe subido correctamente"});
	})
});

app.post("/modificarInforme", multerFactory.single('archivo'), (req, res) => {
	let datos = {
		idPaciente: req.body.id_paciente,
		idInforme: req.body.id_informe,
		fecha: req.body.fecha,
		archivo: req.file.buffer
	};

	console,log(datos);
	daoInformes.modificarInforme(datos, (err, informe) => {
		if(err) console.log("Error producido en /modificarInforme");
        else  {
			res.redirect("/verPaciente/" + idPaciente);
		}
	})
})

//funcion para enviar un mensaje
app.post("/mensajes", function (req, res){ 
    let datos={
        idEmisor: req.body.id_emisor,
        idReceptor: req.body.idReceptor,
		fecha: req.body.fechaSist,
		asunto: req.body.asunto,
        texto: req.body.areaMensaje
    }
    daoMensajes.insertMensaje(datos,(err,result)=> {
        if(err) console.log(err);
        else	res.json({mensaje: "Mensaje enviado correctamente"});
    })
});

// Carga de la tabla Usuarios como destinatarios en la ventana mensajes
app.post("/enviarMensaje", acceso, function(req, res){

	if(res.locals.info.perfil == "Médico"){
		daoUser.getAllPacientes((err,result)=>{
			if(err) console.log(err);
			else {
				res.json(result);
			}
		})
	}
    else{
		daoUser.getAllMedicos((err,result)=>{
			if(err) console.log(err);
			else	res.json(result);
		})
	}
});

//funcion para ver un listados los mensajes que recibido el usuario
app.post("/verMisMensajes", acceso, function(req, res) {
    daoMensajes.getSomeMensajes(req.session.idUser, (err,result)=>{
        if(err) console.log(err);
        else	res.json(result);
    })
});

app.post("/verMensajesEnviados", acceso, function(req, res) {
    daoMensajes.getMensajesSend(req.session.idUser, (err,result)=>{
        if(err) console.log(err);
        else	res.json(result);
    })
});

app.post("/citasTotales", acceso, function(req,res) {
	daoCitas.getAllCitas(res.locals.info.idUser, (err,result)=> {
        if(err) console.log(err);
		else	res.json(result);
  	})
})

//obtener la info de la tabla de citas Presenciales
app.post("/citasPresenciales", acceso, function(req, res) {
    daoCitas.getCitasPresenciales(res.locals.info.idUser,(err,result)=>{
        if(err) console.log(err);
        else	res.json(result);
    })
});

//obtener la info de la tabla de citas Telefonicasa
app.post("/citasTelefonicas", acceso, function(req, res) {
    daoCitas.getCitasTelefonicas(res.locals.info.idUser,(err,result)=>{
        if(err) console.log(err);
        else	res.json(result);
    })
});

//obtener la info de la tabla de citas Videoconferencia
app.post("/citasVideoconferencia", acceso, function(req, res) {
    daoCitas.getCitasVideoconferencia(res.locals.info.idUser,(err,result)=>{
        if(err) console.log(err);
        else	res.json(result);
    })
});

//obtener la info de la tabla de citas Archivadas
app.post("/citasTotalesArchivadas", acceso, function(req, res) {
    daoCitas.getAllCitasArchivadas(res.locals.info.idUser,(err,result)=>{
        if(err) console.log(err);
        else	res.json(result);
    })
});

//obtener la info de la tabla de citas Presenciales de la parte de Archivadas
app.post("/citasPresencialesArchivadas", acceso, function(req, res) {
    daoCitas.getCitasPresencialesArchivadas(res.locals.info.idUser,(err,result)=>{
        if(err) console.log(err);
        else	res.json(result);
    })
});

//obtener la info de la tabla de citas Telefonicasade la parte de Archivadas
app.post("/citasTelefonicasArchivadas", acceso, function(req, res) {
    daoCitas.getCitasTelefonicasArchivadas(res.locals.info.idUser,(err,result)=>{
        if(err) console.log(err);
        else	res.json(result);
    })
});

//obtener la info de la tabla de citas Videoconferenciade la parte de Archivadas
app.post("/citasVideoconferenciaArchivadas", acceso, function(req, res) {
    daoCitas.getCitasVideoconferenciaArchivadas(res.locals.info.idUser,(err,result)=>{
        if(err) console.log(err);
        else	res.json(result);
    })
});

// ----------------------------------------------------------------------------------------------------------------------------------------------------------------
// Generar token de restablecimiento de contraseña
function generateResetToken(email, callback) {

	daoUser.getUserID(email, (err, idUser) => {
		if(err) console.log(err);
		crypto.randomBytes(20, (err, buf) => {
			if (err) return callback(err);

			const token = buf.toString('hex');
			console.log("Token generado: " + token);

			// Obtener la fecha de expiración del token (por ejemplo, media hora desde ahora)
			const expirationDate = moment().add(30, 'minutes').toDate();
			console.log("Fecha de expiración " + expirationDate);
	
			// Guardar el token en la base de datos asociado al ID del usuario
			daoUser.saveResetToken(idUser, token, expirationDate, (err) => {
				if (err) return callback(err);
				callback(null, token);
			});
		});
	});
}

// Enviar correo electrónico con el enlace de restablecimiento de contraseña
function sendResetEmail(email, token, callback) {
    const resetLink = `http://localhost:4000/cambiar-contrasena/${token}`;
    const mailOptions = {
        from: 'general.ward@ethereal.email',
        to: email,
        subject: 'Restablecimiento de contraseña',
        html: `
            <html>
                <body>
                    <p>Para restablecer tu contraseña, haz clic en el siguiente enlace: <a href="${resetLink}" target="_blank">${resetLink}</a></p>
                </body>
            </html>
        `,
    };

    transporter.sendMail(mailOptions, callback);
}


function correoNuevaCita(cita, callback) {

	console.log("cita: ", cita);

	const mailOptions = {
		from: 'general.ward@ethereal.email',
        to: cita.email_usuario,
        subject: 'Nueva cita',
        text: `Hola ${cita.nombre_usuario}, has reservado una cita médica:

				- Fecha y hora: ${cita.fecha} a las ${cita.hora}
				- Médico: ${cita.medico.nombre} ${cita.medico.apellidos} 
				- Tipo de cita: ${cita.tipoReserva}
				
				Recuerda ser puntual, nuestros médicos tienen muchos pacientes que atender.
				¡Hasta pronto!
				
				Consulta médica Javier Cambronero`,
	};

	transporter.sendMail(mailOptions, callback);
}

function correoModificarCita(datosAnteriorCita, datosNuevaCita, medico, callback) {

	console.log(datosAnteriorCita);

	const mailOptions = {
		from: 'general.ward@ethereal.email',
        to: datosAnteriorCita.email,
        subject: 'Modificación de cita',
        text: `Hola ${datosAnteriorCita.nombre} ${datosAnteriorCita.apellidos}, se ha realizado un cambio en tu cita médica del ${datosAnteriorCita.fecha} a las ${datosAnteriorCita.hora}.
			  ${medico.nombre} ${medico.apellidos} te ha propuesto lo siguiente:

				- Fecha y hora: ${datosNuevaCita.fechaFormateada} a las ${datosNuevaCita.horaFormateada}
				- Médico:  ${medico.nombre} ${medico.apellidos}
				- Tipo de cita: ${datosAnteriorCita.tipo}
				
				Si no pudieras asistir en este nuevo horario, por favor comunícanoslo cuanto antes para poder
				encontrar otra solución.

				Recuerda ser puntual, nuestros médicos tienen muchos pacientes que atender.
				¡Hasta pronto!
				
				Consulta médica Javier Cambronero`,
	};

	transporter.sendMail(mailOptions, callback);
}

function correoCancelarCita(cita, callback) {

	const mailOptions = {
		from: 'general.ward@ethereal.email',
        to: cita.email,
        subject: 'Cita cancelada',
        text: `	Hola ${cita.nombre} ${cita.apellidos},
		
				Hemos tenido algún inconveniente y tu cita médica del ${cita.fecha} a las ${cita.hora} ha sido cancelada.

				Si deseas saber más información, no dudes en escribirnos a consultasmedicastfg@gmail.com o llamarnos al 900 301 013.
				
				Sentimos las molestias...
				Consulta médica Javier Cambronero`,
	};

	transporter.sendMail(mailOptions, callback);
}


// GET para solicitar el formulario de restablecimiento de contraseña
app.get('/recuperar-contrasena', (req, res) => {
    res.render('recuperarContrasena', {error: [], success: []});
});

// POST para enviar el correo electrónico de restablecimiento de contraseña
app.post('/recuperar-contrasena', (req, res) => {
	// OJO: para utilizar el servidor de GMAIL con tu propio correo, cambiar const email por el comentado
	// y comentar el de "ethereal.email"
    // const email = req.body.email;

	const emailEmisor = "general.ward@ethereal.email";
	const emailReceptor = req.body.email;
    daoUser.getUserEmail(emailReceptor, (err, user) => {
        if (err || !user)	return res.render('recuperarContrasena', { error: 'No se encontró ningún usuario con este correo electrónico.', success: []});
        
		generateResetToken(emailReceptor, (err, token) => {
            if (err) return res.render('recuperarContrasena', { error: 'Se produjo un error al generar el token de restablecimiento.', success: []}); 
			console.log("Email a restablecer contraseña: " + emailReceptor);
            sendResetEmail(emailReceptor, token, (err) => {
                if (err) return res.render('recuperarContrasena', { error: 'Se produjo un error al enviar el correo electrónico.', success: []});
                res.render('recuperarContrasena', { error: [], success: 'Se ha enviado un correo electrónico con las instrucciones para restablecer tu contraseña.'});
            });
        });
    });
});

// GET para el formulario de restablecimiento de contraseña con el token
app.get('/cambiar-contrasena/:token', (req, res) => {
    const token = req.params.token;
    res.render('cambiarContrasena', { error: [], success: [], validaciones:[], token: token});
});

// POST para cambiar la contraseña
app.post('/cambiar-contrasena/:token', [
		body("resetPassword", "La contraseña debe tener entre 8 y 16 caracteres").if(body("resetPassword").notEmpty()).isLength({min:8,max:16}),
		body("resetPassword", "La contraseña no es válida, debe tener una mayúscula, minúscula, número y un caracter especial").if(body("resetPassword").notEmpty()).matches(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,16}$/),
		body("resetConfPassword", "Las contraseñas no coinciden").custom((value,{req}) => {
			if(req.body.resetConfPassword != req.body.resetPassword) return false;
			else return true;
		}),
	], (req, res) => {
		const token = req.params.token;
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			console.log(errors);
			const validaciones = errors.mapped();
			console.log(validaciones);
			return res.render('cambiarContrasena', { validaciones: validaciones,  error: [], success: [], token: token});
		}

		else {
			const password = req.body.resetPassword;
			daoUser.getUserByResetToken(token, (err, idUser) => {
				if (err || !idUser)	return res.render('cambiarContrasena', { error: 'El token de restablecimiento no es válido o ha caducado.', success: [], validaciones: [], token: token });

				daoUser.resetPassword(idUser, password, (err) => {
					if (err)	return res.render('cambiarContrasena', { error: 'Se produjo un error al restablecer la contraseña.', success: {}, validaciones: [], token: token});
					res.render('cambiarContrasena', { success: '¡Tu contraseña ha sido restablecida con éxito!', error: [], validaciones: [], token: token});
				});
			});
		}
	}
);