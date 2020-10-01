export class SpPersonnelKey {
    id: string;
    private _privateKey: string;

    get clearPrivateKey(): string {
        return atob(this._privateKey);
    }

    get privateKey(): string {
        return this._privateKey;
    }

    set privateKey(key: string) {
        this._privateKey = btoa(key);
    }
}
