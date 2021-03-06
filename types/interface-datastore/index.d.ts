// Type definitions for interface-datastore 1.0
// Project: https://github.com/ipfs/interface-datastore#readme
// Definitions by: Carson Farmer <https://github.com/carsonfarmer>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped
/// <reference types="node" />
/// <reference lib="dom" />
// TypeScript Version: 3.6

// From https://github.com/IndigoUnited/js-err-code
// Used here specifically for string-based error codes only
export interface ErrCode extends Error {
    code: string; // any | undefined
    // [key: string]: any
}

export namespace Errors {
    function dbOpenFailedError(error: Error): ErrCode;
    function dbDeleteFailedError(error: Error): ErrCode;
    function dbWriteFailedError(error: Error): ErrCode;
    function notFoundError(error: Error): ErrCode;
    function abortedError(error: Error): ErrCode;
}

/**
 * Key/Value pair.
 */
export interface Pair<Value = Buffer> {
    key: Key;
    value: Value;
}

/**
 * Options for async operations.
 */
export interface Options {
    signal: AbortSignal;
}

/**
 * Base Interface Datastore Adapter.
 */
export abstract class Adapter<Value = Buffer> {
    abstract open(): Promise<void>;
    abstract close(): Promise<void>;
    /**
     * Store the passed value under the passed key
     *
     * @param key
     * @param val
     * @param options
     */
    abstract put(key: Key, val: Value, options?: Options): Promise<void>;
    /**
     * Store the given key/value pairs
     *
     * @param source
     * @param options
     */
    putMany(
        source: AsyncIterable<Pair<Value>> | Iterable<Pair<Value>>,
        options?: Options,
    ): AsyncIterableIterator<Pair<Value>>;

    /**
     * Retrieve the value for the passed key
     *
     * @param key
     * @param options
     */
    abstract get(key: Key, options?: Options): Promise<Value>;
    /**
     * Retrieve values for the passed keys
     *
     * @param source
     * @param options
     */
    getMany(source: AsyncIterable<Key> | Iterable<Key>, options?: Options): AsyncIterableIterator<Value>;

    /**
     * Check for the existence of a value for the passed key
     *
     * @param key
     */
    abstract has(key: Key): Promise<boolean>;

    /**
     * Remove the record for the passed key
     *
     * @param key
     * @param options
     */
    abstract delete(key: Key, options?: Options): Promise<void>;
    /**
     * Remove values for the passed keys
     *
     * @param source
     * @param options
     */
    deleteMany(source: AsyncIterable<Key> | Iterable<Key>, options?: Options): AsyncIterableIterator<Key>;
    /**
     * Create a new batch object.
     */
    batch(): Batch<Value>;
    /**
     * Query the store.
     *
     * @param q
     * @param options
     */
    query(q: Query<Value>, options?: Options): AsyncIterable<Pair<Value>>;
}

export namespace utils {
    function filter<T>(iterable: AsyncIterable<T>, filterer: (item: T) => boolean): AsyncGenerator<T>;
    function sortAll<T>(iterable: AsyncIterable<T>, sorter: (items: T[]) => T[]): AsyncGenerator<T>;
    function take<T>(iterable: AsyncIterable<T>, n: number): AsyncGenerator<T>;
    function map<T, O>(iterable: AsyncIterable<T>, mapper: (item: T) => O): AsyncGenerator<O>;
    function replaceStartWith(s: string, r: RegExp): string;
    function tmpdir(): string;
}

export class MemoryDatastore<Value = Buffer> extends Adapter<Value> {
    constructor();
    open(): Promise<void>;
    close(): Promise<void>;
    put(key: Key, val: Value): Promise<void>;
    get(key: Key): Promise<Value>;
    has(key: Key): Promise<boolean>;
    delete(key: Key): Promise<void>;
    _all(): AsyncIterable<Pair<Value>>;
}

export interface Batch<Value = Buffer> {
    put(key: Key, value: Value): void;
    delete(key: Key): void;
    commit(options?: Options): Promise<void>;
}

export namespace Query {
    type Filter<Value = Buffer> = (item: Pair<Value>) => boolean;
    type Order<Value = Buffer> = (items: Array<Pair<Value>>) => Array<Pair<Value>>;
}

export interface Query<Value = Buffer> {
    prefix?: string;
    filters?: Array<Query.Filter<Value>>;
    orders?: Array<Query.Order<Value>>;
    limit?: number;
    offset?: number;
    keysOnly?: boolean;
}

/**
 * A Key represents the unique identifier of an object.
 * Our Key scheme is inspired by file systems and Google App Engine key model.
 * Keys are meant to be unique across a system. Keys are hierarchical,
 * incorporating more and more specific namespaces. Thus keys can be deemed
 * 'children' or 'ancestors' of other keys:
 * - `new Key('/Comedy')`
 * - `new Key('/Comedy/MontyPython')`
 * Also, every namespace can be parametrized to embed relevant object
 * information. For example, the Key `name` (most specific namespace) could
 * include the object type:
 * - `new Key('/Comedy/MontyPython/Actor:JohnCleese')`
 * - `new Key('/Comedy/MontyPython/Sketch:CheeseShop')`
 * - `new Key('/Comedy/MontyPython/Sketch:CheeseShop/Character:Mousebender')`
 *
 */
