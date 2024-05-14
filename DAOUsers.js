'use strict'
const moment = require("moment");

class DAOUsers {
    constructor(pool){
        this.pool = pool;
    }

    isUserCorrect(email,password,callback){
        this.pool.getConnection((err,con)=>{
            if(err) callback(new Error("Error en la conexión a la base de datos en isUserCorrect"));
            else {
                con.query("SELECT usuario.id FROM usuario WHERE email = ? AND password = ?", [email,password],
                (err,res) =>{
                    con.release();
                    if(err) callback(new Error("Error al realizar la consulta en isUserCorrect" + err, null));
                    else {
                        if(res.length > 0)  callback(null,true);
                        else callback(null,false);
                    }
                })
            }
        })
    }

    isUserActivo(email,callback){
        this.pool.getConnection((err,con)=>{
            if(err) callback(new Error("Error en la conexión a la base de datos en isUserCorrect"));
            else {
                con.query("SELECT * FROM usuario WHERE email = ? AND activo = 1", [email],
                (err,res) =>{
                    con.release();
                    if(err) callback(new Error("Error al realizar la consulta en isUserActivo" + err, null));
                    else {
                        if(res.length > 0)  callback(null,true);
                        else callback(null,false);
                    }
                })
            }
        })
    }

    userExistsCorreo(email,callback){
        this.pool.getConnection((err,con)=>{
            if(err) callback(new Error("Error en la conexión a la base de datos en userExists"));
            else {
                con.query("SELECT usuario.email FROM usuario WHERE email = ?", [email],
                (err,res) =>{
                    con.release();
                    if(err) callback(new Error("Error al realizar la consulta en userExistsCorreo" + err));
                    else {
                        if(res.length > 0)  callback(null,true);
                        else callback(null,false);
                    }
                })
            }
        })
    }

    userExistsDNI(dni,callback){
        this.pool.getConnection((err,con)=>{
            if(err) callback(new Error("Error en la conexión a la base de datos en userExists"));
            else {
                con.query("SELECT usuario.dni FROM usuario WHERE dni = ?", [dni],
                (err,res) =>{
                    con.release();
                    if(err) callback(new Error("Error al realizar la consulta en userExistsDNI" + err));
                    else {
                        if(res.length > 0)  callback(null,true);
                        else callback(null,false);
                    }
                })
            }
        })
    }

    getPerfil(email,callback){
        this.pool.getConnection((err,con)=>{
            if(err) callback(new Error("Error en la conexión a la base de datos en getPerfil"));
            else {
                con.query("SELECT usuario.perfil FROM usuario where email = ?", [email], (err,result) => {
                    con.release();
                   if(err) callback(new Error("Error al realizar la consulta en getPerfil" + err));
                   else {
                        if(result.length > 0) callback(null, result[0].perfil);
                        else callback(null,null);
                   } 
                })
            }
        })
    }

    insertUser(datos,callback){
        this.pool.getConnection((err,con) =>{
            if(err) callback(new Error("Error en la conexión a la base de datos en insertUser"));
            else {
                con.query("INSERT INTO usuario (nombre,apellidos,email,password,img,sexo,fecha,dni,telefono,perfil,activo) VALUES (?,?,?,?,?,?,?,?,?,?,1)",
                [   datos.nombre,
                    datos.apellidos,
                    datos.email,
                    datos.password,
                    datos.img,
                    datos.sexo,
                    datos.fecha,
                    datos.dni,
                    datos.telefono,
                    datos.perfil
                ],
                (err,res) => {
                    con.release();
                    if(err) callback(new Error("Error al realizar la consulta en insertUser " + err, null))
                    else   callback(null,true);
                })
            }
        })

    }

    deleteUser(idUser,callback){
        this.pool.getConnection((err,con) =>{
            if(err) callback(new Error("Error en la conexión a la base de datos en deleteUser"));
            else {
                con.query("UPDATE usuario SET activo = 0 WHERE id = ?", [idUser], (err,res) => {
                    con.release();
                    if(err) callback(new Error("Error al realizar la consulta en deleteUser" + err));
                    else {
                        callback(null);
                    }
                })
            }
        })
    }

