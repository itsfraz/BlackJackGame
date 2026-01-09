
export class Player {
    constructor(id, name, initialSpendingPower) {
        this.id = id;
        this.name = name;
        this.spendingPower = initialSpendingPower;
    }

    getSpendingPower() {
        return this.spendingPower;
    }

    setSpendingPower(amount) {
        this.spendingPower = amount;
    }

    hasEnoughFunds(amount) {
        return this.spendingPower >= amount;
    }

    deductFunds(amount) {
        if (!this.hasEnoughFunds(amount)) {
            return false;
        }
        this.spendingPower -= amount;
        return true;
    }

    addFunds(amount) {
        this.spendingPower += amount;
    }
}
