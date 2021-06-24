---
title: "Detalles de uso del templater"
label: "Templater"
index: 2
---

# Instructivo del templater

## Carga de templates

Cuando se desea cargar un nuevo template se debe llamar a templater.get(*templates*), donde *templates* es un string de nombres de plantillas separados por coma. Cada nombre de plantilla puede estar compuesto por caracteres y barras separadoras que indicarán cambio de directorio, permitiendo el anidamiento de plantillas.

Cuando se pide la carga de una plantilla con directorio (ej: cuentas/multiplicacion), templater devolverá un método con el nombre de la plantilla, sin incluir el directorio (ej: multiplicacion). **Esto puede ser contraproducente si se tienen varias plantillas con el mismo nombre en diferentes directorios**.

Una vez que el templater carga todas las plantillas pedidas, devuelve un objeto con un método por cada plantilla cargada correctamente. Ej: templater.get('cuentas','razonamientos','hora') devuelve:

```js
  {
    cuentas: (args)=>{}, 
    razonamientos: (args) => {}, 
    hora: (args) => {}
  }
```

En donde **args** es un objeto que puede pasarse opcionalmente. Cada propiedad de este objeto será utilizada para reemplazar elementos de sustitución que puedan existir en la plantilla y luego devolver un objeto compuesto por jq, find y las plantillas existentes dentro de la plantilla. Considerando la plantilla *datosPersonales.tpl*:

```html
  <div>
    {Nombre} bienvenido!
  </div>
  <div class="Template" id="Datos">{Nombre} {Apellido} tiene {Edad} años</div>
```

Un llamado a templater.get('datosPersonales') devolvería el siguiente objeto:

```js
  {
    then: (callback) => {
      callback({
        datosPersonales: (replaceArgs) => {
          // Realizar reemplazos y luego devolver el siguiente obnjeto
          return {
            jq: jQueryObject,
            find: function(jQueryArgs) = jq.find(jQueryArgs),
            Datos: function(replaceArgs)
          }
        }
      })
    }
  }
```

Veamos un ejemplo completo con esta plantilla:

```js
  templater.get('datosPersonales').then(res => {
    res = res.datosPersonales({Nombre: 'Alexis'});

    res.jq.html() //<div>Alexis bienvenido!</div>

    let datos = [
      { Nombre: 'Alexis', Apellido: 'Leite', edad: 30},
      { Nombre: 'Pepito', Apellido: 'Pérez', edad: 100}
    ];

    for(let dato of datos) {
      dato = res.Datos(dato);
      res.jq.append(dato);
    }

    res.jq.html() //<div>Alexis bienvenido!</div><div class="Datos">Alexis Leite tiene 30 años</div>
    // <div class="Datos">Pepito Pérez tiene 100 años</div>

  })
```