    editUser(idUser, datos, callback) {
        this.pool.getConnection((err, con) => {
            if (err) {
                callback(new Error("Error en la conexión a la base de datos en editUser"));
            } else {
                let sql = "UPDATE usuario SET ";
                const values = [];
    
                // Construir la consulta SQL con los campos proporcionados
                if (datos.nombre) {
                    sql += "nombre = ?, ";
                    values.push(datos.nombre);
                }
                if (datos.apellidos) {
                    sql += "apellidos = ?, ";
                    values.push(datos.apellidos);
                }
                if (datos.dni) {
                    sql += "dni = ?, ";
                    values.push(datos.dni);
                }
                if (datos.telefono) {
                    sql += "telefono = ?, ";
                    values.push(datos.telefono);
                }
                if (datos.email) {
                    sql += "email = ?, ";
                    values.push(datos.email);
                }
                if (datos.password) {
                    sql += "password = ?, ";
                    values.push(datos.password);
                }
                if (datos.img) {
                    sql += "img = ?, ";
                    values.push(datos.img);
                }
    
                // Eliminar la coma final y agregar la condición WHERE
                sql = sql.slice(0, -2) + " WHERE id = ?";
                values.push(idUser);

                con.query(sql, values, (err, res) => {
                    con.release();
                    if (err) {
                        callback(new Error("Error al realizar la consulta en editUser" + err));
                    } else {
                        callback(null, null);
                    }
                });
            }
        });
    }

    updateSessionCurrentUser(sessionID, curUser, callback) {
        this.pool.getConnection((err,con) => {
            if(err) callback(new Error("Error en la conexión a la base de datos en updateSessionCurrentUser"));
            else { 
                con.query("SELECT data FROM sessions WHERE session_id = ?", [sessionID], (err, rows) => {
                    if (err) {
                        con.release();
                        callback(new Error("Error al realizar la consulta en updateSessionCurrentUser" + err));
                    } else {
                        if (rows.length === 0) {
                            con.release();
                            callback(new Error("Sesión no encontrada en la base de datos"));
                        } else {
                            const sessionData = JSON.parse(rows[0].data); // Analizar el JSON almacenado en el campo data
                            // Actualizar solo el valor del campo currentUser en el objeto
                            sessionData.currentUser = curUser;

                            const updatedSessionJson = JSON.stringify(sessionData); // Convertir el objeto JSON actualizado a cadena JSON
    
                            // Actualizar el campo data en la base de datos con la nueva cadena JSON
                            con.query("UPDATE sessions SET data = ? WHERE session_id = ?", [updatedSessionJson, sessionID], (err, result) => {
                                con.release();
                                if (err) {
                                    callback(new Error("Error al actualizar información de sesión en la base de datos"));
                                } else {
                                    callback(null, true);
                                }
                            });
                        }
                    }
                });
            }
        });
    }

    esMedico(email,callback){
        this.pool.getConnection((err,con) =>{
            if(err) callback(new Error("Error en la conexión a la base de datos en esMedico"));
            else {
                con.query("SELECT usuario.perfil FROM usuario WHERE email = ?", [email], (err,res) => {
                    con.release()
                    if(err) callback(new Error("Error al realizar la consulta en esMedico" + err, null));
                    else {
                        if(res.length > 0){
                            if(res[0].perfil === 'Médico') callback(null,true);
                            else callback(null,false);
                        }
                        else callback(new Error("No se ha encontrado a ese usuario en la base de datos"), null)
                    }
                })
            }
        })
    }

    getUserImage(idUser,callback){
        this.pool.getConnection((err,con) => {
            if(err) callback(new Error("Error en la conexión a la base de datos en getUserImage"));
            else { 
                con.query("SELECT usuario.img FROM usuario WHERE id = ?",  [idUser], (err, res) =>{
                    con.release();
                    if(err) callback(new Error("Error al realizar la consulta en getUserImage" + err, null));
                    else {
                        if(res.length > 0)  callback(null,res[0].img);
                        else callback(null,null);
                    }
                })
            }
        })
    }

