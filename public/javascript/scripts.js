// FUNCIONES COMUNES
$("#buscar").keyup(function(){
    var buscando = $(this).val().toLowerCase();
    $("table tbody tr").each(function(){
    var encontrado = false;
    $(this).find("td").each(function(){
        if ($(this).text().toLowerCase().indexOf(buscando) !== -1) {
        encontrado = true;
        return false;
        }
    });
    if (encontrado) {
        $(this).show();
    } else {
        $(this).hide();
    }
    });
});

function seleccionarHora(evento) {
    console.log(evento.target.value);
    $.ajax({
        url: "/getCitas",
        type: 'POST',
        data: {
            fecha: evento.target.value
        },
        dataType: "JSON",
        success: (data) => {
            console.log(data);
            let datos = "";
            datos += `<select name="hora" class="form-select" id="hora" required>`;
            let horasDisponibles = []; // Array para almacenar las horas disponibles
            for (let hora = 10; hora < 20; hora++) {
                const encontrado = data.find((h) => {
                    return hora == parseInt(h.hora.split(":")[0]);
                });
                // Si la hora no está ocupada, la agregamos al array de horas disponibles
                if (!encontrado) {
                    horasDisponibles.push(hora);
                }
            }
            // Llenamos el dropdown con las horas disponibles
            horasDisponibles.forEach(hora => {
                datos += `<option value="${hora}:00:00">${hora}:00</option>`;
            });
            datos += `</select>`;
            // Actualizamos el contenido del dropdown
            $('#horasDispo').html(datos);
        },
    });
}

//TABLAS CITAS
//muestra la tabla de las citas totales
//Simula el envío del formulario al cargar la página
function confirmarArchivadoCita(idCita) {
    if (confirm("¿Estás seguro de que quieres archivar esta cita?")) {
        window.location.href = "/archivarCita/" + idCita; // Redirige a la página de archivo del paciente si el usuario confirma
    }
}

function confirmarCancelarCita(idCita) {
    if (confirm("¿Estás seguro de que quieres cancelar esta cita?")) {
        window.location.href = "/cancelarCita/" + idCita; // Redirige a la página de archivo del paciente si el usuario confirma
    }
}

function cambioColorCita(botonColor){
    $(`#botonTodas`).removeClass('btn-secondary');
    $(`#botonTodas`).addClass('btn-primary');
    $(`#botonPresencia`).removeClass('btn-secondary');
    $(`#botonPresencia`).addClass('btn-primary');
    $(`#botonTelefonica`).removeClass('btn-secondary');
    $(`#botonTelefonica`).addClass('btn-primary');
    $(`#botonVideo`).removeClass('btn-secondary');
    $(`#botonVideo`).addClass('btn-primary');
    $(`#${botonColor}`).removeClass('btn-primary');
    $(`#${botonColor}`).addClass('btn-secondary');
}

$(document).ready(function(){
    $(`#botonTodas`).removeClass('btn-primary');
    $(`#botonTodas`).addClass('btn-secondary');
    $('#todasLista').submit(); 
})

$('#todasLista').on( "submit",function( e ) {
    e.preventDefault();
    $('#headListaCitas').empty();
    $('#headListaCitas').append(`<tr>
        <th scope="col" class="cursor" id="nombre">Nombre</th>
        <th scope="col" class="cursor" id="apellido">Apellidos</th>
        <th scope="col" class="cursor" id="tipo">Tipo</th>
        <th scope="col" class="cursor" id="fecha">Fecha cita</th>
        <th scope="col" class="cursor" id="hora">Hora</th>
        <th scope="col"></th>
        <th scope="col"></th>
        <th scope="col"></th>
    </tr>`);

    var formData = $('#todasLista').serialize();
    $.ajax({
        url: "/citasTotales",
        type: 'POST',
        dataType: "JSON",
        data: formData,
        success: (data) => {
            data.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
            let datos = ""
            $('#tablaListaCitas').empty();
            data.forEach(d =>{
                datos += `<tr>
                    <td class="custom">${d.nombre}</td>
                    <td class="custom">${d.apellidos}</td>
                    <td class="custom">${d.tipo}</td>
                    <td class="custom">${new Date(d.fecha).toLocaleDateString()}</td>
                    <td class="custom">${parseInt( d.hora.split(":")[0])}:00</td>
                    <td class="custom"> <a type="button" class="btn" onclick="confirmarCancelarCita(${d.id})"><img src="/img/iconos/eliminar2.png" width="25" height="25" title="Eliminar cita"></a></td>
                    <td class="custom"> <a type="button" class="btn" onclick="modificarCita(${d.id})" title="Modificar cita"><img src="/img/iconos/editar.png" width="25" height="25" title="Modificar"></a></td>
                    <td class="custom"> <a type="button" class="btn" onclick="confirmarArchivadoCita(${d.id})" title="Archivar cita"><img src="/img/iconos/archivar.png" width="25" height="25" title="Archivar paciente"></a></td>
                </tr>`
            })
            $('#tablaListaCitas').append(datos);
            $('#tablaListaCitas').attr('hidden', false);
        },
    });
});

