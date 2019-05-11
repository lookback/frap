export default function shallowEq(a: any, b: any): boolean {
    if (a === b) return true;

    const aIsNull = a === null;
    const bIsNull = b === null;

    if (aIsNull !== bIsNull) return false;

    const aIsArray = Array.isArray(a);
    const bIsArray = Array.isArray(b);

    if (aIsArray !== bIsArray) return false;

    const aTypeof = typeof a;
    const bTypeof = typeof b;

    if (aTypeof !== bTypeof) return false;
    if (isFlat(aTypeof)) return a === b;

    return aIsArray ? shallowArray(a, b) : shallowObject(a, b);
}

function shallowArray(a: any[], b: any[]): boolean {
    const l = a.length;
    if (l !== b.length) return false;

    // tslint:disable-next-line:no-let
    for (let i = 0; i < l; i++) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}

function shallowObject(a: any, b: any): boolean {
    // tslint:disable-next-line:no-let
    let ka = 0;
    // tslint:disable-next-line:no-let
    let kb = 0;

    for (const key in a) {
        if (a.hasOwnProperty(key) && a[key] !== b[key]) return false;

        // tslint:disable-next-line:no-expression-statement
        ka++;
    }

    for (const key in b) {
        // tslint:disable-next-line:no-expression-statement
        if (b.hasOwnProperty(key)) kb++;
    }

    return ka === kb;
}

function isFlat(type: any): boolean {
    return type !== 'function' && type !== 'object';
}
