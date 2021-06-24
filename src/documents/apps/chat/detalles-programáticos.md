---
title: "Detalles programáticos del chat"
label: "Detalles programáticos"
---

# Detalles programáticos del chat

Desarrollé este pequeño chat como prueba para realizar una conexión cliente-servidor sobre el protocolo http sin el uso de WebSockets ya que el servidor que yo tengo contratado no ofrece esa opción. El mecanismo utilizado fue el short poll corriendo en un servidor PHP. 

El resultado fue satisfactorio para un número pequeño de usuarios, claramente para realizar esta aplicación a una escala mayor habría que adoptar un método de long poll. Sin embargo hay algunos elementos del código que creo vale la pena explicar. 

Por ejemplo, la comunicación con el servidor desde la aplicación se realiza a través de una clase que desarrollé llamada ServerCommunication y ofrece los cuatro verbos de http como métodos estáticos:

## Comunicación con el servidor

```js
class ServerCommunications {
  static delete(uri, options = {}) {}

  static get(uri, options = {}) {}

  static patch(uri, data={}, options={}) {}

  static post(uri, data = {}, options = {}) {}

  static put(uri, data = {}, options = {}) {}
}
```

Lo interesante de esta clase es que ofrece la posibilidad de centralizar las comunicaciones con el servidor de forma que si existe una falla sea más fácil localizarla. Cada método devuelve una promesa que al cumplirse otorga un objeto json al callback pasado a then. De esta forma, la comunicación es orientada siempre hacia APIs que trabajen en este formato, tal como la que desarrollé para el chat.

## Api en PHP

El api que desarrollé en PHP me parece muy sencilla de usar y a la vez muy potente. La forma de utilizarla es la siguiente: existe una carpeta por cada verbo que el API procese y dentro de cada directorio se pueden incluir tantos scripts php como se desee. Cada script PHP a su vez devuelve un array asociativo en el cual cada clave es una ruta y cada valor una función.

El servidor procesará la petición obtenida desde el cliente y la contrastará con cada ruta declarada en el verbo actual, de todas las que coincida elegirá aquella que tenga mayor longitud y le dará el control a su correspondiente función del proceso actual. Como argumento la función recibirá el resto de cadena dividido por las barras verticales.

### Ejemplo sencillo

```php
$verb = 'GET';
$route = '/ranking/usuarios/1';

// /get/rankings.php

function composeUser($user) {
  return [
    'name' => $user->name,
    'score' => $user->score
  ]
}

return [
  // This route wont be used
  '/ranking/usuarios' => function($arguments) {
    // $arguments = ['1'];

    $userNumber = intval($arguments[0]);
    $user = $users->get($userNumber);

    return composeUser($user);
;
  },

  // Instead, this one will be
  '/ranking/usuarios/1' => function() {
    // The arguments are not important here
    $user = $users->get(1);

    return array_merge(composeUser($user), ['leader' => true]);
  }
]
```

### Implementación del chat

```php
<?php
return [
  'chat' => function () {
    include(baseDir('resources/fakeSocket/fakeSocket.php'));

    try {
      $socket = new FakeSocket(['keepAliveTime' => 1]);
      
      $socket->onConnectionRequest(function ($registerData) use ($socket) {
        if (count(array_filter($socket->online(), function ($el) use ($registerData) {
          return $el['registerData']['name'] === $registerData['name'];
        }))) {
          $socket->setDenyReason("The name is already in use");
          return false;
        }
        return true;
      });

      $socket->onMessage(function ($emitter, $message) use ($socket) {
        $receipt = exists($message, 'to');

        $socket->send($message, $receipt);
        if ($receipt)
          $socket->send($message, $message['from']);
      });

      $res = $socket->print();
      return $res;
    } catch (Exception $e) {
      return error("Socket error", $e->getMessage());
    }
  },
];
```

### Implementación de un sistema de registro

```php
<?php
return [
  'login/' => function () {
    $users = resource('users');

    $wrongCredentials = error(
      'WRONG_CREDENTIALS',
      'The provided credentials are wrong. If you are trying to login as a guest, you must provide your avatar.'
    );

    // Se inicia sesion con usuario y contraseña
    if (isset($_POST['name'], $_POST['pass'])) {
      [$name, $pass] = [$_POST['name'], $_POST['pass']];

      $user = $users->get($name);

      if ($user === null || $user['pass'] !== $pass) return $wrongCredentials;

      if (isset($_POST['remember']) && !isset($user['hash'])) {
        $user['hash'] = randomHash();
        $users->set($name, $user, true);
      }
    }

    // Se inicia sesión con usuario y hash
    else if (isset($_POST['name'], $_POST['hash'])) {
      [$name, $hash] = [$_POST['name'], $_POST['hash']];

      $user = $users->get($name);

      if ($user === null || $user['hash'] !== $hash) return $wrongCredentials;
    }

    // Se inicia sesión como invitado
    else if (isset($_POST['name'], $_POST['asGuest'], $_POST['avatar'])) {
      $user = [
        'name' => $_POST['name'],
        'avatar' => $_POST['avatar']
      ];
    }

    if (!$user) {
      return $wrongCredentials;
    }

    if (isset($user['pass'])) unset($user['pass']);
    return $user;
  },
  'register/' => function () {
    // Not enough data provided
    if (!isset($_POST['name'], $_POST['pass'], $_POST['image']))
      return error('WRONG_PARAMETERS', 'In order to register you must provide a name, a password and an image');

    [$name, $pass, $image] = [$_POST['name'], $_POST['pass'], $_POST['image']];

    $users = resource('users');

    // The user has already been chosen
    if ($users->exists[$name])
      return error('ALREADY_EXISTENT_USER', 'The provided user has already been taken.');

    // Can register the user
    $users->set($name, [
      'name' => $name,
      'pass' => $pass,
      'image' => $image,
      'score' => 0,
      'hash' => randomHash()
    ], true);

    $user = $users->get($name);
    unset($user['pass']);
    return $user;
  }
];
```