//muestra la tabla de las citas presenciales
 $('#listaPresen').on( "submit",function( e ) {
    e.preventDefault();
    $('#headListaCitas').empty();
    $('#headListaCitas').append(`<tr>
        <th scope="col" class="cursor" id="nombre">Nombre</th>
        <th scope="col" class="cursor" id="apellido">Apellidos</th>
        <th scope="col" class="cursor" id="tipo">Tipo</th>
        <th scope="col" class="cursor" id="fecha">Fecha cita</th>
        <th scope="col" class="cursor" id="hora">Hora</th>
        <th scope="col"></th>
        <th scope="col"></th>
        <th scope="col"></th>
    </tr>`);

    var formData = $('#listaPresen').serialize();
    $.ajax({
        url: "/citasPresenciales",
        type: 'POST',
        dataType: "JSON",
        data: formData,
        success: (data) => {
            data.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
            let datos = ""
            $('#tablaListaCitas').empty();
            data.forEach(d =>{
                datos += `<tr>
                    <td class="custom">${d.nombre}</td>
                    <td class="custom">${d.apellidos}</td>
                    <td class="custom">${d.tipo}</td>
                    <td class="custom">${new Date(d.fecha).toLocaleDateString()}</td>
                    <td class="custom">${parseInt( d.hora.split(":")[0])}:00</td>
                    <td class="custom"> <a type="button" class="btn" onclick="confirmarCancelarCita(${d.id})"><img src="/img/iconos/eliminar2.png" width="25" height="25" title="Eliminar cita"></a></td>
                    <td class="custom"> <a type="button" class="btn" onclick="modificarCita(${d.id})" title="Modificar cita"><img src="/img/iconos/editar.png" width="25" height="25" title="Modificar"></a></td>
                    <td class="custom"> <a type="button" class="btn" onclick="confirmarArchivadoCita(${d.id})" title="Archivar cita"><img src="/img/iconos/archivar.png" width="25" height="25" title="Archivar paciente"></a></td>
                </tr>`
            })
            $('#tablaListaCitas').append(datos);
            $('#tablaListaCitas').attr('hidden', false);
        },
    });
});

