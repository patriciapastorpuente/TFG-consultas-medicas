'use strict'
const moment = require("moment");

class DAOInformes {
    constructor(pool){
        this.pool = pool;
    }

    insertInforme(datos,callback){
        this.pool.getConnection((err,con) =>{
            if(err) callback(new Error("Error en la conexión a la base de datos en insertInforme"));
            else {
                con.query("INSERT INTO informes (idUser,nombre,apellidos,fecha,descripcion,nombreArchivo,archivo) VALUES (?,?,?,?,?,?,?)",
                [   datos.idUser,
                    datos.nombre,
                    datos.apellidos,
                    datos.fecha,
                    datos.descripcion,
                    datos.nombreArchivo,
                    datos.archivo,
                ],
                (err,res) => {
                    con.release();
                    if(err) callback(new Error("Error al realizar la consulta en insertInforme" + err, null))
                    else   callback(null,true);
                })
            }
        })

    }

    getInformesPaciente(id,callback){
        this.pool.getConnection((err,con) =>{
            if(err) callback(new Error("Error en la conexión a la base de datos en insertInforme"));
            else {
                con.query("SELECT * FROM informes WHERE idUser = ?", [id], (err,informes) => {
                    con.release();
                    if(err) callback(new Error("Error al realizar la consulta en getInformesPaciente"));
                    else {
                        callback(null,informes);
                    }
                })
            }
        })
    }

    getInformesInfo(id,callback){
        this.pool.getConnection((err,con) =>{
            if(err) callback(new Error("Error en la conexión a la base de datos en getInformesInfo"));
            else {
                con.query("SELECT * FROM informes WHERE id = ?", [id], (err,res) => {
                    con.release();
                    if(err) callback(new Error("Error al realizar consulta de getInformesInfo " + err))
                    else {
                        if(res.length > 0) {
                            let info = {
                                id: res[0].id,
                                idUser: res[0].idUser,
                                nombre: res[0].nombre,
                                apellidos: res[0].apellidos,
                                fecha: res[0].fecha,
                                descripcion: res[0].descripcion,
                                archivo: res[0].archivo,
                            }
                            callback(null,info);
                        }
                    }
                })
            }
        })
    }

    getUserInforme(id,callback){
        this.pool.getConnection((err,con) => {
            if(err) callback(new Error("Error en la conexión a la base de datos en getUserInforme"));
            else { 
                con.query("SELECT informes.archivo FROM informes WHERE id = ?",  [id], (err, res) =>{
                    con.release();
                    if(err) callback(new Error("Error al buscar informe " + id + " del usuario", null));
                    else {
                        if(res.length > 0)  callback(null,res[0].archivo);
                        else callback(null,null);
                    }
                })
            }
        })
    }

    modificarInforme(datos,callback){
        this.pool.getConnection((err,con) =>{
            if(err) callback(new Error("Error al conectarse a la base de datos en modificarInforme"));
            else {
                con.query("UPDATE informes SET archivo = ?, fecha = ? FROM informes WHERE id = ? AND idUser = ?", [datos.archivo, datos.fecha, datos.idInforme, datos.idPaciente], (err,res) => {
                    con.release();
                    if(err) callback(new Error("Error al modificar informe"));
                    else callback(null);
                })
            }
        })
    }

    eliminarInforme(id,callback){
        this.pool.getConnection((err,con) =>{
            if(err) callback(new Error("Error al conectarse a la base de datos en eliminarInforme"));
            else {
                con.query("DELETE FROM informes WHERE id = ?", [id], (err,res) => {
                    con.release();
                    if(err) callback(new Error("Error al eliminar informe"));
                    else callback(null);
                })
            }
        })
    }

}
module.exports = DAOInformes;