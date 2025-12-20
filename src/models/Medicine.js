export class Medicine {
    constructor(id, name, quantity, expiryDate, notes = "", activeIngredient1 = "", activeIngredient2 = "", activeIngredient3 = "") {
        this.id = id || Date.now().toString();
        this.name = name;
        this.quantity = quantity;
        this.expiryDate = expiryDate;
        this.notes = notes;
        this.activeIngredient1 = activeIngredient1;
        this.activeIngredient2 = activeIngredient2;
        this.activeIngredient3 = activeIngredient3;
        this.createdAt = new Date().toISOString();
    }
}
