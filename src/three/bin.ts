export interface Disposable {
    dispose: () => void;
}

export interface Bin {
    add: <T extends Disposable>(item: T) => T;
    release: () => void;
}

export function createBin(): Bin {
    const items: Disposable[] = [];

    return {
        add: item => {
            items.push(item);
            return item;
        },
        release: () => {
            items.forEach(item => item.dispose());
            items.length = 0;
        }
    };
}