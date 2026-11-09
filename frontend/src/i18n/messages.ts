export const messages = {
  fr: {dashboard:"Tableau de bord", items:"Articles", inventory:"Inventaire", movements:"Mouvements", locations:"Emplacements", customers:"Clients", suppliers:"Fournisseurs", equipment:"Équipements", rentals:"Locations", reports:"Rapports", team:"Équipe", settings:"Paramètres", welcome:"Bonjour", add:"Ajouter", save:"Enregistrer", logout:"Déconnexion"},
  en: {dashboard:"Dashboard", items:"Items", inventory:"Inventory", movements:"Movements", locations:"Locations", customers:"Customers", suppliers:"Suppliers", equipment:"Equipment", rentals:"Rentals", reports:"Reports", team:"Team", settings:"Settings", welcome:"Hello", add:"Add", save:"Save", logout:"Log out"},
  ar: {dashboard:"لوحة التحكم", items:"السلع", inventory:"المخزون", movements:"الحركات", locations:"المواقع", customers:"العملاء", suppliers:"الموردون", equipment:"المعدات", rentals:"التأجير", reports:"التقارير", team:"الفريق", settings:"الإعدادات", welcome:"مرحبا", add:"إضافة", save:"حفظ", logout:"خروج"}
};
export type Language = keyof typeof messages;

