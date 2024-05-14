'use strict'
const moment = require("moment");

class DAOCitas {
    constructor(pool){
        this.pool = pool;
    }

    horasDisponibles(id_medicoE,fecha,callback){
        this.pool.getConnection((err,con) =>{
            if(err) callback(new Error("Error en la conexión a la base de datos en horasDisponibles"));
            else {
                con.query("SELECT citas.hora FROM citas WHERE fecha = ? AND idMedico = ?", [fecha, id_medicoE], (err,res) => {
                    con.release()
                    if(err) callback(new Error("Error al realizar la consulta para saber las horas disponibles", null));
                    else {
                        callback(null,res);
                    }
                })
            }
        })
    }

    insertCita(datos,callback){
        this.pool.getConnection((err,con) =>{
            if(err) callback(new Error("Error en la conexión a la base de datos en insertCitas"));
            else {
                con.query("INSERT INTO citas (idUser,idMedico,nombre,apellidos,email,tipo,fecha,hora,activo) VALUES (?,?,?,?,?,?,?,?,1)",
                [   datos.id_usuario,
                    datos.id_medico,
                    datos.nombre_usuario,
                    datos.apellido_usuario,
                    datos.email_usuario,
                    datos.tipoReserva,
                    datos.fecha,
                    datos.hora,
                ],
                (err,res) => {
                    con.release();
                    if(err) callback(new Error("Error al realizar la consulta en insertCita " + err, null))
                    else   callback(null,true);
                })
            }
        })

    }

    modificarCita(id_mod,datos,callback){
        this.pool.getConnection((err,con) =>{
            if(err) callback(new Error("Error en la conexión a la base de datos en modificarCita"));
            else {
                con.query("UPDATE citas SET fecha = ?, hora = ? WHERE id = ?", [   
                    datos.fecha,
                    datos.hora,
                    id_mod
                ],
                (err,res) => {
                    con.release();
                    if (err) {
                        callback(new Error("Error al realizar la consulta en modificarCita"));
                    } else {
                        callback(null, true);
                    }
                })
            }
        })

    }

    getCitasUsu(email,callback){
        this.pool.getConnection((err,con) =>{
            if(err) callback(new Error("Error al conectarse a la base de datos"));
            else {
                con.query("SELECT * FROM citas WHERE perfil = 'Paciente' AND activo = 1", (err,usuarios) => {
                    con.release();
                    if(err) callback(new Error("Error al realizar consulta en getCitasUsu"));
                    else {
                        callback(null,usuarios);
                    }
                })
            }
        })
    }

    getPacientesConReserva(email, callback) {
        this.pool.getConnection((err, con) => {
            if (err) {
                callback(new Error("Error al conectarse a la base de datos"));
            } else {
                con.query("SELECT cit.id, cit.fecha, cit.hora, usu.nombre, usu.apellidos, cit.tipo FROM citas cit JOIN usuario usu ON cit.idMedico = usu.id WHERE cit.activo = 1 AND cit.email = ?", [email], (err, reservas) => {
                    con.release();
                    if (err) {
                        callback(new Error("Error al realizar la consulta en getPacientesConReserva"));
                    } else {
                        callback(null, reservas);
                    }
                });
            }
        });
    }    

    cancelarCita(idCita,callback){
        this.pool.getConnection((err,con) =>{
            if(err) callback(new Error("Error al conectarse a la BD"));
            else {
                con.query("DELETE FROM citas WHERE id = ?", [idCita], (err,res) => {
                    con.release();
                    if(err) callback(new Error("Error al realizar la consulta en cancelarCita" + err));
                    else {
                        callback(null);
                    }
                })
            }
        })
    }
    
    getCita(id,callback){
        this.pool.getConnection((err,con) =>{
            if(err) callback(new Error("Error al conectarse a la base de datos"));
            else {
                con.query("SELECT * FROM citas WHERE id= ?", [id], (err,res) => {
                    con.release();
                    if(err) callback(new Error("Error al realizar la consulta en getCita" + err, null));
                    else {
                        if(res.length > 0) {
                            // Formatear la fecha
                            var fechaISO = res[0].fecha;
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
                            var horaISO = res[0].hora;
                            var hora = new Date('1970-01-01T' + horaISO);
                            var horaFormateada = hora.getHours() + ':' + (hora.getMinutes() < 10 ? '0' : '') + hora.getMinutes();

                            // Reemplazar la fecha y hora originales con las formateadas en el resultado
                            res[0].fecha = fechaFormateada;
                            res[0].hora = horaFormateada;

                            callback(null, res[0]);
                        }
                        else callback(null, null);
                    }
                })
            }
        })
    }