export class Key {
    constructor(s: Buffer | string, clean?: boolean);
    /**
     * Convert to the string representation
     *
     * @param encoding The encoding to use. Should default to 'utf8'.
     */
    toString(encoding?: string): string;
    /**
     * Return the buffer representation of the key
     */
    toBuffer(): Buffer;
    /**
     * Return string representation of the key
     */
    get [Symbol.toStringTag](): string;
    /**
     * Constructs a key out of a namespace array.
     *
     * @param list The array of namespaces
     *
     * @example
     * Key.withNamespaces(['one', 'two'])
     * // => Key('/one/two')
     */
    static withNamespaces(list: string[]): Key;
    /**
     * Returns a randomly (uuid) generated key.
     *
     * @example
     * Key.random()
     * // => Key('/f98719ea086343f7b71f32ea9d9d521d')
     *
     */
    static random(): Key;
    /**
     * Cleanup the current key
     */
    clean(): void;
    /**
     * Check if the given key is sorted lower than ourself.
     *
     * @param key The other Key to check against
     */
    less(key: Key): boolean;
    /**
     * Returns the key with all parts in reversed order.
     *
     * @example
     * new Key('/Comedy/MontyPython/Actor:JohnCleese').reverse()
     * // => Key('/Actor:JohnCleese/MontyPython/Comedy')
     */
    reverse(): Key;
    /**
     * Returns the `namespaces` making up this Key.
     */
    namespaces(): string[];
    /**
     * Returns the "base" namespace of this key.
     *
     * @example
     * new Key('/Comedy/MontyPython/Actor:JohnCleese').baseNamespace()
     * // => 'Actor:JohnCleese'
     */
    baseNamespace(): string;
    /**
     * Returns the `list` representation of this key.
     *
     * @example
     * new Key('/Comedy/MontyPython/Actor:JohnCleese').list()
     * // => ['Comedy', 'MontyPythong', 'Actor:JohnCleese']
     */
    list(): string[];
    /**
     * Returns the "type" of this key (value of last namespace).
     *
     * @example
     * new Key('/Comedy/MontyPython/Actor:JohnCleese').type()
     * // => 'Actor'
     */
    type(): string;
    /**
     * Returns the "name" of this key (field of last namespace).
     *
     * @example
     * new Key('/Comedy/MontyPython/Actor:JohnCleese').name()
     * // => 'JohnCleese'
     */
    name(): string;
    /**
     * Returns an "instance" of this type key (appends value to namespace).
     *
     * @param str The string to append
     *
     * @example
     * new Key('/Comedy/MontyPython/Actor').instance('JohnClesse')
     * // => Key('/Comedy/MontyPython/Actor:JohnCleese')
     */
    instance(str: string): Key;
    /**
     * Returns the "path" of this key (parent + type).
     *
     * @example
     * new Key('/Comedy/MontyPython/Actor:JohnCleese').path()
     * // => Key('/Comedy/MontyPython/Actor')
     */
    path(): Key;
    /**
     * Returns the `parent` Key of this Key.
     *
     * @example
     * new Key("/Comedy/MontyPython/Actor:JohnCleese").parent()
     * // => Key("/Comedy/MontyPython")
     */
    parent(): Key;
    /**
     * Returns the `child` Key of this Key.
     *
     * @param key The child Key to add
     *
     * @example
     * new Key('/Comedy/MontyPython').child(new Key('Actor:JohnCleese'))
     * // => Key('/Comedy/MontyPython/Actor:JohnCleese')
     */
    child(key: Key): Key;
    /**
     * Returns whether this key is a prefix of `other`
     *
     * @param other The other key to test against
     *
     * @example
     * new Key('/Comedy').isAncestorOf('/Comedy/MontyPython')
     * // => true
     */
    isAncestorOf(other: Key): boolean;
    /**
     * Returns whether this key is a contains another as prefix.
     *
     * @param other The other Key to test against
     *
     * @example
     * new Key('/Comedy/MontyPython').isDecendantOf('/Comedy')
     * // => true
     */
    isDecendantOf(other: Key): boolean;
    /**
     * Returns wether this key has only one namespace.
     */
    isTopLevel(): boolean;
    /**
     * Concats one or more Keys into one new Key.
     *
     * @param keys The array of keys to concatenate
     */
    concat(...keys: Key[]): Key;
    /**
     * Returns whether the input is a valid Key.
     */
    static isKey(key: any): boolean;
}

export type Datastore<Value = Buffer> = Adapter<Value>;
