---
title: "Chat en React con backend en PHP"
label: "Chat"
---

# Chat en React y PHP

En realidad empecé a diseñar un protocolo de comunicación entre cliente y servidor que pudiera trabajar sin Sockets y para probarlo desarrollé este sencillo chat. Algunas de las características que tiene son:

- Sala general y salas individuales.
- Aviso de mensajes no leídos.
- Aviso de desconexión de cliente.
- Mensaje de *Escribiendo...* para saber que la otra persona está activa en el chat.

## Vista previa

`youtube: https://youtu.be/rTRnT-IngNw`

## Algunas características notables

### Uso con el teclado

La aplicación entera puede ser utilizada con el teclado solamente de forma relativamente cómoda. Todos los comandos necesarios pueden ser alcanzados mediante tabulación o mediante la tecla Enter si se desea enviar un mensaje.

### Diseño responsivo

Como es bien sabido, cualquier aplicación moderna debe ser capaz de mostrarse correctamente en cualquier dispositivo. O al menos en los dispositivos en los que pretende ser utilizada. El resultado de cumplir con esta exigencia es el siguiente:

![](./responsive-design.png "Diseño responsivo")