//muestra la tabla de las citas telefonicas
$('#listaTelef').on( "submit",function( e ) {
    e.preventDefault();
    $('#headListaCitas').empty();
    $('#headListaCitas').append(`<tr>
        <th scope="col" class="cursor" id="nombre">Nombre</th>
        <th scope="col" class="cursor" id="apellido">Apellidos</th>
        <th scope="col" class="cursor" id="tipo">Tipo</th>
        <th scope="col" class="cursor" id="fecha">Fecha cita</th>
        <th scope="col" class="cursor" id="hora">Hora</th>
        <th scope="col"></th>
        <th scope="col"></th>
        <th scope="col"></th>
    </tr>`);

    var formData = $('#listaTelef').serialize();
    $.ajax({
        url: "/citasTelefonicas",
        type: 'POST',
        dataType: "JSON",
        data: formData,
        success: (data) => {
            data.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
            let datos = ""
            $('#tablaListaCitas').empty();
            data.forEach(d =>{
                datos += `<tr>
                    <td class="custom">${d.nombre}</td>
                    <td class="custom">${d.apellidos}</td>
                    <td class="custom">${d.tipo}</td>
                    <td class="custom">${new Date(d.fecha).toLocaleDateString()}</td>
                    <td class="custom">${parseInt( d.hora.split(":")[0])}:00</td>
                    <td class="custom"> <a type="button" class="btn" onclick="confirmarCancelarCita(${d.id})"><img src="/img/iconos/eliminar2.png" width="25" height="25" title="Eliminar cita"></a></td>
                    <td class="custom"> <a type="button" class="btn" onclick="modificarCita(${d.id})" title="Modificar cita"><img src="/img/iconos/editar.png" width="25" height="25" title="Modificar"></a></td>
                    <td class="custom"> <a type="button" class="btn" onclick="confirmarArchivadoCita(${d.id})" title="Archivar cita"><img src="/img/iconos/archivar.png" width="25" height="25" title="Archivar paciente"></a></td>
                </tr>`
            })
            $('#tablaListaCitas').append(datos);
            $('#tablaListaCitas').attr('hidden', false);
        },
    });
});

//muestra la tabla de las citas telefonicas
$('#listaVideo').on( "submit",function( e ) {
    e.preventDefault();
    $('#headListaCitas').empty();
    $('#headListaCitas').append(`<tr>
    <th scope="col" class="cursor" id="nombre">Nombre</th>
    <th scope="col" class="cursor" id="apellido">Apellidos</th>
    <th scope="col" class="cursor" id="tipo">Tipo</th>
    <th scope="col" class="cursor" id="fecha">Fecha cita</th>
    <th scope="col" class="cursor" id="hora">Hora</th>
    <th scope="col"></th>
    <th scope="col"></th>
    <th scope="col"></th>
    </tr>`);

    var formData = $('#listaVideo').serialize();
    $.ajax({
        url: "/citasVideoconferencia",
        type: 'POST',
        dataType: "JSON",
        data: formData,
        success: (data) => {
            data.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
            let datos = ""
            $('#tablaListaCitas').empty();
            data.forEach(d =>{
                datos += `<tr>
                <td class="custom">
                    ${d.nombre}
                </td>
                <td class="custom">
                    ${d.apellidos}
                </td>
                <td class="custom">
                    ${d.tipo}
                </td>
                <td class="custom">
                    ${new Date(d.fecha).toLocaleDateString()}
                </td>
                <td class="custom">
                    ${parseInt( d.hora.split(":")[0])}:00
                </td>
                <td class="custom"> <a type="button" class="btn" onclick="confirmarCancelarCita(${d.id})"><img src="/img/iconos/eliminar2.png" width="25" height="25" title="Eliminar cita"></a></td>
                <td class="custom"> <a type="button" class="btn" onclick="modificarCita(${d.id})" title="Modificar cita"><img src="/img/iconos/editar.png" width="25" height="25" title="Modificar"></a></td>
                <td class="custom"> <a type="button" class="btn" onclick="confirmarArchivadoCita(${d.id})" title="Archivar cita"><img src="/img/iconos/archivar.png" width="25" height="25" title="Archivar paciente"></a></td>
                </tr>`
            })
            $('#tablaListaCitas').append(datos);
            $('#tablaListaCitas').attr('hidden', false);
        },
    });
});

//TABLAS CITAS ARCHIVADAS
$(document).ready(function(){
    $('#totalCitasArch').submit(); 
})