    getAllCitas(idM,callback){
        this.pool.getConnection((err,con) =>{
            if(err) callback(new Error("Error al conectarse a la base de datos"));
            else {
                con.query("SELECT * FROM citas WHERE activo = 1 AND idMedico= ?", [idM], (err,reservas) => {
                    con.release();
                    if(err) callback(new Error("Error al realizar la consulta en getAllCitas"));
                    else {
                        callback(null,reservas);
                    }
                })
            }
        })
    }

    archivarCitas(id,callback){
        this.pool.getConnection((err,con) =>{
            if(err) callback(new Error("Error al conectarse a la BD"));
            else {
                con.query("UPDATE citas SET activo = 0 WHERE id = ?", [id], (err,res) => {
                    con.release();
                    if(err) callback(new Error("Error al realizar la consulta en archivarCitas"));
                    else {
                        callback(null);
                    }
                })
            }
        })
    }

    getAllCitasArchivadas(idM,callback){
        this.pool.getConnection((err,con) =>{
            if(err) callback(new Error("Error al conectarse a la base de datos"));
            else {
                con.query("SELECT * FROM citas WHERE activo = 0 AND idMedico = ?", [idM],(err,reservas) => {
                    con.release();
                    if(err) callback(new Error("Error al realizar la consulta en getAllCitasArchivadas"));
                    else {
                        callback(null,reservas);
                    }
                })
            }
        })
    }

    getCitasPresenciales(idM,callback){
        this.pool.getConnection((err,con) =>{
            if(err) callback(new Error("Error al conectarse a la base de datos"));
            else {
                con.query("SELECT * FROM citas WHERE tipo = 'Presencial' AND activo = 1 AND idMedico =?", [idM], (err,reservas) => {
                    con.release();
                    if(err) callback(new Error("Error al realizar la consulta en getCitasPresenciales"));
                    else {
                        callback(null,reservas);
                    }
                })
            }
        })
    }

    getCitasTelefonicas(idM,callback){
        this.pool.getConnection((err,con) =>{
            if(err) callback(new Error("Error al conectarse a la base de datos"));
            else {
                con.query("SELECT * FROM citas WHERE tipo = 'Telefónica' AND activo = 1 AND idMedico = ?", [idM], (err,reservas) => {
                    con.release();
                    if(err) callback(new Error("Error al realizar la consulta en getCitasTelefonicas"));
                    else {
                        callback(null,reservas);
                    }
                })
            }
        })
    }

    getCitasVideoconferencia(idM, callback){
        this.pool.getConnection((err,con) =>{
            if(err) callback(new Error("Error al conectarse a la base de datos"));
            else {
                con.query("SELECT * FROM citas WHERE tipo = 'Videoconferencia' AND activo = 1 AND idMedico = ?", [idM], (err,reservas) => {
                    con.release();
                    if(err) callback(new Error("Error al realizar la consulta en getCitasVideoconferencia"));
                    else {
                        callback(null,reservas);
                    }
                })
            }
        })
    }

    getCitasPresencialesArchivadas(idM,callback){
        this.pool.getConnection((err,con) =>{
            if(err) callback(new Error("Error al conectarse a la base de datos"));
            else {
                con.query("SELECT * FROM citas WHERE tipo = 'Presencial' AND activo = 0 AND idMedico = ?", [idM], (err,reservas) => {
                    con.release();
                    if(err) callback(new Error("Error al realizar la consulta en getCitasPresencialesArchivadas"));
                    else {
                        callback(null,reservas);
                    }
                })
            }
        })
    }

    getCitasTelefonicasArchivadas(idM,callback){
        this.pool.getConnection((err,con) =>{
            if(err) callback(new Error("Error al conectarse a la base de datos"));
            else {
                con.query("SELECT * FROM citas WHERE tipo = 'Telefónica' AND activo = 0 AND idMedico = ?", [idM], (err,reservas) => {
                    con.release();
                    if(err) callback(new Error("Error al realizar la consulta en getCitasTelefonicasArchivadas"));
                    else {
                        callback(null,reservas);
                    }
                })
            }
        })
    }

    getCitasVideoconferenciaArchivadas(idM,callback){
        this.pool.getConnection((err,con) =>{
            if(err) callback(new Error("Error al conectarse a la base de datos"));
            else {
                con.query("SELECT * FROM citas WHERE tipo = 'Videoconferencia' AND activo = 0 AND idMedico = ?", [idM], (err,reservas) => {
                    con.release();
                    if(err) callback(new Error("Error al realizar la consulta en getCitasVideoconferenciaArchivadas"));
                    else {
                        callback(null,reservas);
                    }
                })
            }
        })
    }

}
module.exports = DAOCitas;