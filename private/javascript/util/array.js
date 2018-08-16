export function sorted(arr, ...args) {
    const copy = arr.slice(0);
    copy.sort(...args);
    return copy;
}


export function reversed(arr, ...args) {
    const copy = arr.slice(0);
    copy.reverse(...args);
    return copy;
}
