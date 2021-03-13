export type TypedPoolFactory<T> = () => Promise<T>

export default class TypedPool<T> {

    private static readonly ELEMENT_EXPIRY_MILLIS = 1000 * 60 * 5;

    private readonly data: Map<T, Date | null> = new Map();
    private readonly pending: ((value: T | PromiseLike<T>) => void)[] = [];
    private readonly factory: TypedPoolFactory<T>;
    private readonly max: number;

    constructor(factory: TypedPoolFactory<T>, min: number, max: number, callback?: () => void) {
        if (min > max || min < 0 || max < 0) {
            throw new Error("Invalid boundaries for min and / or max");
        }

        this.factory = factory;
        this.max = max;

        if (min < 1 && callback) {
            callback();
            return;
        }

        let factorized = 0;
        for (let i = 0; i < min; i++) {
            factory().then(value => {
                this.data.set(value, null);
                if (++factorized >= min && callback)
                    callback();
            });
        }
    }

    public acquire(): Promise<T> {
        return new Promise<T>((resolve) => {
            const now = new Date();
            for (let key of this.data.keys()) {
                const date = this.data.get(key);
                if (date == null || date.getMilliseconds() + TypedPool.ELEMENT_EXPIRY_MILLIS > now.getMilliseconds()) {
                    this.data.set(key, now);
                    resolve(key);
                    return;
                }
            }
            // No available resource found
            // Maximum not reached, generate new
            if (this.data.size < this.max) {
                this.factory().then(value => {
                    this.data.set(value, new Date());
                    resolve(value);
                }).catch(() => {
                    // Failed to create new object, fallback to free worker when available
                    this.pending.push(resolve);
                })
                return;
            }

            // Maximum reached, wait for free worker
            this.pending.push(resolve);
        });
    }

    public release(entry: T): void {
        this.data.set(entry, null);

        if (this.pending.length == 0)
            return;
        const pendingEntry = this.pending.pop();
        if (!pendingEntry)
            return;

        pendingEntry(entry);
        this.data.set(entry, new Date());
    }

}
