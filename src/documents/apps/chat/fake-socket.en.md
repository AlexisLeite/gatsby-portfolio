---
title: "Fake socket - short poll connection"
label: "Fake Socket Class"
---

# FakeSocket

The fakesocket is a class which allows the user to establish a connection between multiple hosts and a server, in order to share all kind of information, which could be put in a json format. The information you share through the fake socket is not important, its purpose is to give tools to make the connection and keep it alive as long as the server app considers it necessary. 

@author Alexis Leite
@license MIT
 
## Usage
 
### function __construct($options = [])

The socket will behave as a tool to be used by a server Application (from now on: the server), which will offer a service to its clients. It doesn't worry about the content of the service but about the rules of the connections received. To guarantee an stable connection, it has some rules that must be followed.

In order to create a socket in the server, you must instance the class through the new FakeSocket($options) constructor

@param array $options The *optional* options parameter, if given might be an associative array containing the configurations you want to set. Those configurations are:

- bool **keepAlive**: When enabled, the server will close those connections which don't update their state, and will consider them as lost. This gives you the opportunity to know which clients are online and which are not.
- number **keepAliveTime**: This time is set in seconds and is the time which must pass from the moment the client receives the answer from the server and when it sends back the keepAlive package.
- number **keepAliveTolerance**: This time is set in seconds and is a tolerance to consider the connection time. Ifit's set too short, there it will be probably accidental disconnections.
- number **mantainFrecuency**: This time is set in seconds, the server will execute each given time in seconds a mantainance to delete the old information from the records, in order to keep the server fluid.
- bool **revealClients**: If enabled, the server will send to the clients a list and the correspondent updates about the status of the clients. This way, they will be able to mantain an updated list of online clients on every moment.

The default options are:

```json
[
'keepAlive' => true,
'keepAliveTime' => 5,
'keepAliveTolerance' => 10,
'mantainFrecuency' => 20,
'revealClients' => true
];
```

@throws OutOfBoundsException when the passed array has incorrect keys in order to prevent grammar errors.

#### Example

```php

$socket = new Socket([
'keepAlive' => true, // Enable the keepAlive functionality
'keepAliveTime' => 1, // Expect the keepAlive package to be sent each 1 second
'keepAliveTolerance' => 8, // Give a tolerance of 8 seconds on each keepAlive
'revealClients' => true // Send to the clients a list of all the online clients
]);

```

## The protocol

In order to process correctly the information received, the socket accepts a strict set of rules that must match in order to continue with the comunication. In other words, if these rules are not matched, the server closes the connection.

There are various scenarios which the socket handle, and are described here:

### The first connection

When the client wants to establish a connection, it must declare it as the socket must ask for permission to the server. The implementation is discused in [@onConnectionRequest](#function-onconnectionrequestcallback). To do so, it must send the following package:

```json
[
"action": "register",
"registerData": {} // The contents of the registerData object is not of matter of the socket, it will just pass it to the server and depending on its answer, will allow or deny the connection.
]
```

### Sending messages to the server

Each time the client must send a message to the server, it must use the following format:

```json
[
"action": "post",
"messages": [{}, {}, {}] // Each message can be either an array, an object, an string or wathever. As with the registerData, the socket doesn't worry about its contents. Its only mission is to deliver it to the server. The implementation is described in [@onMessage](#onMessage).
"hash": "..." // The hash is privided by the server as an identification, it must be sent with all the requests in order to the socket to accept it
]
```

### Just keeping alive

If there is no need to send messages, but the client does not want to lose the connection, it can send the following package:

```json
[ "action": "keepAlive", "hash": "..." ]
```

### Disconnecting

It is a good practice to disconnect when the service won't be used anymore. Despite the fact that te server will close the connections automatically, if you close the unused connections, it will work faster.

```json
[ "action": "disconnect", "hash": "..." ]
```

### Requests and answers

Each time you send a request it will give and answer, it will depend on the context and the request. The following table is a quick guide about the possible answers:

| Request action and  properties           | Possible answer status | Possible answer properties                 |
| ---------------------------------------- | ---------------------- | ------------------------------------------ |
| action:"register", registerData: {...}   | ok                     | hash, registerData, clientsList, keepAlive |
| action:"post", messages:[...], hash: ... | ok                     | keepAlive, clientsList, messages           |
| action:"keepAlive", hash: ...            | ok                     | keepAlive, clientsList, messages           |
| action:"disconnect", hash: ...           | connectionEnd          |                                            |
| any request                              | error                  | message, title                             |

 


## Events
 
### function onConnectionRequest($callback)

Each time a client sends a register request, this event will be fired. In order to accept or reject that request, a callback must be passed. If no callback received, every connection will be rejected. The connection will be accepted only if this callback returns true and rejected in any other case.

@param function callback($registerData) a function which accepts the registerData object and returns a bool

#### Example

```php
$socket = new FakeSocket();
$socket->onConnectionRequest(function(&$registerData) use ($socket) {
if(!$this->isRegistered($registerData['name'])) {
$socket->setDenyReason('Unregistered name');
return false;
} else return true;
});
```

  It is highly recomended to delete the information you consider private on the registerData array through accepting that array as a reference. This way you can keep it private, otherwise it will be sent to all the clients if revealClients is enabled.

[@see setDenyReason](#function-setdenyreasonreason)
 
### function onMessage($callback)

Each time a client sends a message, it will be sent to the server through this event. What to do with the messages is pure responsibility of the server.

@param function callback($emitterHash, $message) a function which accepts the message

#### Example

```php
$socket = new FakeSocket();
$socket->onMessage(function($emitter, $message) use ($socket) {
if($this->validate($emitter, $message)) {
$socket->send($message); // Broadcast it back to all clients
}
});
```

[@see send](#function-sendmessage-receipt--null)
 
## Regular methods
 
### function online()

This methods returns a list of all online clients on the moment it's called. 

@return Array each element of the array is an associative array with the following properties: hash, registerData, status
 
### function print()

This method is mandatory to be called, if it's not the socket won't work at all as it wont send any answer to the client.

#### Example

```php
$socket = new FakeSocket();
$socket->onConnectionRequest(function($registerData) use ($socket) { ... });
$socket->onMessage(function($message) use ($socket) { ... });
$socket->print();
```

@return Array This associative array can be used in any way the server considers appropriate but it was thought as to be used in a json_encode echo.
 
### function send($message, $receipt = null)

This method is the one who sends messages to the clients. It allows to broadcast some information or to send to a particular client. 

@param any $message The object which will be sent to the client, it must be capable of being parsed to json

@param string $receipt It's the hash of the client to who you want to send the message. The client's hashes are provided through the public method [@see online](#function-online) or through the clientsList property sent to the clients when the revealClients option is enabled.

#### Example

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

When the server receives a connection and it does not pass the validation, that request will be denied. In order to inform the client, the server can call this method and set the reason.

@param any $reason: It can be anything which could be parsed to json

#### Example

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