---
title: "Fake socket - short poll connection"
label: "Fake Socket Class"
---

# FakeSocket

La clase Fakesocket permite al usuario establecer una conexión entre múltiples clientes y un servidor y compartir cualquier información que pueda ser convertida a formato JSON. Qué información sea compartida no es importante para el socket, su único propósito es brindar herramientas para realizar la conexión y mantenerla activa mientras la aplicación servidor lo considere necesario.

@author Alexis Leite
@license MIT
 
## Uso
 
### function __construct($options = [])

El socket podrá ser utilizado por una aplicación de servidor (desde ahora, el servidor) que ofrecerá un servicio a sus clientes. El mismo no se preocupa por el contenido del servicio pero si por la forma en que las conexiones son establecidas. Para garantizar conexiones estables, el socket tiene algunas reglas que deben ser seguidas.

Para crear un socket en el servidor, se debe instanciar la clase a través del constructor **new FakeSocket($options)**.

@param array $options Este parámetro es **opcional**, si es pasado al constructor debe ser un array asociativo conteniendo las configuraciones apropiadas:

- bool **keepAlive**: Si se pasa true, el server cerrará aquellas conexiones que no actualicen su estado y las considerará perdidas. A través de este mecanismo, es posible saber qué clientes están activos en todo momento y cuáles no.
- number **keepAliveTime**: Tiempo en segundos, establece qué período debe pasar hasta que el servidor cierre una conexión porque la considere perdida. Para mantener una conexión activa, el cliente debe enviar periodicamente un mensaje de keepAlive.
- number **keepAliveTolerance**: Este tiempo establecido en segundos marca una tolerancia en el recibo de paquetes keepAlive, se utiliza en consideración de las demoras inherentes en cualquier conexión http.
- number **mantainFrecuency**: Tiempo en segundos, el servidor realizará tareas de mantenimiento periodicamente, cada **mantainFrecuency** segundos para eliminar mensajes y registros de conexión viejos. De esta forma los registros se mantienen livianos y se mejora el rendimiento.
- bool **revealClients**: Si está establecido en true, el servidor enviará a los clientes una lista de todos los clientes activos. 

Las opciones por defecto son:

```json
[
'keepAlive' => true,
'keepAliveTime' => 5,
'keepAliveTolerance' => 10,
'mantainFrecuency' => 20,
'revealClients' => true
];
```

**@throws OutOfBoundsException** Si el array pasado tiene una composición incorrecta de forma de prevenir errores gramaticales.

#### Example

```php

$socket = new Socket([
'keepAlive' => true, // Enable the keepAlive functionality
'keepAliveTime' => 1, // Expect the keepAlive package to be sent each 1 second
'keepAliveTolerance' => 8, // Give a tolerance of 8 seconds on each keepAlive
'revealClients' => true // Send to the clients a list of all the online clients
]);

```

## El protocolo

Para procesar correctamente la información recibida, el socket establece una serie estricta de reglas que deben ser seguidas para mantener la comunicación. En otras palabras, si estas reglas no son respetadas el servidor cerrará la conexión.

Los escenarios que el socket maneja son los siguientes:

### Primera conexión