$('#totalCitasArch').on( "submit",function( e ) {
    e.preventDefault();
    $('#headListaCitasArchivadas').empty();
    $('#headListaCitasArchivadas').append(`<tr>
    <th scope="col" class="cursor" id="nombre">Nombre</th>
    <th scope="col" class="cursor" id="apellido">Apellidos</th>
    <th scope="col" class="cursor" id="tipo">Tipo</th>
    <th scope="col" class="cursor" id="fecha">Fecha cita</th>
    <th scope="col" class="cursor" id="hora">Hora</th>
    </tr>`);

    var formData = $('#totalCitasArch').serialize();
    $.ajax({
        url: "/citasTotalesArchivadas",
        type: 'POST',
        dataType: "JSON",
        data: formData,
        success: (data) => {
            data.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
            let datos = ""
            $('#tablaListaCitasArchivadas').empty();
            data.forEach(d =>{
                datos += `<tr>
                <td class="custom">
                    ${d.nombre}
                </td>
                <td class="custom">
                    ${d.apellidos}
                </td>
                <td class="custom">
                    ${d.tipo}
                </td>
                <td class="custom">
                    ${new Date(d.fecha).toLocaleDateString()}
                </td>
                <td class="custom">
                    ${parseInt( d.hora.split(":")[0])}:00
                </td>
                </tr>`
            })
            $('#tablaListaCitasArchivadas').append(datos);
            $('#tablaListaCitasArchivadas').attr('hidden', false);
        },
    });
});

//muestra la tabla de las citas presenciales
$('#PresenArchi').on( "submit",function( e ) {
    e.preventDefault();
    $('#headListaCitasArchivadas').empty();
    $('#headListaCitasArchivadas').append(`<tr>
    <th scope="col" class="cursor" id="nombre">Nombre</th>
    <th scope="col" class="cursor" id="apellido">Apellidos</th>
    <th scope="col" class="cursor" id="tipo">Tipo</th>
    <th scope="col" class="cursor" id="fecha">Fecha cita</th>
    <th scope="col" class="cursor" id="hora">Hora</th>
    </tr>`);

    var formData = $('#PresenArchi').serialize();
    $.ajax({
        url: "/citasPresencialesArchivadas",
        type: 'POST',
        dataType: "JSON",
        data: formData,
        success: (data) => {
            data.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
            let datos = ""
            $('#tablaListaCitasArchivadas').empty();
            data.forEach(d =>{
                datos += `<tr>
                <td class="custom">
                    ${d.nombre}
                </td>
                <td class="custom">
                    ${d.apellidos}
                </td>
                <td class="custom">
                    ${d.tipo}
                </td>
                <td class="custom">
                    ${new Date(d.fecha).toLocaleDateString()}
                </td>
                <td class="custom">
                    ${parseInt( d.hora.split(":")[0])}:00
                </td>
                </tr>`
            })
            $('#tablaListaCitasArchivadas').append(datos);
            $('#tablaListaCitasArchivadas').attr('hidden', false);
        },
    });
});

//muestra la tabla de las citas telefonicas
$('#TelefArchi').on( "submit",function( e ) {
    e.preventDefault();
    $('#headListaCitasArchivadas').empty();
    $('#headListaCitasArchivadas').append(`<tr>
    <th scope="col" class="cursor" id="nombre">Nombre</th>
    <th scope="col" class="cursor" id="apellido">Apellidos</th>
    <th scope="col" class="cursor" id="tipo">Tipo</th>
    <th scope="col" class="cursor" id="fecha">Fecha cita</th>
    <th scope="col" class="cursor" id="hora">Hora</th>
    </tr>`);

    var formData = $('#TelefArchi').serialize();
    $.ajax({
        url: "/citasTelefonicasArchivadas",
        type: 'POST',
        dataType: "JSON",
        data: formData,
        success: (data) => {
            data.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
            let datos = ""
            $('#tablaListaCitasArchivadas').empty();
            data.forEach(d =>{
                datos += `<tr>
                <td class="custom">${d.nombre}</td>
                <td class="custom">${d.apellidos}</td>
                <td class="custom">${d.tipo}</td>
                <td class="custom">${new Date(d.fecha).toLocaleDateString()}</td>
                <td class="custom">${parseInt( d.hora.split(":")[0])}:00</td>
                </tr>`
            })
            $('#tablaListaCitasArchivadas').append(datos);
            $('#tablaListaCitasArchivadas').attr('hidden', false);
        },
    });
});