    getUserEmail(email,callback){
        this.pool.getConnection((err,con) => {
            if(err) callback(new Error("Error en la conexión a la base de datos en getUserEmail"));
            else { 
                con.query("SELECT usuario.email FROM usuario WHERE email = ?",  [email], (err, res) =>{
                    con.release();
                    if(err) callback(new Error("Error al realizar la consulta en getUserEmail" + err, null));
                    else {
                        if(res.length > 0)  callback(null, true);
                        else callback(null, false);
                    }
                })
            }
        })
    }

    getUserID(email,callback){
        this.pool.getConnection((err,con) => {
            if(err) callback(new Error("Error en la conexión a la base de datos en getUserID"));
            else { 
                con.query("SELECT usuario.id FROM usuario WHERE email = ?",  [email], (err, res) =>{
                    con.release();
                    if(err) callback(new Error("Error al realizar la consulta en getUserID" + err, null));
                    else {
                        if(res.length > 0)  callback(null, res[0].id);
                        else callback(null, null);
                    }
                })
            }
        })
    }

    getUserInfo(idUser,callback){
        this.pool.getConnection((err,con) =>{
            if(err) callback(new Error("Error en la conexión a la base de datos en getUserInfo"));
            else {
                con.query("SELECT * FROM usuario WHERE id = ?", [idUser], (err,res) => {
                    con.release();
                    if(err) callback(new Error("Error al realizar consulta de getUserInfo " + err))
                    else {
                        if(res.length > 0) {
                            let info = {
                                idUser: res[0].id,
                                nombre: res[0].nombre,
                                apellidos: res[0].apellidos,
                                email: res[0].email,
                                password: res[0].password,
                                sexo: res[0].sexo,
                                fecha: res[0].fecha,
                                perfil: res[0].perfil,
                                dni: res[0].dni,
                                telefono: res[0].telefono,
                            }
                            callback(null,info);
                        }
                    }
                })
            }
        })
    }

    getAllPacientes(callback){
        this.pool.getConnection((err,con) =>{
            if(err) callback(new Error("Error al conectarse a la base de datos"));
            else {
                con.query("SELECT * FROM usuario WHERE perfil = 'Paciente'", (err,usuarios) => {
                    con.release();
                    if(err) callback(new Error("Error al realizar la consulta en getAllPacientes" + err));
                    else {
                        callback(null,usuarios);
                    }
                })
            }
        })
    }

    getAllMedicos(callback){
        this.pool.getConnection((err,con) =>{
            if(err) callback(new Error("Error al conectarse a la base de datos"));
            else {
                con.query("SELECT * FROM usuario WHERE perfil = 'Médico'", (err,usuarios) => {
                    con.release();
                    if(err) callback(new Error("Error al realizar la consulta en getAllMedicos" + err));
                    else {
                        callback(null,usuarios);
                    }
                })
            }
        })
    }

    getActivePacientes(callback){
        this.pool.getConnection((err,con) =>{
            if(err) callback(new Error("Error al conectarse a la base de datos"));
            else {
                con.query("SELECT * FROM usuario WHERE perfil = 'Paciente' AND activo = 1", (err,usuarios) => {
                    con.release();
                    if(err) callback(new Error("Error al realizar la consulta en getActivePacientes" + err));
                    else {
                        callback(null,usuarios);
                    }
                })
            }
        })
    }

    getInactivePacientes(callback){
        this.pool.getConnection((err,con) =>{
            if(err) callback(new Error("Error al conectarse a la base de datos"));
            else {
                con.query("SELECT * FROM usuario WHERE perfil = 'Paciente' AND activo = 0", (err,usuarios) => {
                    con.release();
                    if(err) callback(new Error("Error al realizar la consulta en getInactivePacientes" + err));
                    else {
                        callback(null,usuarios);
                    }
                })
            }
        })
    }

    darBajaPaciente(id,callback){
        this.pool.getConnection((err,con) =>{
            if(err) callback(new Error("Error al conectarse a la BD"));
            else {
                con.query("UPDATE usuario SET activo = 0 WHERE id = ?", [id], (err,res) => {
                    con.release();
                    if(err) callback(new Error("Error al realizar la consulta en darBajaPaciente" + err));
                    else {
                        callback(null);
                    }
                })
            }
        })
    }

