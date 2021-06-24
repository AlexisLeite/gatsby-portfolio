---
title: "Details of templater usage"
label: "Templater"
index: 2
---

# Templater usage

## Loading templates

When a template must be laoded, the templater.get method must be called. As parameter an string containing a comma-separated list of template names must be passed.

The templates can be nested deeply in the templates directory but every template will be returned by its name. **This may generate name conflicts.**

When the templater has loaded all the requested templates, it returns an object containing one method for each one of them. Example: templater.get('cuentas','razonamientos','hora') returns:

```js
  {
    cuentas: (args)=>{}, 
    razonamientos: (args) => {}, 
    hora: (args) => {}
  }
```

**args** is an object that can be passed as parameter optionally. Each property of this object will be used to replace a placeholder declared on the template. The method returns an object with the following properties: jq, find and one additional property for each sub-template declared within the template. Consideer the following template *datosPersonales.tpl*:

```html
  <div>
    {Nombre} bienvenido!
  </div>
  <div class="Template" id="Datos">{Nombre} {Apellido} tiene {Edad} años</div>
```

Calling templater.get('datosPersonales') must return the following object:

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

Let's see an example of how to use it:

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