const fs = require('fs');
const path = require('path');

const categories = [
    {
        id: 'fashion',
        name: 'Fashion & Style',
        icon: 'checkroom',
        children: [
            {
                id: 'fashion_women',
                name: 'Women',
                children: [
                    { id: 'fashion_women_clothing', name: 'Clothing', children: ['Dresses', 'Tops', 'Coats & Jackets', 'Trousers & Leggings', 'Other'] },
                    { id: 'fashion_women_shoes', name: 'Shoes', children: ['Sneakers', 'Heels', 'Boots', 'Sandals', 'Other'] },
                    { id: 'fashion_women_bags', name: 'Bags', children: ['Handbags', 'Backpacks', 'Totes', 'Other'] },
                    { id: 'fashion_women_accessories', name: 'Accessories', children: ['Jewellery', 'Purses', 'Sunglasses', 'Scarves', 'Other'] }
                ]
            },
            {
                id: 'fashion_men',
                name: 'Men',
                children: [
                    { id: 'fashion_men_clothing', name: 'Clothing', children: ['T-Shirts', 'Coats & Jackets', 'Trousers', 'Suits', 'Other'] },
                    { id: 'fashion_men_shoes', name: 'Shoes', children: ['Trainers & Sneakers', 'Loafers', 'Boots', 'Other'] },
                    { id: 'fashion_men_accessories', name: 'Accessories', children: ['Watches', 'Belts', 'Wallets', 'Other'] }
                ]
            },
            {
                id: 'fashion_kids',
                name: 'Kids & Baby',
                children: [
                    { id: 'fashion_kids_girls', name: "Girl's Clothing", children: ['Dresses', 'Skirts', 'Tops', 'Other'] },
                    { id: 'fashion_kids_boys', name: "Boy's Clothing", children: ['Tops', 'Trousers', 'Jumpers', 'Other'] },
                    { id: 'fashion_kids_baby', name: 'Baby', children: ['Bodysuits', 'Sleepsuits', 'Nappies', 'Other'] },
                    { id: 'fashion_kids_shoes', name: 'Shoes', children: ['Trainers', 'Boots', 'Sandals', 'Other'] },
                    { id: 'fashion_kids_prams', name: 'Prams & Nursery', children: ['Pushchairs', 'Car Seats', 'Furniture', 'Other'] },
                    { id: 'fashion_kids_toys', name: 'Toys', children: ['Educational', 'Soft Toys', 'Games', 'Other'] }
                ]
            }
        ]
    },
    {
        id: 'tech',
        name: 'Digital & Tech',
        icon: 'devices',
        children: [
            { id: 'tech_phones', name: 'Mobile Phones', children: ['Smartphones', 'Accessories', 'Other'] },
            { id: 'tech_tablets', name: 'Tablets & Readers', children: ['Tablets', 'E-Readers', 'Accessories', 'Other'] },
            { id: 'tech_computers', name: 'Computers', children: ['Laptops', 'Desktops', 'Monitors', 'Components', 'Accessories', 'Other'] },
            { id: 'tech_audio', name: 'Audio', children: ['Headphones', 'Earphones', 'Speakers', 'Other'] },
            { id: 'tech_cameras', name: 'Cameras', children: ['Digital Cameras', 'Film Cameras', 'Lenses', 'Other'] },
            { id: 'tech_gaming', name: 'Gaming', children: ['Consoles', 'Video Games', 'Accessories', 'Other'] },
            { id: 'tech_tv', name: 'TV & Video', children: ['TV', 'Projectors', 'Other'] }
        ]
    },
    {
        id: 'home',
        name: 'Home & Living',
        icon: 'chair', // MaterialIcons name
        children: [
            { id: 'home_furniture', name: 'Furniture', children: ['Sofas', 'Tables', 'Closets', 'Beds', 'Other'] },
            { id: 'home_decor', name: 'Home Decor', children: ['Lighting', 'Rugs', 'Mirrors', 'Art', 'Other'] },
            { id: 'home_kitchen', name: 'Kitchen & Dining', children: ['Cookware', 'Tableware', 'Small Appliances', 'Other'] },
            { id: 'home_diy', name: 'DIY & Garden', children: ['Tools', 'Building Materials', 'Plants', 'Other'] }
        ]
    },
    {
        id: 'hobbies',
        name: 'Hobbies & Leisure',
        icon: 'sports-soccer', // MaterialIcons name
        children: [
            { id: 'hobbies_sports', name: 'Sports', children: ['Cycling', 'Football', 'Gym', 'Equipment', 'Other'] },
            { id: 'hobbies_outdoor', name: 'Outdoor', children: ['Camping', 'Hiking', 'Fishing', 'Other'] },
            { id: 'hobbies_instruments', name: 'Musical Instruments', children: ['Guitars', 'Keyboards', 'Pro Audio', 'Other'] },
            { id: 'hobbies_entertainment', name: 'Entertainment', children: ['Books', 'Vinyl', 'Board Games', 'Other'] }
        ]
    },
    {
        id: 'mobility',
        name: 'Mobility',
        icon: 'directions-car', // MaterialIcons name
        children: [
            { id: 'mobility_cars', name: 'Car Parts', children: ['Tyres', 'Rims', 'Auto Parts', 'Accessories', 'Other'] },
            { id: 'mobility_motorcycles', name: 'Motorcycles', children: ['Motorbikes', 'Scooters', 'Gear', 'Other'] },
            { id: 'mobility_bicycles', name: 'Bicycles', children: ['Road', 'MTB', 'City Bikes', 'Other'] }
        ]
    }
];

const flatList = [];

function flatten(items, parentId = null) {
    items.forEach(item => {
        // Determine if it's a leaf node in our simplified definition
        // For this app, the last level of children are the leaves.
        // The input structure has 3 levels: Root -> Sub -> Leaf

        // Level 1: Root (Fashion)
        // Level 2: Sub (Women)
        // Level 3: Leaf (Dresses)

        // The 'children' array in the input object mixes objects (Level 2) and strings (Level 3).

        const isLeaf = !item.children;

        // Construct the object
        const obj = {
            id: item.id || (parentId + '_' + item.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')),
            name: item.name,
            parentId: parentId,
            isLeaf: false // Will be true for the string children
        };

        if (item.icon) obj.icon = item.icon;

        // However, the structure in the script above uses objects for Level 1 and 2.
        // Level 3 are strings in the 'children' array of Level 2 objects.

        flatList.push(obj);

        if (item.children) {
            item.children.forEach(child => {
                if (typeof child === 'string') {
                    // This is a leaf node
                    flatList.push({
                        id: obj.id + '_' + child.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, ''),
                        name: child,
                        parentId: obj.id,
                        isLeaf: true
                    });
                } else {
                    // This is a mid-level node, recurse
                    flatten([child], obj.id);
                }
            });
        }
    });
}

flatten(categories);

console.log(JSON.stringify(flatList, null, 2));