    darAltaPaciente(id,callback){
        this.pool.getConnection((err,con) =>{
            if(err) callback(new Error("Error al conectarse a la BD"));
            else {
                con.query("UPDATE usuario SET activo = 1 WHERE id = ?", [id], (err,res) => {
                    con.release();
                    if(err) callback(new Error("Error al realizar la consulta en darAltaPaciente" + err));
                    else {
                        callback(null);
                    }
                })
            }
        })
    }

    checkPassword(id, enteredPassword, callback) {
        this.pool.getConnection((err, con) => {
            if (err) {
                callback(new Error("Error al conectarse a la BD"));
            } else {
                const query = "SELECT id, password FROM usuario WHERE id = ?";
                con.query(query, [id], (err, results) => {
                    con.release();
                    if (err) callback(new Error("Error al realizar la consulta en checkPassword" + err));
                    else {
                        if (results.length === 1) {
                            // Si la contraseña introducida es igual a la de la base de datos
                            console.log("Contraseña introducida: " + enteredPassword + ", contraseña pedida: " + results[0].password)
                            if (enteredPassword === results[0].password) {
                                callback(null, true); 
                            } else {
                                callback(null, false);
                            }
                        } else {
                            callback(new Error("Usuario no encontrado"));
                        }
                    }
                });
            }
        });
    }

    // Funciones para el envío de correos electrónicos
    saveResetToken(idUser, token, expirationDate, callback) {
        this.pool.getConnection((err, con) => {
            if (err) {
                callback(new Error("Error en la conexión a la base de datos en saveToken"));
            } else {
                const query = "INSERT INTO tokens (idUser, token, expirationDate) VALUES (?, ?, ?)";
                con.query(query, [idUser, token, expirationDate], (err, result) => {
                    con.release();
                    if (err) {
                        callback(new Error("Error al realizar la consulta en saveResetToken" + err));
                    } else {
                        callback(null, true);
                    }
                });
            }
        });
    }

    getToken(idUser, callback) {
        this.pool.getConnection((err, con) => {
            if (err) {
                callback(new Error("Error en la conexión a la base de datos en getToken"));
            } else {
                const query = "SELECT token, expirationDate FROM tokens WHERE idUser = ?";
                con.query(query, [idUser], (err, result) => {
                    con.release();
                    if (err) {
                        callback(new Error("Error al realizar la consulta en getToken" + err));
                    } else {
                        if (result.length > 0) {
                            const tokenInfo = {
                                token: result[0].token,
                                expirationDate: result[0].expirationDate
                            };
                            callback(null, tokenInfo);
                        } else {
                            callback(null, null);
                        }
                    }
                });
            }
        });
    }

    getUserByResetToken(token, callback) {
        this.pool.getConnection((err, con) => {
            if (err) {
                callback(new Error("Error en la conexión a la base de datos en getUserByResetToken"));
            } else {
                con.query( "SELECT idUser FROM tokens WHERE token = ? AND expirationDate > NOW()", [token], (err, result) => {
                    con.release();
                    if (err) {
                        callback(new Error("Error al realizar la consulta en getUserByResetToken" + err));
                    } else {
                        if (result.length > 0) {
                            const idUsuario = result[0].idUser;
                            console.log(idUsuario);
                            callback(null, idUsuario);
                        } else {
                            callback(new Error("Token de restablecimiento no válido o expirado"));
                        }
                    }
                });
            }
        });
    }

    resetPassword(id, newPassword, callback) {
        this.pool.getConnection((err, con) => {
            if (err) {
                callback(new Error("Error en la conexión a la base de datos en resetPassword"));
            } else {
                con.query("UPDATE usuario SET password = ? WHERE id = ?", [newPassword, id], (err, result) => {
                    if (err) {
                        con.release();
                        callback(new Error("Error al realizar la consulta en resetPassword" + err));
                    } else {
                        con.query("DELETE FROM tokens WHERE idUser = ?", [id], (err2, result2) => {
                            con.release();
                            if (err2) {
                                callback(new Error("Error al eliminar el token de restablecimiento"));
                            } else {
                                if (result2.affectedRows > 0) {
                                    callback(null);
                                } else {
                                    callback(new Error("No se encontró ningún usuario con el id especificado"));
                                }
                            }
                        });
                    }
                });
            }
        });
    }   

}
module.exports = DAOUsers;