//muestra la tabla de las citas telefonicas
$('#VideoArchi').on( "submit",function( e ) {
    e.preventDefault();
    $('#headListaCitasArchivadas').empty();
    $('#headListaCitasArchivadas').append(`<tr>
    <th scope="col" class="cursor" id="nombre">Nombre</th>
    <th scope="col" class="cursor" id="apellido">Apellidos</th>
    <th scope="col" class="cursor" id="tipo">Tipo</th>
    <th scope="col" class="cursor" id="fecha">Fecha cita</th>
    <th scope="col" class="cursor" id="hora">Hora</th>
    </tr>`);

    var formData = $('#VideoArchi').serialize();
    $.ajax({
        url: "/citasVideoconferenciaArchivadas",
        type: 'POST',
        dataType: "JSON",
        data: formData,
        success: (data) => {
            data.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
            let datos = ""
            $('#tablaListaCitasArchivadas').empty();
            data.forEach(d =>{
                datos += `<tr>
                <td class="custom">${d.nombre}</td>
                <td class="custom">${d.apellidos}</td>
                <td class="custom">${d.tipo}</td>
                <td class="custom">${new Date(d.fecha).toLocaleDateString()}</td>
                <td class="custom">${parseInt( d.hora.split(":")[0])}:00</td>
                </tr>`
            })
            $('#tablaListaCitasArchivadas').append(datos);
            $('#tablaListaCitasArchivadas').attr('hidden', false);
        },
    });
});

//MODAL DE LA PARTE DE SUBIR INFORME
let id_paciente;
let nombreUsu;
let apellidosUsu;
let id_informe;

function subirYEliminar(id_paciente, nombreUsu, apelliodsUsu, id_informe) {
    subirInforme(id_paciente, nombreUsu, apelliodsUsu);
    eliminarInforme(id_paciente, id_informe);
 }

function subirInforme(id_paciente, nombreUsu, apelliodsUsu) {
    console.log("Función subirInforme ejecutada");
    $('#id_paciente').val(id_paciente);
    $('#nombreUsu').val(nombreUsu);
    $('#apellidosUsu').val(apelliodsUsu);
    $('#modalInforme').modal('show');
}

function eliminarInforme(id_paciente, id_informe) {
    // Aquí puedes enviar una solicitud AJAX para eliminar el informe
    $.ajax({
        url: '/eliminarInforme/' + id_paciente + '/' + id_informe,
        type: 'GET',
        success: function(response) {
            // Manejar la respuesta si es necesario
            console.log('Informe eliminado con éxito');
        },
        error: function(xhr, status, error) {
            // Manejar errores si es necesario
            console.error('Error al eliminar el informe:', error);
        }
    });
}


$('#formInforme').on( "submit", function( e ) {
    e.preventDefault();
    var formData = new FormData($('#formInforme')[0]);
    $.ajax({
        url: "/subirInforme",
        type: 'POST',
        data: formData,
        cache: false,
        contentType: false,
        processData: false,
        success: (data) => {
            console.log(data)
            $('#modalInforme').modal('hide');
            alert(data.error);
            location.reload();
        },
        
    });
})

function actualizarInforme(id_paciente, id_informe) {
    console.log("Función modificarInforme ejecutada");
    $('#id_paciente').val(id_paciente);
    $('#id_informe').val(id_informe);

    $('#modalModificarInforme').modal('show');
}

$('#formModificarInforme').on( "submit", function( e ) {
    e.preventDefault();
    $.ajax({
        url: "/modificarInforme",
        type: 'POST',
        data: $('#formModificarInforme').serialize(),
        dataType:"JSON",
        success: (data) => {
            console.log(data)
            $('#modalModificarInforme').modal('hide');
            alert(data.error);
            location.reload();
        },
    });
})

//MODAL DE LA PARTE DE ENVIAR MENSAJES
let id_Receptor;
let id_Texto;
let id_Asunto;
let id_Emisor;
let id_Mensaje;
function enviarCorreo(idReceptor) {
    id_Receptor = idReceptor;
    $('#modalMensaje').modal('show');
}

function responderCorreo(idReceptor, descrip) {
    id_Receptor = idReceptor;
    id_Asunto = descrip;
    console.log(id_Asunto);
    $('#AsuntoMensaje').val(id_Asunto);
    $('#modalResponderMensaje').modal('show');
}

