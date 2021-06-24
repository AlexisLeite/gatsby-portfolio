interface Suscription {
  callback: () => {};
  id: number;
  cancel: () => {};
}

export function EasyEvents(target: any) {
  target.easyEventsId = 0;
  target.easyEvents = [];

  target.addEvent = function (name: string) {
    name = ucFirst(name);
    target.easyEvents.push(name);
    target[`on${name}Callbacks`] = [];
    target[`onRegister${name}Callbacks`] = [];
    target[`off${name}`] = function (suscription: Suscription) {
      if (exists(target, `on${name}Callbacks`))
        target[`on${name}Callbacks`] = target[`on${name}Callbacks`].filter(
          (record: any) =>
            record.callback &&
            record.id &&
            (record.callback !== suscription.callback ||
              record.id !== suscription.id)
        );
    };
    target[`on${name}`] = function (callback: (...args: any) => {}) {
      if (typeof callback == "function") {
        let id = target.easyEventsId++;
        target[`on${name}Callbacks`].push({ callback: callback, id });

        for (let onRegisterCb of target[`onRegister${name}Callbacks`]) {
          onRegisterCb.callback(callback);
        }

        return {
          callback,
          id,
          cancel: () => {
            target[`off${name}`]({ callback, id });
          },
        };
      }
    };
    target[`onRegister${name}`] = function (cb: (...args: any) => {}) {
      if (typeof cb == "function") {
        let newId = target.easyEventsId++;
        target[`onRegister${name}Callbacks`].push({ callback: cb, id: newId });
        return newId;
      }
    };

    target[`fire${name}`] = function (...args: any) {
      for (let record of target[`on${name}Callbacks`]) record.callback(...args);
    };
  };

  target.addEvents = function (events: string[]) {
    for (let event of events) {
      target.addEvent(event);
    }
  };

  target.off = function (event: string, suscription: any) {
    if (`off${ucFirst(event)}` in target)
      return target[`off${ucFirst(event)}`]();
  };

  target.on = function (event: string, handler: any) {
    if (!(`on${ucFirst(event)}` in target)) {
      target.addEvent(event);
    }
    return target[`on${ucFirst(event)}`](handler);
  };
}

export function exists(obj: any, route: string, cb?: (foundObj: any) => {}) {
  let splitRoute = route.split(".");
  for (let dir of splitRoute) {
    if (
      !(typeof obj === "object" || typeof obj === "function") ||
      obj === null ||
      !(dir in obj)
    )
      return false;
    obj = obj[dir];
  }

  if (typeof cb === "function") cb(obj);
  return obj;
}

export function ucFirst(word: string): string {
  return word.charAt(0).toUpperCase() + word.substring(1);
}
