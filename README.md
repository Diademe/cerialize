# Dcerialize

Easy serialization through ES7/Typescript annotations

This is a library to make serializing and deserializing complex JS objects a breeze. It works by applying meta data annotations (as described in ES7 proposal and experimental Typescript feature) to fields in a user defined class. It also aims to be compatible with [Newtonsoft](https://www.newtonsoft.com/) a C# library for serialization.

## Concepts
This library works by processing annotations on class types. Annotations are provided for reading (deserializing) and writing (serializing) values to and from json.

Once you have annotated your class types, you can use the `Serialize*` and `Deserialize*`functions to serialize and deserialize your data. 

## Example

```typescript
    
    const ship = new Starship();
    /* assume values assigned */
    const json = Serialize(ship, () => Starship);
    /*
     json = {
        remainingFuel: 500.5,
        capt: {
            name: "Sparrow",
            onDuty: true,
            credits: { amount: 500, currency: "galactic" }
        },
        crew: [
            {
                name: "Bill",
                onDuty: true,
                credits: { amount: 0, currency: "galactic" }
            },
            {
                name: "Ben",
                onDuty: false,
                credits: { amount: 1500, currency: "galactic" }
            },
            {
                name: "Bob",
                onDuty: true,
                credits: { amount: 50, currency: "galactic" }
            }
        ],
        planetsVisited: {
            Tatooine: {
                timeVisited: "Mon Feb 05 2018 11:35:42 GMT+0100 (CET)",
                description: "desert"
            },
            Yavin4: {
                timeVisited: "Tue Feb 06 2018 11:35:42 GMT+0100 (CET)",
                description: "jungle"
            },
            Endor: {
                timeVisited: "Wed Feb 07 2018 11:35:42 GMT+0100 (CET)",
                description: "forest"
            }
        },
        cargo: {
            containers: 4,
            contents: ["lots", "of", "stuff"]
        }
     }    
    */
    const instance = Deserialize(json, () => Starship);
```
## Details
```typescript
    class CrewMember {

        //unannotated properties are not serialized or deserialized, they are totally ignored
        localId :number;

        //serialize and deserialize the crew name as a string
        @autoserializeAs(() => String) name : string;

        //serialize the onDuty property as a boolean, don't deserialize it
        @serializeAs(() => Boolean) onDuty : boolean;

        //deserialize the happiness rating as a number, don't serialize it
        @deserializeAs(() => Number) happinessRating : number;

        //we only want to write our credit value, never deserialize it
        //we want to transform the value into a representation our server
        //understands which is not a direct mapping of number values. 
        //use a custom serialization function instead of a type.
        @serializeUsing(CreditSerializer) credits : number;
    }

    class PlanetLog {
        
        // we handle the timeVisited field specially in our callbacks
        // we do not annotate it so that we can customize it ourselves
        timeVisited : Date;

        // serialize and deserialize description as a string
        @autoserializeAs(() => String) description : string;

        // when serializing our planet log we need to convert the timezone 
        // of the timeVisited value from local time to galactic time
        // (This could also be done via @serializeUsing(Time.toGalacticTime))
        static onSerialized(instance : PlanetLog, json : JsonObject) {
            json["timeVisited"] = Time.toGalacticTime(instance.timeVisited);
        }

        // when deserializing our planet log we need to convert the timezone 
        // of the timeVisited value from galactic to local time  
        // (This could also be done via @deserializeUsing(Time.toLocalTime))
        static onDeserialized(instance : PlanetLog, json : JsonObject, instantiationMethod : boolean) {
            instance.timeVisited = Time.toLocalTime(instance.timeVisited);
        }

    }

    class Starship {

        // when writing our fuel value to the server, we have a number but the server expects a string
        // when reading our fuel value from the server, we receive a string but we want a number
        @serializeAs(() => String) 
        @deserializeAs(() => Number) 
        remainingFuel : number;
        
        // keys can be customized by providing a second argument to any of the annotations
        @autoserializeAs(() => CrewMember, "capt") captain : CrewMember;

        // serialize and deserialize the crew members as an array
        @autoserializeAsArray(() => CrewMember) : crew : Array<CrewMember>;

        // serialize and deserialize our planet log as an indexable map by planet name
        @autoserializeAsObjectMap(() => Planet) : planetsVisited : Indexable<PlanetLog>;

        // we don't have a specific format for cargo, so just serialize and deserialize it as normal json
        @autoserializeAsJSON() cargo : any; 

    }

    // a function to transform our credit amount into a format our server understands
    function CreditSerializer(instance : { credits : number }) : JsonType {
        return { amount: instance.credits, currency: "galactic" };
    }
```
## Annotations

When annotating your classes you can declare which fields get treated as which kinds of values and how they are read and written to and from json format. To specify how fields are written to json, use `@serialize*` annotations. For writing, use `@deserialize*`.

Most annotations take a class constructor. For primitives, use `String`, `Number`, `Boolean`, `Date`, or `RegExp`. For other types, provide the corresponding type constructor. All annotations take an optional argument `customKey` which will overwrite the corresponding key in the output. If no `customKey` is provided, the property key will be the same as defined in the class. For example, if our class has a field called `protons` but our server sends json with `particles` instead, we would use "particles" as the `customKey` value. If no `customKey` is provided, the property key will be the same as defined in the class. 

If you want the same behavior for a property when serializing and deserializing, you can either tag that property with a `@serialize*` and `@deserialize*` or you can use `@autoserializeXXX` which will do this in a single annotation and behave exactly the same as `@serialize*` and `@deserialize*`. The only difference in behavior is that `@autoserializeUsing()` takes an argument of type `SerializeAndDeserializeFns` instead of a single function argument like it's siblings do.

`@serializeAsMap` will convert a [Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map) to an map object (ie an object with keys and values). Due to syntax of javascript, keys can only be int or string. `@deserializeAsMap` will correctly deserialize into a Map.
##### Serialization
- `@serializeAs(type : () => ClassConstructor, customKey? : string)`
- `@serializeAsObjectMap(type : () => ClassConstructor, customKey? : string)`
- `@serializeAsArray(type : () => ClassConstructor, customKey? : string)`
- `@serializeUsing(transform : SerializerFn, customKey? : string)`
- `@serializeAsJson(customKey? : string)`
- `@serializeAsMap(keyType: SerializableType<any>, valueType: SerializableType<any>, constructor?: () => SerializableType<any>, keyName?: string)`
##### Deserialization
- `@deserializeAs(type : () => ClassConstructor, customKey? : string)`
- `@deserializeAsArray(type : () => ClassConstructor, customKey? : string)`
- `@deserializeAsObjectMap(type : () => ClassConstructor, customKey? : string)`
- `@deserializeUsing(transform : DeserializerFn, customKey? : string)`
- `@deserializeAsJson(customKey? : string)`
- `@deserializeAsMap(keyType: () => SerializableType<any>, valueType: () => SerializableType<any>, constructor?: () => SerializableType<any>, keyName?: string)`
##### Serialization and Deserialization
- `@autoserializeAs(type : () => ClassConstructor, customKey? : string)`
- `@autoserializeAsObjectMap(type : () => ClassConstructor, customKey? : string)`
- `@autoserializeAsArray(type : () => ClassConstructor, customKey? : string)`
- `@autoserializeUsing(transforms : SerializeAndDeserializeFns, customKey? : string)`
- `@autoserializeAsJson(customKey? : string)`
- `@autoserializeAsMap(keyType: () => SerializableType<any>, valueType: () => SerializableType<any>, constructor?: () => SerializableType<any>, keyName?: string)`
##### Types
```typescript
 type SerializationFn = <T>(target : T) => JsonType;
 type DeserializationFn = <T>(data : JsonType, target? : T, instantiationMethod? : InstantiationMethod) => T
 type SerializeAndDeserializeFns = { 
     Serialize: SerializationFn,
     Deserialize: DeserializationFn
 }
```

## Serializing Data to JSON
Calling any of the `Serialize*` family of methods will convert the input object into json. The output is a plain javascript object that has not had `JSON.stringify` called on it.

#### Functions for Serializing
Depending on how your data is structured there are a few options for serialization. You can work with single objects, maps of objects, or arrays of objects. 

- `Serialize<T>(target : T, () => ClassConstructor<T>) => JsonObject` 
    ```typescript
        /* takes a single object and serializes it using the provided class type. */
        const ship = new Starship();
        const json = Serialize(ship, () => Starship);
    ```
- `SerializeArray<T>(target : Array<T>, () => ClassConstructor<T>) => JsonArray`
    ```typescript
        /* takes an array of objects and serializes each entry using the provided class type */
        const ships : Array<Starship>;
        const json = SerializeArray(ships, () => Starship);
    ```
- `SerializeMap<T>(target: Indexable<T>, () => ClassConstructor<T>) => JsonObject` 
    ```typescript
        /* takes an indexable object ie `<T>{ [idx: string] : T }` and for each key serializes
         the object using the provided class type. */
        const ships : Indexable<Starship> = { 
            ship1: new Starship(),
            ship2: new Starship() 
        };
        const json = SerializeObjectMap(ships, () => Starship);
    ```
- `SerializeJson(target : any) => JsonType` 
    ```typescript
     /* takes any value and serializes it as json, no structure is assumed 
        and any serialization annotations on any processed objects are totally ignored. */

        const value = {}; /* anything that isn't a function */
        const json = SerializeJson(value);
    ```

## Deserializing From JSON

Calling any of the `Deserialize*` family of methods will convert the input json into an instance of the provided ClassConstructor or a plain JS object if that is preferred (Redux for example, expects plain objects and not instances)

The simplest way to deserialize a piece of JSON is to call `Deserialize(json, () => type)` on it. This function takes the provided type and pulls out all the properties you've tagged with `@deserializeXXX` or `@autoserializeXXX`. It will pump them (recursively) into a new instance of type which is returned. If your type marks a property for deserialization that is itself tagged with deserialization annotations, that property will be hydrated into it's type following the same deserialization algorithm.

#### Deserializing Into Existing Instances

It is also possible to re-use existing objects when deserializing with `Deserialize(json, () => Type, target)`. You might want to do this so that you can maintain references to things even after updating their properties. This is handled exactly the same way as `Deserialize(json, () => Type)` except that it takes one additional argument, the object you want to deserialize properties into. If the target instance you provide is null or undefined, this behaves identically to `Deserialize(json, () => Type)`, otherwise the deserialization will always use existing objects as write targets (if they are defined and of the expected type) instead of creating new ones.

```typescript
    const existingInstance = new Type();
    const instance = Deserialize(json, () => Type, existingInstance);
    expect(existingInstance === instance).toBe(true);
```

#### Deserializing Into Plain Objects

The `instantiationMethod` parameter can be used to change the way in which instances of the input type are created. With `InstantiationMethod.New`, the constructor will be invoked when a new instance needs to be created. With `InstantiationMethod.ObjectCreate`, the object will be created without invoking its constructor, which is useful for systems where constructed objects immediately freeze themselves. With `InstantiationMethod.None`, the `deserializeXXX` functions will return a plain object instead, which can be useful for systems like Redux that expect / require plain objects and not class instances.

```typescript
	import {Deserialize, Instances} from 'dcerialize';
	
	class Immutable {
	
		public value : string;
		
		constructor(value : string) {
			this.value = value;
			Object.freeze(this);
		}
		
		public getValue() : string {
			return value;
		}
		
	}
	
	Deserialize({value: 'example'}, Immutable, InstantiationMethod.New);          // Error because of Object.freeze
	Deserialize({value: 'example'}, Immutable, InstantiationMethod.ObjectCreate); // Immutable {value 'example'}
	Deserialize({value: 'example'}, Immutable, InstantiationMethod.None);         // Object {value: 'example'}
```

The default InstantiationMethod can be changed with `SetDefaultInstantiationMethod(instantiationMethod : InstantiationMethod)`

##### Functions
- `Deserialize<T>(json : JsonObject, () => ClassConstructor<T>, target? : T) : T`
    ```typescript
        /* takes a single object and serializes it using the provided class type. */

        const json = {/* some values from server */};
        const existingInstance = new Starship();        
        const instance = Deserialize(json, () => Starship); // make a new instance
        
        Deserialize(json, Starship, existing); // re-use our existing instance
    ```
- `DeserializeArray<T>(json : JsonArray, () => ClassConstructor<T>, target? : Array<T>) : Array<T>`
    ```typescript
        const json = [
            {/* some values from server */},
            {/* some values from server */},
            {/* some values from server */}
        ];
        const existingInstances = [ new Starship(), new Starship() ];
        const existingArray = [ new Starship() ];
        
        const array = DeserializeArray(json, () => Starship); // make a new array of instances
        
        /* re-use our existing array, if possible use existing instances in array, otherwise create new ones */
        DeserializeArray(json, Starship, existingArray); 
    ```
- `DeserializeMap<T>(json : JsonObject, () => ClassConstructor<T>, target? : Indexable<T>) : Indexable<T>`
    ```typescript
        const json = {
            ship0: {/* some values from server */},
            ship1: {/* some values from server */},
            ship2: {/* some values from server */}
        };
        const existingMap = {
            ship0: new Starship(), 
            ship3: new Starship()
        };
        
        const map = DeserializeMap(json, () => Starship); // make a new map of instances
        
        /* re-use our existing map, in the case of key collision, 
           write new property values into existing instance
           otherwise create new ones */
        DeserializeMap(json, Starship, existingMap); 
    ```
- `DeserializeJson(json : JsonType, target? : any) : any`
    ```typescript
     /* takes any value and deserializes it from json, no structure is assumed 
        and any deserialization annotations on any processed objects are totally ignored. */

        const value = { /* anything that isn't a function */ };
        const json = DeserializeJson(value);
    ```

- `DeserializeRaw<T>(data : JsonObject, type : () => SerializableType<T>, target? : T) : T`  
    `Raw` is a invoke the deserialization with InstantiationMethod set to None.
    ```typescript
        const json = {/* some values from server */};

        //deserialize into a new object
        const newObject = DeserializeRaw(json, Starship);

        //deserialize into an existing object
        const existingObject = {};
        DeserializeRaw(json, Starship, existingObject);
    ```
- `DeserializeArrayRaw<T>(data : JsonArray, type : () => SerializableType<T>, target? : Array<T>) : Array<T>`
    ```typescript
        const json = [
            {/* some values from server */},
            {/* some values from server */},
            {/* some values from server */}
        ];

        // make a new array of plain objects
        const plainObjectArray = DeserializeArrayRaw(json, Starship); 
        const existingArray = [{}, {}];
        
        const value0 = existingArray[0];
        const value1 = existingArray[1];

        /* re-use our existing array, if possible use existing plain objects in array, otherwise create new ones */
        DeserializeArrayRaw(json, () => Starship, existingArray); 
        expect(existingArray[0]).toBe(value0);
        expect(existingArray[1]).toBe(value1);
        expect(existingArray.length).toBe(3);

    ```
- `DeserializeMapRaw<T>(data : Indexable<JsonType>, type : SerializableType<T>, target? : Indexable<T>) : Indexable<T>`
    ```typescript
        const json = {
            ship0: {/* some values from server */},
            ship1: {/* some values from server */},
            ship2: {/* some values from server */}
        };
        const plainObjectMap = DeserializeMapRaw(json, () => Starship); // make a new map of plain objects
        const existingMap = {
            ship0: {},
            ship3: {}
        }
        /* re-use our existing map, if possible use existing plain objects in map, otherwise create new ones */
        DeserializeMapRaw(json, Starship, existingMap); 
    ```
    

## onSerialized Callback 
A callback can be provided for when a class is serialized. To define the callback, add a static method `onSerialized<T>(instance : T, json : JsonObject)` to the class that needs custom post processing. You can either return a new value from this function, or modify the `json` parameter.

```typescript 
    class CrewMember {

        @autoserializeAs(() => String) firstName;
        @autoserializeAs(() => String) lastName;

        static onSerialized(instance : CrewMember, json : JsonObject) {
            json["employeeId"] = instance.lastName.toUpperCase() + ", " + instance.firstName.toUpperCase();
        }

    }
```

## onDeserialized Callback
A callback can be provided for when a class is deserialized. To define the callback, add a static method `onDeserialized<T>(instance : T, json : JsonObject, instantiationMethod = InstantiationMethod.New)` to the class that needs custom post processing. You can either return a new value from this function, or modify the `json` parameter. The `instantiationMethod` parameter signifies whether the initial call to deserialize this object should create instances of the types (when true) or just plain objects (when false)

```typescript 
    class CrewMember {

        @autoserializeAs(() => String) firstName;
        @autoserializeAs(() => String) lastName;

        static onDeserialized(instance : CrewMember, json : JsonObject, instantiationMethod : InstantiationMethod) {
            instance.firstName = json.firstName.toLowerCase();
            instance.lastName = json.lastName.toLowerCase();
        }
    }
```

## Inheriting Serialization
Serialization behavior is not inherited by subclasses automatically. To inherit a base class's serialization / deserialization behavior, tag the subclass with `@inheritSerialization(() => ParentClass)`.

```typescript
    import { inheritSerialization } from 'dcerialize';

    @inheritSerialization(() => User)
    class Admin extends User {

    }
```

## Customizing key transforms

Often your server and your client will have different property naming conventions. For instance, Rails / Ruby generally expects objects to have properties that are under_score_cased while most JS authors prefer camelCase. You can tell Dcerialize to use a certain key transform automatically when serializing and deserializing by calling `SetSerializeKeyTransform(fn : (str : string) => string)` and `SetDeserializeKeyTransform(fn : (str : string) => string)`. A handful of transform functions are provided in this package or you can define your own function conforming to `(key : string) => string`.  
- The provided functions are:
    - `CamelCase`
    - `UnderscoreCase`
    - `SnakeCase`
    - `DashCase`


##### Note
When using `SetDeserializeKeyTransform(fn : (str : string) => string)` you need to provide a function that transforms the EXISTING keys to a format that allows indexing of the input object.
```typescript
    //in this example we expect the server to give us upper cased key names
    //we need to map our local camel cased key to match the server provided key
    //NOT the other way around.
    SetDeserializeKeyTransform(function (value : string) : string {
        return value.toUpperCase();
    });

    class Test {
        @deserializeAs(() => String) value : string;
    }

    const json = {
        VALUE: "strvalue",
    };

    const instance = Deserialize(json, () => Test);
    expect(instance).toEqual({
        value: "strvalue"
    });
```

## Runtime Typing
consider the following case :
```typescript
    class Living;
        whoIAm(): string{
            return "I am a living being";
        }
    }

    @inheritSerialization(() => Living)
    class Dog extends Living;
        whoIAm(): string{
            return "I am a dog";
        }
    }

    @inheritSerialization(() => Living)
    class Fish extends Living;
        whoIAm(): string{
            return "I am a fish";
        }
    }

    let animal: Living[] = [new Fish(), new Dog(), new Living()];
    let json = SerializeAsArray(animal, () => Living);
```
But then, at deserialization you end up with a bunch of Living, but no dog nor fish. The runtime serialization will detect at runtime that there are other types in the array (it also work with simple variable). To do so, a ```$type``` attribute will be added. You have to provide the content of this attribute (it allows you to be compatible with [Newtonsoft](https://www.newtonsoft.com/) TypeNameHandling.Objects settings).
The Runtime typing is enable as follow :
```typescript
    let animal: Living[] = [new Fish(), new Dog(), new Living()];
    RuntimeTypingSetEnable(true);
    RuntimeTypingSetTypeString(Fish, "It's a fish");
    RuntimeTypingSetTypeString(Dog, "and that is a dog");
    RuntimeTypingSetTypeString(Living, "every thing is fine as long as there are no collision");

    let json = SerializeArray(animal, () => Living);
    ...
    let animal_d = DeserializeArray(json, () => Living);
    RuntimeTypingSetEnable(false);
    RuntimeTypingResetDictionary();

```

### Note
In the previous case, it will not enforce a class to be a subclass of Living.
The last two line are not mandatory (if you want to serialize/deserialize more).
Unfortunately, I didn't found a way to add Runtime Typing for Map (or object used as map). You can do the following (use a class that inherits form Map)
```typescript
class MyDico1 extends Map<string, Number>{
}
class Test0 {
    @serializeAsObjectMap(() => Number) public dico1: MyDico1;
}
const s = new Test0();
s.dico1 = new MyDico1([["1", 2], ["2", 3]]);
s.dico1.set("3" , 4);
RuntimeTypingSetEnable(true);
RuntimeTypingSetTypeString(Test0, "my Test0 type");
RuntimeTypingSetTypeString(MyDico1, "my MyDico1 type");
const json = Serialize(s, () => Test0); // {$type: "my Test0 type", dico1: {$type: "my 1 type", 1: 2, 2: 3, 3: 4}}
RuntimeTypingSetEnable(false);
RuntimeTypingResetDictionary();
```

## Default value
### emitDefaultValue
if this decorator has false in it's argument, the variable will not be serialized if it's value is the default.
|   type  | default value |
|:-------:|:-------------:|
| number  |       0       |
| string  |       ""      |
| object  |      null     |
| boolean |     false     |

### defaultValue
This decorator permits to change the default value. It only work with primitive type.
```typescript
    class Test {
        @emitDefaultValue(false)
        @serializeAs(() => Number)
        public valueDefault: number = 0;

        @emitDefaultValue(false)
        @serializeAs(() => Number)
        @defaultValue(2)
        public valueNotDefault1: number = 1;

        @emitDefaultValue(false)
        @serializeAs(() => Number)
        @defaultValue(2)
        public valueNotDefault2: number = 2;
    }
    const t = new Test();
    const json = Serialize(t, () => Test);
    /* { valueNotDefault1: 1 } */

```

## Reference and circular reference
Without this option, the following happens :
```typescript
    class Test {
        @autoserializeAs(() => Number) public value: number = 10;
    }

    class Test0 {
        @autoserializeAs(() => Test) public value0: Test;
        @autoserializeAs(() => Test) public value1: Test;
    }
    const t = new Test();
    const t0 = new Test0();
    t0.value0 = t0.value1 = t;
    const json = Serialize(t0, () => Test0); /*json = {"value0":{"value":10},"value1":{"value":10}}*/
    const obj = Deserialize(json, () => Test0);
    obj.value1 == obj.value0; /*false*/
```
Even if ```t0.value0``` and ```t0.value1``` are the same, they are serialized as to separate object. Event worse, if the references form a loop, the serialization will crash. With SetRefCycleDetection, each object will have its own id, and will be referenced for any other references except the first one.
```typescript
    class Test {
        @deserializeAsJson() public value: number = 10;
    }

    class Test0 {
        @deserializeAsJson() public value0: Test;
        @deserializeAsJson() public value1: Test;
    }
    const json = {
        $id: 1,
        value0: { $id: 2, value: 1 },
        value1: { $ref: 2 }
    };
    SetRefCycleDetection(true);
    const instance = Deserialize(json, () => Test0);
    RefClean();
    SetRefCycleDetection(false);
    obj.value1 == obj.value0; /*true*/
```

### Note
For architectural code choice, during deserialization, the parser must read the object id before any mention of it's reference. For example the following json would crash during deserialization :
```typescript
{
    $id: 1,
    value1: { $ref: 2 },
    value2: { $id: 2, value: 1 }
}
```
Because the reference of object 2 would be read before its id.
The generated json from SetRefCycleDetection is compatible with [PreserveReferencesHandling](https://www.newtonsoft.com/json/help/html/PreserveReferencesHandlingObject.htm) option form newtonsoft.

## Selective serialization
You can serialize only some member and take this decision at runtime using bitmask : affect a bitmask to a member with `serializeBitMask` (up to 2^53). Before serialization, you can set a global bitmask using `SelectiveSerialization`. If and only if the bitmask of the member AND the global bitmask evaluate to true, then the member will be serialized.
```typescript
{
    class Test {
        @serializeBitMask(1)
        @serializeAs(() => Number)
        public v1: number = 1;
        @serializeBitMask(3)
        @serializeAs(() => Number)
        public v2: number = 2;
        @serializeAs(() => Number)
        @serializeBitMask(2)
        public v3: number = 3;
    }
    SelectiveSerialization(1);
    Serialize(s, () => Test); // {v1: 1, v2: 2}
    SelectiveSerialization(2);
    Serialize(s, () => Test); // {v2: 2, v3: 3}
    SelectiveSerialization(3);
    Serialize(s, () => Test); // {v1: 1, v2: 2, v3: 3}
}
```
To reset the selective serialization do `SelectiveSerialization()`.

## Serialize and deserialize Infinities and NaN
By default, `JSON.stringify(Number.POSITIVE_INFINITY)` return null. But we can provide an helper function that will stringify these numbers (Infinities and NaN) to custom string. You can code your own, or use the one provided by this library : `stringifyNumber`. The call will be `JSON.stringify(my object with Infinities, stringifyNumber);`
The same problem arise during parse. Use `JSON.parse('"Infinity"', parseNumber);`.
These two functions are compatible with the [FloatFormatHandling](https://www.newtonsoft.com/json/help/html/T_Newtonsoft_Json_FloatFormatHandling.htm) Newtonsoft option.

## Summary

### Decorator
| serialize         | deserialize         | autoserialize         | 
|-------------------|---------------------|-----------------------| 
| serializeAs       | deserializeAs       | autoserializeAs       | 
| serializeAsArray  | deserializeAsArray  | autoserializeAsArray  | 
| serializeAsJson   | deserializeAsJson   | autoserializeAsJson   | 
| serializeAsObjectMap    | deserializeAsObjectMap    | autoserializeAsObjectMap    | 
| serializeAsMap    | deserializeAsMap    | autoserializeAsMap    |
| serializeUsing    | deserializeUsing    | autoserializeUsing    | 

Other decorators
* inheritSerialization
* serializeBitMask
* emitDefaultValue
* defaultValue

### Setting Accessor
* SetRefCycleDetection
* RefClean
* SetDefaultInstantiationMethod
* SetDeserializeKeyTransform
* SetSerializeKeyTransform
* RuntimeTypingResetDictionary
* RuntimeTypingSetTypeString
* RuntimeTypingSetEnable
* SelectiveSerialization

### Callback
* onDeserialized
* onSerialized

### Good to know
* To reset the selective serialization do `SelectiveSerialization()`.
* You need to specify the type of each member that you want to (de)serialize. Use String, Number, Boolean, Date, or RegExp for primitives types
* Serialization return an *object* that can be stringified (use JSON.stringify after a call to Serialize).
* Deserialization expect an *object* (use JSON.parse before a call to Deserialize).
* You must use the `inheritSerialization` if you want to serialize object with inheritance.
* Use RefClean if you want that `$id` start to one again.
* You don't need to call `RuntimeTypingSetEnable(false)` after a serialization if you want to use it again.
* `@serializeAsArray` expect a non array type (ie if it's an array of `Boolean`, you should give `Boolean` as parameter). Same goes for `@serializeAsObjectMap`.
* `@serializeAsMap` works on [`Map` object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map).