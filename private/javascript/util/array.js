// Return a sorted copy of an array
export function sorted(arr, ...args) {
    const copy = arr.slice(0);
    copy.sort(...args);
    return copy;
}


// Return a reversed copy of an array
export function reversed(arr, ...args) {
    const copy = arr.slice(0);
    copy.reverse(...args);
    return copy;
}