function lookCorreo(id, idEmisor, idReceptor, asunto, texto) {
    id_Receptor = idReceptor;
    id_Asunto = asunto;
    id_Texto = texto;
    id_Emisor = idEmisor;
    id_Mensaje = id;
    $('#idMensaje').val(id_Mensaje);
    $('#idEmisor').val(id_Emisor);
    $('#correoEmisor').val(id_Receptor);
    $('#AsuntoM').val(id_Asunto);
    $('#textoMensaje').val(id_Texto);
    $('#modalVerMensaje').modal('show');

}

function lookCorreoEnviado(asunto, texto) {
    id_Asunto = asunto;
    id_Texto = texto;
    $('#motivo').val(id_Asunto);
    $('#descripcion').val(id_Texto);
    $('#modalVerMensajesEnviados').modal('show');

}

function cambioColorMensaje(botonColor){
    $(`#botonVerCorreo`).removeClass('btn-secondary');
    $(`#botonVerCorreo`).addClass('btn-primary');
    $(`#botonEnviados`).removeClass('btn-secondary');
    $(`#botonEnviados`).addClass('btn-primary');
    $(`#botonEnviar`).removeClass('btn-secondary');
    $(`#botonEnviar`).addClass('btn-primary');
    $(`#${botonColor}`).removeClass('btn-primary');
    $(`#${botonColor}`).addClass('btn-secondary');
}

//publica el mensaje
$('#formMensaje').submit(function(e){
    e.preventDefault();
    var formData = $('#formMensaje').serializeArray();
    formData.push({name: "idReceptor", value: id_Receptor});
    console.log(formData);
    $.ajax({
        url: "/mensajes",
        type: 'POST',
        dataType: "JSON",
        data: formData,
        success: (data) => {
            alert("Correo enviado correctamente");
            $('#modalMensaje').modal('hide');
        },
    });
});

//publica respuesta
$('#formRespuesta').submit(function(e){
    e.preventDefault();
    var formData = $('#formRespuesta').serializeArray();
    formData.push({name: "idReceptor", value: id_Receptor},{name: "asunto", value: id_Asunto});
    console.log(formData);
    // Realizar la acción adicional
    var idMensaje = document.getElementById('idMensaje').value;
    var url = '/mensajeVisto/' + idMensaje;
    window.location.href = url;
    
    $.ajax({
        url: "/mensajes",
        type: 'POST',
        dataType: "JSON",
        data: formData,
        success: (data) => {
            console.log(formData);
            alert("Correo enviado correctamente");
            $('#modalResponderMensaje').modal('hide');
        },
    });
});

// Captura la fecha actual del sistema
var fechaActual = new Date();

// Formatea la fecha en el formato deseado (por ejemplo, yyyy-mm-dd)
var fechaFormateada = fechaActual.getFullYear() + '-' + ('0' + (fechaActual.getMonth() + 1)).slice(-2) + '-' + ('0' + fechaActual.getDate()).slice(-2);

// Asigna la fecha formateada al campo de entrada de texto
document.getElementById('fechaSist').value = fechaFormateada;

//Simula el envío del formulario al cargar la página
$(document).ready(function(){
    $(`#botonVerCorreo`).removeClass('btn-primary');
    $(`#botonVerCorreo`).addClass('btn-secondary');
    $('#verCorreos').submit(); 
})

//muestra la tabla de los usuarios a los que se les puede enviar mensaje
//y abre el modal para enviar este
$('#listaMensaje').on( "submit",function( e ) {
    e.preventDefault();
    $('#headCorreos').empty();
    $('#headCorreos').append(`<tr>
    <th scope="col">Nombre</th>
    <th scope="col">Apellidos</th>
    <th scope="col">Enviar</th>
    </tr>`);

    var formData = $('#listaMensaje').serialize();
    $.ajax({
        url: "/enviarMensaje",
        type: 'POST',
        dataType: "JSON",
        data: formData,
        success: (data) => {
            let datos = ""
            $('#tablaCorreos').empty();
            data.forEach(d =>{
                datos += `<tr>
                <td class="custom">
                    ${d.nombre}
                </td>
                <td class="custom">
                    ${d.apellidos}
                </td>
                <td class="custom"> <a type="button" class="btn btn_secondary" onclick="enviarCorreo(${d.id})"><img src="/img/iconos/enviar.png" width="25" height="25" title="Enviar"></a>
                </td>
                </tr>`
            })
            $('#tablaCorreos').append(datos);
            $('#tablaCorreos').attr('hidden', false);
        },
    });

});

