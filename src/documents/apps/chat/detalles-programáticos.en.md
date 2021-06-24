---
title: "Programmatic details of chat"
label: "Programmatic details"
---

# Programmatic details of chat

I have developed this little chat application as a way to test a real time communication between the server and the clients without using Web sockets, yet my hosting service does not allow it. The used technique is short polling on a PHP server.

The result is successful for a small number of users, in a high demand scenario it would be probably a good idea to choose long poll technique. However, there are some code elements that can be highlighted:

One of them is the communication with the server from the React applicacion, it's made through a class I wrote which exposes one method for each http verb:

## Communicating with server

```js
class ServerCommunications {
  static delete(uri, options = {}) {}

  static get(uri, options = {}) {}

  static patch(uri, data={}, options={}) {}

  static post(uri, data = {}, options = {}) {}

  static put(uri, data = {}, options = {}) {}
}
```

The interesting part is the possibility of putting all comunications together such a way the debuging process will be easier. Each method returns a promise that when accomplished gives the caller a JSON object ready to be used. This way, all the communication process is made in order to make request against a JSON api, which is what I made for the chat.

## PHP API

The API I developed is very simple and powerful. It is very easy to be implemented, there is one folder for each verb you want to implement, inside each of those folders it could be as many php scripts as you want and each one of them must return an associative array. Each key of the array will be a route of your API and each value will be it's corresponding execution method.

The server will process each request and will compare the route against each route you declared, this way it will use the route which match with the requested and whose length is the biggest. That function must return an object containing the server's answer and accept an $arguments array which will contain all the unmatched slugs of the request, exploded by '/'.

### Simple example of matching process

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

### Chat implementation

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

### Login and register system

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