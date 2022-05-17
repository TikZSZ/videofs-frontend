declare module 'json-stringify-deterministic'{
  declare function stringify(value: any, replacer?: (this: any, key: string, value: any) => any, space?: string | number): string;
  export default stringify
}