//muestra la tabla de los correos que ha recibido este usuario
//y abre el modal para poder responder a los mensajes
$('#verCorreos').on( "submit",function( e ) {
    e.preventDefault();
    $('#headCorreos').empty();
    $('#headCorreos').append(`<tr>
    <th scope="col"></th>
    <th scope="col">Fecha</th>
    <th scope="col">Nombre</th>
    <th scope="col">Apellidos</th>
    <th scope="col">Asunto</th>
    <th scope="col">Mensaje</th>
    <th scope="col"></th>
    </tr>`);

    var formData = $('#verCorreos').serialize();
    $.ajax({
        url: "/verMisMensajes",
        type: 'POST',
        dataType: "JSON",
        data: formData,
        success: (data) => {
            data.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
            let datos = ""
            $('#tablaCorreos').empty();
            data.forEach(d =>{

                const estiloMensaje = d.visto === 1 ? 'table-primary' : ''; // Si visto es 1, aplica negrita

                datos += `<tr class="${estiloMensaje}">
                <td class="custom"><a type="button" class="btn btn_primary" href="/mensajeVisto/${d.id}"><img src="/img/iconos/mensaje-no-leido.png" width="25" height="25" title="Marcar como leido">
                </td>
                <td class="custom">
                    ${new Date(d.fecha).toLocaleDateString()}
                </td>
                <td class="custom">
                    ${d.nombre}
                </td>
                <td class="custom">
                    ${d.apellidos}
                </td>
                <td class="custom">
                    ${d.asunto}
                </td>
                <td class="custom">
                    ${d.texto.substring(0, 20)}${d.texto.length > 20 ? '...' : ''} <!-- Muestra solo los primeros 10 caracteres -->
                </td>
                <td class="custom"> <a type="button" class="btn btn_primary" onclick="lookCorreo(${d.id}, ${d.idEmisor},'${d.email}','${d.asunto}', '${d.texto.replace(/(?:\r\n|\r|\n)/g, '\\n')}')"><img src="/img/iconos/ver1.png" width="25" height="25" title="Ver datos"></a>
                </td>
                </tr>`
            })
            $('#tablaCorreos').append(datos);
            $('#tablaCorreos').attr('hidden', false);
        },
    });
});

//tabla para mis mensajes enviados 
$('#correosEnviados').on( "submit",function( e ) {
    e.preventDefault();
    $('#headCorreos').empty();
    $('#headCorreos').append(`<tr>
    <th scope="col">Fecha</th>
    <th scope="col">Nombre</th>
    <th scope="col">Apellidos</th>
    <th scope="col">Asunto</th>
    <th scope="col">Mensaje</th>
    <th scope="col"></th>
    </tr>`);

    var formData = $('#correosEnviados').serialize();
    $.ajax({
        url: "/verMensajesEnviados",
        type: 'POST',
        dataType: "JSON",
        data: formData,
        success: (data) => {
            data.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
            let datos = ""
            $('#tablaCorreos').empty();
            data.forEach(d =>{

                datos += `<tr>
                <td class="custom">
                    ${new Date(d.fecha).toLocaleDateString()}
                </td>
                <td class="custom">
                    ${d.nombre}
                </td>
                <td class="custom">
                    ${d.apellidos}
                </td>
                <td class="custom">
                    ${d.asunto}
                </td>
                <td class="custom">
                    ${d.texto.substring(0, 20)}${d.texto.length > 20 ? '...' : ''} <!-- Muestra solo los primeros 10 caracteres -->
                </td>
                <td class="custom"> <a type="button" class="btn btn_primary" onclick="lookCorreoEnviado('${d.asunto}', '${d.texto.replace(/(?:\r\n|\r|\n)/g, '\\n')}')"><img src="/img/iconos/ver1.png" width="25" height="25" title="Ver datos"></a>
                </td>
                </tr>`
            })
            $('#tablaCorreos').append(datos);
            $('#tablaCorreos').attr('hidden', false);
        },
    });
});