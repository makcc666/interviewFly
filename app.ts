class PromiseCancelable<T> extends Promise<T> {
    protected resolvePromise: (value: T | PromiseLike<T>) => void;
    protected rejectPromise: (reason?: any) => void;
    protected onCancelCallback?: Function;

    cancel(reason?: any): void {
        if (this.onCancelCallback) {
            this.onCancelCallback.apply([]);
        }

        this.rejectPromise(reason);
    }

    constructor(executor: (
        resolve: (value: T | PromiseLike<T>) => void,
        reject: (reason?: any) => void,
        onCancel: (callback?: Function) => void
    ) => void) {
        const toPromise: {
            resolve: (value: T | PromiseLike<T>) => void,
            reject: (reason?: any) => void,
            cb?: Function,
        } = {
            resolve: () => undefined,
            reject: () => undefined,
        }

        super(
            (g, b) => {
                toPromise.resolve = g;
                toPromise.reject = b;
                return executor(
                    toPromise.resolve,
                    toPromise.reject,
                    (fn: Function | undefined) => (toPromise.cb = fn)
                )
            }
        );

        this.resolvePromise = toPromise.resolve;
        this.rejectPromise = toPromise.reject;
        this.onCancelCallback = toPromise.cb;
    }

}

// Тесты
(async () => {

    // Вызов "cancel", работа "onCancel"
    {
        const promise = new PromiseCancelable((g, b, onCancel) => {
            console.log("promise1::start");

            onCancel(() => {
                console.log("promise1::был остановлен извне");
            });
        })

        try {
            promise.cancel(new Error('Some error'));
            console.log(await promise)
        } catch (e) {
            console.log("promise1::catch error::", e);
        }
    }
    console.log("\n")

    // Удачное завершение Promise
    {
        const promise2 = new PromiseCancelable((g, b, onCancel) => {
            console.log("promise2::start");

            const timeout = setTimeout(() => {
                g("promise2::завершился удачно");
            }, 200);

            onCancel(() => {
                clearTimeout(timeout);
                console.log("promise2::был остановлен извне");
            });
        })

        try {
            console.log(await promise2)
        } catch (e) {
            console.log("promise2::catch error::", e);
        }
    }
    console.log("\n")

    {
        const promise3 = new PromiseCancelable((g, b) => {
            console.log("promise3::start");

            setTimeout(() => {
                g("promise3::завершился удачно");
            }, 200);

        })

        try {
            console.log(await promise3)
        } catch (e) {
            console.log("promise3::catch error::", e);
        }
    }
})();
