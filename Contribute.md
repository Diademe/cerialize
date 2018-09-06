# Contribute to the project
You are welcome to contribute to this project. If you do, you must ensure that you do not break the current set of test, and you must add test for your new feature / bug correction. 

## Setting up the environnement
[Fork this repository](https://help.github.com/articles/fork-a-repo/), and checkout the dev branch (this is the most up to date branch). Then create your own feature branch, and do a [pull requests](https://help.github.com/articles/about-pull-requests/).

### Testing and prettier
This project use *jest* as testing library, and *tslint* as prettier.
To set them up, do the following `npm install`. To run test, use `npm run test` and to check the formating, use `npm run tslint`.  
To add tests, simply add them to the existing files, or add a new file with `.spec.ts` as extension in the spec folder.

## Where do I start ?
This section will help you to discover the project by (re)creating the `@serializeBitMask` [**Parameter Decorator**](https://www.typescriptlang.org/docs/handbook/decorators.html#parameter-decorators). This decorator will allow us to tag a member of a class, and serialize only the member that are tagged with a specific label. We will use bit field to represent the label.

* ### step 1, Decorator
All decorator are located in the *annotations.ts* file. Our decorator will need an extra parameter (the label: a number), so we will create a factory decorator (*serializeBitMask*):
```typescript
export function serializeBitMask(bitMask: number): any {
    return function(target: any, actualKeyName: string): any {
        /* not implemented yet */
    };
}
```
The factory collect one extra parameter (*bitMask*), and return the actual decorator that will be called during the parse.
The factory need to be exported as it is part of the user interface. Check that whatever you need to expose is indeed exported in *index.ts*.

* ### step 2, Metadata
the bitmask need to be saved, and we should be able to access it during the serialization. A popular library is [reflect-metadata](https://www.npmjs.com/package/reflect-metadata). There are two downside to this library: an extra dependency, and a poor support for circular dependency. So the creator of cerialize implement is own system: a map that associate a constructor of a class to all its parameters decorated. More precisely, each time we save some data for a parameter, we will create a new *MetaData* MD object that will be associated to the constructor of the class. This MD object will store the information we need. In our case, this will be the label. We add a member (*bitMaskSerialize*) to the *MetaData* class in *meta_data.ts*.
```typescript
export function serializeBitMask(bitMask: number): any {
    return function(target: any, actualKeyName: string): any {
        const metadata = MetaData.getMetaData( /* create a new MetaData object, or return one that was previously created by a decorator on the same parameter */
            target.constructor,
            actualKeyName
        );
        metadata.bitMaskSerialize = bitMask; /* save our label in the MetaData object */
    };
}
```

* ### step 3, Serialization
Serialization functions are in  *serialize.ts*. We need one additional procedure to define what label we want to use as a filter for serialization.
```typescript
let serializeBitMaskPrivate = Number.MAX_SAFE_INTEGER; /* an ugly global variable to save the label */

export function SelectiveSerialization(
    bitMask: number = Number.MAX_SAFE_INTEGER
) {
    serializeBitMaskPrivate = bitMask;
}
```
We have now every information we need to do the actual serialization. The serialization takes place in the function `Serialize`. This function will scan all metadata associated to the class associated to the object being serialized. Each metadata corresponds to a parameter decorator and a bunch of information including the type of name and type of the decorated member. `Serialize` will dispatch the serialization to the right function (SerializeArray, SerializePrimitive ...). We need to prevent the dispatch if the label of the member being serialized doesn't correspond to the one set with the `SelectiveSerialization` procedure. To do that, we can `continue` the loop scanning the metadata.
```typescript
for (const metadata of metadataList) { /* loop scanning metadata*/
    if (!(metadata.bitMaskSerialize & serializeBitMaskPrivate)) { /* check that the label correspond to the one set by SelectiveSerialization */
        continue;
    }
```
And we are done !

### More information

### Index
This file expose the api of *dcerialize*. If you add functionality, check that it is exported in *index.ts*

### Annotations
A decorator is a function that will most likely gather information about a type of a member of a class during the parse of the class, and use this information during serialization and deserialization. A new decorator should be added in the *annotations.ts* file.

### Metadata
All information collected by the decorators are stored in objects of type *MetaData* class in *meta_data.ts*. If you want to store additional information *A*, you will need to:
* Set a default value for *A* in the constructor of *MetaData*.
* Modify *clone* with to deal with *A*. This step is also mandatory, otherwise the information *A* wil not be accessible in case of inheritance.

### Ref Cycle
Functions used to deal with reference and reference loop.

### Runtime typing
Functions and data structures to store an unique identifier for each type, and recover the type given the identifier.

### String transforms
Functions to transform all identifier with a given style (CamelCase, UnderscoreCase ...).

### Utils
Some helper functions.

### Serialize
Function used to serialize:
* `SerializeObjectMap`: serialize non es6 Map like object.
* `SerializeMap`: serialize es6 Map like object.
* `SerializeArray`: serialize array like object.
* `SerializeSet`: serialize set like object.
* `SerializePrimitive`: serialize primitive value (boolean, number, string, date, regex).
* `SerializeJSON`: serialize object without taking into account decorators (selective serialization isn't taken into account).
* `Serialize`: dispatch to object to be serialized to the above functions.
* `defaultValue`: test if a given value is the default one.
* `SelectiveSerialization`: set the bitmask for the next serialization.

### Deserialize
Function used to deserialize. Unlike in serialize, each function has an api, and a private function. This allow us to test somme global parameter prior to the deserialization. The api has 4 parameters: the object *O* to be deserialized, the type of the object, an object in which *O* will be deserialized (or null to create a new one), 
* `DeserializeObjectMap`: deserialize non es6 Map.
* `DeserializeMap`: deserialize es6 Map. Can take a constructor as argument if you need to deserialize in a class that inherit from an es6 Map.
* `DeserializeArray`: deserialize array like object. Same remarque as above.
* `DeserializePrimitive`: deserialize primitive value.
* `DeserializeJSON`: deserialize object without taking into account decorators.
* `Deserialize`: dispatch to object to be deserialized to the above functions
* `DeserializeRaw`: same as above, but with InstantiationMethod set to None.
* `DeserializeArrayRaw`: same as above, but with InstantiationMethod set to None.
* `DeserializeMapRaw`: same as above, but with InstantiationMethod set to None.


## Good to know
* If your new decorator need a non primitive type, you should ask this type in parameter. Do not try to infer it with `instanceof` as it is incompatible with the style of this library (a previous version of the library cerialize on which dcerialize is based tried to check the type with `instanceof`, the code was difficult to read).
* If your new decorator need a type (primitive or not), ask your user to provide it via a factory (an anonymous function returning it works perfectly). This prevent the error in which the required type is not yet available during the parse. [See this article](https://blog.angularindepth.com/what-is-forwardref-in-angular-and-why-we-need-it-6ecefb417d48).