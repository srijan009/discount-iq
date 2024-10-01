export const removeUnwantedKeys = ( originalObject: any , allowedKeys: string[]) => {
    const filteredObject = Object.keys(originalObject).reduce((acc: any, key : string) => {
        if (!allowedKeys.includes(key)) {
          acc[key] = originalObject[key];
        }
        return acc;
      }, {});
      return filteredObject
} 