Cuando un cliente establece una conexión con el servidor debe dejarlo claro ya que el socket pedirá permiso a la aplicación servidor para aceptarlo. La implementación está detallada en [@onConnectionRequest](#function-onconnectionrequestcallback). Para establecer una conexión, se debe enviar el siguiente paquete:

```json
[
"action": "register",
"registerData": {} // The contents of the registerData object is not of matter of the socket, it will just pass it to the server and depending on its answer, will allow or deny the connection.
]
```

### Enviando mensajes al servidor

Cada vez que un cliente desea enviar un mensaje al servidor, debe componer un paquete como el siguiente:

```json
[
"action": "post",
"messages": [{}, {}, {}] // Cada mensaje puede ser un array, un objeto o lo que sea. El socket no se preocupa por el contenido siempre y cuando pueda ser convertido a JSON.
"hash": "..." // El hash es devuelto por el servidor en el registro, deberá ser utilizado en cada subsecuente llamada comoo identificación
]
```

### Mantener la conexión viva

Si no hay nada para enviar pero el cliente desea mantener viva la conexión, deberá enviar un paquete de **keepAlive** como el siguiente:

```json
[ "action": "keepAlive", "hash": "..." ]
```

### Desconexión

Es importante que los clientes avisen al servidor antes de desconectarse, de modo de mantener la aplicación liviana. A pesar de que esta parte del protocolo se cumpla o no, el servidor sabrá cuando un cliente se desconecta de todas formas, la diferencia radica en el tiempo que el servidor sigue intentando conectarse con el cliente cuando éste se desconecta sin avisar.

```json
[ "action": "disconnect", "hash": "..." ]
```

### Peticiones y respuestas

Cada vez que se realice una petición al servidor, este devolverá un paquete con información, a continuación se exponen los paquetes que serán devueltos según la petición realizada:

| Petición: acción y propiedades           | Status                 | Posibles propiedades devueltas             |
| ---------------------------------------- | ---------------------- | ------------------------------------------ |
| action:"register", registerData: {...}   | ok                     | hash, registerData, clientsList, keepAlive |
| action:"post", messages:[...], hash: ... | ok                     | keepAlive, clientsList, messages           |
| action:"keepAlive", hash: ...            | ok                     | keepAlive, clientsList, messages           |
| action:"disconnect", hash: ...           | connectionEnd          |                                            |
| any request                              | error                  | message, title                             |

 


## Eventos
 
### function onConnectionRequest($callback)

Cada vez que el cliente envíe una petición de registro, este evento será disparado. Para poder aceptar o rechazar una esa petición se debe pasar un callback como parámetro. Si no se recibe el callback, todas las conexiones serán rechazadas. La conexión solamente será aceptada cuando el callback pasado devuelva true.

@param function callback($registerData) Una función que acepta un objeto *registerData* y devuelve un bool

#### Ejemplo

```php
$socket = new FakeSocket();
$socket->onConnectionRequest(function(&$registerData) use ($socket) {
if(!$this->isRegistered($registerData['name'])) {
$socket->setDenyReason('Nombre no registrado');
return false;
} else return true;
});
```

Es muy importante que aquella información que el servidor considere privada debe ser eliminada del objeto registerData. Para ello, el objeto registerData deberá ser declarado como referencia en la firma de la función. De esta forma cuando el servidor envíe la información de los clientes activos, esta información no estará presente.

[@see setDenyReason](#function-setdenyreasonreason)
 
### function onMessage($callback)

Cada vez que un cliente envía un mensaje, este evento será disparado. Registrarse a este evento es la forma de recibir dichos mensajes. Una vez que el servidor los entrega a la aplicación servidor no se preocupa por ellos más, debe ser la aplicación servidor quien decida qué hacer con ellos. 

Por ejemplo, podría alterar información en sus registros internos, realizar un broadcast, enviar un mensaje a un cliente particular o cualquier otra acción que considere apropiada.

@param function callback($emitterHash, $message) Una función que acepte los parámetros indicados.

#### Ejemplo

```php
$socket = new FakeSocket();
$socket->onMessage(function($emitter, $message) use ($socket) {
if($this->validate($emitter, $message)) {
$socket->send($message); // Broadcast it back to all clients
}
});
```

[@see send](#function-sendmessage-receipt--null)
 
## API pública
 
### function online()

Este método devuelve una lista de los clientes activos.

@return Array Cada elemento del array es un array asociativo que contiene las siguientes propiedades: hash, registerData, status
 
### function print()

Es importante llamar siempre a este método ya que de otra forma el socket no responderá al cliente.

#### Ejemplo

```php
$socket = new FakeSocket();
$socket->onConnectionRequest(function($registerData) use ($socket) { ... });
$socket->onMessage(function($message) use ($socket) { ... });
echo json_encode($socket->print());
```

@return Array Un array asociativo que puede ser usado por la aplicación servidor de la forma que le parezca apropiada. El uso más sencillo es a través del método json_encode.
 
### function send($message, $receipt = null)

Este método es el encargado de enviar mensajes a los clientes. Permite enviar mensajes con destinatario o broadcasts.

@param any $message El objeto que será enviado al cliente, debe ser posible convertirlo a json.

@param string $receipt **optional** Si no es pasado, se realiza un broadcast. Si es pasado, debe ser el hash del cliente al que se desea enviar. Es posible obtener una lista de clientes a través del método online o a través de la opción revealClients del constructor. 

#### Ejemplo

```php
$socket = new FakeSocket();
... // Handle register requests
$socket->send("Important: the server will add some extra features!"); // Broadcasts a message
$socket->onMessage(function($emitter, $message) use ($socket) {
$socket->send("We received your message", $emitter); // Answer the message
});
```

[@see online](#function-online)
 
### function setDenyReason($reason)

Cuando el servidor recibe una petición de conexión y esta no pasa la validación, esta conexión será rechazada. Es posible informar al cliente el motivo de este rechazo a través de este método.

@param any $reason: Cualquier cosa que pueda ser convertida a json.

#### Ejemplo

```php
$socket = new FakeSocket();
$socket->onConnectionRequest(function($registerData) use ($socket) {
if(!$this->isRegistered($registerData['name'])) {
$socket->setDenyReason('Unregistered name');
return false;
}
});
```

[@see onConnectionRequest](#function-onconnectionrequestcallback)